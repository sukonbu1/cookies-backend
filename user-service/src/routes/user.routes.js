const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const { validateRequest } = require('../middleware/validation.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const User = require('../models/user.model');

// Validation schemas
const registerSchema = [
  body('username').trim().isLength({ min: 3, max: 50 }),
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
  body('email').isEmail(),
  body('password').isLength({ min: 6 })
];

const updateUserSchema = [
  body('username').optional().trim().isLength({ min: 3, max: 50 }),
  body('phone_number').optional().isMobilePhone(),
  body('bio').optional().trim().isLength({ max: 500 }),
  body('country').optional().trim(),
  body('city').optional().trim()
];

// Auth routes
router.post('/register', registerSchema, validateRequest, userController.register);
router.post('/login', loginSchema, validateRequest, userController.login);
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

// User routes
router.get('/me', authenticate, userController.getMe);
router.get('/:userId', authenticate, userController.getUser);
router.put('/:userId', authenticate, updateUserSchema, validateRequest, userController.updateUser);
router.delete('/:userId', authenticate, userController.deleteUser);
router.get('/:userId/posts', authenticate, userController.getUserPosts);
router.get('/:userId/followers', authenticate, userController.getUserFollowers);
router.get('/:userId/following', authenticate, userController.getUserFollowing);

// Avatar routes
router.post('/:userId/avatar', authenticate, upload.single('avatar'), async (req, res, next) => {
  try {
    const avatarUrl = req.file.path; // Cloudinary's secure_url
    const user = await require('../models/user.model').updateProfilePicture(req.params.userId, avatarUrl);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ avatar_url: avatarUrl });
  } catch (err) {
    next(err);
  }
});

module.exports = router; 