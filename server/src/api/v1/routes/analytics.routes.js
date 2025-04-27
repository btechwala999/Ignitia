const express = require('express');
const analyticsController = require('../controllers/analytics.controller');
const { protect, restrictTo } = require('../middlewares/auth');

const router = express.Router();

// Protect all routes after this middleware
router.use(protect);

// Get overall stats (admin only)
router.get('/overall', restrictTo('admin'), analyticsController.getOverallStats);

// Get user stats
router.get('/user/:userId?', analyticsController.getUserStats);

// Get recent activity
router.get('/recent/:userId?', analyticsController.getRecentActivity);

// Get trending subjects
router.get('/trending-subjects', analyticsController.getTrendingSubjects);

// Get difficulty stats
router.get('/difficulty-stats', analyticsController.getDifficultyStats);

module.exports = router; 