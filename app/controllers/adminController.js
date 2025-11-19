const User = require('../models/User');
const UserStats = require('../models/UserStats');
const UserActivity = require('../models/UserActivity');
const SupportRequest = require('../models/SupportRequest');
const Notification = require('../models/Notification');
const CommunityEvent = require('../models/CommunityEvent');
const Crew = require('../models/Crew');
const HelpContent = require('../models/HelpContent');
const Game = require('../models/Game');

/**
 * Get dashboard statistics
 */
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await UserStats.countDocuments({ lastActiveAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } });
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    });
    const totalSupportRequests = await SupportRequest.countDocuments();
    const openSupportRequests = await SupportRequest.countDocuments({ status: { $in: ['open', 'in-progress'] } });

    // Simple system status check
    const systemStatus = 'operational'; // Could be enhanced with actual health checks

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        newUsersToday,
        totalSupportRequests,
        openSupportRequests,
        systemStatus,
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
    });
  }
};

/**
 * Get users with pagination and search
 */
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { email: { $regex: search, $options: 'i' } },
          { username: { $regex: search, $options: 'i' } },
          { displayName: { $regex: search, $options: 'i' } },
        ],
      };
    }

    const users = await User.find(query)
      .select('-password -emailVerificationToken -emailVerificationExpires')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments(query);

    // Transform _id to id for frontend
    const transformedUsers = users.map((user) => ({
      ...user,
      id: user._id.toString(),
      _id: undefined,
    }));

    res.json({
      success: true,
      data: {
        users: transformedUsers,
        total,
        page,
        limit,
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
    });
  }
};

/**
 * Get user details with activity
 */
const getUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password -emailVerificationToken -emailVerificationExpires').lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const activity = await UserActivity.find({ userId: id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Transform _id to id for frontend
    const transformedUser = {
      ...user,
      id: user._id.toString(),
      _id: undefined,
    };

    const transformedActivity = activity.map((log) => ({
      ...log,
      id: log._id.toString(),
      _id: undefined,
    }));

    res.json({
      success: true,
      data: {
        user: transformedUser,
        activity: transformedActivity,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
    });
  }
};

/**
 * Update user
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, isVerified } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (role !== undefined) user.role = role;
    if (isVerified !== undefined) user.isVerified = isVerified;

    await user.save();

    res.json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
    });
  }
};

/**
 * Get support requests
 */
const getSupportRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    let query = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.type) query.type = req.query.type;

    const requests = await SupportRequest.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    const total = await SupportRequest.countDocuments(query);

    // Transform _id to id and create content object for frontend
    const transformedRequests = requests.map((request) => {
      const content = {};
      if (request.summary) content.summary = request.summary;
      if (request.steps) content.steps = request.steps;
      if (request.platform) content.platform = request.platform;
      if (request.severity) content.severity = request.severity;
      if (request.topic) content.topic = request.topic;
      if (request.feedback) content.feedback = request.feedback;
      if (request.name) content.name = request.name;

      return {
        ...request,
        id: request._id.toString(),
        _id: undefined,
        content,
      };
    });

    res.json({
      success: true,
      data: {
        requests: transformedRequests,
        total,
      },
    });
  } catch (error) {
    console.error('Get support requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch support requests',
    });
  }
};

/**
 * Update support request status
 */
const updateSupportRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const request = await SupportRequest.findByIdAndUpdate(id, { status }, { new: true }).lean();
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Support request not found',
      });
    }

    // Transform _id to id and create content object for frontend
    const content = {};
    if (request.summary) content.summary = request.summary;
    if (request.steps) content.steps = request.steps;
    if (request.platform) content.platform = request.platform;
    if (request.severity) content.severity = request.severity;
    if (request.topic) content.topic = request.topic;
    if (request.feedback) content.feedback = request.feedback;
    if (request.name) content.name = request.name;

    const transformedRequest = {
      ...request,
      id: request._id.toString(),
      _id: undefined,
      content,
    };

    res.json({
      success: true,
      data: {
        request: transformedRequest,
      },
    });
  } catch (error) {
    console.error('Update support request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update support request',
    });
  }
};

