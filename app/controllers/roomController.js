const Room = require('../models/Room');
const GameSession = require('../models/GameSession');
const Game = require('../models/Game');

/**
 * Get room states for a game (playing/waiting counts per entry fee)
 */
const getRoomStates = async (req, res) => {
  try {
    const { gameSlug } = req.params;

    // Verify game exists
    const game = await Game.findOne({ slug: gameSlug, isActive: true });
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found',
      });
    }

    // Get all active rooms for this game
    const rooms = await Room.find({
      gameSlug,
      status: { $in: ['waiting', 'starting', 'active'] },
    }).lean();

    // Get all game sessions for this game (for waiting players not in rooms)
    const sessions = await GameSession.find({
      gameSlug,
      status: { $in: ['waiting', 'playing'] },
      roomId: null, // Players not in a room yet
    }).lean();

    // Define standard entry fee tiers
    const feeTiers = [5, 10, 25, 50, 100, 200, 500, 1000, 2000, 5000, 10000];

    // Calculate counts per fee tier
    // Always return all fee tiers, even if no rooms exist (will be 0 for all)
    const roomStates = feeTiers.map((fee) => {
      // Count players in rooms with this entry fee
      const roomsWithFee = rooms.filter((room) => room.entryFee === fee);
      const playing = roomsWithFee.reduce((sum, room) => {
        return sum + room.players.filter((p) => p.status === 'playing').length;
      }, 0);
      const waiting = roomsWithFee.reduce((sum, room) => {
        return sum + room.players.filter((p) => p.status === 'waiting' || p.status === 'ready').length;
      }, 0);

      // Always return the fee tier with counts (0 if no rooms/players)
      return {
        fee,
        playing,
        waiting,
      };
    });

    res.json({
      success: true,
      data: { roomStates },
    });
  } catch (error) {
    console.error('Get room states error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch room states',
    });
  }
};

/**
 * Join a room queue (create or join existing room)
 */
const joinRoom = async (req, res) => {
  try {
    const { gameSlug, entryFee } = req.body;
    const userId = req.user._id.toString();

    // Verify game exists
    const game = await Game.findOne({ slug: gameSlug, isActive: true });
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found',
      });
    }

    // Find or create a waiting room for this fee tier
    let room = await Room.findOne({
      gameSlug,
      entryFee,
      status: 'waiting',
      'players.userId': { $ne: userId }, // User not already in this room
    }).sort({ createdAt: 1 }); // Get oldest waiting room

    if (!room) {
      // Create new room
      room = await Room.create({
        gameId: game._id,
        gameSlug,
        entryFee,
        status: 'waiting',
        maxPlayers: game.maxPlayers,
        players: [{
          userId,
          status: 'waiting',
        }],
      });
    } else {
      // Add player to existing room
      room.players.push({
        userId,
        status: 'waiting',
      });
      await room.save();
    }

    // Update or create game session with roomId
    await GameSession.findOneAndUpdate(
      {
        userId,
        gameSlug,
        status: { $in: ['waiting', 'playing'] },
      },
      {
        gameId: game._id,
        gameSlug,
        userId,
        roomId: room._id.toString(),
        status: 'waiting',
        lastActivity: new Date(),
      },
      { upsert: true, new: true }
    );

    // Broadcast room state update
    if (global.broadcastToAll) {
      const roomStates = await calculateRoomStates(gameSlug);
      global.broadcastToAll('room-state-update', {
        gameSlug,
        roomStates,
      });
    }

    res.json({
      success: true,
      data: { room: room.toObject() },
    });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join room',
    });
  }
};

/**
 * Leave a room
 */
const leaveRoom = async (req, res) => {
  try {
    const { gameSlug, roomId } = req.body;
    const userId = req.user._id.toString();

    // Remove player from room
    const room = await Room.findById(roomId);
    if (room) {
      room.players = room.players.filter((p) => p.userId.toString() !== userId);
      
      // If room is empty, delete it
      if (room.players.length === 0) {
        await Room.findByIdAndDelete(roomId);
      } else {
        await room.save();
      }
    }

    // Update game session
    await GameSession.findOneAndUpdate(
      {
        userId,
        gameSlug,
      },
      {
        roomId: null,
        status: 'waiting',
        lastActivity: new Date(),
      }
    );

    // Broadcast room state update
    if (global.broadcastToAll) {
      const roomStates = await calculateRoomStates(gameSlug);
      global.broadcastToAll('room-state-update', {
        gameSlug,
        roomStates,
      });
    }

    res.json({
      success: true,
      message: 'Left room successfully',
    });
  } catch (error) {
    console.error('Leave room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave room',
    });
  }
};

/**
 * Helper function to calculate room states
 */
async function calculateRoomStates(gameSlug) {
  const rooms = await Room.find({
    gameSlug,
    status: { $in: ['waiting', 'starting', 'active'] },
  }).lean();

  const feeTiers = [5, 10, 25, 50, 100, 200, 500, 1000, 2000, 5000, 10000];

  // Always return all fee tiers with counts (0 if no rooms/players)
  return feeTiers.map((fee) => {
    const roomsWithFee = rooms.filter((room) => room.entryFee === fee);
    const playing = roomsWithFee.reduce((sum, room) => {
      return sum + room.players.filter((p) => p.status === 'playing').length;
    }, 0);
    const waiting = roomsWithFee.reduce((sum, room) => {
      return sum + room.players.filter((p) => p.status === 'waiting' || p.status === 'ready').length;
    }, 0);

    return {
      fee,
      playing,
      waiting,
    };
  });
}

module.exports = {
  getRoomStates,
  joinRoom,
  leaveRoom,
};

