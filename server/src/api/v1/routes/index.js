const express = require('express');
const authRoutes = require('./auth.routes');
const questionPaperRoutes = require('./questionPaper.routes');
const analyticsRoutes = require('./analytics.routes');
const path = require('path');

const router = express.Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/question-papers', questionPaperRoutes);
router.use('/analytics', analyticsRoutes);

// Serve uploaded files
router.use('/uploads', express.static(path.join(__dirname, '../../../../public/uploads')));

// API health check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running',
  });
});

module.exports = router; 