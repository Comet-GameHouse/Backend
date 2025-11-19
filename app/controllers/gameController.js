const Game = require('../models/Game');
const GameSession = require('../models/GameSession');

/**
 * Get all active games with current player counts
 */
const getGames = async (req, res) => {
  try {
    const games = await Game.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    // Get player counts for each game
    const gameSlugs = games.map((game) => game.slug);
    const playerCounts = await GameSession.aggregate([
      {
        $match: {
          gameSlug: { $in: gameSlugs },
          status: { $in: ['waiting', 'playing'] },
        },
      },
      {
        $group: {
          _id: '$gameSlug',
          count: { $sum: 1 },
        },
      },
    ]);

    // Create a map of slug -> player count
    const playerCountMap = {};
    playerCounts.forEach((item) => {
      playerCountMap[item._id] = item.count;
    });

    // Transform games and update player counts
    const gamesWithId = games.map((game) => ({
      ...game,
      id: game._id.toString(),
      _id: undefined,
      players: playerCountMap[game.slug] || 0, // Use real-time count
    }));

    res.json({
      success: true,
      data: { games: gamesWithId },
    });
  } catch (error) {
    console.error('Get games error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch games',
    });
  }
};

/**
 * Get a single game by slug with current player count
 */
const getGame = async (req, res) => {
  try {
    const { slug } = req.params;
    const game = await Game.findOne({ slug, isActive: true }).lean();

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found',
      });
    }

    // Get current player count
    const playerCount = await GameSession.countDocuments({
      gameSlug: slug,
      status: { $in: ['waiting', 'playing'] },
    });

    // Transform _id to id and update player count
    const gameWithId = {
      ...game,
      id: game._id.toString(),
      _id: undefined,
      players: playerCount, // Use real-time count
    };

    res.json({
      success: true,
      data: { game: gameWithId },
    });
  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch game',
    });
  }
};

module.exports = {
  getGames,
  getGame,
};

