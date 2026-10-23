const db = require('../db');
const { logAudit } = require('../middleware/audit');

function runRetentionCleanup() {
  try {
    // 1. Delete event snapshots whose expires_at < CURRENT_TIMESTAMP
    const expiredSnapshots = db.prepare(`
      SELECT count(*) as count FROM event_snapshots WHERE expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP
    `).get();

    if (expiredSnapshots && expiredSnapshots.count > 0) {
      db.prepare(`
        DELETE FROM event_snapshots WHERE expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP
      `).run();
      logAudit(null, 'CRON_RETENTION_WORKER', 'SYSTEM', 'SNAPSHOTS_PURGED', 'EVENT_SNAPSHOTS', null, `Purged ${expiredSnapshots.count} expired event snapshots according to retention policy`);
      console.log(`[Retention Policy] Purged ${expiredSnapshots.count} expired event snapshots.`);
    }

    // 2. Clear biometric representations for students with WITHDRAWN consent
    const withdrawnBios = db.prepare(`
      SELECT b.id, b.student_id FROM biometric_profiles b
      JOIN students s ON s.id = b.student_id
      WHERE s.consent_status = 'WITHDRAWN' AND b.status = 'ACTIVE'
    `).all();

    for (const bio of withdrawnBios) {
      db.prepare(`
        UPDATE biometric_profiles
        SET feature_vector_encrypted = '[PURGED_ON_WITHDRAWAL]',
            landmarks_template = NULL,
            status = 'PURGED',
            purged_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(bio.id);

      logAudit(null, 'CRON_RETENTION_WORKER', 'SYSTEM', 'BIOMETRICS_PURGED', 'BIOMETRIC_PROFILE', bio.id, `Purged biometric representation for student #${bio.student_id} following consent withdrawal`);
    }
  } catch (err) {
    console.error('[Retention Policy] Error during retention cleanup:', err.message);
  }
}

// Run cleanup every 15 minutes in production; also immediately on startup
runRetentionCleanup();
setInterval(runRetentionCleanup, 15 * 60 * 1000);

module.exports = { runRetentionCleanup };
