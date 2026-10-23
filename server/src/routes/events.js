const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

// List Events with multi-criteria filters
router.get('/', authenticateToken, (req, res) => {
  const { session_id, student_id, category, event_type, verification_status, limit = 50 } = req.query;

  let query = `
    SELECT d.id, d.session_id, d.student_id, d.student_name_snapshot,
           d.event_type, d.category, d.confidence_score, d.duration_seconds,
           d.verification_status, d.ai_observation, d.camera_id, d.timestamp, d.is_simulated,
           COALESCE(d.teacher_notes, tv.notes) as teacher_notes,
           COALESCE(d.teacher_notes, tv.notes) as verification_reason,
           COALESCE(d.verified_by, t.full_name, 'Class Teacher') as verified_by_teacher,
           COALESCE(d.verified_at, tv.verified_at) as verified_at,
           ms.session_code, c.name as classroom_name,
           (SELECT COUNT(*) FROM event_snapshots es WHERE es.event_id = d.id) as snapshot_count
    FROM detected_events d
    LEFT JOIN monitoring_sessions ms ON ms.id = d.session_id
    LEFT JOIN classrooms c ON c.id = ms.classroom_id
    LEFT JOIN teacher_verifications tv ON tv.event_id = d.id
    LEFT JOIN teachers t ON t.id = tv.teacher_id
    WHERE 1=1
  `;
  const params = [];

  if (session_id) {
    query += ' AND d.session_id = ?';
    params.push(session_id);
  }
  if (student_id) {
    query += ' AND d.student_id = ?';
    params.push(student_id);
  }
  if (category) {
    query += ' AND d.category = ?';
    params.push(category);
  }
  if (event_type) {
    query += ' AND d.event_type = ?';
    params.push(event_type);
  }
  if (verification_status) {
    query += ' AND d.verification_status = ?';
    params.push(verification_status);
  }

  // Student role restriction: student can only view their own events if allowed by policy
  if (req.user.role === 'STUDENT' && req.user.studentId) {
    query += ' AND d.student_id = ?';
    params.push(req.user.studentId);
  }

  query += ' ORDER BY d.id DESC LIMIT ?';
  params.push(Number(limit));

  const events = db.prepare(query).all(...params);

  // Enrich each event with its captured snapshots (1-3 evidence frames)
  const getSnapshotsStmt = db.prepare(`
    SELECT id, snapshot_index, image_data_url, captured_at
    FROM event_snapshots
    WHERE event_id = ?
    ORDER BY snapshot_index ASC
  `);

  const enrichedEvents = events.map((evt) => ({
    ...evt,
    snapshots: getSnapshotsStmt.all(evt.id)
  }));

  res.json({ events: enrichedEvents });
});

// Get Event Details with Snapshots and Teacher Verification History
router.get('/:id', authenticateToken, (req, res) => {
  const event = db.prepare(`
    SELECT d.*,
           COALESCE(d.teacher_notes, tv.notes) as teacher_notes,
           COALESCE(d.teacher_notes, tv.notes) as verification_reason,
           COALESCE(d.verified_by, t.full_name, 'Class Teacher') as verified_by_teacher,
           COALESCE(d.verified_at, tv.verified_at) as verified_at,
           ms.session_code, c.name as classroom_name, c.classroom_code,
           s.roll_number, s.class_name as student_class, s.section as student_section
    FROM detected_events d
    LEFT JOIN monitoring_sessions ms ON ms.id = d.session_id
    LEFT JOIN classrooms c ON c.id = ms.classroom_id
    LEFT JOIN students s ON s.id = d.student_id
    LEFT JOIN teacher_verifications tv ON tv.event_id = d.id
    LEFT JOIN teachers t ON t.id = tv.teacher_id
    WHERE d.id = ?
  `).get(req.params.id);

  if (!event) return res.status(404).json({ error: 'Event not found.' });

  // Student role guard
  if (req.user.role === 'STUDENT' && req.user.studentId && event.student_id !== req.user.studentId) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  // Fetch snapshots (respecting retention: only unexpired snapshots)
  const snapshots = db.prepare(`
    SELECT id, snapshot_index, image_data_url, captured_at, expires_at
    FROM event_snapshots
    WHERE event_id = ? AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    ORDER BY snapshot_index ASC
  `).all(event.id);

  // Fetch teacher verification record if present
  const verification = db.prepare(`
    SELECT tv.*, COALESCE(t.full_name, 'Class Teacher') as teacher_name
    FROM teacher_verifications tv
    LEFT JOIN teachers t ON t.id = tv.teacher_id
    WHERE tv.event_id = ?
    ORDER BY tv.id DESC LIMIT 1
  `).get(event.id);

  res.json({
    event,
    snapshots,
    verification
  });
});

