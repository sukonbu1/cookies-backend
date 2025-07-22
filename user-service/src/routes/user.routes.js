const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const { validateRequest } = require('../middleware/validation.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const User = require('../models/user.model');
const ShippingAddress = require('../models/shippingAddress.model');

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


// Follow/unfollow endpoints
router.post('/:id/follow', authenticate, userController.followUser);
router.delete('/:id/follow', authenticate, userController.unfollowUser);
// List followers/following
router.get('/:id/followers', userController.getFollowers);
router.get('/:id/following', userController.getFollowing);

router.post('/email-by-username', userController.getEmailByUsername);

router.post('/google-auth', userController.googleAuth);

// Get the authenticated user's shipping address
router.get('/shipping-address', authenticate, async (req, res) => {
  const user_id = req.user.user_id;
  const address = await ShippingAddress.findByUserId(user_id);
  if (!address) {
    return res.status(404).json({ status: 'error', message: 'Shipping address not found' });
  }
  res.json({ status: 'success', data: address });
});

// Update the authenticated user's shipping address
router.put('/shipping-address', authenticate, async (req, res) => {
  const user_id = req.user.user_id;
  const updateData = { ...req.body };
  const address = await ShippingAddress.updateByUserId(user_id, updateData);
  res.json({ status: 'success', data: address });
});

// Create the authenticated user's shipping address if not exists
router.post('/shipping-address', authenticate, async (req, res) => {
  const user_id = req.user.user_id;
  const existing = await ShippingAddress.findByUserId(user_id);
  if (existing) {
    return res.status(400).json({ status: 'error', message: 'Shipping address already exists' });
  }
  const addressData = { ...req.body, user_id };
  const address = await ShippingAddress.create(addressData);
  res.status(201).json({ status: 'success', data: address });
});

module.exports = router;