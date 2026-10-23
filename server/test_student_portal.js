const http = require('http');
const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'data', 'classguard.db');
const app = require('./src/index');

async function runStudentPortalTestSuite() {
  const PORT = process.env.PORT || 5000;
  await new Promise(r => setTimeout(r, 600));
  console.log(`\n======================================================`);
  console.log(`🛡️ CLASSGUARD AI — STUDENT PORTAL FULL-STACK TEST SUITE`);
  console.log(`Connecting to port ${PORT}...`);
  console.log(`======================================================\n`);

  function makeRequest(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
      const payload = body ? JSON.stringify(body) : null;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (payload) headers['Content-Length'] = Buffer.byteLength(payload);

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
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      });

      req.on('error', reject);
      if (payload) req.write(payload);
      req.end();
    });
  }

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✓ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${message}`);
      throw new Error(`Test assertion failed: ${message}`);
    }
  }

  try {
    const db = new Database(dbPath);

    console.log('--- STEP 1: AUTHENTICATING TEST STUDENT & TEACHER ---');
    // Ensure clean test student
    db.prepare("DELETE FROM users WHERE username = 'portal_test_student'").run();
    db.prepare("DELETE FROM students WHERE student_id = 'PORTAL-TEST-001'").run();

    // Register fresh test student
    const regRes = await makeRequest('POST', '/auth/student/register', {
      username: 'portal_test_student',
      email: 'portal.student@institution.edu',
      password: 'StudentPortalPassword2026!',
      fullName: 'Aarav Patel',
      studentId: 'PORTAL-TEST-001',
      rollNumber: '88',
      className: '6th Semester ISE',
      section: 'B',
      phone: '+91 91234 56789',
      consentGranted: true
    });
    assert(regRes.status === 201, 'Student successfully registered (HTTP 201)');
    const studentToken = regRes.data.token;
    const studentRecordId = regRes.data.user.studentId;
    assert(!!studentToken, 'Student JWT token generated');

    // Create a sample detected event for this student to test review & appeals
    const sampleEvent = db.prepare(`
      INSERT INTO detected_events (
        session_id, student_id, student_name_snapshot, event_type, category,
        confidence_score, duration_seconds, verification_status, ai_observation, camera_id
      )
      VALUES (1, ?, 'Aarav Patel', 'PROLONGED_EYE_CLOSURE', 'ATTENTION', 0.88, 4.2, 'PENDING', 'Preliminary EAR closure of 4.2 seconds', 'CAM-01')
    `).run(studentRecordId);
    const sampleEventId = sampleEvent.lastInsertRowid;
    assert(sampleEventId > 0, `Test event created with ID #${sampleEventId}`);

    // Get Teacher token
    const teacherLogin = await makeRequest('POST', '/auth/login', {
      identifier: 'dr_arun_kumar',
      password: 'FacultyPassword2026!'
    });
    let teacherToken = teacherLogin.data?.token;
    if (!teacherToken) {
      // Fallback demo login
      const demoT = await makeRequest('POST', '/auth/demo-login', { role: 'TEACHER' });
      teacherToken = demoT.data.token;
    }
    assert(!!teacherToken, 'Teacher token acquired');

    console.log('\n--- STEP 2: STUDENT DASHBOARD VERIFICATION ---');
    const dashRes = await makeRequest('GET', '/students/me/dashboard', null, studentToken);
    assert(dashRes.status === 200, 'Student dashboard endpoint returns HTTP 200');
    assert(dashRes.data.student.studentId === 'PORTAL-TEST-001', 'Dashboard returns authenticated student USN');
    assert(dashRes.data.student.fullName === 'Aarav Patel', 'Dashboard returns student full name');
    assert(dashRes.data.statistics.totalDetectedObservations >= 1, 'Dashboard statistics reflect actual DB records');
    assert(dashRes.data.statistics.pendingReviewCount >= 1, 'Pending review count calculated from DB');
    assert(Array.isArray(dashRes.data.recentActivity), 'Recent activity array returned');
    assert(!!dashRes.data.privacyConsent, 'Privacy & consent status object included');
    assert(!!dashRes.data.classroom, 'Assigned classroom info included');

    console.log('\n--- STEP 3: MY PROFILE & PERMITTED UPDATES ---');
    const profRes = await makeRequest('GET', '/students/me/profile', null, studentToken);
    assert(profRes.status === 200, 'Profile details retrieved (HTTP 200)');
    assert(profRes.data.profile.email === 'portal.student@institution.edu', 'Profile email matches');

    // Update permitted fields
    const patchRes = await makeRequest('PATCH', '/students/me/profile', {
      phone: '+91 99999 00000',
      bio: 'Enthusiastic machine learning undergraduate',
      emergency_contact: 'Father: +91 98888 77777',
      preferred_name: 'Aarav P.'
    }, studentToken);
    assert(patchRes.status === 200, 'Permitted profile fields updated (HTTP 200)');

    // Verify persistence
    const reProfRes = await makeRequest('GET', '/students/me/profile', null, studentToken);
    assert(reProfRes.data.profile.phone === '+91 99999 00000', 'Updated phone persisted');
    assert(reProfRes.data.profile.preferredName === 'Aarav P.', 'Updated preferred name persisted');

    // Test rejection of unauthorized field manipulation
    const hackAttempt = await makeRequest('PATCH', '/students/me/profile', {
      phone: 'a'.repeat(50) // too long
    }, studentToken);
    assert(hackAttempt.status === 400, 'Validation rejects excessively long phone (HTTP 400)');

    console.log('\n--- STEP 4: PASSWORD CHANGE SECURITY ---');
    // Wrong current password
    const badPassRes = await makeRequest('POST', '/students/me/change-password', {
      currentPassword: 'WRONG_OLD_PASSWORD',
      newPassword: 'BrandNewSecurePassword2026!',
      confirmPassword: 'BrandNewSecurePassword2026!'
    }, studentToken);
    assert(badPassRes.status === 401, 'Password change rejects incorrect current password (HTTP 401)');

    // Mismatched passwords
    const mismatchRes = await makeRequest('POST', '/students/me/change-password', {
      currentPassword: 'StudentPortalPassword2026!',
      newPassword: 'BrandNewSecurePassword2026!',
      confirmPassword: 'DIFFERENT_CONFIRM_PASSWORD'
    }, studentToken);
    assert(mismatchRes.status === 400, 'Password change rejects mismatched confirmation (HTTP 400)');

    // Valid password change
    const goodPassRes = await makeRequest('POST', '/students/me/change-password', {
      currentPassword: 'StudentPortalPassword2026!',
      newPassword: 'BrandNewSecurePassword2026!',
      confirmPassword: 'BrandNewSecurePassword2026!'
    }, studentToken);
    assert(goodPassRes.status === 200, 'Password changed successfully (HTTP 200)');

    // Verify new password works on login
    const newLoginRes = await makeRequest('POST', '/auth/login', {
      identifier: 'portal_test_student',
      password: 'BrandNewSecurePassword2026!'
    });
    assert(newLoginRes.status === 200, 'Can log in with updated password (HTTP 200)');

    console.log('\n--- STEP 5: MY CLASSROOM ENDPOINT ---');
    const classRes = await makeRequest('GET', '/students/me/classroom', null, studentToken);
    assert(classRes.status === 200, 'Classroom details retrieved (HTTP 200)');
    assert(!!classRes.data.classroom.classroom_code, 'Classroom code present');
    assert(Array.isArray(classRes.data.schedule), 'Class schedule array provided');
    assert(!!classRes.data.monitoringPolicy, 'Monitoring transparency policy provided');
    assert(!!classRes.data.supportContact, 'Department support contact provided');

    console.log('\n--- STEP 6: MY ACTIVITY RECORDS & FILTERS ---');
    const recordsRes = await makeRequest('GET', '/students/me/activity-records?category=ATTENTION', null, studentToken);
    assert(recordsRes.status === 200, 'Filtered activity records retrieved (HTTP 200)');
    assert(Array.isArray(recordsRes.data.records), 'Records array returned');
    assert(recordsRes.data.records.some(r => r.id === sampleEventId), 'Sample event found in records');

    // Filter by pending status
    const pendingFilterRes = await makeRequest('GET', '/students/me/activity-records?status=PENDING', null, studentToken);
    assert(pendingFilterRes.status === 200, 'Status filter query executed successfully');

    console.log('\n--- STEP 7: PRIVACY & CONSENT MANAGEMENT ---');
    const privRes = await makeRequest('GET', '/students/me/privacy', null, studentToken);
    assert(privRes.status === 200, 'Privacy & consent status retrieved (HTTP 200)');
    assert(privRes.data.consentStatus === 'CONSENTED', 'Consent is initially CONSENTED');

    // Withdraw consent
    const withdrawRes = await makeRequest('POST', '/students/me/privacy/consent', { action: 'WITHDRAW' }, studentToken);
    assert(withdrawRes.status === 200, 'Consent withdrawn successfully (HTTP 200)');

    // Verify withdrawn state in database
    const studentDbCheck = db.prepare('SELECT consent_status FROM students WHERE id = ?').get(studentRecordId);
    assert(studentDbCheck.consent_status === 'WITHDRAWN', 'Student record reflects WITHDRAWN consent status');

    // Grant consent back
    const grantRes = await makeRequest('POST', '/students/me/privacy/consent', { action: 'GRANT' }, studentToken);
    assert(grantRes.status === 200, 'Consent granted back (HTTP 200)');
    const reConsentCheck = db.prepare('SELECT consent_status FROM students WHERE id = ?').get(studentRecordId);
    assert(reConsentCheck.consent_status === 'CONSENTED', 'Student record reflects active consent');

    console.log('\n--- STEP 8: PRIVACY STATUTORY REQUESTS ---');
    const reqSubmitRes = await makeRequest('POST', '/students/me/privacy-requests', {
      category: 'ACCESS_PERSONAL_DATA',
      explanation: 'Requesting formal summary of all telemetry collected in 6th semester.'
    }, studentToken);
    assert(reqSubmitRes.status === 201, 'Privacy request created with HTTP 201');
    assert(reqSubmitRes.data.requestCode.startsWith('PR-2026-'), 'Generated formal request code PR-2026-XXXX');

    // List privacy requests
    const listReqsRes = await makeRequest('GET', '/students/me/privacy-requests', null, studentToken);
    assert(listReqsRes.status === 200, 'Privacy requests list retrieved (HTTP 200)');
    assert(listReqsRes.data.requests.length >= 1, 'Submitted request found in list');

    console.log('\n--- STEP 9: REQUEST A REVIEW / STUDENT APPEAL ---');
    const appealRes = await makeRequest('POST', '/students/me/review-appeals', {
      event_id: sampleEventId,
      reason_category: 'NORMAL_ACTIVITY',
      explanation: 'I was looking down writing notes in my project diary during lecture.'
    }, studentToken);
    assert(appealRes.status === 201, 'Review appeal submitted successfully (HTTP 201)');
    assert(appealRes.data.appealCode.startsWith('APP-2026-'), 'Generated formal appeal code APP-2026-XXXX');

    // Test duplicate appeal rejection
    const dupAppealRes = await makeRequest('POST', '/students/me/review-appeals', {
      event_id: sampleEventId,
      reason_category: 'INCORRECT_DETECTION',
      explanation: 'Duplicate appeal submission attempt.'
    }, studentToken);
    assert(dupAppealRes.status === 409, 'Duplicate pending appeal is rejected with HTTP 409 Conflict');

    // List appeals
    const listAppealsRes = await makeRequest('GET', '/students/me/review-appeals', null, studentToken);
    assert(listAppealsRes.status === 200, 'Appeals list retrieved (HTTP 200)');
    assert(listAppealsRes.data.appeals.length >= 1, 'Submitted appeal present in tracker');

    console.log('\n--- STEP 10: TEACHER REVIEW & APPEAL RESOLUTION INTEGRATION ---');
    // Teacher verifies the event as FALSE_POSITIVE with notes
    const teacherVerifyRes = await makeRequest('POST', `/events/${sampleEventId}/verify`, {
      decision: 'FALSE_POSITIVE',
      notes: 'Reviewed student appeal; confirmed student was taking lecture notes.'
    }, teacherToken);
    assert(teacherVerifyRes.status === 200, 'Teacher verified event as FALSE_POSITIVE (HTTP 200)');

    // Verify that the linked appeal in review_appeals was automatically resolved
    const resolvedAppeal = db.prepare('SELECT status, teacher_decision, teacher_notes FROM review_appeals WHERE event_id = ?').get(sampleEventId);
    assert(resolvedAppeal.status === 'RESOLVED', 'Review appeal status automatically updated to RESOLVED');
    assert(resolvedAppeal.teacher_decision === 'DISMISSED', 'Teacher decision recorded on appeal');

    console.log('\n--- STEP 11: NOTIFICATIONS CENTER ---');
    const notifsRes = await makeRequest('GET', '/students/me/notifications', null, studentToken);
    assert(notifsRes.status === 200, 'Notifications list retrieved (HTTP 200)');
    assert(notifsRes.data.notifications.length >= 1, 'Student received notifications for appeal & review');
    const firstNotifId = notifsRes.data.notifications[0].id;

    // Mark single notification as read
    const markReadRes = await makeRequest('PATCH', `/students/me/notifications/${firstNotifId}/read`, null, studentToken);
    assert(markReadRes.status === 200, 'Single notification marked as read (HTTP 200)');

    // Mark all as read
    const markAllRes = await makeRequest('POST', '/students/me/notifications/mark-all-read', null, studentToken);
    assert(markAllRes.status === 200, 'Mark all notifications read succeeded (HTTP 200)');

    console.log('\n--- STEP 12: ACTIVITY INSIGHTS ---');
    const insightsRes = await makeRequest('GET', '/students/me/activity-insights?range=30d', null, studentToken);
    assert(insightsRes.status === 200, 'Activity insights retrieved (HTTP 200)');
    assert(!!insightsRes.data.summary, 'Insights summary object returned');
    assert(Array.isArray(insightsRes.data.categories), 'Categories array returned');
    assert(Array.isArray(insightsRes.data.trend), 'Daily trend array returned');
    assert(!!insightsRes.data.ethicalNotice, 'Ethical AI disclaimer included');

    console.log('\n--- STEP 13: SECURITY CENTER & AUDITING ---');
    const secRes = await makeRequest('GET', '/students/me/security', null, studentToken);
    assert(secRes.status === 200, 'Security center details retrieved (HTTP 200)');
    assert(Array.isArray(secRes.data.loginHistory), 'Login history array returned');
    assert(Array.isArray(secRes.data.securityChecklist), 'Security checklist returned');

    console.log('\n--- STEP 14: SUPPORT TICKETS ---');
    const ticketRes = await makeRequest('POST', '/students/me/support-tickets', {
      subject: 'Inquiry regarding camera hardware specification',
      category: 'TECHNICAL_ISSUE',
      message: 'Can I verify the exact FPS and resolution used by MediaPipe in CR-402?'
    }, studentToken);
    assert(ticketRes.status === 201, 'Support ticket created with HTTP 201');
    assert(ticketRes.data.ticketCode.startsWith('TCK-2026-'), 'Ticket code generated');

    const getTicketsRes = await makeRequest('GET', '/students/me/support-tickets', null, studentToken);
    assert(getTicketsRes.data.tickets.length >= 1, 'Support ticket retrieved in student list');

    console.log('\n--- STEP 15: DOWNLOAD MY DATA (EXPORT TRANSPARENCY) ---');
    const exportRes = await makeRequest('GET', '/students/me/export-data', null, studentToken);
    assert(exportRes.status === 200, 'Export data package generated (HTTP 200)');
    assert(exportRes.data.studentProfile.studentId === 'PORTAL-TEST-001', 'Export contains authenticated student profile');
    assert(Array.isArray(exportRes.data.consentHistory), 'Export contains consent history');
    assert(Array.isArray(exportRes.data.activityRecords), 'Export contains activity records');
    assert(Array.isArray(exportRes.data.submittedReviewAppeals), 'Export contains review appeals');
    assert(Array.isArray(exportRes.data.submittedPrivacyRequests), 'Export contains privacy requests');
    // Ensure secrets are excluded
    assert(!exportRes.data.studentProfile.password_hash, 'Password hashes are NEVER exported');
    assert(!exportRes.data.studentProfile.jwt, 'JWT tokens are NEVER exported');

    console.log('\n--- STEP 16: IDOR & CROSS-STUDENT ACCESS RESTRICTION ---');
    // Student 1 trying to query Student 2's direct endpoint
    const idorRes = await makeRequest('GET', '/students/2', null, studentToken);
    assert(idorRes.status === 403, 'Cross-student direct object reference is rejected with HTTP 403 Forbidden');

    console.log(`\n======================================================`);
    console.log(`🎯 ALL STUDENT PORTAL TESTS PASSED: ${passed} / ${total} assertions verified!`);
    console.log(`======================================================\n`);
  } catch (err) {
    console.error('\n❌ TEST RUN FAILED:', err);
    process.exitCode = 1;
  } finally {
    process.exit(process.exitCode || 0);
  }
}

runStudentPortalTestSuite();
