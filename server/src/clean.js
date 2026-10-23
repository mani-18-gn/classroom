const db = require('./db');

console.log('Cleaning demo users, students, and events from database...');

db.exec(`
  DELETE FROM event_snapshots;
  DELETE FROM teacher_verifications;
  DELETE FROM detected_events;
  DELETE FROM biometric_profiles WHERE student_id IN (SELECT id FROM students WHERE is_demo = 1 OR student_id LIKE 'DEMO%' OR full_name IN ('Rahul Kumar', 'Ananya Rao', 'Priya Sharma', 'Kiran Gowda', 'Vikramaditya Hegde', 'Sneha Patel'));
  DELETE FROM consents WHERE student_id IN (SELECT id FROM students WHERE is_demo = 1 OR student_id LIKE 'DEMO%' OR full_name IN ('Rahul Kumar', 'Ananya Rao', 'Priya Sharma', 'Kiran Gowda', 'Vikramaditya Hegde', 'Sneha Patel'));
  DELETE FROM enrollments WHERE student_id IN (SELECT id FROM students WHERE is_demo = 1 OR student_id LIKE 'DEMO%' OR full_name IN ('Rahul Kumar', 'Ananya Rao', 'Priya Sharma', 'Kiran Gowda', 'Vikramaditya Hegde', 'Sneha Patel'));
  DELETE FROM students WHERE is_demo = 1 OR student_id LIKE 'DEMO%' OR full_name IN ('Rahul Kumar', 'Ananya Rao', 'Priya Sharma', 'Kiran Gowda', 'Vikramaditya Hegde', 'Sneha Patel');
  DELETE FROM teachers WHERE employee_id = 'EMP-CSE-104' OR full_name = 'Prof. Meera Kulkarni';
  DELETE FROM users WHERE username IN ('admin', 'teacher_prof', 'rahul_k', 'ananya_r') OR full_name IN ('Dr. Suresh Sharma', 'Prof. Meera Kulkarni', 'Rahul Kumar', 'Ananya Rao');
`);

console.log('Remaining students:', db.prepare('SELECT id, student_id, full_name FROM students').all());
console.log('Remaining users:', db.prepare('SELECT id, username, full_name, role FROM users').all());
console.log('Remaining events count:', db.prepare('SELECT count(*) as count FROM detected_events').get().count);
