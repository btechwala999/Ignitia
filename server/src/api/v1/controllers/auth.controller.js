const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const logger = require('../../../utils/logger');
const { AppError } = require('../middlewares/errorHandler');

// Helper function to generate tokens
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '7d',
  });
};

// Helper function to send token response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = generateToken(user._id);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
  });
};

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('Email already in use', 400));
    }

    // Create new user with plain text password and always set role to "teacher"
    const user = await User.create({
      name,
      email,
      password, // plain text password
      role: 'teacher', // Always set to teacher regardless of what was sent
    });

    // Send token response
    sendTokenResponse(user, 201, res);
  } catch (error) {
    logger.error('Registration error:', error);
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    // Find user by email
    const user = await User.findOne({ email });

    // Check if user exists
    if (!user) {
      return next(new AppError('User not found. Please register first.', 401));
    }

    // Check if password matches (using plain text comparison)
    if (!user.comparePassword(password)) {
      return next(new AppError('Invalid password', 401));
    }

    // Send token response
    sendTokenResponse(user, 200, res);
  } catch (error) {
    logger.error('Login error:', error);
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          stats: user.stats
        }
      }
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    next(error);
  }
};

// @desc    Update user profile
// @route   PATCH /api/v1/auth/updateProfile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    // Allow updates only to name field for security
    const { name } = req.body;
    
    if (!name) {
      return next(new AppError('Please provide a name', 400));
    }
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { name },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    next(error);
  }
};

// @desc    Check server status
// @route   GET /api/v1/auth/status
// @access  Public
exports.getStatus = (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date()
  });
}; 