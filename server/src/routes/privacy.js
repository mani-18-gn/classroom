const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

// Download student data package (GDPR/DPDP export)
router.get('/export-my-data/:studentId', authenticateToken, (req, res) => {
  const student = db.prepare('SELECT id, student_id, full_name, class_name, section, roll_number, email, phone, consent_status, created_at FROM students WHERE id = ?').get(req.params.studentId);

  if (!student) return res.status(404).json({ error: 'Student not found' });

  // Self or admin/teacher check
  if (req.user.role === 'STUDENT' && req.user.studentId && req.user.studentId !== student.id) {
    return res.status(403).json({ error: 'Access forbidden.' });
  }

  const consents = db.prepare('SELECT id, consent_type, granted_by, status, terms_version, granted_at, revoked_at FROM consents WHERE student_id = ?').all(student.id);

  const biometricStatus = db.prepare('SELECT id, quality_score, status, enrolled_at, purged_at FROM biometric_profiles WHERE student_id = ?').get(student.id);

  const verifiedEvents = db.prepare(`
    SELECT d.id, d.event_type, d.category, d.confidence_score, d.duration_seconds, d.timestamp,
           tv.decision, tv.notes, tv.verified_at
    FROM detected_events d
    JOIN teacher_verifications tv ON tv.event_id = d.id
    WHERE d.student_id = ? AND d.verification_status = 'VERIFIED'
  `).all(student.id);

  const exportPayload = {
    exportDate: new Date().toISOString(),
    system: 'ClassGuard AI — Smart Classroom Safety & Attention Monitoring System',
    privacyStandards: ['Zero Continuous Video Retention', 'Local Edge Processing', 'Human Teacher In The Loop', 'Role-Based Encryption'],
    studentProfile: student,
    consents,
    biometricRecord: biometricStatus ? {
      status: biometricStatus.status,
      qualityScore: biometricStatus.quality_score,
      enrolledAt: biometricStatus.enrolled_at,
      rawBiometricsExposed: false,
      notice: 'Biometric vectors are encrypted at rest with AES-256-GCM and never exported or transferred.'
    } : null,
    verifiedEventsRecord: verifiedEvents
  };

  logAudit(req.user.id, req.user.fullName, req.user.role, 'DATA_EXPORT_DOWNLOADED', 'STUDENT', student.id, `Exported GDPR/DPDP personal data archive for student #${student.id}`, req.ip);

  res.setHeader('Content-Disposition', `attachment; filename=classguard-export-${student.student_id}.json`);
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(exportPayload, null, 2));
});

// Privacy Center Overview metrics
router.get('/overview', authenticateToken, (req, res) => {
  const retentionDays = db.prepare("SELECT value FROM system_settings WHERE key = 'retention_period_days'").get()?.value || '7';

  const totalConsents = db.prepare("SELECT COUNT(*) as count FROM consents WHERE status = 'ACTIVE'").get()?.count || 0;
  const revokedConsents = db.prepare("SELECT COUNT(*) as count FROM consents WHERE status = 'REVOKED'").get()?.count || 0;
  const purgedBiometrics = db.prepare("SELECT COUNT(*) as count FROM biometric_profiles WHERE status = 'PURGED'").get()?.count || 0;
  const activeBiometrics = db.prepare("SELECT COUNT(*) as count FROM biometric_profiles WHERE status = 'ACTIVE'").get()?.count || 0;
  const totalSnapshots = db.prepare("SELECT COUNT(*) as count FROM event_snapshots").get()?.count || 0;

  res.json({
    retentionDays: parseInt(retentionDays, 10),
    totalConsents,
    revokedConsents,
    purgedBiometrics,
    activeBiometrics,
    totalSnapshots,
    dataProcessingLocation: 'Local In-Browser & Local Institutional Edge Node',
    continuousVideoStored: false,
    externalCloudStreaming: false
  });
});

module.exports = router;
