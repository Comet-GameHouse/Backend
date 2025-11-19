const mongoose = require('mongoose');

const userCardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  cardId: {
    type: String,
    required: true,
    enum: [
      'bronze-field-card',
      'silver-ward-card',
      'gold-surge-card',
      'diamond-flux-card',
      'enterprise-nexus-card',
      'mythic-singularity-card',
    ],
  },
  purchasedAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  durationDays: {
    type: Number,
    required: true,
    // Store the original duration when purchased (max duration)
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index to prevent duplicate cards per user
userCardSchema.index({ userId: 1, cardId: 1 }, { unique: true });
// Index for active card queries
userCardSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('UserCard', userCardSchema);

