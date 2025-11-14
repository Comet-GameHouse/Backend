const express = require('express');
const router = express.Router();

// Health check route
router.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'API is healthy' });
});

// Auth routes
router.use('/auth', require('./auth'));
router.use('/notifications', require('./notifications'));

module.exports = router;

