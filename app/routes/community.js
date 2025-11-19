const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');

// Public route - no authentication required
router.get('/', communityController.getCommunityData);

module.exports = router;

