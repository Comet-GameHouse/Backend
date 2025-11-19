const mongoose = require('mongoose');

const badgeProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  badgeId: {
    type: String,
    required: true,
    index: true,
  },
  currentProgress: {
    type: Number,
    default: 0,
    min: 0,
  },
  targetProgress: {
    type: Number,
    required: true,
  },
  achieved: {
    type: Boolean,
    default: false,
    index: true,
  },
  claimed: {
    type: Boolean,
    default: false,
  },
  achievedAt: {
    type: Date,
  },
  claimedAt: {
    type: Date,
  },
  achievementCount: {
    type: Number,
    default: 0,
  },
  lastAchievedAt: {
    type: Date,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
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

// Compound index to prevent duplicate progress entries
badgeProgressSchema.index({ userId: 1, badgeId: 1 }, { unique: true });

badgeProgressSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  // For ongoing badges, we check achievement on each save
  // For one-time badges, once achieved, it stays achieved
  if (this.currentProgress >= this.targetProgress) {
    if (!this.achieved) {
      // First time achieving
      this.achieved = true;
      this.achievedAt = new Date();
      this.achievementCount = 1;
      this.lastAchievedAt = new Date();
    } else {
      // For ongoing badges, update achievement count
      // Note: This will be handled by the controller based on badgeType
      this.lastAchievedAt = new Date();
    }
  }
  next();
});

module.exports = mongoose.model('BadgeProgress', badgeProgressSchema);

