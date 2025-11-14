const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken, generateRefreshToken } = require('../utils/jwt');
const { sendVerificationEmail } = require('../services/emailService');
const { createNotification } = require('../utils/notifications');

/**
 * Sign up a new user
 */
const signUp = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Format validation errors for better frontend display
      const formattedErrors = errors.array().map((error) => ({
        field: error.path || error.param,
        message: error.msg,
      }));
      
      // Get the first error message for the main message
      const firstError = errors.array()[0];
      
      return res.status(400).json({
        success: false,
        message: firstError?.msg || 'Validation failed',
        errors: formattedErrors,
        validationErrors: errors.array(), // Keep original format for compatibility
      });
    }

    const { email, username, password, displayName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username: username.toLowerCase() }],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: existingUser.email === email 
          ? 'Email already registered' 
          : 'Username already taken',
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24); // 24 hours

    // Create user
    const user = await User.create({
      email,
      username: username.toLowerCase(),
      displayName: displayName || username,
      password: hashedPassword,
      role: 'player',
      isVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken, displayName || username);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail signup if email fails, but log it
    }

    // Send welcome notification
    try {
      await createNotification(user._id.toString(), {
        type: 'system',
        title: 'Welcome to Comet GameHouse! 🎮',
        message: `Welcome, ${displayName || username}! We're excited to have you join our community. Start exploring games, join arenas, and connect with players from around the world.`,
        intent: 'success',
        icon: 'rocket',
        payload: {
          welcome: true,
          signupDate: new Date().toISOString(),
        },
      });
    } catch (notificationError) {
      console.error('Failed to send welcome notification:', notificationError);
      // Don't fail signup if notification fails, but log it
    }

    // Generate tokens
    const token = generateToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please check your email to verify your account.',
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          role: user.role,
          isVerified: user.isVerified,
        },
        token,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create account',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Sign in with email/username and password
 */
const signIn = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Format validation errors for better frontend display
      const formattedErrors = errors.array().map((error) => ({
        field: error.path || error.param,
        message: error.msg,
      }));
      
      // Get the first error message for the main message
      const firstError = errors.array()[0];
      
      return res.status(400).json({
        success: false,
        message: firstError?.msg || 'Validation failed',
        errors: formattedErrors,
        validationErrors: errors.array(), // Keep original format for compatibility
      });
    }

    const { identifier, password } = req.body;

    // Find user by email or username
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier.toLowerCase() },
      ],
    }).select('+password'); // Include password field

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/username or password',
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    // Check if user has a password (OAuth-only accounts)
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: 'This account uses OAuth. Please sign in with Google or Discord',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/username or password',
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const token = generateToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    res.json({
      success: true,
      message: user.isVerified 
        ? 'Signed in successfully' 
        : 'Signed in successfully. Please verify your email address.',
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          role: user.role,
          isVerified: user.isVerified,
        },
        token,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sign in',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get current authenticated user
 */
const getCurrentUser = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: {
          id: req.user._id.toString(),
          email: req.user.email,
          username: req.user.username,
          displayName: req.user.displayName,
          avatarUrl: req.user.avatarUrl,
          role: req.user.role,
          isVerified: req.user.isVerified,
          createdAt: req.user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user information',
    });
  }
};

/**
 * Refresh access token using refresh token
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'your-secret-key-change-in-production');

    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }

    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive',
      });
    }

    const newToken = generateToken(user._id.toString());
    const newRefreshToken = generateRefreshToken(user._id.toString());

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token',
    });
  }
};

/**
 * Verify email address with token
 */
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required',
      });
    }

    // Find user with this token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token',
      });
    }

    // Verify the user
    user.isVerified = true;
    user.emailVerifiedAt = new Date();
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Resend verification email
 */
const resendVerification = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { email } = req.body;

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      // Don't reveal if email exists for security
      return res.json({
        success: true,
        message: 'If an account exists with this email, a verification email has been sent.',
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.json({
        success: true,
        message: 'Email is already verified',
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24); // 24 hours

    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationExpires;
    await user.save();

    // Send verification email
    try {
      await sendVerificationEmail(user.email, verificationToken, user.displayName);
      res.json({
        success: true,
        message: 'Verification email sent successfully',
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      res.status(500).json({
        success: false,
        message: 'Failed to send verification email',
      });
    }
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Sign out (client should remove token)
 */
const signOut = async (req, res) => {
  try {
    // In a more advanced setup, you might invalidate the token here
    // For now, we just acknowledge the signout
    res.json({
      success: true,
      message: 'Signed out successfully',
    });
  } catch (error) {
    console.error('Signout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sign out',
    });
  }
};

/**
 * Handle Google OAuth callback
 */
const handleGoogleCallback = async (req, res) => {
  try {
    const user = req.user;
    
    // Check if this is a new user (created within the last 10 seconds)
    const isNewUser = user.createdAt && (Date.now() - new Date(user.createdAt).getTime()) < 10000;
    
    // Send welcome notification for new users
    if (isNewUser) {
      try {
        await createNotification(user._id.toString(), {
          type: 'system',
          title: 'Welcome to Comet GameHouse! 🎮',
          message: `Welcome, ${user.displayName}! We're excited to have you join our community. Start exploring games, join arenas, and connect with players from around the world.`,
          intent: 'success',
          icon: 'rocket',
          payload: {
            welcome: true,
            signupDate: new Date().toISOString(),
            provider: 'google',
          },
        });
      } catch (notificationError) {
        console.error('Failed to send welcome notification:', notificationError);
        // Don't fail OAuth if notification fails
      }
    }
    
    const token = generateToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    // Redirect to frontend with token
    const redirectUrl = new URL(process.env.FRONTEND_URL + '/auth/oauth-callback');
    redirectUrl.searchParams.set('token', token);
    redirectUrl.searchParams.set('refreshToken', refreshToken);
    redirectUrl.searchParams.set('provider', 'google');

    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.redirect(process.env.FRONTEND_URL + '/auth/signin?error=oauth_failed');
  }
};

/**
 * Handle Discord OAuth callback
 */
const handleDiscordCallback = async (req, res) => {
  try {
    const user = req.user;
    
    // Check if this is a new user (created within the last 10 seconds)
    const isNewUser = user.createdAt && (Date.now() - new Date(user.createdAt).getTime()) < 10000;
    
    // Send welcome notification for new users
    if (isNewUser) {
      try {
        await createNotification(user._id.toString(), {
          type: 'system',
          title: 'Welcome to Comet GameHouse! 🎮',
          message: `Welcome, ${user.displayName}! We're excited to have you join our community. Start exploring games, join arenas, and connect with players from around the world.`,
          intent: 'success',
          icon: 'rocket',
          payload: {
            welcome: true,
            signupDate: new Date().toISOString(),
            provider: 'discord',
          },
        });
      } catch (notificationError) {
        console.error('Failed to send welcome notification:', notificationError);
        // Don't fail OAuth if notification fails
      }
    }
    
    const token = generateToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    // Redirect to frontend with token
    const redirectUrl = new URL(process.env.FRONTEND_URL + '/auth/oauth-callback');
    redirectUrl.searchParams.set('token', token);
    redirectUrl.searchParams.set('refreshToken', refreshToken);
    redirectUrl.searchParams.set('provider', 'discord');

    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Discord OAuth callback error:', error);
    res.redirect(process.env.FRONTEND_URL + '/auth/signin?error=oauth_failed');
  }
};

module.exports = {
  signUp,
  signIn,
  getCurrentUser,
  refreshToken,
  verifyEmail,
  resendVerification,
  signOut,
  handleGoogleCallback,
  handleDiscordCallback,
};

