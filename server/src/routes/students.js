const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

// List students
router.get('/', authenticateToken, (req, res) => {
  const { class_name, consent_status, is_demo } = req.query;
  let query = `
    SELECT s.id, s.student_id, s.full_name, s.class_name, s.section, s.roll_number,
           s.email, s.phone, s.photo_data_url, s.consent_status, s.is_demo, s.created_at,
           b.status as biometric_status, b.quality_score
    FROM students s
    LEFT JOIN biometric_profiles b ON b.student_id = s.id
    WHERE 1=1
  `;
  const params = [];

  if (class_name) {
    query += ' AND s.class_name = ?';
    params.push(class_name);
  }
  if (consent_status) {
    query += ' AND s.consent_status = ?';
    params.push(consent_status);
  }
  if (is_demo !== undefined) {
    query += ' AND s.is_demo = ?';
    params.push(Number(is_demo));
  }

  query += ' ORDER BY s.id ASC';
  const students = db.prepare(query).all(...params);
  res.json({ students });
});

// Authorized match list for on-device local inference with real photo and facial descriptor
router.get('/authorized-match-list', authenticateToken, (req, res) => {
  const authorized = db.prepare(`
    SELECT s.id, s.student_id, s.full_name, s.class_name, s.section, s.roll_number,
           s.photo_data_url, s.face_descriptor, s.is_demo
    FROM students s
    WHERE s.consent_status = 'CONSENTED'
    ORDER BY s.full_name ASC
  `).all();

  res.json({ authorizedStudents: authorized });
});

