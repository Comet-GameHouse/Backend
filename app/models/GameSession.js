const mongoose = require('mongoose');

const gameSessionSchema = new mongoose.Schema({
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true,
    index: true,
  },
  gameSlug: {
    type: String,
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  roomId: {
    type: String, // Optional: if player is in a specific room
    default: null,
  },
  status: {
    type: String,
    enum: ['waiting', 'playing', 'spectating'],
    default: 'waiting',
  },
  joinedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  lastActivity: {
    type: Date,
    default: Date.now,
  },
});

// TTL index to auto-remove stale sessions (30 minutes)
gameSessionSchema.index({ lastActivity: 1 }, { expireAfterSeconds: 1800 });

// Compound index for efficient queries
gameSessionSchema.index({ gameSlug: 1, status: 1 });

module.exports = mongoose.model('GameSession', gameSessionSchema);

