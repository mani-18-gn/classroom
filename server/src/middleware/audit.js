const db = require('../db');

function logAudit(userId, userName, userRole, action, resourceType, resourceId, details, ipAddress = '127.0.0.1') {
  try {
    const stmt = db.prepare(`
      INSERT INTO audit_logs (user_id, user_name, user_role, action, resource_type, resource_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(userId || null, userName || 'SYSTEM', userRole || 'SYSTEM', action, resourceType, resourceId ? String(resourceId) : null, details, ipAddress);
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
}

module.exports = { logAudit };
