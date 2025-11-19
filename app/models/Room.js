const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
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
  entryFee: {
    type: Number,
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['waiting', 'starting', 'active', 'finished'],
    default: 'waiting',
    index: true,
  },
  players: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['waiting', 'ready', 'playing'],
      default: 'waiting',
    },
  }],
  maxPlayers: {
    type: Number,
    required: true,
  },
  startedAt: {
    type: Date,
    default: null,
  },
  finishedAt: {
    type: Date,
    default: null,
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

// Compound index for efficient queries
roomSchema.index({ gameSlug: 1, entryFee: 1, status: 1 });

// Update updatedAt before saving
roomSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Room', roomSchema);

