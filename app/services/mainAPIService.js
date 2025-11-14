const express = require('express');
const cors = require('cors');
const passport = require('../config/passport');

const createAPIService = () => {
  const app = express();

  // CORS configuration
  const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    optionsSuccessStatus: 200,
  };
  app.use(cors(corsOptions));

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

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