/**
 * Get notifications
 */
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total] = await Promise.all([
      Notification.find({ isGlobal: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Notification.countDocuments({ isGlobal: true }),
    ]);

    // Transform _id to id for frontend
    const transformedNotifications = notifications.map((notification) => ({
      ...notification,
      id: notification._id.toString(),
      _id: undefined,
    }));

    res.json({
      success: true,
      data: {
        notifications: transformedNotifications,
        total,
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
    });
  }
};

/**
 * Create notification
 */
const createNotification = async (req, res) => {
  try {
    const { title, message, type, targetAudience } = req.body;

    const notification = await Notification.create({
      title,
      message,
      intent: type || 'info',
      type: 'system',
      isGlobal: true,
      targetAudience: targetAudience || 'all',
      createdBy: req.user._id,
    });

    res.json({
      success: true,
      data: {
        notification,
      },
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification',
    });
  }
};

/**
 * Send notification to all users
 */
const sendNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    // Get target users based on audience
    let userQuery = {};
    if (notification.targetAudience === 'verified') {
      userQuery.isVerified = true;
    } else if (notification.targetAudience === 'unverified') {
      userQuery.isVerified = false;
    }

    const users = await User.find(userQuery).select('_id').lean();
    const userIds = users.map((u) => u._id.toString());

    // Mark global notification as sent (only one notification record, not per user)
    notification.sentAt = new Date();
    await notification.save();

    // Prepare notification data for WebSocket
    const notificationData = {
      _id: notification._id.toString(),
      id: notification._id.toString(),
      userId: null, // Global notification has no specific userId
      isGlobal: true,
      title: notification.title,
      message: notification.message,
      intent: notification.intent,
      type: notification.type,
      icon: notification.icon || 'bell',
      actionUrl: notification.actionUrl,
      payload: notification.payload,
      targetAudience: notification.targetAudience,
      createdAt: notification.createdAt,
      sentAt: notification.sentAt,
    };

    // Send notifications via WebSocket to all connected target users in real-time
    if (global.sendNotificationToUser) {
      let sentCount = 0;
      userIds.forEach((userId) => {
        // Send to each target user via WebSocket
        global.sendNotificationToUser(userId, {
          ...notificationData,
          userId, // Include userId for frontend compatibility
        });
        sentCount++;
      });
      console.log(`Sent global notification to ${sentCount} users via WebSocket`);
    }

    res.json({
      success: true,
      message: `Global notification sent to ${userIds.length} users`,
      data: {
        notification: {
          id: notification._id.toString(),
          title: notification.title,
          message: notification.message,
          targetAudience: notification.targetAudience,
          sentAt: notification.sentAt,
        },
      },
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
    });
  }
};

/**
 * Get activity logs
 */
const getActivityLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    let query = {};
    if (req.query.userId) query.userId = req.query.userId;

    const logs = await UserActivity.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    const total = await UserActivity.countDocuments(query);

    // Transform _id to id for frontend
    const transformedLogs = logs.map((log) => ({
      ...log,
      id: log._id.toString(),
      _id: undefined,
    }));

    res.json({
      success: true,
      data: {
        logs: transformedLogs,
        total,
      },
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity logs',
    });
  }
};

/**
 * Get system metrics
 */
const getSystemMetrics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await UserStats.countDocuments({ lastActiveAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } });
    const totalSupportRequests = await SupportRequest.countDocuments();
    const openSupportRequests = await SupportRequest.countDocuments({ status: { $in: ['open', 'in-progress'] } });

    res.json({
      success: true,
      data: {
        metrics: {
          total_users: totalUsers,
          active_users_24h: activeUsers,
          total_support_requests: totalSupportRequests,
          open_support_requests: openSupportRequests,
          system_status: 'operational',
          uptime: process.uptime(),
        },
      },
    });
  } catch (error) {
    console.error('Get system metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system metrics',
    });
  }
};

