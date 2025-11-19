const Game = require('../models/Game');
const GameSession = require('../models/GameSession');
const Room = require('../models/Room');

/**
 * Proxy game action to game server
 * The main server acts as a gateway, forwarding requests to the appropriate game server
 */
const handleGameAction = async (req, res) => {
  try {
    const { gameSlug } = req.params;
    const { action } = req.body;
    const userId = req.user._id.toString();

    // Get game from database to find its server URL
    const game = await Game.findOne({ slug: gameSlug, isActive: true }).lean();
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found',
      });
    }

    // Check if game has a dedicated server
    if (!game.gameServerUrl) {
      return res.status(404).json({
        success: false,
        message: `Game server not configured for: ${gameSlug}. Please configure gameServerUrl in admin panel.`,
      });
    }

    // Find active game session for this user
    const session = await GameSession.findOne({
      userId,
      gameSlug,
      status: { $in: ['waiting', 'playing'] },
    }).lean();

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Active game session not found',
      });
    }

    // Get room if session is in a room
    let room = null;
    if (session.roomId) {
      room = await Room.findById(session.roomId).lean();
      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Room not found',
        });
      }
    }

    // Prepare session data to send to game server
    const sessionData = {
      sessionId: session._id.toString(),
      userId,
      gameSlug,
      roomId: session.roomId?.toString() || null,
      status: session.status,
      gameState: room?.gameState || session.gameState || null,
    };

    // Forward request to game server
    const gameServerUrl = game.gameServerUrl.replace(/\/$/, ''); // Remove trailing slash
    const actionUrl = `${gameServerUrl}/api/action`;

    try {
      const response = await fetch(actionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization || '', // Forward auth token
          'X-User-Id': userId, // Pass user ID as header
        },
        body: JSON.stringify({
          action,
          sessionData,
        }),
        timeout: 10000, // 10 second timeout
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Game server error' }));
        return res.status(response.status).json({
          success: false,
          message: errorData.message || `Game server returned error: ${response.status}`,
        });
      }

      const result = await response.json();

      // Update local session/room with new game state if returned
      if (result.data?.gameState) {
        if (room) {
          await Room.findByIdAndUpdate(session.roomId, {
            gameState: result.data.gameState,
            updatedAt: new Date(),
          });
        } else {
          await GameSession.findByIdAndUpdate(session._id, {
            gameState: result.data.gameState,
            lastActivity: new Date(),
          });
        }
      }

      // Return game server response
      res.json(result);
    } catch (error) {
      console.error(`[GameActionController] Error forwarding to game server (${gameServerUrl}):`, error);
      
      // Check if it's a connection error
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.name === 'AbortError') {
        return res.status(503).json({
          success: false,
          message: `Game server is unavailable: ${gameServerUrl}. Please check if the game server is running.`,
        });
      }

      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to communicate with game server',
      });
    }
  } catch (error) {
    console.error('Handle game action error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process game action',
    });
  }
};

/**
 * Get current game state from game server
 */
const getCurrentGameState = async (req, res) => {
  try {
    const { gameSlug } = req.params;
    const userId = req.user._id.toString();

    // Get game from database
    const game = await Game.findOne({ slug: gameSlug, isActive: true }).lean();
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found',
      });
    }

    // Check if game has a dedicated server
    if (!game.gameServerUrl) {
      // Fallback to local game state if no server configured
      const session = await GameSession.findOne({
        userId,
        gameSlug,
        status: { $in: ['waiting', 'playing'] },
      }).lean();

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Active game session not found',
        });
      }

      let gameState = null;
      if (session.roomId) {
        const room = await Room.findById(session.roomId).lean();
        gameState = room?.gameState || null;
      } else {
        gameState = session.gameState || null;
      }

      return res.json({
        success: true,
        data: { gameState },
      });
    }

    // Find active game session
    const session = await GameSession.findOne({
      userId,
      gameSlug,
      status: { $in: ['waiting', 'playing'] },
    }).lean();

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Active game session not found',
      });
    }

    // Forward request to game server
    const gameServerUrl = game.gameServerUrl.replace(/\/$/, '');
    const stateUrl = `${gameServerUrl}/api/state`;

    try {
      const response = await fetch(stateUrl, {
        method: 'GET',
        headers: {
          'Authorization': req.headers.authorization || '',
          'X-User-Id': userId,
          'X-Session-Id': session._id.toString(),
        },
        timeout: 5000,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Game server error' }));
        return res.status(response.status).json({
          success: false,
          message: errorData.message || `Game server returned error: ${response.status}`,
        });
      }

      const result = await response.json();
      res.json(result);
    } catch (error) {
      console.error(`[GameActionController] Error getting state from game server (${gameServerUrl}):`, error);
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.name === 'AbortError') {
        return res.status(503).json({
          success: false,
          message: `Game server is unavailable: ${gameServerUrl}`,
        });
      }

      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to communicate with game server',
      });
    }
  } catch (error) {
    console.error('Get game state error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get game state',
    });
  }
};

module.exports = {
  handleGameAction,
  getCurrentGameState,
};

