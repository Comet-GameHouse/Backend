const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const UserStats = require('../models/UserStats');
const UserActivity = require('../models/UserActivity');
const Badge = require('../models/Badge');
const UserCard = require('../models/UserCard');

/**
 * Get user dashboard data
 */
const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    // Get or create user stats
    let userStats = await UserStats.findOne({ userId });
    if (!userStats) {
      userStats = await UserStats.create({ userId });
    }

    // Get recent activities (last 10)
    const activities = await UserActivity.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Format activities with relative time
    const formatTime = (date) => {
      const now = new Date();
      const diff = now - date;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
      return date.toLocaleDateString();
    };

    const formattedActivities = activities.map((activity) => ({
      title: activity.title,
      detail: activity.detail,
      time: formatTime(activity.createdAt),
    }));

    // Calculate summary stats
    const summary = [
      {
        label: 'Rank Points',
        value: userStats.rankPoints.toLocaleString(),
        change: userStats.weeklyRankPointsChange >= 0
          ? `+${userStats.weeklyRankPointsChange} this week`
          : `${userStats.weeklyRankPointsChange} this week`,
      },
      {
        label: 'Active Sessions',
        value: userStats.activeSessions.toString(),
        change: 'Rooms synced across NA/EU',
      },
      {
        label: 'Daily Streak',
        value: `${userStats.dailyStreak} day${userStats.dailyStreak !== 1 ? 's' : ''}`,
        change: 'Keep playing for bonus shards',
      },
    ];

    res.json({
      success: true,
      data: {
        summary,
        activities: formattedActivities,
      },
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
    });
  }
};

/**
 * Get user profile data
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    // Get user data
    const user = await User.findById(userId).select('-password -emailVerificationToken -emailVerificationExpires');

    // Get or create user stats
    let userStats = await UserStats.findOne({ userId });
    if (!userStats) {
      userStats = await UserStats.create({ userId });
    }

    // Get user badges (last 3)
    const badges = await Badge.find({ userId })
      .sort({ unlockedAt: -1 })
      .limit(3)
      .lean();

    // Calculate level progress
    const progress = Math.min(Math.round((userStats.experience / userStats.experienceRequired) * 100), 100);

    // Calculate global rank percentile
    const totalUsers = await UserStats.countDocuments({ globalScore: { $gt: 0 } });
    const usersAbove = await UserStats.countDocuments({ globalScore: { $gt: userStats.globalScore } });
    const percentile = totalUsers > 0
      ? `Top ${Math.round(((totalUsers - usersAbove) / totalUsers) * 100)}%`
      : 'Top 100%';

    // Format stats
    const stats = [
      {
        label: 'Matches Played',
        value: userStats.matchesPlayed.toString(),
      },
      {
        label: 'Win Rate',
        value: `${userStats.winRate}%`,
      },
      {
        label: 'Preferred Role',
        value: userStats.preferredRole || 'N/A',
      },
    ];

    // Format user data
    const baseUrl = process.env.API_URL || 'http://localhost:3000';
    const avatarUrl = user.avatarUrl
      ? (user.avatarUrl.startsWith('http') ? user.avatarUrl : `${baseUrl}${user.avatarUrl}`)
      : undefined;

    const profileData = {
      user: {
        id: user._id.toString(),
        displayName: user.displayName,
        username: user.username,
        email: user.email,
        avatarUrl,
        bio: user.bio,
        pronouns: user.pronouns,
        timezone: user.timezone,
        socials: user.socials || {},
        role: user.role,
        createdAt: user.createdAt,
      },
      stats,
      level: {
        current: userStats.level,
        earned: userStats.experience,
        required: userStats.experienceRequired,
        progress,
      },
      globalRank: {
        position: userStats.globalRank || null,
        percentile,
        score: userStats.globalScore,
      },
      badges: badges.map((badge) => ({
        title: badge.title,
        detail: badge.description,
        image: badge.imageUrl || `https://res.cloudinary.com/demo/image/upload/v1439593208/${badge.badgeId}.png`,
      })),
    };

    res.json({
      success: true,
      data: profileData,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile data',
    });
  }
};

/**
 * Public profile by username (safe fields only)
 */
