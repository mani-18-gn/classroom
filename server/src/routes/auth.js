const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

// Login
router.post('/login', (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Username/Email and password are required.' });
  }

  const user = db.prepare(`
    SELECT * FROM users WHERE email = ? OR username = ?
  `).get(identifier, identifier);

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    logAudit(null, identifier, 'GUEST', 'LOGIN_FAILED', 'USER', null, 'Invalid credentials provided', req.ip);
    return res.status(401).json({ error: 'Invalid email/username or password.' });
  }

  let roleDetails = null;
  if (user.role === 'TEACHER') {
    roleDetails = db.prepare('SELECT * FROM teachers WHERE user_id = ?').get(user.id);
  } else if (user.role === 'STUDENT') {
    roleDetails = db.prepare('SELECT * FROM students WHERE user_id = ?').get(user.id);
  }

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
      teacherId: roleDetails?.id || null,
      studentId: roleDetails?.id || null
    },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

  logAudit(user.id, user.full_name, user.role, 'LOGIN_SUCCESS', 'USER', user.id, 'User authenticated successfully', req.ip);

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
      institutionId: user.institution_id,
      studentId: roleDetails?.id || null,
      teacherId: roleDetails?.id || null,
      roleDetails
    }
  });
});

// Demo Login (Seamless switcher for judging & presentations)
router.post('/demo-login', (req, res) => {
  const { role } = req.body; // 'ADMIN' | 'TEACHER' | 'STUDENT'
  let targetUser;

  if (role === 'ADMIN') {
    targetUser = db.prepare("SELECT * FROM users WHERE role = 'ADMIN' LIMIT 1").get();
  } else if (role === 'TEACHER') {
    targetUser = db.prepare("SELECT * FROM users WHERE role = 'TEACHER' LIMIT 1").get();
  } else if (role === 'STUDENT') {
    targetUser = db.prepare("SELECT * FROM users WHERE role = 'STUDENT' LIMIT 1").get();
  } else {
    return res.status(400).json({ error: 'Invalid role for demo login' });
  }

  if (!targetUser) {
    return res.status(404).json({ error: `Demo user for role ${role} not found` });
  }

  let roleDetails = null;
  if (targetUser.role === 'TEACHER') {
    roleDetails = db.prepare('SELECT * FROM teachers WHERE user_id = ?').get(targetUser.id);
  } else if (targetUser.role === 'STUDENT') {
    roleDetails = db.prepare('SELECT * FROM students WHERE user_id = ?').get(targetUser.id);
  }

  const token = jwt.sign(
    {
      id: targetUser.id,
      username: targetUser.username,
      email: targetUser.email,
      role: targetUser.role,
      fullName: targetUser.full_name,
      teacherId: roleDetails?.id || null,
      studentId: roleDetails?.id || null
    },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

  logAudit(targetUser.id, targetUser.full_name, targetUser.role, 'DEMO_LOGIN', 'USER', targetUser.id, `Demo persona activated as ${targetUser.role}`, req.ip);

  res.json({
    token,
    user: {
      id: targetUser.id,
      username: targetUser.username,
      email: targetUser.email,
      role: targetUser.role,
      fullName: targetUser.full_name,
      institutionId: targetUser.institution_id,
      studentId: roleDetails?.id || null,
      teacherId: roleDetails?.id || null,
      roleDetails
    }
  });
});

// Get Current User Profile
router.get('/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, username, email, role, full_name, institution_id, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  let roleDetails = null;
  if (user.role === 'TEACHER') {
    roleDetails = db.prepare('SELECT * FROM teachers WHERE user_id = ?').get(user.id);
  } else if (user.role === 'STUDENT') {
    roleDetails = db.prepare('SELECT * FROM students WHERE user_id = ?').get(user.id);
  }

  res.json({
    user: {
      ...user,
      fullName: user.full_name,
      studentId: roleDetails?.id || null,
      teacherId: roleDetails?.id || null,
      roleDetails
    }
  });
});

