const Notification = require('../models/Notification');

/**
 * Create and send a notification to a user
 * @param {string} userId - User ID to send notification to
 * @param {Object} options - Notification options
 * @param {string} options.type - Notification type
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message
 * @param {string} options.intent - Notification intent (info, success, warning, error)
 * @param {string} options.icon - Icon name
 * @param {string} options.actionUrl - Optional action URL
 * @param {Object} options.payload - Optional payload data
 */
async function createNotification(userId, options) {
  try {
    const notification = await Notification.create({
      userId,
      type: options.type || 'system',
      title: options.title,
      message: options.message,
      intent: options.intent || 'info',
      icon: options.icon || 'bell',
      actionUrl: options.actionUrl,
      payload: options.payload,
    });

    // Send notification via WebSocket if user is connected
    if (global.sendNotificationToUser) {
      global.sendNotificationToUser(userId, notification.toObject());
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

module.exports = { createNotification };

