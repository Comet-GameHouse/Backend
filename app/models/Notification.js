const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return !this.isGlobal;
    },
    index: true,
  },
  isGlobal: {
    type: Boolean,
    default: false,
    index: true,
  },
  targetAudience: {
    type: String,
    enum: ['all', 'verified', 'unverified'],
    default: 'all',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  sentAt: {
    type: Date,
  },
  type: {
    type: String,
    enum: ['system', 'friend-request', 'match-invite', 'room-update', 'reward'],
    required: true,
    default: 'system',
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  intent: {
    type: String,
    enum: ['info', 'success', 'warning', 'error'],
    default: 'info',
  },
  icon: {
    type: String,
    default: 'bell',
  },
  actionUrl: {
    type: String,
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
  },
  readAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Index for faster queries
notificationSchema.index({ userId: 1, readAt: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

