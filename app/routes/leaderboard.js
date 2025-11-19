const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const leaderboardController = require('../controllers/leaderboardController');

/**
 * GET /api/leaderboard
 * Get leaderboard rankings
 * Query params: period (daily|weekly|monthly|total), limit (default: 50)
 * Optional auth to show user's position
 */
router.get('/', optionalAuth, leaderboardController.getLeaderboard);

module.exports = router;


