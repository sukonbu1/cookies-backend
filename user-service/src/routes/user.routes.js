const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const { validateRequest } = require('../middleware/validation.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const User = require('../models/user.model');

// Validation schemas
const registerSchema = [
  body('username').optional().trim().isLength({ min: 3, max: 50 }),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('phone_number').optional().isMobilePhone(),
  body('bio').optional().trim().isLength({ max: 500 }),
  body('date_of_birth').optional().isDate(),
  body('gender').optional().isIn(['male', 'female', 'other']),
  body('country').optional().trim(),
  body('city').optional().trim()
];

const loginSchema = [
  body('email').optional().isEmail(),
  body('username').optional().trim().isLength({ min: 3, max: 50 }),
  body('password').isLength({ min: 6 }),
  body().custom((value, { req }) => {
    if (!value.email && !value.username) {
      throw new Error('Either email or username is required');
    }
    return true;
  })
];

const updateUserSchema = [
  body('username').optional().trim().isLength({ min: 3, max: 50 }),
  body('phone_number').optional().isMobilePhone(),
  body('bio').optional().trim().isLength({ max: 500 }),
  body('country').optional().trim(),
  body('city').optional().trim()
];

// Auth routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/auth/google', userController.googleAuth);
router.post('/logout', authenticate, userController.logout);

// Test endpoint for debugging
router.get('/test-auth', (req, res) => {
  console.log('Test auth endpoint called');
  console.log('Cookies:', req.cookies);
  console.log('Headers:', {
    authorization: req.headers.authorization,
    cookie: req.headers.cookie,
    origin: req.headers.origin
  });
  res.json({ 
    message: 'Test endpoint working',
    cookies: req.cookies,
    hasToken: !!(req.cookies.token || req.headers.authorization)
  });
});

// Search endpoint
router.get('/search', userController.searchUsers);

// User routes
router.get('/me', authenticate, userController.getMe);
router.get('/:userId', userController.getUserById);
router.put('/:userId', authenticate, updateUserSchema, validateRequest, userController.updateUser);
router.delete('/:userId', authenticate, userController.deleteUser);
router.get('/:userId/posts', authenticate, userController.getUserPosts);

// Avatar upload route removed; avatars are now set via URL in updateUser

// Follow/unfollow endpoints
router.post('/:id/follow', authenticate, userController.followUser);
router.delete('/:id/follow', authenticate, userController.unfollowUser);
// List followers/following
router.get('/:id/followers', userController.getFollowers);
router.get('/:id/following', userController.getFollowing);

router.post('/email-by-username', userController.getEmailByUsername);

router.post('/google-auth', userController.googleAuth);

module.exports = router; 