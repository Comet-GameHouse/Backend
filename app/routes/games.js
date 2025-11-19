const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const { optionalAuth, authenticate } = require('../middleware/auth');
const gameController = require('../controllers/gameController');
const gameSessionController = require('../controllers/gameSessionController');
const roomController = require('../controllers/roomController');
const gameActionController = require('../controllers/gameActionController');

/**
 * GET /api/games
 * Get all active games
 */
router.get('/', optionalAuth, gameController.getGames);

/**
 * GET /api/games/:slug/players
 * Get current player count for a game
 */
router.get('/:slug/players', optionalAuth, gameSessionController.getPlayerCount);

/**
 * POST /api/games/join
 * Join a game session (authenticated)
 */
router.post('/join', authenticate, gameSessionController.joinGame);

/**
 * POST /api/games/leave
 * Leave a game session (authenticated)
 */
router.post('/leave', authenticate, gameSessionController.leaveGame);

/**
 * PATCH /api/games/session/status
 * Update game session status (authenticated)
 */
router.patch('/session/status', authenticate, gameSessionController.updateSessionStatus);

/**
 * GET /api/games/:slug/rooms
 * Get room states for a game (playing/waiting counts per entry fee)
 */
router.get('/:slug/rooms', optionalAuth, roomController.getRoomStates);

/**
 * POST /api/games/rooms/join
 * Join a room queue (authenticated)
 */
router.post('/rooms/join', authenticate, roomController.joinRoom);

/**
 * POST /api/games/rooms/leave
 * Leave a room (authenticated)
 */
router.post('/rooms/leave', authenticate, roomController.leaveRoom);

/**
 * POST /api/games/:slug/action
 * Process a game action (move, turn, etc.) - Proxied to game server (authenticated)
 */
router.post('/:slug/action', authenticate, gameActionController.handleGameAction);

/**
 * GET /api/games/:slug/component.js
 * Serve game component bundle dynamically (no restart needed after initial setup)
 * Must come before /:slug route to avoid conflicts
 */
router.get('/:slug/component.js', async (req, res) => {
  try {
    const { slug } = req.params;
    const componentPath = path.join(__dirname, '../../game-components', `${slug}.js`);

    // Dynamically check if file exists (no restart needed!)
    try {
      await fs.access(componentPath);
    } catch {
      return res.status(404).json({
        success: false,
        error: 'Game component not found',
      });
    }

    // Read file dynamically (reads fresh from disk each time)
    const file = await fs.readFile(componentPath);

    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.send(file);
  } catch (error) {
    console.error('Error serving game component:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to serve component',
    });
  }
});

/**
 * GET /api/games/:slug/rooms
 * Get room states for a game (playing/waiting counts per entry fee)
 */
router.get('/:slug/rooms', optionalAuth, roomController.getRoomStates);

/**
 * GET /api/games/:slug/state
 * Get current game state - Proxied to game server (authenticated)
 */
router.get('/:slug/state', authenticate, gameActionController.getCurrentGameState);

/**
 * GET /api/games/:slug
 * Get a single game by slug (must be last to avoid conflicts)
 */
router.get('/:slug', optionalAuth, gameController.getGame);

module.exports = router;

