const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'classguard.db');
console.log('Connecting to database:', dbPath);

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function resetDatabase() {
  console.log('\n======================================================');
  console.log('🛡️  ClassGuard AI — Database Reset & Clean Initialization');
  console.log('======================================================');

  // Checkpoint WAL first
  db.pragma('wal_checkpoint(TRUNCATE)');

  const resetTx = db.transaction(() => {
    // Temporarily turn off foreign keys to allow complete table reset
    db.pragma('foreign_keys = OFF');

    // Remove all old records from all tables
    db.exec(`
      DELETE FROM session_timeline_markers;
      DELETE FROM event_snapshots;
      DELETE FROM teacher_verifications;
      DELETE FROM detected_events;
      DELETE FROM biometric_profiles;
      DELETE FROM consents;
      DELETE FROM enrollments;
      DELETE FROM students;
      DELETE FROM teachers;
      DELETE FROM monitoring_sessions;
      DELETE FROM classrooms;
      DELETE FROM classes;
      DELETE FROM audit_logs;
      DELETE FROM users;
      DELETE FROM system_settings;
      DELETE FROM sqlite_sequence;
    `);

    db.pragma('foreign_keys = ON');

    // 1. Seed Clean Academic Classes
    const insertClass = db.prepare(`
      INSERT INTO classes (name, department, semester, academic_year)
      VALUES (?, ?, ?, ?)
    `);
    const c1 = insertClass.run('8th Semester CSE - Section A', 'Computer Science & Engineering', '8', '2025-2026');
    const c2 = insertClass.run('6th Semester ISE - Section B', 'Information Science & Engineering', '6', '2025-2026');
    const c3 = insertClass.run('4th Semester AIML - Section A', 'Artificial Intelligence & Machine Learning', '4', '2025-2026');

    // 2. Seed Clean Classrooms
    const insertClassroom = db.prepare(`
      INSERT INTO classrooms (id, classroom_code, name, class_id, camera_source, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertClassroom.run(1, 'CR-402', 'Room 402 — Advanced Computing Lab', c1.lastInsertRowid, 'Integrated Webcam', 'IDLE');
    insertClassroom.run(2, 'CR-201', 'Room 201 — Main Lecture Hall', c2.lastInsertRowid, 'Integrated Webcam', 'IDLE');

    // 3. Seed Default Monitoring Session container
    db.prepare(`
      INSERT INTO monitoring_sessions (
        id, session_code, classroom_id, started_at, status,
        avg_attention_score, avg_drowsiness_rate, avg_noise_level,
        total_students_detected, potential_events_count, verified_events_count
      )
      VALUES (1, 'SESS-LIVE-01', 1, CURRENT_TIMESTAMP, 'ACTIVE', 85.0, 5.0, 'QUIET', 0, 0, 0)
    `).run();

    // 4. Seed Standard Privacy & AI Configuration Settings
    const insertSetting = db.prepare(`
      INSERT INTO system_settings (key, value, description)
      VALUES (?, ?, ?)
    `);
    insertSetting.run('ear_drowsiness_threshold', '0.20', 'Eye Aspect Ratio threshold below which eye is considered closed');
    insertSetting.run('eye_closure_duration_sec', '5.0', 'Continuous eye closure duration in seconds to trigger sleeping alert');
    insertSetting.run('yaw_distraction_threshold_deg', '28.0', 'Head pose yaw angle in degrees away from board to trigger distraction flag');
    insertSetting.run('retention_period_days', '7', 'Automatic deletion retention window for temporary event snapshots');

    // 5. Initial System Audit Record
    db.prepare(`
      INSERT INTO audit_logs (user_name, user_role, action, resource_type, details, ip_address)
      VALUES ('SYSTEM_INIT', 'SYSTEM', 'DATABASE_CLEAN_INITIALIZATION', 'DATABASE', 'Complete database reset and clean schema reinitialization executed successfully', '127.0.0.1')
    `).run();
  });

  resetTx();

  // Run VACUUM to reclaim disk space
  console.log('Reclaiming disk space with VACUUM...');
  db.exec('VACUUM;');

  console.log('\n--- VERIFICATION OF CLEAN DATABASE STATE ---');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
  for (const t of tables) {
    const cnt = db.prepare(`SELECT count(*) as count FROM "${t.name}"`).get().count;
    console.log(`Table: ${t.name.padEnd(26)} Rows: ${cnt}`);
  }

  const integrity = db.pragma('integrity_check');
  console.log('\nIntegrity check:', integrity[0].integrity_check);
  console.log('✓ Clean database initialized successfully with ZERO old accounts or user data.\n');
}

if (require.main === module) {
  resetDatabase();
  db.close();
}

module.exports = { resetDatabase };
