const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

// List Consents
router.get('/', authenticateToken, requireRole(['ADMIN', 'TEACHER']), (req, res) => {
  const consents = db.prepare(`
    SELECT c.*, s.student_id, s.full_name as student_name, s.class_name, s.section, s.roll_number
    FROM consents c
    JOIN students s ON s.id = c.student_id
    ORDER BY c.id DESC
  `).all();

  const summary = db.prepare(`
    SELECT
      COUNT(*) as total_consents,
      SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active_consents,
      SUM(CASE WHEN status = 'REVOKED' THEN 1 ELSE 0 END) as revoked_consents
    FROM consents
  `).get();

  res.json({ consents, summary });
});

// Update Consent Status
router.patch('/:id/status', authenticateToken, requireRole(['ADMIN']), (req, res) => {
  const { status } = req.body;
  if (!['ACTIVE', 'REVOKED'].includes(status)) {
    return res.status(400).json({ error: 'Status must be ACTIVE or REVOKED' });
  }

  const consent = db.prepare('SELECT * FROM consents WHERE id = ?').get(req.params.id);
  if (!consent) return res.status(404).json({ error: 'Consent record not found' });

  const revokedAt = status === 'REVOKED' ? new Date().toISOString() : null;
  db.prepare(`
    UPDATE consents SET status = ?, revoked_at = ? WHERE id = ?
  `).run(status, revokedAt, consent.id);

  // Sync with student consent status
  db.prepare(`
    UPDATE students SET consent_status = ? WHERE id = ?
  `).run(status === 'ACTIVE' ? 'CONSENTED' : 'WITHDRAWN', consent.student_id);

  logAudit(req.user.id, req.user.fullName, req.user.role, 'CONSENT_STATUS_MODIFIED', 'CONSENT', consent.id, `Admin changed consent #${consent.id} to ${status}`, req.ip);

  res.json({ message: `Consent record updated to ${status}` });
});

module.exports = router;
