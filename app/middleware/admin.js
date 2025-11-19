const { authenticate } = require('./auth');

/**
 * Middleware to ensure user is admin or moderator
 */
const requireAdmin = (req, res, next) => {
  authenticate(req, res, () => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({
        success: false,
        message: 'Admin or moderator access required',
      });
    }

    next();
  });
};

module.exports = { requireAdmin };

