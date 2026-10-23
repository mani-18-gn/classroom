const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'classguard.db');
const db = new Database(dbPath);

// Enable WAL mode and foreign keys for high performance and integrity
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('ADMIN', 'TEACHER', 'STUDENT')) NOT NULL,
    full_name TEXT NOT NULL,
    institution_id TEXT DEFAULT 'INST-CSE-001',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    employee_id TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    department TEXT NOT NULL,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    semester TEXT NOT NULL,
    academic_year TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS classrooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    classroom_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
    teacher_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL,
    camera_source TEXT DEFAULT 'Camera 1 (Integrated Webcam)',
    status TEXT DEFAULT 'IDLE' CHECK(status IN ('IDLE', 'MONITORING', 'PAUSED')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    class_name TEXT NOT NULL,
    section TEXT NOT NULL,
    roll_number TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    photo_data_url TEXT,
    face_descriptor TEXT,
    consent_status TEXT DEFAULT 'CONSENTED' CHECK(consent_status IN ('CONSENTED', 'WITHDRAWN', 'PENDING')),
    is_demo INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    classroom_id INTEGER REFERENCES classrooms(id) ON DELETE CASCADE,
    enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, classroom_id)
  );

  CREATE TABLE IF NOT EXISTS consents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    consent_type TEXT DEFAULT 'CLASSROOM_SAFETY_ATTENTION_MONITORING',
    granted_by TEXT NOT NULL,
    status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'REVOKED')),
    terms_version TEXT DEFAULT 'v1.4-PrivacyFirst',
    ip_address TEXT DEFAULT '127.0.0.1',
    granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    revoked_at DATETIME
  );

  CREATE TABLE IF NOT EXISTS biometric_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    feature_vector_hash TEXT NOT NULL,
    feature_vector_encrypted TEXT NOT NULL,
    landmarks_template TEXT,
    quality_score REAL DEFAULT 0.95,
    status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'PURGED')),
    enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    purged_at DATETIME
  );

  CREATE TABLE IF NOT EXISTS monitoring_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_code TEXT UNIQUE NOT NULL,
    classroom_id INTEGER REFERENCES classrooms(id) ON DELETE CASCADE,
    teacher_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME,
    status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'PAUSED', 'COMPLETED')),
    avg_attention_score REAL DEFAULT 82.5,
    avg_drowsiness_rate REAL DEFAULT 6.2,
    avg_noise_level TEXT DEFAULT 'MODERATE',
    total_students_detected INTEGER DEFAULT 0,
    potential_events_count INTEGER DEFAULT 0,
    verified_events_count INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS detected_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER REFERENCES monitoring_sessions(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES students(id) ON DELETE SET NULL,
    student_name_snapshot TEXT NOT NULL,
    event_type TEXT CHECK(event_type IN ('PROLONGED_EYE_CLOSURE', 'PROLONGED_DISTRACTION', 'CLASSROOM_DISTURBANCE', 'PHYSICAL_CONFLICT')) NOT NULL,
    category TEXT CHECK(category IN ('ATTENTION', 'ENGAGEMENT', 'DISTURBANCE', 'SAFETY')) NOT NULL,
    confidence_score REAL NOT NULL,
    duration_seconds REAL NOT NULL,
    verification_status TEXT DEFAULT 'PENDING' CHECK(verification_status IN ('PENDING', 'VERIFIED', 'REJECTED', 'NEEDS_REVIEW')),
    ai_observation TEXT NOT NULL,
    camera_id TEXT DEFAULT 'CAM-01',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_simulated INTEGER DEFAULT 0,
    teacher_notes TEXT,
    verified_by TEXT,
    verified_at DATETIME
  );

  CREATE TABLE IF NOT EXISTS event_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER REFERENCES detected_events(id) ON DELETE CASCADE,
    snapshot_index INTEGER NOT NULL,
    image_data_url TEXT NOT NULL,
    captured_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME
  );

  CREATE TABLE IF NOT EXISTS teacher_verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER REFERENCES detected_events(id) ON DELETE CASCADE,
    teacher_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL,
    decision TEXT CHECK(decision IN ('VERIFIED', 'FALSE_POSITIVE', 'NEEDS_REVIEW')) NOT NULL,
    notes TEXT,
    verified_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    user_name TEXT,
    user_role TEXT,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    details TEXT,
    ip_address TEXT DEFAULT '127.0.0.1',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS session_timeline_markers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER REFERENCES monitoring_sessions(id) ON DELETE CASCADE,
    marker_type TEXT NOT NULL,
    title TEXT NOT NULL,
    notes TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON teachers(user_id);
  CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
  CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
  CREATE INDEX IF NOT EXISTS idx_detected_events_session_id ON detected_events(session_id);
  CREATE INDEX IF NOT EXISTS idx_detected_events_student_id ON detected_events(student_id);
  CREATE INDEX IF NOT EXISTS idx_event_snapshots_event_id ON event_snapshots(event_id);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
`);

// Safe column migrations for existing databases
try {
  db.exec("ALTER TABLE students ADD COLUMN photo_data_url TEXT;");
} catch (e) {}
try {
  db.exec("ALTER TABLE students ADD COLUMN face_descriptor TEXT;");
} catch (e) {}
try {
  db.exec("ALTER TABLE detected_events ADD COLUMN teacher_notes TEXT;");
} catch (e) {}
try {
  db.exec("ALTER TABLE detected_events ADD COLUMN verified_by TEXT;");
} catch (e) {}
try {
  db.exec("ALTER TABLE detected_events ADD COLUMN verified_at DATETIME;");
} catch (e) {}

// Ensure default classroom & active monitoring session exist so detected_events foreign keys always succeed
try {
  const cCount = db.prepare('SELECT count(*) as count FROM classrooms').get().count;
  if (cCount === 0) {
    db.prepare(`
      INSERT INTO classrooms (id, classroom_code, name, camera_source, status)
      VALUES (1, 'CR-402', 'Room 402 — Advanced Computing Lab', 'Integrated Webcam', 'MONITORING')
    `).run();
  }
  const sCount = db.prepare('SELECT count(*) as count FROM monitoring_sessions').get().count;
  if (sCount === 0) {
    db.prepare(`
      INSERT INTO monitoring_sessions (id, session_code, classroom_id, started_at, status, avg_attention_score, avg_drowsiness_rate, avg_noise_level, potential_events_count)
      VALUES (1, 'SESS-LIVE-01', 1, CURRENT_TIMESTAMP, 'ACTIVE', 85, 5, 'QUIET', 0)
    `).run();
  }
} catch (e) {
  console.warn('Initial session check:', e.message);
}

module.exports = db;
