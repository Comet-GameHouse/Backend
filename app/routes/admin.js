const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/admin');
const adminController = require('../controllers/adminController');

// All admin routes require admin/moderator role
router.use(requireAdmin);

// Dashboard
router.get('/dashboard/stats', adminController.getDashboardStats);

// Users
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUser);
router.patch('/users/:id', adminController.updateUser);

// Support Requests
router.get('/support', adminController.getSupportRequests);
router.patch('/support/:id', adminController.updateSupportRequest);

// Notifications
router.get('/notifications', adminController.getNotifications);
router.post('/notifications', adminController.createNotification);
router.post('/notifications/:id/send', adminController.sendNotification);

// Activity Logs
router.get('/activity', adminController.getActivityLogs);

// Monitoring
router.get('/monitoring/metrics', adminController.getSystemMetrics);

// Community Events
router.get('/community/events', adminController.getCommunityEvents);
router.post('/community/events', adminController.createCommunityEvent);
router.patch('/community/events/:id', adminController.updateCommunityEvent);
router.delete('/community/events/:id', adminController.deleteCommunityEvent);

// Crews
router.get('/community/crews', adminController.getCrews);
router.post('/community/crews', adminController.createCrew);
router.patch('/community/crews/:id', adminController.updateCrew);
router.delete('/community/crews/:id', adminController.deleteCrew);

// Help Content (FAQ)
router.get('/help', adminController.getHelpContents);
router.get('/help/:id', adminController.getHelpContent);
router.post('/help', adminController.createHelpContent);
router.patch('/help/:id', adminController.updateHelpContent);
router.delete('/help/:id', adminController.deleteHelpContent);

// Games
router.get('/games', adminController.getGames);
router.get('/games/:id', adminController.getGame);
router.post('/games', adminController.createGame);
router.patch('/games/:id', adminController.updateGame);
router.delete('/games/:id', adminController.deleteGame);

module.exports = router;