/**
 * Get all community events
 */
const getCommunityEvents = async (req, res) => {
  try {
    const events = await CommunityEvent.find()
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: {
        events: events.map((event) => ({
          id: event._id.toString(),
          title: event.title,
          detail: event.detail,
          prizeCoins: event.prizeCoins,
          eventDate: event.eventDate,
          isActive: event.isActive,
          createdAt: event.createdAt,
          updatedAt: event.updatedAt,
        })),
      },
    });
  } catch (error) {
    console.error('Get community events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load community events',
    });
  }
};

/**
 * Create community event
 */
const createCommunityEvent = async (req, res) => {
  try {
    const { title, detail, prizeCoins, eventDate, isActive } = req.body;

    if (!title || !detail) {
      return res.status(400).json({
        success: false,
        message: 'Title and detail are required',
      });
    }

    const event = await CommunityEvent.create({
      title,
      detail,
      prizeCoins: prizeCoins || 0,
      eventDate: eventDate ? new Date(eventDate) : undefined,
      isActive: isActive !== undefined ? isActive : true,
    });

    // Send notification to all users about the new community event
    if (isActive) {
      try {
        const User = require('../models/User');
        const notificationMessage = prizeCoins > 0
          ? `${event.detail} Prize: ${prizeCoins.toLocaleString()} coins`
          : event.detail;

        // Create a single global notification (not one per user)
        const notification = await Notification.create({
          title: `New Community Event: ${event.title}`,
          message: notificationMessage,
          intent: 'info',
          type: 'system',
          isGlobal: true,
          targetAudience: 'all',
          icon: 'bell',
          actionUrl: '/community',
          payload: { eventId: event._id.toString() },
          createdBy: req.user._id,
          sentAt: new Date(), // Mark as sent immediately
        });

        // Get all users to send via WebSocket
        const users = await User.find({}).select('_id').lean();
        const userIds = users.map((u) => u._id.toString());

        // Prepare notification data for WebSocket
        const notificationData = {
          _id: notification._id.toString(),
          id: notification._id.toString(),
          userId: null, // Global notification has no specific userId
          isGlobal: true,
          title: notification.title,
          message: notification.message,
          intent: notification.intent,
          type: notification.type,
          icon: notification.icon || 'bell',
          actionUrl: notification.actionUrl,
          payload: notification.payload,
          targetAudience: notification.targetAudience,
          createdAt: notification.createdAt,
          sentAt: notification.sentAt,
        };

        // Send notifications via WebSocket to all connected users in real-time
        if (global.sendNotificationToUser) {
          let sentCount = 0;
          userIds.forEach((userId) => {
            // Send to each target user via WebSocket
            global.sendNotificationToUser(userId, {
              ...notificationData,
              userId, // Include userId for frontend compatibility
            });
            sentCount++;
          });
          console.log(`Sent global community event notification to ${sentCount} users via WebSocket`);
        }

        console.log(`Created global community event notification for ${userIds.length} users`);
      } catch (error) {
        console.error('Error sending community event notification:', error);
        // Don't fail the request if notification sending fails
      }
    }

    res.json({
      success: true,
      data: {
        event: {
          id: event._id.toString(),
          title: event.title,
          detail: event.detail,
          prizeCoins: event.prizeCoins,
          eventDate: event.eventDate,
          isActive: event.isActive,
          createdAt: event.createdAt,
          updatedAt: event.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error('Create community event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create community event',
    });
  }
};

/**
 * Update community event
 */
const updateCommunityEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, detail, prizeCoins, eventDate, isActive } = req.body;

    const event = await CommunityEvent.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Community event not found',
      });
    }

    if (title !== undefined) event.title = title;
    if (detail !== undefined) event.detail = detail;
    if (prizeCoins !== undefined) event.prizeCoins = prizeCoins;
    if (eventDate !== undefined) event.eventDate = eventDate ? new Date(eventDate) : null;
    if (isActive !== undefined) event.isActive = isActive;

    await event.save();

    res.json({
      success: true,
      data: {
        event: {
          id: event._id.toString(),
          title: event.title,
          detail: event.detail,
          prizeCoins: event.prizeCoins,
          eventDate: event.eventDate,
          isActive: event.isActive,
          createdAt: event.createdAt,
          updatedAt: event.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error('Update community event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update community event',
    });
  }
};

/**
 * Delete community event
 */
const deleteCommunityEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await CommunityEvent.findByIdAndDelete(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Community event not found',
      });
    }

    res.json({
      success: true,
      message: 'Community event deleted successfully',
    });
  } catch (error) {
    console.error('Delete community event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete community event',
    });
  }
};

