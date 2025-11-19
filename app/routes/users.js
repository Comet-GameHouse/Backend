const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const userController = require('../controllers/userController');
const cardController = require('../controllers/cardController');

/**
 * GET /api/users/public/:username
 * Get public profile by username
 */
router.get('/public/:username', userController.getPublicProfile);

/**
 * GET /api/users/dashboard
 * Get user dashboard data
 */
router.get('/dashboard', authenticate, userController.getDashboard);

/**
 * GET /api/users/profile
 * Get user profile data
 */
router.get('/profile', authenticate, userController.getProfile);

/**
 * POST /api/users/avatar/upload
 * Upload user avatar
 */
router.post('/avatar/upload', authenticate, upload.single('avatar'), userController.uploadAvatar);

/**
 * PATCH /api/users/profile
 * Update user profile
 */
router.patch(
  '/profile',
  authenticate,
  [
    body('displayName').optional().trim().isLength({ min: 2 }).withMessage('Display name must be at least 2 characters long'),
    body('username').optional().trim().isAlphanumeric().withMessage('Username must be alphanumeric').isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
    body('bio').optional().trim().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
    body('pronouns').optional().trim().isLength({ max: 50 }).withMessage('Pronouns cannot exceed 50 characters'),
    body('timezone').optional().trim().isLength({ max: 50 }).withMessage('Timezone cannot exceed 50 characters'),
    body('socials.discord').optional().trim().isLength({ max: 100 }).withMessage('Discord handle cannot exceed 100 characters'),
    body('socials.twitch').optional().trim().isLength({ max: 100 }).withMessage('Twitch handle cannot exceed 100 characters'),
    body('socials.twitter').optional().trim().isLength({ max: 100 }).withMessage('Twitter handle cannot exceed 100 characters'),
  ],
  userController.updateProfile
);

/**
 * GET /api/users/cards/available
 * Get all available cards (for shop - optional auth to show ownership)
 */
router.get('/cards/available', optionalAuth, cardController.getAvailableCards);

/**
 * GET /api/users/cards
 * Get user's owned ability cards
 */
router.get('/cards', authenticate, cardController.getUserCards);

/**
 * POST /api/users/cards/activate
 * Set active ability card
 */
router.post('/cards/activate', authenticate, cardController.setActiveCard);

/**
 * POST /api/users/cards/purchase
 * Purchase a new ability card
 */
router.post('/cards/purchase', authenticate, cardController.purchaseCard);

module.exports = router;

