const BadgeDefinition = require('../models/BadgeDefinition');
const BadgeProgress = require('../models/BadgeProgress');

/**
 * Get all available badge definitions
 */
const getBadgeDefinitions = async (_req, res) => {
  try {
    const badges = await BadgeDefinition.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    const formattedBadges = badges.map((badge) => ({
      id: badge._id.toString(),
      badgeId: badge.badgeId,
      title: badge.title,
      detail: badge.detail,
      image: badge.image,
      upgradeImage: badge.upgradeImage || badge.image,
      category: badge.category,
      badgeType: badge.badgeType || 'one-time',
      requirement: badge.requirement,
      reward: badge.reward,
    }));

    return res.json({
      success: true,
      data: { badges: formattedBadges },
    });
  } catch (error) {
    console.error('Get badge definitions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load badge definitions',
    });
  }
};

/**
 * Get user's badge progress
 */
const getUserBadgeProgress = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    // Get all active badge definitions
    const badgeDefinitions = await BadgeDefinition.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    // Get user's progress for all badges
    const userProgress = await BadgeProgress.find({ userId })
      .lean();

    // Create a map of badgeId -> progress
    const progressMap = new Map();
    userProgress.forEach((progress) => {
      progressMap.set(progress.badgeId, progress);
    });

    // Combine definitions with user progress
    const badgesWithProgress = badgeDefinitions.map((badge) => {
      const progress = progressMap.get(badge.badgeId);
      const badgeType = badge.badgeType || 'one-time';
      const currentProgress = progress?.currentProgress || 0;
      const targetProgress = badge.requirement.target;
      const achieved = progress?.achieved || false;
      const claimed = progress?.claimed || false;
      const achievementCount = progress?.achievementCount || 0;
      const completion = Math.min(Math.round((currentProgress / targetProgress) * 100), 100);

      // For ongoing badges that are achieved, check if progress should reset
      // (e.g., streaks reset when broken, but total matches continue)
      const isOngoing = badgeType === 'ongoing';
      const canReachieve = isOngoing && achieved && claimed;

      // Generate progress text
      let progressText = '';
      if (achieved && claimed) {
        if (isOngoing && achievementCount > 0) {
          progressText = `Achieved ${achievementCount}x • +${badge.reward.xp || 0} XP`;
          if (badge.reward.coins > 0) {
            progressText += ` • +${badge.reward.coins} coins`;
          }
        } else {
          progressText = `Claimed • +${badge.reward.xp || 0} XP`;
          if (badge.reward.coins > 0) {
            progressText += ` • +${badge.reward.coins} coins`;
          }
        }
      } else if (achieved) {
        progressText = `${targetProgress} / ${targetProgress} complete`;
      } else {
        progressText = `${currentProgress} / ${targetProgress} ${badge.requirement.description || ''}`.trim();
      }

      return {
        id: badge._id.toString(),
        badgeId: badge.badgeId,
        title: badge.title,
        detail: badge.detail,
        image: badge.image,
        upgradeImage: badge.upgradeImage || badge.image,
        badgeType,
        achieved,
        claimed,
        progressText,
        completion,
        currentProgress,
        targetProgress,
        achievementCount,
        canReachieve,
      };
    });

    return res.json({
      success: true,
      data: { badges: badgesWithProgress },
    });
  } catch (error) {
    console.error('Get user badge progress error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load badge progress',
    });
  }
};

/**
 * Claim a badge reward
 */
const claimBadge = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { badgeId } = req.body;

    if (!badgeId) {
      return res.status(400).json({
        success: false,
        message: 'Badge ID is required',
      });
    }

    // Get badge definition
    const badgeDefinition = await BadgeDefinition.findOne({ badgeId, isActive: true });
    if (!badgeDefinition) {
      return res.status(404).json({
        success: false,
        message: 'Badge not found',
      });
    }

    // Get or create user progress
    let progress = await BadgeProgress.findOne({ userId, badgeId });
    if (!progress) {
      progress = await BadgeProgress.create({
        userId,
        badgeId,
        currentProgress: 0,
        targetProgress: badgeDefinition.requirement.target,
      });
    }

    // Check if badge is achieved and not yet claimed
    if (!progress.achieved) {
      return res.status(400).json({
        success: false,
        message: 'Badge not yet achieved',
      });
    }

    // For one-time badges, check if already claimed
    if (badgeDefinition.badgeType === 'one-time' && progress.claimed) {
      return res.status(400).json({
        success: false,
        message: 'Badge already claimed',
      });
    }

    // For ongoing badges that are already claimed, check if progress has reached target again
    if (badgeDefinition.badgeType === 'ongoing' && progress.claimed) {
      // Check if current progress has reached or exceeded target again
      if (progress.currentProgress >= progress.targetProgress) {
        // Progress has reached target again, allow claiming
        // Reset claimed status to allow claiming again
        progress.claimed = false;
        progress.claimedAt = null;
      } else {
        // Progress hasn't reached target again yet
        return res.status(400).json({
          success: false,
          message: 'Badge progress has not reached target again',
        });
      }
    }

    // Mark as claimed
    progress.claimed = true;
    progress.claimedAt = new Date();
    
    // For ongoing badges, increment achievement count
    if (badgeDefinition.badgeType === 'ongoing') {
      progress.achievementCount = (progress.achievementCount || 0) + 1;
    }
    
    await progress.save();

    // TODO: Add reward XP and coins to user stats
    // This would require UserStats model integration

    return res.json({
      success: true,
      message: 'Badge claimed successfully',
      data: {
        badgeId: progress.badgeId,
        reward: badgeDefinition.reward,
      },
    });
  } catch (error) {
    console.error('Claim badge error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to claim badge',
    });
  }
};

module.exports = {
  getBadgeDefinitions,
  getUserBadgeProgress,
  claimBadge,
};