/**
 * Get all crews
 */
const getCrews = async (req, res) => {
  try {
    const crews = await Crew.find()
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: {
        crews: crews.map((crew) => ({
          id: crew._id.toString(),
          name: crew.name,
          focus: crew.focus,
          memberCount: crew.memberCount,
          isActive: crew.isActive,
          createdAt: crew.createdAt,
          updatedAt: crew.updatedAt,
        })),
      },
    });
  } catch (error) {
    console.error('Get crews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load crews',
    });
  }
};

/**
 * Create crew
 */
const createCrew = async (req, res) => {
  try {
    const { name, focus, memberCount, isActive } = req.body;

    if (!name || !focus) {
      return res.status(400).json({
        success: false,
        message: 'Name and focus are required',
      });
    }

    const crew = await Crew.create({
      name,
      focus,
      memberCount: memberCount || 0,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.json({
      success: true,
      data: {
        crew: {
          id: crew._id.toString(),
          name: crew.name,
          focus: crew.focus,
          memberCount: crew.memberCount,
          isActive: crew.isActive,
          createdAt: crew.createdAt,
          updatedAt: crew.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error('Create crew error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A crew with this name already exists',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create crew',
    });
  }
};

/**
 * Update crew
 */
const updateCrew = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, focus, memberCount, isActive } = req.body;

    const crew = await Crew.findById(id);
    if (!crew) {
      return res.status(404).json({
        success: false,
        message: 'Crew not found',
      });
    }

    if (name !== undefined) crew.name = name;
    if (focus !== undefined) crew.focus = focus;
    if (memberCount !== undefined) crew.memberCount = memberCount;
    if (isActive !== undefined) crew.isActive = isActive;

    await crew.save();

    res.json({
      success: true,
      data: {
        crew: {
          id: crew._id.toString(),
          name: crew.name,
          focus: crew.focus,
          memberCount: crew.memberCount,
          isActive: crew.isActive,
          createdAt: crew.createdAt,
          updatedAt: crew.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error('Update crew error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A crew with this name already exists',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update crew',
    });
  }
};

/**
 * Delete crew
 */
const deleteCrew = async (req, res) => {
  try {
    const { id } = req.params;

    const crew = await Crew.findByIdAndDelete(id);
    if (!crew) {
      return res.status(404).json({
        success: false,
        message: 'Crew not found',
      });
    }

    res.json({
      success: true,
      message: 'Crew deleted successfully',
    });
  } catch (error) {
    console.error('Delete crew error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete crew',
    });
  }
};

/**
 * Get all help content (FAQ) items
 */
const getHelpContents = async (req, res) => {
  try {
    const { page = 1, limit = 50, category, isActive } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const [helpContents, total] = await Promise.all([
      HelpContent.find(query)
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('createdBy', 'username email')
        .populate('updatedBy', 'username email')
        .lean(),
      HelpContent.countDocuments(query),
    ]);

    // Transform _id to id
    const transformed = helpContents.map((item) => ({
      ...item,
      id: item._id.toString(),
      _id: item._id.toString(),
      createdBy: item.createdBy ? {
        id: item.createdBy._id.toString(),
        username: item.createdBy.username,
        email: item.createdBy.email,
      } : null,
      updatedBy: item.updatedBy ? {
        id: item.updatedBy._id.toString(),
        username: item.updatedBy.username,
        email: item.updatedBy.email,
      } : null,
    }));

    res.json({
      success: true,
      data: {
        helpContents: transformed,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get help contents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch help contents',
    });
  }
};

/**
 * Get single help content item
 */
const getHelpContent = async (req, res) => {
  try {
    const { id } = req.params;

    const helpContent = await HelpContent.findById(id)
      .populate('createdBy', 'username email')
      .populate('updatedBy', 'username email')
      .lean();

    if (!helpContent) {
      return res.status(404).json({
        success: false,
        message: 'Help content not found',
      });
    }

    // Transform _id to id
    const transformed = {
      ...helpContent,
      id: helpContent._id.toString(),
      _id: helpContent._id.toString(),
      createdBy: helpContent.createdBy ? {
        id: helpContent.createdBy._id.toString(),
        username: helpContent.createdBy.username,
        email: helpContent.createdBy.email,
      } : null,
      updatedBy: helpContent.updatedBy ? {
        id: helpContent.updatedBy._id.toString(),
        username: helpContent.updatedBy.username,
        email: helpContent.updatedBy.email,
      } : null,
    };

    res.json({
      success: true,
      data: transformed,
    });
  } catch (error) {
    console.error('Get help content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch help content',
    });
  }
};

/**
 * Create help content (FAQ) item
 */
const createHelpContent = async (req, res) => {
  try {
    const { question, answer, step, order, isActive, category } = req.body;

    if (!question || !answer || !step) {
      return res.status(400).json({
        success: false,
        message: 'Question, answer, and step are required',
      });
    }

    const helpContent = await HelpContent.create({
      question,
      answer,
      step,
      order: order || 0,
      isActive: isActive !== undefined ? isActive : true,
      category: category || 'general',
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Help content created successfully',
      data: {
        id: helpContent._id.toString(),
        ...helpContent.toObject(),
      },
    });
  } catch (error) {
    console.error('Create help content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create help content',
    });
  }
};

/**
 * Update help content (FAQ) item
 */
const updateHelpContent = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, step, order, isActive, category } = req.body;

    const helpContent = await HelpContent.findById(id);
    if (!helpContent) {
      return res.status(404).json({
        success: false,
        message: 'Help content not found',
      });
    }

    // Update fields
    if (question !== undefined) helpContent.question = question;
    if (answer !== undefined) helpContent.answer = answer;
    if (step !== undefined) helpContent.step = step;
    if (order !== undefined) helpContent.order = order;
    if (isActive !== undefined) helpContent.isActive = isActive;
    if (category !== undefined) helpContent.category = category;
    helpContent.updatedBy = req.user._id;

    await helpContent.save();

    res.json({
      success: true,
      message: 'Help content updated successfully',
      data: {
        id: helpContent._id.toString(),
        ...helpContent.toObject(),
      },
    });
  } catch (error) {
    console.error('Update help content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update help content',
    });
  }
};

