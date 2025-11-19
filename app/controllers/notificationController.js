const Notification = require('../models/Notification');
const NotificationRead = require('../models/NotificationRead');
const User = require('../models/User');

/**
 * Get all notifications for the authenticated user
 * Includes both user-specific notifications and global notifications
 */
const getNotifications = async (req, res) => {
  try {
    const { limit = 50, offset = 0, unreadOnly = false } = req.query;
    const userId = req.user.id;
    
    // Get user to check verification status for global notification filtering
    const user = await User.findById(userId).select('isVerified emailVerifiedAt').lean();
    const isVerified = user?.isVerified || !!user?.emailVerifiedAt;

    // Get user-specific notifications
    const userQuery = { userId };
    if (unreadOnly === 'true') {
      userQuery.readAt = { $exists: false };
    }

    // Fetch more than needed so we can combine and limit properly
    const fetchLimit = parseInt(limit) * 2; // Fetch more to account for combining
    const userNotifications = await Notification.find(userQuery)
      .sort({ createdAt: -1 })
      .limit(fetchLimit)
      .skip(parseInt(offset))
      .lean();

    // Build query for global notifications that match user's audience
    const globalAudienceConditions = [{ targetAudience: 'all' }];
    if (isVerified) {
      globalAudienceConditions.push({ targetAudience: 'verified' });
    } else {
      globalAudienceConditions.push({ targetAudience: 'unverified' });
    }

    // Get IDs of global notifications this user has read
    const readGlobalNotificationIds = await NotificationRead.find({ userId }).select('notificationId').lean();
    const readIds = readGlobalNotificationIds.map((r) => r.notificationId.toString());

    // Build global query
    const globalQuery = {
      isGlobal: true,
      sentAt: { $exists: true }, // Only sent global notifications
      $or: globalAudienceConditions,
    };

    // Only exclude read global notifications if unreadOnly is true
    if (unreadOnly === 'true' && readIds.length > 0) {
      globalQuery._id = { $nin: readIds };
    }

    // Fetch more than needed so we can combine and limit properly
    const globalNotificationsRaw = await Notification.find(globalQuery)
      .sort({ createdAt: -1 })
      .limit(fetchLimit)
      .lean();

    // Transform global notifications to include readAt if user has read them
    const globalNotificationIds = globalNotificationsRaw.map((n) => n._id);
    const readGlobalRecords = await NotificationRead.find({
      userId,
      notificationId: { $in: globalNotificationIds },
    }).lean();
    const readGlobalMap = new Map(
      readGlobalRecords.map((r) => [r.notificationId.toString(), r.readAt])
    );

    const globalNotifications = globalNotificationsRaw.map((notification) => ({
      ...notification,
      isGlobal: true,
      userId: null, // Global notifications don't have a userId
      readAt: readGlobalMap.get(notification._id.toString()) || null,
    }));

    // Count total notifications for pagination
    const totalUserNotifications = await Notification.countDocuments(userQuery);
    const totalGlobalNotifications = await Notification.countDocuments(globalQuery);
    const totalNotifications = totalUserNotifications + totalGlobalNotifications;

    // Combine and sort all notifications
    const allNotifications = [...userNotifications, ...globalNotifications]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, parseInt(limit));

    // Calculate unread count
    const userUnreadCount = await Notification.countDocuments({
      userId,
      readAt: { $exists: false },
    });

    // Count unread global notifications
    const globalAudienceConditionsForCount = [{ targetAudience: 'all' }];
    if (isVerified) {
      globalAudienceConditionsForCount.push({ targetAudience: 'verified' });
    } else {
      globalAudienceConditionsForCount.push({ targetAudience: 'unverified' });
    }

    const unreadGlobalQuery = {
      isGlobal: true,
      sentAt: { $exists: true },
      $or: globalAudienceConditionsForCount,
    };
    if (readIds.length > 0) {
      unreadGlobalQuery._id = { $nin: readIds };
    }
    const globalUnreadCount = await Notification.countDocuments(unreadGlobalQuery);

    const totalUnreadCount = userUnreadCount + globalUnreadCount;

    res.json({
      success: true,
      data: {
        notifications: allNotifications,
        unreadCount: totalUnreadCount,
        total: totalNotifications,
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
    });
  }
};

/**
 * Get count of unread notifications (includes global notifications)
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user to check verification status
    const user = await User.findById(userId).select('isVerified emailVerifiedAt').lean();
    const isVerified = user?.isVerified || !!user?.emailVerifiedAt;

    // Count user-specific unread notifications
    const userUnreadCount = await Notification.countDocuments({
      userId,
      readAt: { $exists: false },
    });

    // Get IDs of global notifications this user has read
    const readGlobalNotificationIds = await NotificationRead.find({ userId }).select('notificationId').lean();
    const readIds = readGlobalNotificationIds.map((r) => r.notificationId.toString());

    // Count unread global notifications
    const globalAudienceConditionsForCount = [{ targetAudience: 'all' }];
    if (isVerified) {
      globalAudienceConditionsForCount.push({ targetAudience: 'verified' });
    } else {
      globalAudienceConditionsForCount.push({ targetAudience: 'unverified' });
    }

    const globalUnreadQuery = {
      isGlobal: true,
      sentAt: { $exists: true },
      $or: globalAudienceConditionsForCount,
    };
    if (readIds.length > 0) {
      globalUnreadQuery._id = { $nin: readIds };
    }
    const globalUnreadCount = await Notification.countDocuments(globalUnreadQuery);

    const totalUnreadCount = userUnreadCount + globalUnreadCount;

    res.json({
      success: true,
      data: { unreadCount: totalUnreadCount },
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
    });
  }
};

/**
 * Create a new notification (admin/system only)
 */
