const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

// List classrooms
router.get('/', authenticateToken, (req, res) => {
  const classrooms = db.prepare(`
    SELECT c.id, c.classroom_code, c.name, c.camera_source, c.status, c.created_at,
           cl.name as class_name, cl.department, cl.semester,
           t.full_name as teacher_name,
           (SELECT COUNT(*) FROM enrollments e WHERE e.classroom_id = c.id) as enrolled_count,
           (SELECT id FROM monitoring_sessions ms WHERE ms.classroom_id = c.id AND ms.status = 'ACTIVE' LIMIT 1) as active_session_id
    FROM classrooms c
    LEFT JOIN classes cl ON cl.id = c.class_id
    LEFT JOIN teachers t ON t.id = c.teacher_id
    ORDER BY c.id ASC
  `).all();

  res.json({ classrooms });
});

// Get Classroom Details
router.get('/:id', authenticateToken, (req, res) => {
  const classroom = db.prepare(`
    SELECT c.id, c.classroom_code, c.name, c.camera_source, c.status, c.created_at,
           cl.id as class_id, cl.name as class_name, cl.department, cl.semester,
           t.id as teacher_id, t.full_name as teacher_name
    FROM classrooms c
    LEFT JOIN classes cl ON cl.id = c.class_id
    LEFT JOIN teachers t ON t.id = c.teacher_id
    WHERE c.id = ?
  `).get(req.params.id);

  if (!classroom) return res.status(404).json({ error: 'Classroom not found' });

  // Enrolled students
  const enrolledStudents = db.prepare(`
    SELECT s.id, s.student_id, s.full_name, s.roll_number, s.consent_status, s.is_demo
    FROM enrollments e
    JOIN students s ON s.id = e.student_id
    WHERE e.classroom_id = ?
    ORDER BY s.full_name ASC
  `).all(classroom.id);

  // Active or last session
  const latestSession = db.prepare(`
    SELECT * FROM monitoring_sessions WHERE classroom_id = ? ORDER BY id DESC LIMIT 1
  `).get(classroom.id);

  res.json({
    classroom,
    enrolledStudents,
    latestSession
  });
});

// Create Classroom
router.post('/', authenticateToken, requireRole(['ADMIN']), (req, res) => {
  const { classroom_code, name, class_id, teacher_id, camera_source } = req.body;
  if (!classroom_code || !name) {
    return res.status(400).json({ error: 'Classroom code and name are required.' });
  }

  const existing = db.prepare('SELECT id FROM classrooms WHERE classroom_code = ?').get(classroom_code);
  if (existing) {
    return res.status(409).json({ error: `Classroom code ${classroom_code} already exists.` });
  }

  const result = db.prepare(`
    INSERT INTO classrooms (classroom_code, name, class_id, teacher_id, camera_source, status)
    VALUES (?, ?, ?, ?, ?, 'IDLE')
  `).run(classroom_code, name, class_id || null, teacher_id || null, camera_source || 'Default Classroom Camera');

  logAudit(req.user.id, req.user.fullName, req.user.role, 'CLASSROOM_CREATED', 'CLASSROOM', result.lastInsertRowid, `Created classroom ${name} (${classroom_code})`, req.ip);

  res.status(201).json({ message: 'Classroom created successfully.', classroomId: result.lastInsertRowid });
});

module.exports = router;