/**
 * Delete help content (FAQ) item
 */
const deleteHelpContent = async (req, res) => {
  try {
    const { id } = req.params;

    const helpContent = await HelpContent.findByIdAndDelete(id);
    if (!helpContent) {
      return res.status(404).json({
        success: false,
        message: 'Help content not found',
      });
    }

    res.json({
      success: true,
      message: 'Help content deleted successfully',
    });
  } catch (error) {
    console.error('Delete help content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete help content',
    });
  }
};

/**
 * Get all games
 */
const getGames = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
        { mode: { $regex: search, $options: 'i' } },
      ];
    }

    const [games, total] = await Promise.all([
      Game.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Game.countDocuments(query),
    ]);

    const gamesWithId = games.map((game) => ({
      ...game,
      id: game._id.toString(),
      _id: undefined,
    }));

    res.json({
      success: true,
      data: {
        games: gamesWithId,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Get games error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch games',
    });
  }
};

/**
 * Get a single game by ID
 */
const getGame = async (req, res) => {
  try {
    const { id } = req.params;
    const game = await Game.findById(id).lean();

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found',
      });
    }

    const gameWithId = {
      ...game,
      id: game._id.toString(),
      _id: undefined,
    };

    res.json({
      success: true,
      data: { game: gameWithId },
    });
  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch game',
    });
  }
};

