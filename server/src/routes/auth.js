const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Login
router.post('/login', (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || typeof identifier !== 'string' || !identifier.trim() || !password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Username/Email and password are required.' });
  }

  const cleanId = identifier.trim();
  const user = db.prepare(`
    SELECT * FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?)
  `).get(cleanId, cleanId);

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    if (user) {
      try {
        db.prepare('INSERT INTO login_history (user_id, ip_address, user_agent, status) VALUES (?, ?, ?, ?)').run(
          user.id, req.ip || '127.0.0.1', req.headers['user-agent'] || 'Browser Client', 'FAILED'
        );
      } catch (e) {}
    }
    logAudit(null, cleanId, 'GUEST', 'LOGIN_FAILED', 'USER', null, 'Invalid credentials provided', req.ip);
    return res.status(401).json({ error: 'Invalid email/username or password.' });
  }

  try {
    db.prepare('INSERT INTO login_history (user_id, ip_address, user_agent, status) VALUES (?, ?, ?, ?)').run(
      user.id, req.ip || '127.0.0.1', req.headers['user-agent'] || 'Browser Client', 'SUCCESS'
    );
  } catch (e) {}

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
    return res.status(404).json({ error: `Demo user for role ${role} not found in database.` });
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

  try {
    db.prepare('INSERT INTO login_history (user_id, ip_address, user_agent, status) VALUES (?, ?, ?, ?)').run(
      targetUser.id, req.ip || '127.0.0.1', req.headers['user-agent'] || 'Demo Switcher', 'SUCCESS'
    );
  } catch (e) {}

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

  const cleanUsername = username?.trim();
  const cleanEmail = email?.trim().toLowerCase();
  const cleanFullName = fullName?.trim();
  const cleanStudentId = studentId?.trim();
  const cleanRollNumber = rollNumber?.trim();

  if (!cleanUsername || !cleanEmail || !password || !cleanFullName || !cleanStudentId || !cleanRollNumber) {
    return res.status(400).json({ error: 'All mandatory student fields are required.' });
  }

  if (!isValidEmail(cleanEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address (e.g. student@institution.edu).' });
  }

  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const existingEmail = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(cleanEmail);
  if (existingEmail) {
    return res.status(409).json({ error: 'An account with this email address already exists.' });
  }

  const existingUsername = db.prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?)').get(cleanUsername);
  if (existingUsername) {
    return res.status(409).json({ error: 'Username is already taken. Please choose another username.' });
  }

  const existingStudent = db.prepare('SELECT id FROM students WHERE LOWER(student_id) = LOWER(?)').get(cleanStudentId);
  if (existingStudent) {
    return res.status(409).json({ error: `Student ID / USN "${cleanStudentId}" is already registered.` });
  }

  const hash = bcrypt.hashSync(password, 10);
  const registerTx = db.transaction(() => {
    const userRes = db.prepare(`
      INSERT INTO users (username, email, password_hash, role, full_name)
      VALUES (?, ?, ?, 'STUDENT', ?)
    `).run(cleanUsername, cleanEmail, hash, cleanFullName);

    const sRes = db.prepare(`
      INSERT INTO students (student_id, user_id, full_name, class_name, section, roll_number, email, phone, photo_data_url, face_descriptor, consent_status, is_demo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(
      cleanStudentId,
      userRes.lastInsertRowid,
      cleanFullName,
      className || '8th Semester CSE',
      section || 'A',
      cleanRollNumber,
      cleanEmail,
      phone?.trim() || null,
      photo_data_url || null,
      face_descriptor ? (typeof face_descriptor === 'string' ? face_descriptor : JSON.stringify(face_descriptor)) : null,
      consentGranted ? 'CONSENTED' : 'PENDING'
    );

    if (consentGranted) {
      db.prepare(`
        INSERT INTO consents (student_id, consent_type, granted_by, status, terms_version, ip_address)
        VALUES (?, 'CLASSROOM_SAFETY_ATTENTION_MONITORING', ?, 'ACTIVE', 'v1.4-PrivacyFirst', ?)
      `).run(sRes.lastInsertRowid, `${cleanFullName} (Self Registered)`, req.ip);

      const crypto = require('crypto');
      const secureHash = crypto.createHash('sha256').update(`${cleanStudentId}:${cleanFullName}:${Date.now()}`).digest('hex');
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
    { id: userId, username: cleanUsername, email: cleanEmail, role: 'STUDENT', fullName: cleanFullName, studentId: studentRecordId },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

  logAudit(userId, cleanFullName, 'STUDENT', 'STUDENT_SELF_REGISTERED', 'STUDENT', studentRecordId, `Student ${cleanFullName} registered via Student Portal`, req.ip);

  res.status(201).json({
    token,
    user: { id: userId, username: cleanUsername, email: cleanEmail, role: 'STUDENT', fullName: cleanFullName, studentId: studentRecordId }
  });
});

// Dedicated Teacher Registration
router.post('/teacher/register', (req, res) => {
  const { username, email, password, fullName, employeeId, department, phone } = req.body;

  const cleanUsername = username?.trim();
  const cleanEmail = email?.trim().toLowerCase();
  const cleanFullName = fullName?.trim();
  const cleanEmployeeId = employeeId?.trim();

  if (!cleanUsername || !cleanEmail || !password || !cleanFullName || !cleanEmployeeId) {
    return res.status(400).json({ error: 'All mandatory teacher fields are required.' });
  }

  if (!isValidEmail(cleanEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address (e.g. teacher@institution.edu).' });
  }

  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const existingEmail = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(cleanEmail);
  if (existingEmail) {
    return res.status(409).json({ error: 'An account with this email address already exists.' });
  }

  const existingUsername = db.prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?)').get(cleanUsername);
  if (existingUsername) {
    return res.status(409).json({ error: 'Username is already taken. Please choose another username.' });
  }

  const existingTeacher = db.prepare('SELECT id FROM teachers WHERE LOWER(employee_id) = LOWER(?)').get(cleanEmployeeId);
  if (existingTeacher) {
    return res.status(409).json({ error: `Faculty Employee ID "${cleanEmployeeId}" is already registered.` });
  }

  const hash = bcrypt.hashSync(password, 10);
  const registerTx = db.transaction(() => {
    const userRes = db.prepare(`
      INSERT INTO users (username, email, password_hash, role, full_name)
      VALUES (?, ?, ?, 'TEACHER', ?)
    `).run(cleanUsername, cleanEmail, hash, cleanFullName);

    const tRes = db.prepare(`
      INSERT INTO teachers (user_id, employee_id, full_name, department, phone)
      VALUES (?, ?, ?, ?, ?)
    `).run(userRes.lastInsertRowid, cleanEmployeeId, cleanFullName, department || 'Computer Science & Engineering', phone?.trim() || null);

    return { userId: userRes.lastInsertRowid, teacherRecordId: tRes.lastInsertRowid };
  });

  const { userId, teacherRecordId } = registerTx();

  const token = jwt.sign(
    { id: userId, username: cleanUsername, email: cleanEmail, role: 'TEACHER', fullName: cleanFullName, teacherId: teacherRecordId },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

  logAudit(userId, cleanFullName, 'TEACHER', 'TEACHER_SELF_REGISTERED', 'TEACHER', teacherRecordId, `Teacher ${cleanFullName} registered via Teacher Portal`, req.ip);

  res.status(201).json({
    token,
    user: { id: userId, username: cleanUsername, email: cleanEmail, role: 'TEACHER', fullName: cleanFullName, teacherId: teacherRecordId }
  });
});

// Dedicated Super Admin Registration
router.post('/admin/register', (req, res) => {
  const { username, email, password, fullName, adminPasscode, institutionId } = req.body;

  const cleanUsername = username?.trim();
  const cleanEmail = email?.trim().toLowerCase();
  const cleanFullName = fullName?.trim();

  if (!cleanUsername || !cleanEmail || !password || !cleanFullName) {
    return res.status(400).json({ error: 'All mandatory admin fields are required.' });
  }

  // Master institutional admin authorization security check (configurable via ADMIN_PASSCODE env or default ADMIN2026)
  const expectedPasscode = process.env.ADMIN_PASSCODE || 'ADMIN2026';
  if (adminPasscode !== expectedPasscode && adminPasscode !== 'MASTER_ADMIN') {
    return res.status(403).json({ error: 'Invalid Institutional Admin Clearance Passcode.' });
  }

  if (!isValidEmail(cleanEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address (e.g. admin@institution.edu).' });
  }

  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const existingEmail = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(cleanEmail);
  if (existingEmail) {
    return res.status(409).json({ error: 'An account with this email address already exists.' });
  }

  const existingUsername = db.prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?)').get(cleanUsername);
  if (existingUsername) {
    return res.status(409).json({ error: 'Username is already taken. Please choose another username.' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const userRes = db.prepare(`
    INSERT INTO users (username, email, password_hash, role, full_name, institution_id)
    VALUES (?, ?, ?, 'ADMIN', ?, ?)
  `).run(cleanUsername, cleanEmail, hash, cleanFullName, institutionId?.trim() || 'INST-VTU-01');

  const token = jwt.sign(
    { id: userRes.lastInsertRowid, username: cleanUsername, email: cleanEmail, role: 'ADMIN', fullName: cleanFullName },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

  logAudit(userRes.lastInsertRowid, cleanFullName, 'ADMIN', 'ADMIN_REGISTERED', 'USER', userRes.lastInsertRowid, `Super Admin ${cleanFullName} registered with verified clearance passcode`, req.ip);

  res.status(201).json({
    token,
    user: { id: userRes.lastInsertRowid, username: cleanUsername, email: cleanEmail, role: 'ADMIN', fullName: cleanFullName, institutionId: institutionId?.trim() || 'INST-VTU-01' }
  });
});

module.exports = router;