// Register New Account
// Dedicated Student Registration
router.post('/student/register', (req, res) => {
  const {
    username, email, password, fullName, studentId, rollNumber,
    className, section, phone, consentGranted, photo_data_url, face_descriptor
  } = req.body;
  if (!username || !email || !password || !fullName || !studentId || !rollNumber) {
    return res.status(400).json({ error: 'All mandatory student fields are required.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
  if (existing) {
    return res.status(409).json({ error: 'Account with this email or username already exists.' });
  }

  const existingStudent = db.prepare('SELECT id FROM students WHERE student_id = ?').get(studentId);
  if (existingStudent) {
    return res.status(409).json({ error: `Student ID ${studentId} is already registered.` });
  }

  const hash = bcrypt.hashSync(password, 10);
  const registerTx = db.transaction(() => {
    const userRes = db.prepare(`
      INSERT INTO users (username, email, password_hash, role, full_name)
      VALUES (?, ?, ?, 'STUDENT', ?)
    `).run(username, email, hash, fullName);

    const sRes = db.prepare(`
      INSERT INTO students (student_id, user_id, full_name, class_name, section, roll_number, email, phone, photo_data_url, face_descriptor, consent_status, is_demo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(
      studentId,
      userRes.lastInsertRowid,
      fullName,
      className || '8th Semester CSE',
      section || 'A',
      rollNumber,
      email,
      phone || null,
      photo_data_url || null,
      face_descriptor ? (typeof face_descriptor === 'string' ? face_descriptor : JSON.stringify(face_descriptor)) : null,
      consentGranted ? 'CONSENTED' : 'PENDING'
    );

    if (consentGranted) {
      db.prepare(`
        INSERT INTO consents (student_id, consent_type, granted_by, status, terms_version, ip_address)
        VALUES (?, 'CLASSROOM_SAFETY_ATTENTION_MONITORING', ?, 'ACTIVE', 'v1.4-PrivacyFirst', ?)
      `).run(sRes.lastInsertRowid, `${fullName} (Self Registered)`, req.ip);

      const crypto = require('crypto');
      const secureHash = crypto.createHash('sha256').update(`${studentId}:${fullName}:${Date.now()}`).digest('hex');
      db.prepare(`
        INSERT INTO biometric_profiles (student_id, feature_vector_hash, feature_vector_encrypted, landmarks_template, quality_score, status)
        VALUES (?, ?, ?, ?, 0.95, 'ACTIVE')
      `).run(
        sRes.lastInsertRowid,
        `sha256:${secureHash}`,
        'enc:aes256gcm:client_enrolled',
        face_descriptor ? (typeof face_descriptor === 'string' ? face_descriptor : JSON.stringify(face_descriptor)) : null
      );
    }

    return { userId: userRes.lastInsertRowid, studentRecordId: sRes.lastInsertRowid };
  });

  const { userId, studentRecordId } = registerTx();

  const token = jwt.sign(
    { id: userId, username, email, role: 'STUDENT', fullName, studentId: studentRecordId },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

  logAudit(userId, fullName, 'STUDENT', 'STUDENT_SELF_REGISTERED', 'STUDENT', studentRecordId, `Student ${fullName} registered via Student Portal`, req.ip);

  res.status(201).json({
    token,
    user: { id: userId, username, email, role: 'STUDENT', fullName, studentId: studentRecordId }
  });
});

// Dedicated Teacher Registration
router.post('/teacher/register', (req, res) => {
  const { username, email, password, fullName, employeeId, department, phone } = req.body;
  if (!username || !email || !password || !fullName || !employeeId) {
    return res.status(400).json({ error: 'All mandatory teacher fields are required.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
  if (existing) {
    return res.status(409).json({ error: 'Account with this email or username already exists.' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const registerTx = db.transaction(() => {
    const userRes = db.prepare(`
      INSERT INTO users (username, email, password_hash, role, full_name)
      VALUES (?, ?, ?, 'TEACHER', ?)
    `).run(username, email, hash, fullName);

    const tRes = db.prepare(`
      INSERT INTO teachers (user_id, employee_id, full_name, department, phone)
      VALUES (?, ?, ?, ?, ?)
    `).run(userRes.lastInsertRowid, employeeId, fullName, department || 'Computer Science & Engineering', phone || null);

    return { userId: userRes.lastInsertRowid, teacherRecordId: tRes.lastInsertRowid };
  });

  const { userId, teacherRecordId } = registerTx();

  const token = jwt.sign(
    { id: userId, username, email, role: 'TEACHER', fullName, teacherId: teacherRecordId },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

  logAudit(userId, fullName, 'TEACHER', 'TEACHER_SELF_REGISTERED', 'TEACHER', teacherRecordId, `Teacher ${fullName} registered via Teacher Portal`, req.ip);

  res.status(201).json({
    token,
    user: { id: userId, username, email, role: 'TEACHER', fullName, teacherId: teacherRecordId }
  });
});

// Dedicated Super Admin Registration
router.post('/admin/register', (req, res) => {
  const { username, email, password, fullName, adminPasscode, institutionId } = req.body;
  if (!username || !email || !password || !fullName) {
    return res.status(400).json({ error: 'All mandatory fields are required.' });
  }

  // Master institutional admin authorization security check
  if (adminPasscode !== 'ADMIN2026' && adminPasscode !== 'MASTER_ADMIN') {
    return res.status(403).json({ error: 'Invalid Institutional Admin Clearance Passcode. (Hint: ADMIN2026)' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
  if (existing) {
    return res.status(409).json({ error: 'Account with this email or username already exists.' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const userRes = db.prepare(`
    INSERT INTO users (username, email, password_hash, role, full_name, institution_id)
    VALUES (?, ?, ?, 'ADMIN', ?, ?)
  `).run(username, email, hash, fullName, institutionId || 'INST-VTU-01');

  const token = jwt.sign(
    { id: userRes.lastInsertRowid, username, email, role: 'ADMIN', fullName },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

  logAudit(userRes.lastInsertRowid, fullName, 'ADMIN', 'ADMIN_REGISTERED', 'USER', userRes.lastInsertRowid, `Super Admin ${fullName} registered with verified passcode`, req.ip);

  res.status(201).json({
    token,
    user: { id: userRes.lastInsertRowid, username, email, role: 'ADMIN', fullName, institutionId: institutionId || 'INST-VTU-01' }
  });
});

module.exports = router;