const createNotification = async (req, res) => {
  try {
    // Only admins and moderators can create notifications for other users
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({
        success: false,
        message: 'Only admins and moderators can create notifications',
      });
    }

    const { userId, type, title, message, intent, icon, actionUrl, payload } = req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'userId, title, and message are required',
      });
    }

    const notification = await Notification.create({
      userId,
      type: type || 'system',
      title,
      message,
      intent: intent || 'info',
      icon: icon || 'bell',
      actionUrl,
      payload,
    });

    // Send notification via WebSocket if user is connected
    if (global.sendNotificationToUser) {
      global.sendNotificationToUser(userId, notification.toObject());
    }

    res.status(201).json({
      success: true,
      data: { notification },
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification',
    });
  }
};

/**
 * Mark a notification as read
 * Handles both user-specific and global notifications
 */
const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    // Check if it's a user-specific notification
    const userNotification = await Notification.findOne({
      _id: notificationId,
      userId,
      isGlobal: { $ne: true },
    });

    if (userNotification) {
      // User-specific notification - mark as read directly
      if (!userNotification.readAt) {
        userNotification.readAt = new Date();
        await userNotification.save();
      }

      return res.json({
        success: true,
        data: { notification: userNotification },
      });
    }

    // Check if it's a global notification
    const globalNotification = await Notification.findOne({
      _id: notificationId,
      isGlobal: true,
    });

    if (globalNotification) {
      // Global notification - create a read record
      const readRecord = await NotificationRead.findOneAndUpdate(
        {
          userId,
          notificationId,
        },
        {
          userId,
          notificationId,
          readAt: new Date(),
        },
        {
          upsert: true,
          new: true,
        }
      );

      // Return notification with readAt included
      const notificationWithRead = {
        ...globalNotification.toObject(),
        isGlobal: true,
        userId: null,
        readAt: readRecord.readAt,
      };

      return res.json({
        success: true,
        data: { notification: notificationWithRead },
      });
    }

    // Notification not found
    return res.status(404).json({
      success: false,
      message: 'Notification not found',
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
    });
  }
};

/**
 * Mark all notifications as read (includes global notifications)
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    // Mark all user-specific notifications as read
    const userResult = await Notification.updateMany(
      {
        userId,
        readAt: { $exists: false },
      },
      {
        $set: { readAt: new Date() },
      }
    );

    // Get user to check verification status for global notifications
    const user = await User.findById(userId).select('isVerified emailVerifiedAt').lean();
    const isVerified = user?.isVerified || !!user?.emailVerifiedAt;

    // Get all unread global notifications that match user's audience
    const globalAudienceConditionsForMarkAll = [{ targetAudience: 'all' }];
    if (isVerified) {
      globalAudienceConditionsForMarkAll.push({ targetAudience: 'verified' });
    } else {
      globalAudienceConditionsForMarkAll.push({ targetAudience: 'unverified' });
    }

    const globalQuery = {
      isGlobal: true,
      sentAt: { $exists: true },
      $or: globalAudienceConditionsForMarkAll,
    };

    // Get IDs of global notifications this user has already read
    const readGlobalNotificationIds = await NotificationRead.find({ userId }).select('notificationId').lean();
    const readIds = readGlobalNotificationIds.map((r) => r.notificationId.toString());

    // Exclude already read global notifications
    if (readIds.length > 0) {
      globalQuery._id = { $nin: readIds };
    }

    const unreadGlobalNotifications = await Notification.find(globalQuery).select('_id').lean();
    const globalNotificationIds = unreadGlobalNotifications.map((n) => n._id);

    // Create read records for all unread global notifications
    let globalReadCount = 0;
    if (globalNotificationIds.length > 0) {
      const readRecords = globalNotificationIds.map((notificationId) => ({
        userId,
        notificationId,
        readAt: new Date(),
      }));

      // Use insertMany with ordered: false to handle potential duplicates gracefully
      try {
        await NotificationRead.insertMany(readRecords, { ordered: false });
        globalReadCount = readRecords.length;
      } catch (error) {
        // Some records might already exist, count successful inserts
        if (error.writeErrors) {
          globalReadCount = readRecords.length - error.writeErrors.length;
        }
      }
    }

    const totalUpdatedCount = userResult.modifiedCount + globalReadCount;

    res.json({
      success: true,
      data: { updatedCount: totalUpdatedCount },
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
    });
  }
};

/**
 * Delete a notification
 * Only user-specific notifications can be deleted, not global ones
 */
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user.id,
      isGlobal: { $ne: true }, // Cannot delete global notifications
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or cannot be deleted',
      });
    }

    await Notification.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
    });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};

