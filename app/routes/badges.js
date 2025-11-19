const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const badgeController = require('../controllers/badgeController');

/**
 * GET /api/badges/definitions
 * Get all available badge definitions (public)
 */
router.get('/definitions', badgeController.getBadgeDefinitions);

/**
 * GET /api/badges/progress
 * Get user's badge progress (authenticated)
 */
router.get('/progress', authenticate, badgeController.getUserBadgeProgress);

/**
 * POST /api/badges/claim
 * Claim a badge reward (authenticated)
 */
router.post('/claim', authenticate, badgeController.claimBadge);

module.exports = router;

