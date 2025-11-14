const express = require('express');
const { body } = require('express-validator');
const passport = require('../config/passport');
const { authenticate } = require('../middleware/auth');
const authController = require('../controllers/authController');

const router = express.Router();

/**
 * POST /api/auth/signup
 * Register a new user with email/password
 */
router.post(
  '/signup',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('username')
      .trim()
      .isLength({ min: 3, max: 20 })
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username must be 3-20 characters, letters, numbers, and underscores only'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('displayName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Display name must be 1-50 characters'),
  ],
  authController.signUp
);

/**
 * POST /api/auth/signin
 * Sign in with email/username and password
 */
router.post(
  '/signin',
  [
    body('identifier')
      .notEmpty()
      .withMessage('Email or username is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],
  authController.signIn
);

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', authenticate, authController.getCurrentUser);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', authController.refreshToken);

/**
 * GET /api/auth/verify-email
 * Verify email address with token
 */
router.get('/verify-email', authController.verifyEmail);

/**
 * POST /api/auth/resend-verification
 * Resend verification email
 */
router.post(
  '/resend-verification',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  ],
  authController.resendVerification
);

/**
 * POST /api/auth/signout
 * Sign out (client should remove token)
 */
router.post('/signout', authenticate, authController.signOut);

/**
 * GET /api/auth/google
 * Initiate Google OAuth flow
 */
router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({
      success: false,
      message: 'Google OAuth is not configured',
    });
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

/**
 * GET /api/auth/google/callback
 * Google OAuth callback
 */
router.get(
  '/google/callback',
  (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.redirect(process.env.FRONTEND_URL + '/auth/signin?error=oauth_not_configured');
    }
    passport.authenticate('google', { session: false, failureRedirect: process.env.FRONTEND_URL + '/auth/signin?error=oauth_failed' })(req, res, next);
  },
  authController.handleGoogleCallback
);

/**
 * GET /api/auth/discord
 * Initiate Discord OAuth flow
 */
router.get('/discord', (req, res, next) => {
  if (!process.env.DISCORD_CLIENT_ID || !process.env.DISCORD_CLIENT_SECRET) {
    return res.status(503).json({
      success: false,
      message: 'Discord OAuth is not configured',
    });
  }
  passport.authenticate('discord', { scope: ['identify', 'email'] })(req, res, next);
});

/**
 * GET /api/auth/discord/callback
 * Discord OAuth callback
 */
router.get(
  '/discord/callback',
  (req, res, next) => {
    if (!process.env.DISCORD_CLIENT_ID || !process.env.DISCORD_CLIENT_SECRET) {
      return res.redirect(process.env.FRONTEND_URL + '/auth/signin?error=oauth_not_configured');
    }
    passport.authenticate('discord', { session: false, failureRedirect: process.env.FRONTEND_URL + '/auth/signin?error=oauth_failed' })(req, res, next);
  },
  authController.handleDiscordCallback
);

module.exports = router;

