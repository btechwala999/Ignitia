import api from './api';

/**
 * Service for analytics-related API calls
 */
const analyticsService = {
  /**
   * Get overall analytics statistics (admin only)
   * @returns {Promise<Object>} Overall statistics
   */
  getOverallStats: async () => {
    const response = await api.get('/analytics/overall');
    return response.data;
  },

  /**
   * Get analytics for a specific user
   * @param {string} [userId] - User ID (omit for current user)
   * @returns {Promise<Object>} User statistics
   */
  getUserStats: async (userId) => {
    const url = userId ? `/analytics/user/${userId}` : '/analytics/user';
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Get recent activity for a user
   * @param {string} [userId] - User ID (omit for current user)
   * @returns {Promise<Object>} Recent activity data
   */
  getRecentActivity: async (userId) => {
    const url = userId ? `/analytics/recent/${userId}` : '/analytics/recent';
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Get trending subjects
   * @returns {Promise<Object>} Trending subjects data
   */
  getTrendingSubjects: async () => {
    const response = await api.get('/analytics/trending-subjects');
    return response.data;
  },

  /**
   * Get usage by difficulty level
   * @returns {Promise<Object>} Difficulty statistics
   */
  getDifficultyStats: async () => {
    const response = await api.get('/analytics/difficulty-stats');
    return response.data;
  }
};

export default analyticsService; 