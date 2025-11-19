const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        message: 'No token provided. Authorization required.' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
      
      // Find user and attach to request
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return res.status(401).json({ 
          success: false,
          message: 'User not found. Token invalid.' 
        });
      }

      if (!user.isActive) {
        return res.status(403).json({ 
          success: false,
          message: 'Account is deactivated.' 
        });
      }

      // Check email verification for email/password users
      // OAuth users (googleId or discordId) are considered verified
      const isOAuthUser = user.googleId || user.discordId;
      const isEmailVerified = user.emailVerifiedAt !== null && user.emailVerifiedAt !== undefined;
      
      if (!isOAuthUser && !isEmailVerified) {
        return res.status(403).json({ 
          success: false,
          message: 'Email verification required. Please verify your email address to access this resource.',
          code: 'EMAIL_NOT_VERIFIED'
        });
      }

      req.user = user;
      next();
    } catch (tokenError) {
      if (tokenError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false,
          message: 'Token expired. Please sign in again.' 
        });
      }
      if (tokenError.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          success: false,
          message: 'Invalid token.' 
        });
      }
      throw tokenError;
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Authentication failed.' 
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
        const user = await User.findById(decoded.userId).select('-password');
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Silently fail for optional auth
      }
    }
    next();
  } catch (error) {
    next();
  }
};

/**
 * Role-based authorization middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required.' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: 'Insufficient permissions.' 
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
};