// Create Detected Event (Captured by local browser vision pipeline)
router.post('/', authenticateToken, (req, res) => {
  const {
    session_id, student_id, student_name_snapshot,
    event_type, category, confidence_score, duration_seconds,
    ai_observation, camera_id, is_simulated, snapshots
  } = req.body;

  if (!session_id || !event_type || !category) {
    return res.status(400).json({ error: 'Missing required event fields.' });
  }

  // Ensure target session exists so foreign key constraint never fails
  try {
    const sessionExists = db.prepare('SELECT id FROM monitoring_sessions WHERE id = ?').get(session_id);
    if (!sessionExists) {
      const defaultClassroom = db.prepare('SELECT id FROM classrooms LIMIT 1').get();
      const classroomId = defaultClassroom ? defaultClassroom.id : 1;
      db.prepare(`
        INSERT OR IGNORE INTO monitoring_sessions (id, session_code, classroom_id, started_at, status)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP, 'ACTIVE')
      `).run(session_id, `SESS-${Date.now()}`, classroomId);
    }
  } catch (e) {
    console.warn('Session verification fallback notice:', e.message);
  }

  // Retention setting from db (default 7 days)
  const retentionSetting = db.prepare("SELECT value FROM system_settings WHERE key = 'retention_period_days'").get();
  const retentionDays = parseInt(retentionSetting?.value || '7', 10);

  const insertTx = db.transaction(() => {
    // 1. Insert Event
    const eventStmt = db.prepare(`
      INSERT INTO detected_events (
        session_id, student_id, student_name_snapshot, event_type, category,
        confidence_score, duration_seconds, verification_status, ai_observation,
        camera_id, is_simulated
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?)
    `);

    const result = eventStmt.run(
      session_id,
      student_id || null,
      student_name_snapshot || 'Unknown Student',
      event_type,
      category,
      confidence_score || 0.85,
      duration_seconds || 5.0,
      ai_observation,
      camera_id || 'CAM-01 (Integrated)',
      is_simulated ? 1 : 0
    );

    const eventId = result.lastInsertRowid;

    // 2. Insert Snapshots if provided (1-3 frames)
    if (Array.isArray(snapshots) && snapshots.length > 0) {
      const snapStmt = db.prepare(`
        INSERT INTO event_snapshots (event_id, snapshot_index, image_data_url, expires_at)
        VALUES (?, ?, ?, datetime('now', '+${retentionDays} days'))
      `);
      snapshots.slice(0, 3).forEach((snap, idx) => {
        const url = typeof snap === 'string' ? snap : (snap.image_data_url || snap.imageDataUrl || '');
        if (url) {
          snapStmt.run(eventId, idx + 1, url);
        }
      });
    }

    // 3. Update session potential event count
    try {
      db.prepare('UPDATE monitoring_sessions SET potential_events_count = potential_events_count + 1 WHERE id = ?').run(session_id);
    } catch (e) {}

    return eventId;
  });

  const newEventId = insertTx();
  res.status(201).json({
    message: 'Potential event observation recorded for teacher review.',
    eventId: newEventId
  });
});

