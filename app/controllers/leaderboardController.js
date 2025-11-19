const User = require('../models/User');
const UserStats = require('../models/UserStats');

/**
 * Get leaderboard rankings
 * Supports different time periods: daily, weekly, monthly, total
 */
const getLeaderboard = async (req, res) => {
  try {
    const { period = 'total', limit = 50 } = req.query;
    const limitNum = parseInt(limit, 10);
    const userId = req.user?._id?.toString();

    // Calculate date range based on period
    let startDate = null;
    const now = new Date();
    
    switch (period.toLowerCase()) {
      case 'daily':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'total':
      default:
        startDate = null; // No date filter for total
        break;
    }

    // For now, we'll use globalScore from UserStats for all periods
    // In a real implementation, you'd track period-specific scores
    let query = {};
    if (startDate) {
      // Filter by users active in the period
      query.lastActiveDate = { $gte: startDate };
    }

    // Get user stats sorted by globalScore (descending)
    // Only include users with stats
    const stats = await UserStats.find(query)
      .populate({
        path: 'userId',
        select: 'displayName username avatarUrl',
        match: { isActive: true }, // Only include active users
      })
      .sort({ globalScore: -1 })
      .limit(limitNum * 2) // Get more to account for filtered users
      .lean();

    // Filter out entries where user is null (inactive users)
    const validStats = stats.filter((stat) => stat.userId !== null).slice(0, limitNum);

    // Format leaderboard entries
    const rankings = validStats.map((stat, index) => {
      const user = stat.userId;
      if (!user) return null;

      // Calculate trend (for now, use weeklyRankPointsChange as trend indicator)
      const trendValue = stat.weeklyRankPointsChange || 0;
      const trend = trendValue > 0 ? `+${trendValue}` : trendValue < 0 ? `${trendValue}` : '±0';

      return {
        place: index + 1,
        userId: user._id.toString(),
        name: user.displayName || user.username || 'Unknown',
        rating: stat.globalScore.toLocaleString('en-US'),
        trend,
        avatarUrl: user.avatarUrl,
        rankPoints: stat.rankPoints,
        matchesWon: stat.matchesWon,
        winRate: stat.winRate,
      };
    }).filter(Boolean);

    // Find user's position if authenticated
    let userPosition = null;
    if (userId) {
      const userStat = await UserStats.findOne({ userId, ...query }).lean();
      if (userStat) {
        // Count users with higher scores (matching the same period filter)
        const higherScores = await UserStats.countDocuments({
          ...query,
          globalScore: { $gt: userStat.globalScore },
        });
        userPosition = higherScores + 1;
      }
    }

    res.json({
      success: true,
      data: {
        rankings,
        period: period.toLowerCase(),
        userPosition,
        total: rankings.length,
      },
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard',
    });
  }
};

module.exports = {
  getLeaderboard,
};

