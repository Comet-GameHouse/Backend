const mongoose = require('mongoose');

const userStatsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  // Gameplay stats
  matchesPlayed: {
    type: Number,
    default: 0,
  },
  matchesWon: {
    type: Number,
    default: 0,
  },
  matchesLost: {
    type: Number,
    default: 0,
  },
  winRate: {
    type: Number,
    default: 0,
  },
  preferredRole: {
    type: String,
    enum: ['Support', 'DPS', 'Tank', 'Flex', null],
    default: null,
  },
  // Progression stats
  rankPoints: {
    type: Number,
    default: 0,
  },
  level: {
    type: Number,
    default: 1,
  },
  experience: {
    type: Number,
    default: 0,
  },
  experienceRequired: {
    type: Number,
    default: 1000,
  },
  dailyStreak: {
    type: Number,
    default: 0,
  },
  lastActiveDate: {
    type: Date,
    default: Date.now,
  },
  // Leaderboard stats
  globalRank: {
    type: Number,
    default: null,
  },
  globalScore: {
    type: Number,
    default: 0,
  },
  // Weekly stats for dashboard
  weeklyRankPointsChange: {
    type: Number,
    default: 0,
  },
  activeSessions: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update updatedAt before saving
userStatsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  // Calculate win rate
  if (this.matchesPlayed > 0) {
    this.winRate = Math.round((this.matchesWon / this.matchesPlayed) * 100);
  }
  next();
});

// Index for leaderboard queries
userStatsSchema.index({ globalScore: -1 });
userStatsSchema.index({ rankPoints: -1 });
userStatsSchema.index({ level: -1, experience: -1 });

module.exports = mongoose.model('UserStats', userStatsSchema);