// Teacher Verification Endpoint (Human-in-the-loop: Verify, False Positive, or Needs Review)
router.post('/:id/verify', authenticateToken, requireRole(['TEACHER', 'ADMIN']), (req, res) => {
  const { decision, notes } = req.body;
  if (!['VERIFIED', 'FALSE_POSITIVE', 'NEEDS_REVIEW'].includes(decision)) {
    return res.status(400).json({ error: 'Decision must be VERIFIED, FALSE_POSITIVE, or NEEDS_REVIEW.' });
  }

  const event = db.prepare('SELECT * FROM detected_events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found.' });

  const statusMap = {
    'VERIFIED': 'VERIFIED',
    'FALSE_POSITIVE': 'REJECTED',
    'NEEDS_REVIEW': 'NEEDS_REVIEW'
  };

  const newStatus = statusMap[decision];
  const teacherName = req.user.fullName || (req.user.role === 'TEACHER' ? 'Class Teacher' : 'Administrator');

  const finalReason = notes && notes.trim()
    ? notes.trim()
    : decision === 'VERIFIED'
    ? 'Class teacher verified student was sleeping during lecture'
    : decision === 'FALSE_POSITIVE'
    ? 'Class teacher marked as false positive / normal attentive activity'
    : 'Observation marked for further review';

  const verifyTx = db.transaction(() => {
    // 1. Update detected_events status, teacher_notes, verified_by, verified_at
    db.prepare(`
      UPDATE detected_events
      SET verification_status = ?,
          teacher_notes = ?,
          verified_by = ?,
          verified_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newStatus, finalReason, teacherName, event.id);

    // 2. Record verification entry
    db.prepare(`
      INSERT INTO teacher_verifications (event_id, teacher_id, decision, notes)
      VALUES (?, ?, ?, ?)
    `).run(event.id, req.user.teacherId || null, decision, finalReason);

    // 3. Update session verified count if verified
    if (newStatus === 'VERIFIED') {
      db.prepare('UPDATE monitoring_sessions SET verified_events_count = verified_events_count + 1 WHERE id = ?').run(event.session_id);
    }

    // 4. If an appeal exists for this event, resolve it
    const activeAppeal = db.prepare('SELECT id, student_id FROM review_appeals WHERE event_id = ? AND status IN (\'SUBMITTED\', \'UNDER_REVIEW\')').get(event.id);
    if (activeAppeal) {
      const appealDecision = decision === 'VERIFIED' ? 'CONFIRMED' : decision === 'FALSE_POSITIVE' ? 'DISMISSED' : 'CORRECTED';
      db.prepare(`
        UPDATE review_appeals
        SET status = 'RESOLVED',
            teacher_decision = ?,
            teacher_notes = ?,
            reviewed_by = ?,
            reviewed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(appealDecision, finalReason, teacherName, activeAppeal.id);

      // Fetch user_id for student
      const studentUser = db.prepare('SELECT user_id FROM students WHERE id = ?').get(activeAppeal.student_id);
      if (studentUser && studentUser.user_id) {
        db.prepare(`
          INSERT INTO notifications (user_id, student_id, type, title, message, link_tab)
          VALUES (?, ?, 'APPEAL_UPDATE', 'Review Appeal Decision Recorded', ?, 'student-request-review')
        `).run(
          studentUser.user_id,
          activeAppeal.student_id,
          `Teacher ${teacherName} reviewed your appeal for observation #${event.id}: Marked as ${decision}. Teacher notes: "${finalReason}"`
        );
      }
    } else if (event.student_id) {
      // General teacher review notification
      const studentUser = db.prepare('SELECT user_id FROM students WHERE id = ?').get(event.student_id);
      if (studentUser && studentUser.user_id) {
        db.prepare(`
          INSERT INTO notifications (user_id, student_id, type, title, message, link_tab)
          VALUES (?, ?, 'TEACHER_REVIEW', 'Observation Review Completed', ?, 'student-activity-records')
        `).run(
          studentUser.user_id,
          event.student_id,
          `Observation #${event.id} (${event.event_type.replace(/_/g, ' ')}) was reviewed by ${teacherName}: ${decision}.`
        );
      }
    }
  });

  verifyTx();

  const auditAction = (event.event_type === 'PROLONGED_EYE_CLOSURE' && newStatus === 'VERIFIED')
    ? 'STUDENT_SLEEPING_VERIFIED'
    : 'EVENT_VERIFICATION_DECISION';

  logAudit(
    req.user.id,
    req.user.fullName,
    req.user.role,
    auditAction,
    'EVENT',
    event.id,
    `Class Teacher (${teacherName}) verified ${event.event_type} for ${event.student_name_snapshot} as ${decision} with reason: "${finalReason}"`,
    req.ip
  );

  res.json({
    message: `Event successfully verified and recorded as ${decision}.`,
    verificationStatus: newStatus,
    reason: finalReason,
    verifiedBy: teacherName
  });
});

module.exports = router;
