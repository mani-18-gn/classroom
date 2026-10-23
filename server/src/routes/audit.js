const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// List Audit Logs
router.get('/', authenticateToken, requireRole(['ADMIN']), (req, res) => {
  const { action, resource_type, limit = 100 } = req.query;

  let query = 'SELECT * FROM audit_logs WHERE 1=1';
  const params = [];

  if (action) {
    query += ' AND action = ?';
    params.push(action);
  }
  if (resource_type) {
    query += ' AND resource_type = ?';
    params.push(resource_type);
  }

  query += ' ORDER BY id DESC LIMIT ?';
  params.push(Number(limit));

  const logs = db.prepare(query).all(...params);
  res.json({ logs });
});

module.exports = router;
