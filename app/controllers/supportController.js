const { validationResult } = require('express-validator');
const SupportRequest = require('../models/SupportRequest');
const ServerStatus = require('../models/ServerStatus');
const HelpContent = require('../models/HelpContent');
const mongoose = require('mongoose');
const os = require('os');

const getHelpCenter = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch active FAQ items from database with pagination, sorted by order
    const [faqItems, total] = await Promise.all([
      HelpContent.find({ isActive: true })
        .sort({ order: 1, createdAt: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('question answer step')
        .lean(),
      HelpContent.countDocuments({ isActive: true }),
    ]);

    // Transform to match expected format
    const faq = faqItems.map((item) => ({
      question: item.question,
      answer: item.answer,
      step: item.step,
    }));

    return res.json({ success: true, data: { faq, total } });
  } catch (error) {
    console.error('Get help center error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load help center' });
  }
};

// Helper function to check server health
const checkServerHealth = () => {
  const startTime = Date.now();
  
  // Check MongoDB connection
  const dbStatus = mongoose.connection.readyState === 1 ? 'ok' : 'major';
  
  // Get system metrics
  const memoryUsage = process.memoryUsage();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryPercentage = (usedMemory / totalMemory) * 100;
  
  // Determine overall status
  let status = 'ok';
  let details = 'All systems operational';
  
  // Check memory usage
  if (memoryPercentage > 90) {
    status = 'major';
    details = 'High memory usage detected';
  } else if (memoryPercentage > 75) {
    status = 'minor';
    details = 'Elevated memory usage';
  }
  
  // Check database connection
  if (dbStatus === 'major') {
    status = 'major';
    details = 'Database connection issue';
  }
  
  // Check process memory
  const processMemoryMB = memoryUsage.heapUsed / 1024 / 1024;
  if (processMemoryMB > 500) { // More than 500MB
    if (status === 'ok') {
      status = 'minor';
      details = 'High process memory usage';
    }
  }
  
  const responseTime = Date.now() - startTime;
  
  return {
    status,
    details,
    responseTime,
    uptime: process.uptime(),
    memoryUsage: {
      used: Math.round(usedMemory / 1024 / 1024), // MB
      total: Math.round(totalMemory / 1024 / 1024), // MB
      percentage: Math.round(memoryPercentage),
    },
    processMemory: Math.round(processMemoryMB),
  };
};

// Log current status (called periodically or on request)
const logCurrentStatus = async () => {
  try {
    const health = checkServerHealth();
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of day
    
    // Check if status already logged for today
    const existingStatus = await ServerStatus.findOne({
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    });
    
    if (existingStatus) {
      // Update existing status if current is worse
      if (
        (existingStatus.status === 'ok' && health.status !== 'ok') ||
        (existingStatus.status === 'minor' && health.status === 'major')
      ) {
        existingStatus.status = health.status;
        existingStatus.details = health.details;
        existingStatus.responseTime = health.responseTime;
        existingStatus.uptime = health.uptime;
        existingStatus.memoryUsage = health.memoryUsage;
        await existingStatus.save();
      }
    } else {
      // Create new status entry for today
      await ServerStatus.create({
        date: today,
        status: health.status,
        details: health.details,
        responseTime: health.responseTime,
        uptime: health.uptime,
        memoryUsage: health.memoryUsage,
      });
    }
  } catch (error) {
    console.error('Error logging server status:', error);
  }
};

const getSystemStatus = async (_req, res) => {
  try {
    // Log current status
    await logCurrentStatus();
    
    // Get current health
    const currentHealth = checkServerHealth();
    
    // Format service status
    const statusLabels = {
      ok: 'Operational',
      minor: 'Minor Issues',
      major: 'Major Outage',
    };
    
    const service = {
      name: 'Server',
      status: statusLabels[currentHealth.status] || 'Unknown',
      detail: currentHealth.details,
    };

    // Get 90-day history from database
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const statusHistory = await ServerStatus.find({
      date: { $gte: ninetyDaysAgo },
    })
      .sort({ date: 1 })
      .lean();
    
    // Fill in missing days with 'ok' status
    const history = [];
    for (let i = 89; i >= 0; i--) {
      // Create date by subtracting days (more explicit and handles month boundaries correctly)
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dayStatus = statusHistory.find(
        (s) => s.date.toISOString().split('T')[0] === date.toISOString().split('T')[0]
      );
      
      history.push({
        date: date.toISOString(),
        status: dayStatus ? dayStatus.status : 'ok', // Default to 'ok' if no data
      });
    }

    return res.json({
      success: true,
      data: {
        services: [service],
        history,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Get system status error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load system status' });
  }
};

const submitBugReport = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map((e) => ({ field: e.path || e.param, message: e.msg })),
      });
    }

    const userId = req.user ? req.user._id.toString() : null;
    const { email, platform, severity, summary, steps } = req.body;

    const doc = await SupportRequest.create({
      type: 'bug',
      userId,
      email,
      platform,
      severity,
      summary,
      steps,
      metadata: {
        userAgent: req.headers['user-agent'] || null,
        ip: req.ip || req.headers['x-forwarded-for'] || null,
      },
    });

    return res.json({
      success: true,
      message: 'Bug report submitted',
      data: { id: doc._id.toString() },
    });
  } catch (error) {
    console.error('Submit bug report error:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit bug report' });
  }
};

const submitFeedback = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map((e) => ({ field: e.path || e.param, message: e.msg })),
      });
    }

    const userId = req.user ? req.user._id.toString() : null;
    const { name, email, topic, feedback } = req.body;

    const doc = await SupportRequest.create({
      type: 'feedback',
      userId,
      name,
      email,
      topic,
      feedback,
      metadata: {
        userAgent: req.headers['user-agent'] || null,
        ip: req.ip || req.headers['x-forwarded-for'] || null,
      },
    });

    return res.json({
      success: true,
      message: 'Feedback submitted',
      data: { id: doc._id.toString() },
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit feedback' });
  }
};

module.exports = { submitBugReport, submitFeedback, getHelpCenter, getSystemStatus };


