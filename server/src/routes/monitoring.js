const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

// Start Monitoring Session
router.post('/start', authenticateToken, requireRole(['TEACHER', 'ADMIN']), (req, res) => {
  const { classroom_id } = req.body;
  if (!classroom_id) return res.status(400).json({ error: 'Classroom ID is required.' });

  const classroom = db.prepare('SELECT * FROM classrooms WHERE id = ?').get(classroom_id);
  if (!classroom) return res.status(404).json({ error: 'Classroom not found.' });

  // Check if active session already exists
  let activeSession = db.prepare(`
    SELECT * FROM monitoring_sessions WHERE classroom_id = ? AND status = 'ACTIVE' LIMIT 1
  `).get(classroom_id);

  if (activeSession) {
    return res.json({ message: 'Monitoring session already active.', session: activeSession });
  }

  const sessionCode = `SESS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

  const result = db.prepare(`
    INSERT INTO monitoring_sessions (
      session_code, classroom_id, teacher_id, started_at, status,
      avg_attention_score, avg_drowsiness_rate, avg_noise_level,
      total_students_detected, potential_events_count, verified_events_count
    )
    VALUES (?, ?, ?, CURRENT_TIMESTAMP, 'ACTIVE', 85.0, 5.0, 'QUIET', 0, 0, 0)
  `).run(sessionCode, classroom_id, req.user.teacherId || null);

  db.prepare("UPDATE classrooms SET status = 'MONITORING' WHERE id = ?").run(classroom_id);

  const newSession = db.prepare('SELECT * FROM monitoring_sessions WHERE id = ?').get(result.lastInsertRowid);
  logAudit(req.user.id, req.user.fullName, req.user.role, 'MONITORING_STARTED', 'MONITORING_SESSION', newSession.id, `Started monitoring session ${sessionCode} in classroom ${classroom.name}`, req.ip);

  res.status(201).json({ message: 'Monitoring session started.', session: newSession });
});

// Pause/Resume Session
router.post('/:id/pause', authenticateToken, requireRole(['TEACHER', 'ADMIN']), (req, res) => {
  const session = db.prepare('SELECT * FROM monitoring_sessions WHERE id = ?').get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const newStatus = session.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
  db.prepare('UPDATE monitoring_sessions SET status = ? WHERE id = ?').run(newStatus, session.id);
  db.prepare('UPDATE classrooms SET status = ? WHERE id = ?').run(newStatus === 'ACTIVE' ? 'MONITORING' : 'PAUSED', session.classroom_id);

  logAudit(req.user.id, req.user.fullName, req.user.role, 'MONITORING_STATUS_CHANGED', 'MONITORING_SESSION', session.id, `Session status changed to ${newStatus}`, req.ip);

  res.json({ message: `Session status changed to ${newStatus}`, status: newStatus });
});

// Stop Monitoring Session
router.post('/:id/stop', authenticateToken, requireRole(['TEACHER', 'ADMIN']), (req, res) => {
  const session = db.prepare('SELECT * FROM monitoring_sessions WHERE id = ?').get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  // Update session counts and status
  const eventStats = db.prepare(`
    SELECT
      COUNT(*) as total_events,
      SUM(CASE WHEN verification_status = 'VERIFIED' THEN 1 ELSE 0 END) as verified_events
    FROM detected_events WHERE session_id = ?
  `).get(session.id);

  db.prepare(`
    UPDATE monitoring_sessions
    SET status = 'COMPLETED',
        ended_at = CURRENT_TIMESTAMP,
        potential_events_count = ?,
        verified_events_count = ?
    WHERE id = ?
  `).run(eventStats.total_events || 0, eventStats.verified_events || 0, session.id);

  db.prepare("UPDATE classrooms SET status = 'IDLE' WHERE id = ?").run(session.classroom_id);

  logAudit(req.user.id, req.user.fullName, req.user.role, 'MONITORING_STOPPED', 'MONITORING_SESSION', session.id, `Session completed. Total potential observations: ${eventStats.total_events || 0}`, req.ip);

  res.json({ message: 'Monitoring session ended successfully.' });
});

// Update Live Aggregate Telemetry (Numbers only - Zero video transmission)
router.post('/:id/metrics', authenticateToken, (req, res) => {
  const { attention_score, drowsiness_rate, noise_level, visible_students } = req.body;

  db.prepare(`
    UPDATE monitoring_sessions
    SET avg_attention_score = COALESCE(?, avg_attention_score),
        avg_drowsiness_rate = COALESCE(?, avg_drowsiness_rate),
        avg_noise_level = COALESCE(?, avg_noise_level),
        total_students_detected = MAX(total_students_detected, COALESCE(?, 0))
    WHERE id = ?
  `).run(attention_score, drowsiness_rate, noise_level, visible_students, req.params.id);

  res.json({ ok: true });
});

// Add Timeline Marker (e.g. topic change, quiz, AI nudge)
router.post('/:id/timeline-marker', authenticateToken, (req, res) => {
  const { marker_type, title, notes } = req.body;
  if (!marker_type || !title) {
    return res.status(400).json({ error: 'Marker type and title are required.' });
  }

  const result = db.prepare(`
    INSERT INTO session_timeline_markers (session_id, marker_type, title, notes)
    VALUES (?, ?, ?, ?)
  `).run(req.params.id, marker_type, title, notes || null);

  res.status(201).json({ message: 'Timeline marker added.', markerId: result.lastInsertRowid });
});

// Get Session Details & Timeline
router.get('/:id', authenticateToken, (req, res) => {
  const session = db.prepare(`
    SELECT ms.*, c.name as classroom_name, c.classroom_code, cl.name as class_name, t.full_name as teacher_name
    FROM monitoring_sessions ms
    JOIN classrooms c ON c.id = ms.classroom_id
    LEFT JOIN classes cl ON cl.id = c.class_id
    LEFT JOIN teachers t ON t.id = ms.teacher_id
    WHERE ms.id = ?
  `).get(req.params.id);

  if (!session) return res.status(404).json({ error: 'Session not found' });

  const markers = db.prepare(`
    SELECT * FROM session_timeline_markers WHERE session_id = ? ORDER BY timestamp ASC
  `).all(session.id);

  const events = db.prepare(`
    SELECT d.*, tv.decision, tv.notes as teacher_notes
    FROM detected_events d
    LEFT JOIN teacher_verifications tv ON tv.event_id = d.id
    WHERE d.session_id = ?
    ORDER BY d.id DESC
  `).all(session.id);

  res.json({ session, markers, events });
});

// Session Report
router.get('/:id/report', authenticateToken, (req, res) => {
  const session = db.prepare(`
    SELECT ms.*, c.name as classroom_name, c.classroom_code, cl.name as class_name, t.full_name as teacher_name
    FROM monitoring_sessions ms
    JOIN classrooms c ON c.id = ms.classroom_id
    LEFT JOIN classes cl ON cl.id = c.class_id
    LEFT JOIN teachers t ON t.id = ms.teacher_id
    WHERE ms.id = ?
  `).get(req.params.id);

  if (!session) return res.status(404).json({ error: 'Session not found' });

  const markers = db.prepare(`
    SELECT * FROM session_timeline_markers WHERE session_id = ? ORDER BY timestamp ASC
  `).all(session.id);

  const eventSummary = db.prepare(`
    SELECT
      category,
      event_type,
      COUNT(*) as count,
      SUM(CASE WHEN verification_status = 'VERIFIED' THEN 1 ELSE 0 END) as verified_count,
      SUM(CASE WHEN verification_status = 'REJECTED' THEN 1 ELSE 0 END) as false_positive_count,
      SUM(CASE WHEN verification_status = 'PENDING' THEN 1 ELSE 0 END) as pending_count
    FROM detected_events
    WHERE session_id = ?
    GROUP BY category, event_type
  `).all(session.id);

  // Generate timeline engagement points dynamically from actual session metrics and markers
  const sessionStartTime = new Date(session.started_at);
  const nowTime = session.ended_at ? new Date(session.ended_at) : new Date();
  const timelinePoints = [];

  if (markers.length > 0) {
    markers.forEach((m) => {
      const mDate = new Date(m.timestamp);
      timelinePoints.push({
        time: mDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        attention: Math.round(session.avg_attention_score || 85),
        drowsiness: Math.round(session.avg_drowsiness_rate || 5),
        noise: session.avg_noise_level || 'Quiet',
        eventFlag: m.title
      });
    });
  } else {
    const startStr = sessionStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const curStr = nowTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    timelinePoints.push({
      time: startStr,
      attention: Math.round(session.avg_attention_score || 85),
      drowsiness: Math.round(session.avg_drowsiness_rate || 5),
      noise: session.avg_noise_level || 'Quiet',
      eventFlag: 'Session Commenced'
    });
    if (startStr !== curStr) {
      timelinePoints.push({
        time: curStr,
        attention: Math.round(session.avg_attention_score || 85),
        drowsiness: Math.round(session.avg_drowsiness_rate || 5),
        noise: session.avg_noise_level || 'Quiet',
        eventFlag: session.status === 'COMPLETED' ? 'Session Concluded' : 'Live Observation'
      });
    }
  }

  res.json({
    report: {
      session,
      markers,
      eventSummary,
      timelinePoints,
      ethicalDisclaimer: 'ClassGuard AI operates strictly on local edge telemetry and privacy-preserving aggregate metrics. Individual students are never tracked or penalized automatically.'
    }
  });
});

module.exports = router;
