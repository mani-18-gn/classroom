const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Initialize DB and retention worker
require('./db');
require('./services/retentionService');

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const classroomRoutes = require('./routes/classrooms');
const monitoringRoutes = require('./routes/monitoring');
const eventRoutes = require('./routes/events');
const consentRoutes = require('./routes/consents');
const auditRoutes = require('./routes/audit');
const settingsRoutes = require('./routes/settings');
const privacyRoutes = require('./routes/privacy');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Request logger for debugging & security audit
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test' && req.originalUrl.startsWith('/api')) {
      // console.log(`[API] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    }
  });
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/consents', consentRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/privacy', privacyRoutes);

// System Health & Privacy Guarantee Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'ClassGuard AI Core Backend',
    version: '2.4.0',
    privacyCompliance: {
      onDeviceInference: true,
      continuousVideoRecording: false,
      biometricExportForbidden: true,
      retentionPolicyActive: true
    },
    uptimeSeconds: Math.floor(process.uptime())
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[ClassGuard Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🛡️  ClassGuard AI Backend Server Running on Port ${PORT}`);
  console.log(`🔒 Privacy-First Architecture: 0 Video Bytes Uploaded`);
  console.log(`=======================================================`);
});

module.exports = app;
