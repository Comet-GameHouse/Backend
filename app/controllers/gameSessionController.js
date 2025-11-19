const GameSession = require('../models/GameSession');
const Game = require('../models/Game');

// Helper function to broadcast player count updates
const broadcastPlayerCountUpdate = (gameSlug, count) => {
  if (global.broadcastToAll) {
    global.broadcastToAll('game-player-count', {
      gameSlug,
      count,
    });
  }
};

/**
 * Join a game session
 */
const joinGame = async (req, res) => {
  try {
    const { gameSlug } = req.body;
    const userId = req.user._id.toString();

    // Verify game exists
    const game = await Game.findOne({ slug: gameSlug, isActive: true });
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found',
      });
    }

    // Check if user already has an active session for this game
    const existingSession = await GameSession.findOne({
      userId,
      gameSlug,
      status: { $in: ['waiting', 'playing'] },
    });

    if (existingSession) {
      // Update last activity
      existingSession.lastActivity = new Date();
      await existingSession.save();
      return res.json({
        success: true,
        data: { session: existingSession },
      });
    }

    // Create new session
    const session = await GameSession.create({
      gameId: game._id,
      gameSlug,
      userId,
      status: 'waiting',
    });

    // Get updated player count and broadcast
    const playerCount = await GameSession.countDocuments({
      gameSlug,
      status: { $in: ['waiting', 'playing'] },
    });
    broadcastPlayerCountUpdate(gameSlug, playerCount);

    res.json({
      success: true,
      data: { session },
    });
  } catch (error) {
    console.error('Join game error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join game',
    });
  }
};

/**
 * Leave a game session
 */
const leaveGame = async (req, res) => {
  try {
    const { gameSlug } = req.body;
    const userId = req.user._id.toString();

    // Remove all active sessions for this user and game
    await GameSession.deleteMany({
      userId,
      gameSlug,
      status: { $in: ['waiting', 'playing', 'spectating'] },
    });

    // Get updated player count and broadcast
    const playerCount = await GameSession.countDocuments({
      gameSlug,
      status: { $in: ['waiting', 'playing'] },
    });
    broadcastPlayerCountUpdate(gameSlug, playerCount);

    res.json({
      success: true,
      message: 'Left game successfully',
    });
  } catch (error) {
    console.error('Leave game error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave game',
    });
  }
};

/**
 * Update session status (e.g., from waiting to playing)
 */
const updateSessionStatus = async (req, res) => {
  try {
    const { gameSlug, status, roomId } = req.body;
    const userId = req.user._id.toString();

    const session = await GameSession.findOneAndUpdate(
      {
        userId,
        gameSlug,
        status: { $in: ['waiting', 'playing', 'spectating'] },
      },
      {
        status,
        roomId: roomId || null,
        lastActivity: new Date(),
      },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    // Get updated player count and broadcast (if status changed to/from playing)
    const playerCount = await GameSession.countDocuments({
      gameSlug,
      status: { $in: ['waiting', 'playing'] },
    });
    broadcastPlayerCountUpdate(gameSlug, playerCount);

    res.json({
      success: true,
      data: { session },
    });
  } catch (error) {
    console.error('Update session status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update session status',
    });
  }
};

/**
 * Get player count for a specific game
 */
const getPlayerCount = async (req, res) => {
  try {
    const { gameSlug } = req.params;

    const count = await GameSession.countDocuments({
      gameSlug,
      status: { $in: ['waiting', 'playing'] },
    });

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error('Get player count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get player count',
    });
  }
};

module.exports = {
  joinGame,
  leaveGame,
  updateSessionStatus,
  getPlayerCount,
};

