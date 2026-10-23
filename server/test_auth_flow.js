const http = require('http');
const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'data', 'classguard.db');
console.log('Testing against Database at:', dbPath);

// Import the server app
const app = require('./src/index');

async function runTestSuite() {
  const PORT = process.env.PORT || 5000;
  // Give it a moment to initialize
  await new Promise(r => setTimeout(r, 800));
  console.log(`Test client connecting to port ${PORT}`);

  function makeRequest(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
      const payload = body ? JSON.stringify(body) : null;
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      if (payload) {
        headers['Content-Length'] = Buffer.byteLength(payload);
      }

      const req = http.request({
        hostname: '127.0.0.1',
        port: PORT,
        path: `/api${path}`,
        method: method,
        headers: headers
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = data ? JSON.parse(data) : {};
            resolve({ status: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      });

      req.on('error', reject);
      if (payload) {
        req.write(payload);
      }
      req.end();
    });
  }

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✓ [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`  ✗ [FAIL] ${message}`);
      throw new Error(`Test assertion failed: ${message}`);
    }
  }

  try {
    console.log('\n--- 1. DATABASE & SCHEMA AUDIT ---');
    const db = new Database(dbPath);
    const tableNames = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(t => t.name);
    console.log('Detected tables in DB:', tableNames);
    assert(tableNames.includes('users'), 'Table "users" exists');
    assert(tableNames.includes('teachers'), 'Table "teachers" exists');
    assert(tableNames.includes('students'), 'Table "students" exists');
    assert(tableNames.includes('classrooms'), 'Table "classrooms" exists');
    assert(tableNames.includes('consents'), 'Table "consents" exists');
    assert(tableNames.includes('biometric_profiles'), 'Table "biometric_profiles" exists');
    assert(tableNames.includes('monitoring_sessions'), 'Table "monitoring_sessions" exists');
    assert(tableNames.includes('detected_events'), 'Table "detected_events" exists');
    assert(tableNames.includes('audit_logs'), 'Table "audit_logs" exists');
    assert(tableNames.includes('system_settings'), 'Table "system_settings" exists');

    // Clean up test fixture accounts so test is repeatable & idempotent
    db.prepare("DELETE FROM users WHERE username IN ('priya_sharma', 'dr_arun_kumar', 'super_admin')").run();
    db.prepare("DELETE FROM students WHERE student_id IN ('1MS21CS042')").run();
    db.prepare("DELETE FROM teachers WHERE employee_id IN ('FAC-CSE-019')").run();

    console.log('\n--- 2. STUDENT REGISTRATION & VALIDATION ---');
    // Test 2.1: Student registration with missing mandatory fields -> 400
    const resShort = await makeRequest('POST', '/auth/student/register', {
      username: 'incomplete_user'
    });
    assert(resShort.status === 400, 'Student registration rejects missing mandatory fields (HTTP 400)');

    // Test 2.2: Student registration with invalid email format -> 400
    const resBadEmail = await makeRequest('POST', '/auth/student/register', {
      username: 'bademail_student',
      email: 'not-an-email',
      password: 'password123',
      fullName: 'Test Student',
      studentId: 'USN-TEST-001',
      rollNumber: 'CS-01'
    });
    assert(resBadEmail.status === 400, 'Student registration rejects invalid email format (HTTP 400)');

    // Test 2.3: Student registration with short password -> 400
    const resShortPass = await makeRequest('POST', '/auth/student/register', {
      username: 'shortpass_student',
      email: 'short@student.edu',
      password: '123',
      fullName: 'Test Student',
      studentId: 'USN-TEST-002',
      rollNumber: 'CS-02'
    });
    assert(resShortPass.status === 400, 'Student registration rejects password shorter than 6 characters (HTTP 400)');

    // Test 2.4: Valid Student Registration with Consent -> 201
    const resStudentReg = await makeRequest('POST', '/auth/student/register', {
      username: 'priya_sharma',
      email: 'priya.sharma@institution.edu',
      password: 'SecurePassword123!',
      fullName: 'Priya Sharma',
      studentId: '1MS21CS042',
      rollNumber: '42',
      className: '8th Semester CSE',
      section: 'A',
      phone: '+91 98765 43210',
      consentGranted: true
    });
    assert(resStudentReg.status === 201, 'Valid student registration returns HTTP 201 Created');
    assert(!!resStudentReg.data.token, 'Student registration returns a valid JWT token');
    assert(resStudentReg.data.user.role === 'STUDENT', 'User role is correctly set to STUDENT');
    const studentToken = resStudentReg.data.token;

    // Test 2.5: Duplicate email registration -> 409
    const resDupEmail = await makeRequest('POST', '/auth/student/register', {
      username: 'priya_another',
      email: 'priya.sharma@institution.edu', // duplicate email
      password: 'SecurePassword123!',
      fullName: 'Another Priya',
      studentId: '1MS21CS099',
      rollNumber: '99'
    });
    assert(resDupEmail.status === 409, 'Duplicate email registration is rejected with HTTP 409 Conflict');
    assert(resDupEmail.data.error.includes('email address already exists'), 'Error message specifically identifies duplicate email');

    // Test 2.6: Duplicate username registration -> 409
    const resDupUser = await makeRequest('POST', '/auth/student/register', {
      username: 'priya_sharma', // duplicate username
      email: 'priya.different@institution.edu',
      password: 'SecurePassword123!',
      fullName: 'Different Priya',
      studentId: '1MS21CS098',
      rollNumber: '98'
    });
    assert(resDupUser.status === 409, 'Duplicate username registration is rejected with HTTP 409 Conflict');
    assert(resDupUser.data.error.includes('Username is already taken'), 'Error message specifically identifies duplicate username');

    // Test 2.7: Duplicate student ID / USN -> 409
    const resDupUsn = await makeRequest('POST', '/auth/student/register', {
      username: 'priya_new',
      email: 'priya.brandnew@institution.edu',
      password: 'SecurePassword123!',
      fullName: 'Different Priya',
      studentId: '1MS21CS042', // duplicate USN
      rollNumber: '43'
    });
    assert(resDupUsn.status === 409, 'Duplicate Student ID / USN registration is rejected with HTTP 409 Conflict');

    console.log('\n--- 3. TEACHER REGISTRATION & VALIDATION ---');
    // Test 3.1: Valid Teacher Registration -> 201
    const resTeacherReg = await makeRequest('POST', '/auth/teacher/register', {
      username: 'dr_arun_kumar',
      email: 'arun.kumar@institution.edu',
      password: 'FacultyPassword2026!',
      fullName: 'Dr. Arun Kumar',
      employeeId: 'FAC-CSE-019',
      department: 'Computer Science & Engineering',
      phone: '+91 94480 12345'
    });
    assert(resTeacherReg.status === 201, 'Valid teacher registration returns HTTP 201 Created');
    assert(resTeacherReg.data.user.role === 'TEACHER', 'User role is correctly set to TEACHER');
    const teacherToken = resTeacherReg.data.token;

    // Test 3.2: Duplicate Teacher Employee ID -> 409
    const resDupTeacherEmp = await makeRequest('POST', '/auth/teacher/register', {
      username: 'arun_other',
      email: 'arun.other@institution.edu',
      password: 'FacultyPassword2026!',
      fullName: 'Another Arun',
      employeeId: 'FAC-CSE-019', // duplicate employee ID
      department: 'CSE'
    });
    assert(resDupTeacherEmp.status === 409, 'Duplicate Faculty Employee ID is rejected with HTTP 409');

    console.log('\n--- 4. SUPER ADMIN REGISTRATION & PASSCODE SECURITY ---');
    // Test 4.1: Admin Registration with wrong clearance passcode -> 403
    const resAdminBadPass = await makeRequest('POST', '/auth/admin/register', {
      username: 'admin_attempt',
      email: 'admin.attempt@institution.edu',
      password: 'AdminPassword2026!',
      fullName: 'Unauthorized Admin',
      adminPasscode: 'WRONG_CODE_999'
    });
    assert(resAdminBadPass.status === 403, 'Admin registration with invalid passcode is rejected with HTTP 403 Forbidden');

    // Test 4.2: Valid Admin Registration with clearance passcode -> 201
    const resAdminReg = await makeRequest('POST', '/auth/admin/register', {
      username: 'super_admin',
      email: 'admin.director@institution.edu',
      password: 'DirectorAdmin2026!',
      fullName: 'Director S. Ramanathan',
      adminPasscode: 'ADMIN2026',
      institutionId: 'INST-VTU-MAIN'
    });
    assert(resAdminReg.status === 201, 'Valid Super Admin registration returns HTTP 201 Created');
    assert(resAdminReg.data.user.role === 'ADMIN', 'User role is correctly set to ADMIN');
    const adminToken = resAdminReg.data.token;

    console.log('\n--- 5. PASSWORD SECURITY & HASH INTEGRITY IN DATABASE ---');
    const usersInDb = db.prepare('SELECT id, username, email, password_hash, role FROM users').all();
    assert(usersInDb.length >= 3, `Expected at least 3 registered users in DB, found ${usersInDb.length}`);
    for (const u of usersInDb) {
      assert(u.password_hash.startsWith('$2a$') || u.password_hash.startsWith('$2b$'), `User ${u.username} password is a secure bcrypt hash`);
      assert(!u.password_hash.includes('SecurePassword123!'), `Plaintext password NEVER stored for ${u.username}`);
      assert(!u.password_hash.includes('FacultyPassword2026!'), `Plaintext password NEVER stored for ${u.username}`);
      assert(!u.password_hash.includes('DirectorAdmin2026!'), `Plaintext password NEVER stored for ${u.username}`);
    }

    // Verify student profile & consent records
    const studentRecord = db.prepare('SELECT * FROM students WHERE student_id = ?').get('1MS21CS042');
    assert(!!studentRecord, 'Student profile record created in database');
    assert(studentRecord.consent_status === 'CONSENTED', 'Student consent status is CONSENTED');

    const consentRecord = db.prepare('SELECT * FROM consents WHERE student_id = ?').get(studentRecord.id);
    assert(!!consentRecord, 'Formal digital consent record created');
    assert(consentRecord.status === 'ACTIVE', 'Digital consent status is ACTIVE');

    const bioRecord = db.prepare('SELECT * FROM biometric_profiles WHERE student_id = ?').get(studentRecord.id);
    assert(!!bioRecord, 'Biometric profile record created with quality score');
    assert(bioRecord.status === 'ACTIVE', 'Biometric profile status is ACTIVE');

    console.log('\n--- 6. LOGIN AUTHENTICATION VERIFICATION ---');
    // Test 6.1: Login with registered email + correct password -> 200
    const resLoginEmail = await makeRequest('POST', '/auth/login', {
      identifier: 'priya.sharma@institution.edu',
      password: 'SecurePassword123!'
    });
    assert(resLoginEmail.status === 200, 'Student login by email succeeds (HTTP 200)');
    assert(!!resLoginEmail.data.token, 'Student login returns valid JWT token');
    assert(resLoginEmail.data.user.role === 'STUDENT', 'User role in login response is STUDENT');

    // Test 6.2: Login with registered username + correct password -> 200
    const resLoginUser = await makeRequest('POST', '/auth/login', {
      identifier: 'dr_arun_kumar',
      password: 'FacultyPassword2026!'
    });
    assert(resLoginUser.status === 200, 'Teacher login by username succeeds (HTTP 200)');
    assert(resLoginUser.data.user.role === 'TEACHER', 'User role in login response is TEACHER');

    // Test 6.3: Login with invalid password -> 401
    const resBadPass = await makeRequest('POST', '/auth/login', {
      identifier: 'priya.sharma@institution.edu',
      password: 'WRONG_PASSWORD_XYZ'
    });
    assert(resBadPass.status === 401, 'Login with incorrect password returns HTTP 401 Unauthorized');

    // Test 6.4: Login with non-existent user identifier -> 401
    const resNonExistent = await makeRequest('POST', '/auth/login', {
      identifier: 'ghost_user_9999@institution.edu',
      password: 'SomePassword!'
    });
    assert(resNonExistent.status === 401, 'Login with non-existent account returns HTTP 401 Unauthorized');

    // Test 6.5: Login with empty credentials -> 400
    const resEmptyLogin = await makeRequest('POST', '/auth/login', {
      identifier: '',
      password: ''
    });
    assert(resEmptyLogin.status === 400, 'Login with empty credentials returns HTTP 400 Bad Request');

    console.log('\n--- 7. AUTHORIZATION & PROTECTED ROUTES ---');
    // Test 7.1: Access /api/auth/me with valid token -> 200
    const resMe = await makeRequest('GET', '/auth/me', null, studentToken);
    assert(resMe.status === 200, 'Protected route /api/auth/me succeeds with valid token (HTTP 200)');
    assert(resMe.data.user.username === 'priya_sharma', 'Authenticated profile matches logged-in user');

    // Test 7.2: Access /api/auth/me with no token -> 401
    const resMeNoToken = await makeRequest('GET', '/auth/me', null, null);
    assert(resMeNoToken.status === 401, 'Protected route /api/auth/me rejects missing token (HTTP 401)');

    // Test 7.3: Access /api/auth/me with forged token -> 403
    const resMeForged = await makeRequest('GET', '/auth/me', null, 'FORGED_INVALID_JWT_TOKEN');
    assert(resMeForged.status === 403, 'Protected route /api/auth/me rejects forged token (HTTP 403)');

    // Test 7.4: Role-based access control for /api/audit (ADMIN only)
    // Student should be rejected (403)
    const resAuditStudent = await makeRequest('GET', '/audit', null, studentToken);
    assert(resAuditStudent.status === 403, 'Student role rejected from admin audit logs (HTTP 403)');

    // Teacher should be rejected (403)
    const resAuditTeacher = await makeRequest('GET', '/audit', null, teacherToken);
    assert(resAuditTeacher.status === 403, 'Teacher role rejected from admin audit logs (HTTP 403)');

    // Super Admin should be allowed (200)
    const resAuditAdmin = await makeRequest('GET', '/audit', null, adminToken);
    assert(resAuditAdmin.status === 200, 'Super Admin role authorized for admin audit logs (HTTP 200)');
    assert(Array.isArray(resAuditAdmin.data.logs), 'Audit logs list returned for Super Admin');

    console.log('\n--- 8. PERSISTENCE CHECK (SIMULATING SERVER / DB REBOOT) ---');
    db.close();
    // Reopen DB connection cleanly
    const reconnectedDb = new Database(dbPath);
    const persistedUser = reconnectedDb.prepare('SELECT id, username, email, role FROM users WHERE username = ?').get('priya_sharma');
    assert(!!persistedUser, 'User account persisted after connection recycle');
    assert(persistedUser.role === 'STUDENT', 'User role persisted intact');

    // Re-verify login against newly reconnected instance
    const resReLogin = await makeRequest('POST', '/auth/login', {
      identifier: 'priya_sharma',
      password: 'SecurePassword123!'
    });
    assert(resReLogin.status === 200, 'User can log in after simulated restart');
    reconnectedDb.close();

    console.log(`\n======================================================`);
    console.log(`🎯 ALL TESTS PASSED: ${passedTests} / ${totalTests} assertions verified!`);
    console.log(`======================================================\n`);
  } catch (err) {
    console.error('\n❌ TEST RUN FAILED:', err);
    process.exitCode = 1;
  } finally {
    process.exit(process.exitCode || 0);
  }
}

runTestSuite();