const getPublicProfile = async (req, res) => {
  try {
    const { username } = req.params;
    if (!username) {
      return res.status(400).json({ success: false, message: 'Username is required' });
    }

    const user = await User.findOne({ username: username.toLowerCase() }).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Build avatar absolute URL if needed
    const baseUrl = process.env.API_URL || 'http://localhost:3000';
    const avatarUrl = user.avatarUrl
      ? (user.avatarUrl.startsWith('http') ? user.avatarUrl : `${baseUrl}${user.avatarUrl}`)
      : undefined;

    // Safe fields only
    const publicUser = {
      id: user._id.toString(),
      displayName: user.displayName,
      username: user.username,
      avatarUrl,
      bio: user.bio || '',
      socials: user.socials || {},
      createdAt: user.createdAt,
    };

    // Optionally include lightweight stats if exist
    const userStats = await UserStats.findOne({ userId: user._id.toString() }).lean();
    const level = userStats
      ? {
          current: userStats.level,
          earned: userStats.experience,
          required: userStats.experienceRequired,
          progress: Math.min(Math.round((userStats.experience / userStats.experienceRequired) * 100), 100),
        }
      : undefined;

    // Include recent badges (last 6)
    const badgesDocs = await Badge.find({ userId: user._id.toString() })
      .sort({ unlockedAt: -1 })
      .limit(6)
      .lean();

    const badges = badgesDocs.map((badge) => ({
      title: badge.title,
      detail: badge.description,
      image: badge.imageUrl || `https://res.cloudinary.com/demo/image/upload/v1439593208/${badge.badgeId}.png`,
      unlockedAt: badge.unlockedAt,
    }));

    return res.json({
      success: true,
      data: {
        user: publicUser,
        level,
        badges,
      },
    });
  } catch (error) {
    console.error('Get public profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch public profile',
    });
  }
};

/**
 * Upload avatar
 */
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const userId = req.user._id.toString();
    const user = await User.findById(userId);
    if (!user) {
      // Delete uploaded file if user not found
      if (req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Delete old avatar if it exists and is a local file
    if (user.avatarUrl && user.avatarUrl.startsWith('/uploads/avatars/')) {
      const oldAvatarPath = path.join(__dirname, '../../', user.avatarUrl);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // Update user avatar URL
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    user.avatarUrl = avatarUrl;
    await user.save();

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        avatarUrl: `${process.env.API_URL || 'http://localhost:3000'}${avatarUrl}`,
      },
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    // Delete uploaded file on error
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError);
      }
    }
    res.status(500).json({
      success: false,
      message: 'Failed to upload avatar',
    });
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map((error) => ({
        field: error.path || error.param,
        message: error.msg,
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: formattedErrors,
      });
    }

    const userId = req.user._id.toString();
    const { displayName, username, bio, pronouns, timezone, socials } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if username is already taken by another user
    if (username !== undefined && username !== user.username) {
      const existingUser = await User.findOne({
        username: username.toLowerCase(),
        _id: { $ne: userId },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Username already taken',
        });
      }
    }

    // Update fields
    if (displayName !== undefined) user.displayName = displayName;
    if (username !== undefined) user.username = username.toLowerCase();
    if (bio !== undefined) user.bio = bio;
    if (pronouns !== undefined) user.pronouns = pronouns;
    if (timezone !== undefined) user.timezone = timezone;
    if (socials !== undefined) {
      if (!user.socials) {
        user.socials = {};
      }
      if (socials.discord !== undefined) user.socials.discord = socials.discord;
      if (socials.twitch !== undefined) user.socials.twitch = socials.twitch;
      if (socials.twitter !== undefined) user.socials.twitter = socials.twitter;
    }

    await user.save();

    const baseUrl = process.env.API_URL || 'http://localhost:3000';
    const avatarUrl = user.avatarUrl
      ? (user.avatarUrl.startsWith('http') ? user.avatarUrl : `${baseUrl}${user.avatarUrl}`)
      : undefined;

    res.json({
      success: true,
      message: 'Profile updated successfully',
              data: {
                user: {
                  id: user._id.toString(),
                  displayName: user.displayName,
                  username: user.username,
                  email: user.email,
                  avatarUrl,
                  bio: user.bio,
                  pronouns: user.pronouns,
                  timezone: user.timezone,
                  socials: user.socials || {},
                  role: user.role,
                  createdAt: user.createdAt,
                },
              },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
    });
  }
};

module.exports = {
  getDashboard,
  getProfile,
  updateProfile,
  uploadAvatar,
  getPublicProfile,
};

