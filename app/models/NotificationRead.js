const mongoose = require('mongoose');

/**
 * Tracks which users have read which global notifications
 * This allows us to have a single global notification instead of creating one per user
 */
const notificationReadSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  notificationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification',
    required: true,
    index: true,
  },
  readAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Compound index to ensure one read record per user per notification
notificationReadSchema.index({ userId: 1, notificationId: 1 }, { unique: true });

module.exports = mongoose.model('NotificationRead', notificationReadSchema);

