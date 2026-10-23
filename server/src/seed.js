const db = require('./db');

function seedDatabase() {
  console.log('Initializing ClassGuard AI clean infrastructure...');

  // Reset demo events & mock students if any exist
  db.exec(`
    DELETE FROM session_timeline_markers;
    DELETE FROM teacher_verifications;
    DELETE FROM event_snapshots;
    DELETE FROM detected_events;
    DELETE FROM monitoring_sessions;
    DELETE FROM biometric_profiles WHERE student_id IN (SELECT id FROM students WHERE is_demo = 1 OR student_id LIKE 'DEMO%');
    DELETE FROM consents WHERE student_id IN (SELECT id FROM students WHERE is_demo = 1 OR student_id LIKE 'DEMO%');
    DELETE FROM enrollments WHERE student_id IN (SELECT id FROM students WHERE is_demo = 1 OR student_id LIKE 'DEMO%');
    DELETE FROM students WHERE is_demo = 1 OR student_id LIKE 'DEMO%' OR full_name IN ('Rahul Kumar', 'Ananya Rao', 'Priya Sharma', 'Kiran Gowda', 'Vikramaditya Hegde', 'Sneha Patel');
    DELETE FROM teachers WHERE employee_id = 'EMP-CSE-104' OR full_name = 'Prof. Meera Kulkarni';
    DELETE FROM users WHERE username IN ('admin', 'teacher_prof', 'rahul_k', 'ananya_r') OR full_name IN ('Dr. Suresh Sharma', 'Prof. Meera Kulkarni', 'Rahul Kumar', 'Ananya Rao');
  `);

  // Ensure initial classes exist
  const existingClasses = db.prepare('SELECT count(*) as count FROM classes').get().count;
  if (existingClasses === 0) {
    const insertClass = db.prepare(`
      INSERT INTO classes (name, department, semester, academic_year)
      VALUES (?, ?, ?, ?)
    `);
    const c1 = insertClass.run('8th Semester CSE - Section A', 'Computer Science & Engineering', '8', '2025-2026');
    insertClass.run('6th Semester ISE - Section B', 'Information Science & Engineering', '6', '2025-2026');
    insertClass.run('4th Semester AIML - Section A', 'AI & Machine Learning', '4', '2025-2026');

    // Ensure initial classrooms exist
    const insertClassroom = db.prepare(`
      INSERT INTO classrooms (classroom_code, name, class_id, camera_source, status)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertClassroom.run('CR-402', 'Room 402 — Advanced Computing Lab', c1.lastInsertRowid, 'Integrated Webcam', 'IDLE');
    insertClassroom.run('CR-201', 'Room 201 — Main Lecture Hall', c1.lastInsertRowid, 'Integrated Webcam', 'IDLE');
  }

  // System Settings Defaults
  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO system_settings (key, value, description)
    VALUES (?, ?, ?)
  `);
  insertSetting.run('ear_drowsiness_threshold', '0.20', 'Eye Aspect Ratio threshold below which eye is considered closed');
  insertSetting.run('eye_closure_duration_sec', '5.0', 'Continuous eye closure duration in seconds to trigger sleeping alert');
  insertSetting.run('yaw_distraction_threshold_deg', '28.0', 'Head pose yaw angle in degrees away from board to trigger distraction flag');
  insertSetting.run('retention_period_days', '7', 'Automatic deletion retention window for temporary event snapshots');

  console.log('✓ Database clean and ready for real student and teacher enrollment.');
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
