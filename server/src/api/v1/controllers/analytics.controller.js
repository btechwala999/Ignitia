const Analytics = require('../models/analytics.model');
const User = require('../models/user.model');
const QuestionPaper = require('../models/questionPaper.model');
const logger = require('../../../utils/logger');

/**
 * Get overall statistics (admin only)
 */
exports.getOverallStats = async (req, res, next) => {
  try {
    // Get total users count by role
    const userStats = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 }
        }
      }
    ]);

    // Get total question papers
    const totalPapers = await QuestionPaper.countDocuments();

    // Get papers created in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentPapers = await QuestionPaper.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Get most active users (paper creation)
    const mostActiveUsers = await User.find()
      .sort({ 'stats.papersCreated': -1 })
      .limit(5)
      .select('name email stats.papersCreated');

    // Get activity by action type
    const actionStats = await Analytics.aggregate([
      {
        $group: {
          _id: "$action",
          count: { $sum: 1 }
        }
      }
    ]);

    // Format user stats into an object
    const userStatsByRole = {};
    userStats.forEach(stat => {
      userStatsByRole[stat._id] = stat.count;
    });

    // Format action stats into an object
    const actionCounts = {};
    actionStats.forEach(stat => {
      actionCounts[stat._id] = stat.count;
    });

    res.status(200).json({
      status: 'success',
      data: {
        users: {
          total: userStats.reduce((sum, stat) => sum + stat.count, 0),
          byRole: userStatsByRole
        },
        papers: {
          total: totalPapers,
          last30Days: recentPapers
        },
        mostActiveUsers,
        actions: actionCounts
      }
    });
  } catch (error) {
    logger.error('Error getting overall stats:', error);
    next(error);
  }
};

/**
 * Get statistics for a specific user
 */
exports.getUserStats = async (req, res, next) => {
  try {
    // Get user ID from params or from authenticated user
    const userId = req.params.userId || req.user._id;

    // Check if the requesting user is authorized to view stats for the specified user
    if (req.params.userId && req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to view stats for this user'
      });
    }

    // Get user details
    const user = await User.findById(userId).select('name email role stats');
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }

    // Get paper count
    const paperCount = await QuestionPaper.countDocuments({ createdBy: userId });

    // Get most recent actions
    const recentActions = await Analytics.find({ user: userId })
      .sort({ timestamp: -1 })
      .limit(10);

    // Get action counts by type
    const actionsByType = await Analytics.aggregate([
      { $match: { user: userId } },
      { $group: { _id: "$action", count: { $sum: 1 } } }
    ]);

    // Format action counts
    const actionCounts = {};
    actionsByType.forEach(action => {
      actionCounts[action._id] = action.count;
    });

    res.status(200).json({
      status: 'success',
      data: {
        user,
        papers: {
          count: paperCount
        },
        actions: {
          recent: recentActions,
          counts: actionCounts
        }
      }
    });
  } catch (error) {
    logger.error('Error getting user stats:', error);
    next(error);
  }
};

/**
 * Get recent activity for a user
 */
exports.getRecentActivity = async (req, res, next) => {
  try {
    // Get user ID from params or from authenticated user
    const userId = req.params.userId || req.user._id;

    // Check if the requesting user is authorized to view activity for the specified user
    if (req.params.userId && req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to view activity for this user'
      });
    }

    // Get recent analytics data
    const activities = await Analytics.find({ user: userId })
      .sort({ timestamp: -1 })
      .limit(20)
      .populate({
        path: 'questionPaper',
        select: 'title subject'
      });

    // Get recent papers created by the user
    const recentPapers = await QuestionPaper.find({ createdBy: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title subject totalMarks createdAt');

    res.status(200).json({
      status: 'success',
      data: {
        activities,
        recentPapers
      }
    });
  } catch (error) {
    logger.error('Error getting recent activity:', error);
    next(error);
  }
};

/**
 * Get trending subjects
 */
exports.getTrendingSubjects = async (req, res, next) => {
  try {
    // Get paper counts by subject
    const subjectCounts = await QuestionPaper.aggregate([
      {
        $group: {
          _id: "$subject",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get recent activity by subject
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentSubjectCounts = await QuestionPaper.aggregate([
      { 
        $match: { 
          createdAt: { $gte: thirtyDaysAgo } 
        } 
      },
      {
        $group: {
          _id: "$subject",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        allTime: subjectCounts,
        lastThirtyDays: recentSubjectCounts
      }
    });
  } catch (error) {
    logger.error('Error getting trending subjects:', error);
    next(error);
  }
};

/**
 * Get statistics by difficulty level
 */
exports.getDifficultyStats = async (req, res, next) => {
  try {
    // Aggregate questions by difficulty
    const questionsByDifficulty = await QuestionPaper.aggregate([
      { $unwind: "$questions" },
      {
        $group: {
          _id: "$questions.difficulty",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get average marks by difficulty
    const avgMarksByDifficulty = await QuestionPaper.aggregate([
      { $unwind: "$questions" },
      {
        $group: {
          _id: "$questions.difficulty",
          avgMarks: { $avg: "$questions.marks" }
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        questionCounts: questionsByDifficulty,
        averageMarks: avgMarksByDifficulty
      }
    });
  } catch (error) {
    logger.error('Error getting difficulty stats:', error);
    next(error);
  }
}; 