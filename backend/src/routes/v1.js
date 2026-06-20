const express = require('express');
const { authRoutes } = require('../modules/auth');
const env = require('../config/env');

const router = express.Router();

router.use('/auth', authRoutes);

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'API is healthy', data: { version: 'v1' } });
});

module.exports = router;
