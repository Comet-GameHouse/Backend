const express = require('express');
const cors = require('cors');
const passport = require('../config/passport');

const createAPIService = () => {
  const app = express();

  // CORS configuration
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    process.env.ADMIN_FRONTEND_URL || 'http://localhost:5174',
  ].filter(Boolean); // Remove any undefined values

  const corsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
  };
  app.use(cors(corsOptions));

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve static files for uploads
  const path = require('path');
  app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));
  
  // Serve game component bundles (optional - can also use route handler)
  // This allows direct access to /api/games/game-slug.js files
  app.use('/api/games', express.static(path.join(__dirname, '../../game-components'), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Cache-Control', 'public, max-age=3600');
      }
    },
  }));

  // Initialize Passport
  app.use(passport.initialize());

  // Routes
  app.get('/', (req, res) => {
    res.json({ message: 'Welcome to CometGameHouse API' });
  });

  // API routes
  app.use('/api', require('../routes'));

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
      success: false,
      message: 'Something went wrong!', 
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ 
      success: false,
      message: 'Route not found' 
    });
  });

  return app;
};

module.exports = createAPIService;

