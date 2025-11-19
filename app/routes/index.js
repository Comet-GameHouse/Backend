const express = require('express');
const router = express.Router();

// Health check route
router.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'API is healthy' });
});

// Auth routes
router.use('/auth', require('./auth'));
router.use('/notifications', require('./notifications'));
router.use('/users', require('./users'));
router.use('/support', require('./support'));
router.use('/community', require('./community'));
router.use('/badges', require('./badges'));
router.use('/leaderboard', require('./leaderboard'));
router.use('/games', require('./games'));

// Admin routes
router.use('/admin', require('./admin'));

module.exports = router;

