import api, { setAuthToken } from './api';

/**
 * @typedef {Object} RegisterParams
 * @property {string} name
 * @property {string} email
 * @property {string} password
 * @property {'admin' | 'teacher' | 'student'} [role]
 */

/**
 * @typedef {Object} LoginParams
 * @property {string} email
 * @property {string} password
 */

/**
 * @typedef {Object} UpdateProfileParams
 * @property {string} name
 */

/**
 * @typedef {Object} ChangePasswordParams
 * @property {string} currentPassword
 * @property {string} newPassword
 */

const authService = {
  /**
   * Register a new user
   * @param {RegisterParams} data - Registration data
   * @returns {Promise<Object>} Response from server
   */
  register: async (data) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  /**
   * Login a user
   * @param {LoginParams} data - Login credentials
   * @returns {Promise<Object>} Response from server with token and user
   */
  login: async (data) => {
    const response = await api.post('/auth/login', data);
    
    // Store token and user in localStorage
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  /**
   * Logout a user
   */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  /**
   * Get current user
   * @returns {Promise<Object>} Current user data
   */
  getCurrentUser: async () => {
    try {
      const res = await api.get('/api/v1/auth/me');
      return res.data.data.user;
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
  },

  /**
   * Update user profile
   * @param {UpdateProfileParams} data - Profile data to update
   * @returns {Promise<Object>} Updated user data
   */
  updateProfile: async (data) => {
    const response = await api.patch('/auth/updateProfile', data);
    
    // Update stored user
    if (response.data.user) {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({
        ...storedUser,
        name: response.data.user.name
      }));
    }
    
    return response.data;
  },

  /**
   * Change password
   * @param {ChangePasswordParams} data - Password change data
   * @returns {Promise<Object>} Response from server
   */
  changePassword: async (data) => {
    const response = await api.patch('/auth/changePassword', data);
    return response.data;
  },

  /**
   * Get stored user from localStorage
   * @returns {Object|null} User object or null if not found
   */
  getStoredUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  },

  /**
   * Check if user is authenticated
   * @returns {boolean} True if authenticated, false otherwise
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  /**
   * Check if token is valid
   * @returns {Promise<boolean>} True if token is valid, false otherwise
   */
  verifyToken: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return false;
      }
      
      // Set the token in the headers
      setAuthToken(token);
      
      // Make a request to verify the token
      const res = await api.get('/api/v1/auth/me');
      return !!res.data.data.user;
    } catch (error) {
      console.error('Token verification error:', error);
      return false;
    }
  },

  /**
   * Refresh auth token
   * @returns {Promise<boolean>} True if token is refreshed, false otherwise
   */
  refreshToken: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return false;
      }
      
      // Set the token in the headers
      setAuthToken(token);
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }
};

export default authService; 