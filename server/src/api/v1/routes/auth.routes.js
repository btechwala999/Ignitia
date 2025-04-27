const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// Public routes
router.get('/status', authController.getStatus);

router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
  ],
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  authController.login
);

// Protected routes - require authentication
router.get('/me', protect, authController.getMe);
router.patch(
  '/updateProfile',
  protect,
  [body('name').notEmpty().withMessage('Name is required')],
  authController.updateProfile
);

module.exports = router; 