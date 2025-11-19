const mongoose = require('mongoose');

const badgeDefinitionSchema = new mongoose.Schema({
  badgeId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  detail: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  image: {
    type: String,
    required: true,
    trim: true,
  },
  upgradeImage: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    enum: ['combat', 'support', 'strategy', 'social', 'progression'],
    default: 'progression',
    index: true,
  },
  badgeType: {
    type: String,
    enum: ['one-time', 'ongoing'],
    default: 'one-time',
    index: true,
  },
  requirement: {
    type: {
      type: String,
      enum: ['matches', 'wins', 'assists', 'streak', 'custom'],
      required: true,
    },
    target: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  reward: {
    xp: {
      type: Number,
      default: 0,
    },
    coins: {
      type: Number,
      default: 0,
    },
  },
  order: {
    type: Number,
    default: 0,
    index: true,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
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

badgeDefinitionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('BadgeDefinition', badgeDefinitionSchema);

