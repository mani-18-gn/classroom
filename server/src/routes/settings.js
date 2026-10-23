const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

// Get all system and AI configuration settings
router.get('/', authenticateToken, (req, res) => {
  const settingsRows = db.prepare('SELECT key, value, description, updated_at FROM system_settings').all();
  const settings = {};
  settingsRows.forEach(row => {
    settings[row.key] = row.value;
  });

  res.json({ settings, settingsList: settingsRows });
});

// Update Settings
router.post('/update', authenticateToken, requireRole(['ADMIN']), (req, res) => {
  const { settings } = req.body;
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ error: 'Settings object required' });
  }

  const upsert = db.prepare(`
    INSERT INTO system_settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `);

  const updateTx = db.transaction(() => {
    for (const [key, val] of Object.entries(settings)) {
      upsert.run(key, String(val));
    }
  });

  updateTx();

  logAudit(req.user.id, req.user.fullName, req.user.role, 'SYSTEM_SETTINGS_UPDATED', 'SETTINGS', 'CONFIG', `Updated system configuration keys: ${Object.keys(settings).join(', ')}`, req.ip);

  res.json({ message: 'Settings updated successfully' });
});

module.exports = router;