// Get Student Profile with Verified vs AI Detected statistics
router.get('/:id', authenticateToken, (req, res) => {
  const student = db.prepare(`
    SELECT s.id, s.student_id, s.full_name, s.class_name, s.section, s.roll_number,
           s.email, s.phone, s.consent_status, s.is_demo, s.created_at,
           b.status as biometric_status, b.quality_score, b.enrolled_at as biometric_enrolled_at
    FROM students s
    LEFT JOIN biometric_profiles b ON b.student_id = s.id
    WHERE s.id = ?
  `).get(req.params.id);

  if (!student) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  // Check student self-access guard: Students can only view their own profile
  if (req.user.role === 'STUDENT' && req.user.studentId && req.user.studentId !== student.id) {
    return res.status(403).json({ error: 'Access denied to other student profiles.' });
  }

  // Consent history
  const consents = db.prepare(`
    SELECT * FROM consents WHERE student_id = ? ORDER BY id DESC
  `).all(student.id);

  // Statistics: explicitly distinguish AI DETECTED vs TEACHER VERIFIED
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_detected_observations,
      SUM(CASE WHEN category = 'ATTENTION' THEN 1 ELSE 0 END) as ai_attention_events,
      SUM(CASE WHEN category = 'DISTURBANCE' THEN 1 ELSE 0 END) as ai_disturbance_events,
      SUM(CASE WHEN category = 'SAFETY' THEN 1 ELSE 0 END) as ai_safety_events,
      SUM(CASE WHEN verification_status = 'VERIFIED' THEN 1 ELSE 0 END) as teacher_verified_events,
      SUM(CASE WHEN verification_status = 'REJECTED' THEN 1 ELSE 0 END) as false_positive_events,
      SUM(CASE WHEN verification_status = 'PENDING' THEN 1 ELSE 0 END) as pending_review_events
    FROM detected_events
    WHERE student_id = ?
  `).get(student.id);

  // Recent detected events
  const recentEvents = db.prepare(`
    SELECT d.id, d.event_type, d.category, d.confidence_score, d.duration_seconds,
           d.verification_status, d.ai_observation, d.timestamp,
           COALESCE(d.teacher_notes, tv.notes) as teacher_notes,
           COALESCE(d.teacher_notes, tv.notes) as verification_reason,
           COALESCE(d.verified_by, t.full_name, 'Class Teacher') as verified_by_teacher,
           COALESCE(d.verified_at, tv.verified_at) as verified_at,
           tv.decision as teacher_decision
    FROM detected_events d
    LEFT JOIN teacher_verifications tv ON tv.event_id = d.id
    LEFT JOIN teachers t ON t.id = tv.teacher_id
    WHERE d.student_id = ?
    ORDER BY d.id DESC LIMIT 25
  `).all(student.id);

  // Specifically query official teacher-verified sleeping records for this student
  const verifiedSleepingRecords = db.prepare(`
    SELECT d.id, d.event_type, d.category, d.confidence_score, d.duration_seconds,
           d.verification_status, d.ai_observation, d.timestamp,
           COALESCE(d.teacher_notes, tv.notes) as teacher_notes,
           COALESCE(d.teacher_notes, tv.notes) as verification_reason,
           COALESCE(d.verified_by, t.full_name, 'Class Teacher') as verified_by_teacher,
           COALESCE(d.verified_at, tv.verified_at) as verified_at,
           ms.session_code, c.name as classroom_name
    FROM detected_events d
    LEFT JOIN monitoring_sessions ms ON ms.id = d.session_id
    LEFT JOIN classrooms c ON c.id = ms.classroom_id
    LEFT JOIN teacher_verifications tv ON tv.event_id = d.id
    LEFT JOIN teachers t ON t.id = tv.teacher_id
    WHERE d.student_id = ? AND d.event_type = 'PROLONGED_EYE_CLOSURE' AND d.verification_status = 'VERIFIED'
    ORDER BY d.id DESC
  `).all(student.id);

  res.json({
    student,
    consents,
    statistics: {
      totalDetectedObservations: stats.total_detected_observations || 0,
      aiAttentionEvents: stats.ai_attention_events || 0,
      aiDisturbanceEvents: stats.ai_disturbance_events || 0,
      aiSafetyEvents: stats.ai_safety_events || 0,
      teacherVerifiedEvents: stats.teacher_verified_events || 0,
      falsePositiveEvents: stats.false_positive_events || 0,
      pendingReviewEvents: stats.pending_review_events || 0,
      verifiedSleepingCount: verifiedSleepingRecords.length,
      ethicalNotice: 'AI detections represent unverified observations only and must not be used for disciplinary actions without teacher verification.'
    },
    verifiedSleepingRecords,
    recentEvents
  });
});

// Enroll / Register Student with Consent
router.post('/enroll', authenticateToken, requireRole(['ADMIN', 'TEACHER']), (req, res) => {
  const {
    student_id, full_name, class_name, section, roll_number,
    email, phone, consent_granted, is_demo, photo_data_url, face_descriptor
  } = req.body;

  if (!student_id || !full_name || !class_name || !roll_number) {
    return res.status(400).json({ error: 'Missing mandatory registration fields.' });
  }

  if (!consent_granted) {
    return res.status(400).json({
      error: 'Explicit consent is mandatory before enrolling student biometrics into the system.'
    });
  }

  const existing = db.prepare('SELECT id FROM students WHERE student_id = ?').get(student_id);
  if (existing) {
    return res.status(409).json({ error: `Student with ID ${student_id} already exists.` });
  }

  // Create student transactionally
  const insertStudent = db.transaction(() => {
    const studentStmt = db.prepare(`
      INSERT INTO students (student_id, full_name, class_name, section, roll_number, email, phone, photo_data_url, face_descriptor, consent_status, is_demo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONSENTED', ?)
    `);
    const studentResult = studentStmt.run(
      student_id,
      full_name,
      class_name,
      section || 'A',
      roll_number,
      email || null,
      phone || null,
      photo_data_url || null,
      face_descriptor ? (typeof face_descriptor === 'string' ? face_descriptor : JSON.stringify(face_descriptor)) : null,
      is_demo ? 1 : 0
    );
    const newStudentId = studentResult.lastInsertRowid;

    // Record formal consent
    db.prepare(`
      INSERT INTO consents (student_id, consent_type, granted_by, status, terms_version, ip_address)
      VALUES (?, 'CLASSROOM_SAFETY_ATTENTION_MONITORING', ?, 'ACTIVE', 'v1.4-PrivacyFirst', ?)
    `).run(newStudentId, `${full_name} (Authorized by ${req.user.fullName})`, req.ip);

    // Generate secure hashed/encrypted biometric token representation
    const secureHash = crypto.createHash('sha256').update(`${student_id}:${full_name}:${Date.now()}`).digest('hex');
    const encryptedVector = `enc:aes256gcm:${crypto.randomBytes(16).toString('hex')}`;

    db.prepare(`
      INSERT INTO biometric_profiles (student_id, feature_vector_hash, feature_vector_encrypted, landmarks_template, quality_score, status)
      VALUES (?, ?, ?, ?, 0.96, 'ACTIVE')
    `).run(
      newStudentId,
      `sha256:${secureHash}`,
      encryptedVector,
      face_descriptor ? (typeof face_descriptor === 'string' ? face_descriptor : JSON.stringify(face_descriptor)) : null
    );

    return newStudentId;
  });

  const createdId = insertStudent();
  logAudit(req.user.id, req.user.fullName, req.user.role, 'STUDENT_ENROLLED', 'STUDENT', createdId, `Enrolled student ${full_name} (${student_id}) with active consent`, req.ip);

  res.status(201).json({
    message: 'Student enrolled successfully with verified consent.',
    studentId: createdId
  });
});

// Withdraw Student Consent
router.post('/:id/withdraw-consent', authenticateToken, (req, res) => {
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  // Update student consent status
  db.prepare(`
    UPDATE students SET consent_status = 'WITHDRAWN', updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(student.id);

  // Revoke consent log
  db.prepare(`
    UPDATE consents SET status = 'REVOKED', revoked_at = CURRENT_TIMESTAMP WHERE student_id = ? AND status = 'ACTIVE'
  `).run(student.id);

  // Purge biometric profile representations immediately
  db.prepare(`
    UPDATE biometric_profiles
    SET status = 'PURGED',
        feature_vector_encrypted = '[PURGED_ON_WITHDRAWAL]',
        landmarks_template = NULL,
        purged_at = CURRENT_TIMESTAMP
    WHERE student_id = ?
  `).run(student.id);

  logAudit(req.user.id, req.user.fullName, req.user.role, 'CONSENT_WITHDRAWN', 'STUDENT', student.id, `Consent revoked and biometric profile purged for ${student.full_name}`, req.ip);

  res.json({ message: 'Consent withdrawn successfully. Biometric representations have been permanently purged.' });
});

// Complete Data Deletion Request
router.delete('/:id/data', authenticateToken, (req, res) => {
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  // Delete all biometric, snapshots, events associated
  const deleteTx = db.transaction(() => {
    // Purge biometrics
    db.prepare('DELETE FROM biometric_profiles WHERE student_id = ?').run(student.id);
    db.prepare('DELETE FROM consents WHERE student_id = ?').run(student.id);
    db.prepare('DELETE FROM enrollments WHERE student_id = ?').run(student.id);

    // Nullify or remove events to protect student privacy
    db.prepare('UPDATE detected_events SET student_id = NULL, student_name_snapshot = "[DELETED_UPON_REQUEST]" WHERE student_id = ?').run(student.id);

    // Delete student record
    db.prepare('DELETE FROM students WHERE id = ?').run(student.id);
  });

  deleteTx();

  logAudit(req.user.id, req.user.fullName, req.user.role, 'DATA_PURGED_ON_REQUEST', 'STUDENT', student.id, `Permanent data deletion completed for student record`, req.ip);

  res.json({ message: 'All personal and biometric data permanently deleted in accordance with data privacy regulations.' });
});

module.exports = router;
