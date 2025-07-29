const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const shippingAddressController = require('../controllers/shippingAddress.controller');
const { validateRequest } = require('../middleware/validation.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const ShippingAddress = require('../models/shippingAddress.model');


const updateUserSchema = [
  body('username').optional().trim().isLength({ min: 3, max: 50 }),
  body('phone_number').optional().isMobilePhone(),
  body('bio').optional().trim().isLength({ max: 500 }),
  body('country').optional().trim(),
  body('city').optional().trim()
];


// Search endpoint
router.get('/search', userController.searchUsers);

// Shipping address routes
router.get('/shipping-address', authenticate, shippingAddressController.getShippingAddress);
router.put('/shipping-address', authenticate, shippingAddressController.updateShippingAddress);
router.post('/shipping-address', authenticate, shippingAddressController.createShippingAddress);

// User routes
router.get('/me', authenticate, userController.getMe);
router.get('/:userId', authenticate, userController.getUserById);
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
router.post('/logout', userController.logout);

module.exports = router;