/**
 * Create a new game
 */
const createGame = async (req, res) => {
  try {
    const {
      slug,
      title,
      tagline,
      overview,
      mode,
      icon,
      gradient,
      status,
      loadout,
      objectives,
      tips,
      minPlayers,
      maxPlayers,
      thumbnailUrl,
      componentUrl,
      gameServerUrl,
      isActive,
    } = req.body;

    // Validate required fields
    if (!slug || !title || !mode) {
      return res.status(400).json({
        success: false,
        message: 'Slug, title, and mode are required',
      });
    }

    // Check if slug already exists
    const existingGame = await Game.findOne({ slug: slug.toLowerCase().trim() });
    if (existingGame) {
      return res.status(400).json({
        success: false,
        message: 'Game with this slug already exists',
      });
    }

    const game = await Game.create({
      slug: slug.toLowerCase().trim(),
      title,
      tagline,
      overview,
      mode,
      icon: icon || 'gamepad',
      gradient: gradient || 'from-cyan-500/20 to-purple-500/20 border-cyan-400/30',
      status: status || 'Active',
      loadout: loadout || [],
      objectives: objectives || [],
      tips: tips || [],
      minPlayers: minPlayers || 2,
      maxPlayers: maxPlayers || 16,
      thumbnailUrl: thumbnailUrl || null,
      componentUrl: componentUrl || null,
      gameServerUrl: gameServerUrl || null,
      isActive: isActive !== undefined ? isActive : true,
      players: 0,
    });

    const gameWithId = {
      ...game.toObject(),
      id: game._id.toString(),
      _id: undefined,
    };

    res.status(201).json({
      success: true,
      data: { game: gameWithId },
      message: 'Game created successfully',
    });
  } catch (error) {
    console.error('Create game error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Game with this slug already exists',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create game',
    });
  }
};

/**
 * Update a game
 */
const updateGame = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // If slug is being updated, check for duplicates
    if (updateData.slug) {
      updateData.slug = updateData.slug.toLowerCase().trim();
      const existingGame = await Game.findOne({
        slug: updateData.slug,
        _id: { $ne: id },
      });
      if (existingGame) {
        return res.status(400).json({
          success: false,
          message: 'Game with this slug already exists',
        });
      }
    }

    const game = await Game.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).lean();

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found',
      });
    }

    const gameWithId = {
      ...game,
      id: game._id.toString(),
      _id: undefined,
    };

    res.json({
      success: true,
      data: { game: gameWithId },
      message: 'Game updated successfully',
    });
  } catch (error) {
    console.error('Update game error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Game with this slug already exists',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update game',
    });
  }
};

/**
 * Delete a game
 */
const deleteGame = async (req, res) => {
  try {
    const { id } = req.params;
    const game = await Game.findByIdAndDelete(id);

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found',
      });
    }

    res.json({
      success: true,
      message: 'Game deleted successfully',
    });
  } catch (error) {
    console.error('Delete game error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete game',
    });
  }
};

module.exports = {
  getDashboardStats,
  getUsers,
  getUser,
  updateUser,
  getSupportRequests,
  updateSupportRequest,
  getNotifications,
  createNotification,
  sendNotification,
  getActivityLogs,
  getSystemMetrics,
  getCommunityEvents,
  createCommunityEvent,
  updateCommunityEvent,
  deleteCommunityEvent,
  getCrews,
  createCrew,
  updateCrew,
  deleteCrew,
  getHelpContents,
  getHelpContent,
  createHelpContent,
  updateHelpContent,
  deleteHelpContent,
  getGames,
  getGame,
  createGame,
  updateGame,
  deleteGame,
};

