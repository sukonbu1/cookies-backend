const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const reviewController = require('../controllers/review.controller');
const authMiddleware = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validation.middleware');

// Validation middleware
const createReviewValidation = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('title')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters'),
  body('content')
    .optional()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Content must be between 1 and 2000 characters'),
  body('media_urls')
    .optional()
    .isArray()
    .withMessage('Media URLs must be an array'),
  body('is_verified_purchase')
    .optional()
    .isBoolean()
    .withMessage('is_verified_purchase must be a boolean'),
  validateRequest
];

const updateReviewValidation = [
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('title')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters'),
  body('content')
    .optional()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Content must be between 1 and 2000 characters'),
  body('media_urls')
    .optional()
    .isArray()
    .withMessage('Media URLs must be an array'),
  validateRequest
];

const idValidation = [
  param('reviewId').isUUID().withMessage('Invalid review ID'),
  validateRequest
];

const productIdValidation = [
  param('productId').isUUID().withMessage('Invalid product ID'),
  validateRequest
];

const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  validateRequest
];

// Public routes
router.get('/product/:productId', productIdValidation, paginationValidation, reviewController.getProductReviews);
router.get('/product/:productId/stats', productIdValidation, reviewController.getProductRatingStats);
router.get('/:reviewId', idValidation, reviewController.getReviewById);

// Protected routes (require authentication)
router.post('/product/:productId', authMiddleware.verifyToken, productIdValidation, createReviewValidation, reviewController.createReview);
router.get('/user/me', authMiddleware.verifyToken, paginationValidation, reviewController.getUserReviews);
router.put('/:reviewId', authMiddleware.verifyToken, idValidation, updateReviewValidation, reviewController.updateReview);
router.delete('/:reviewId', authMiddleware.verifyToken, idValidation, reviewController.deleteReview);

// Like/Unlike routes
router.post('/:reviewId/like', authMiddleware.verifyToken, idValidation, reviewController.likeReview);
router.delete('/:reviewId/like', authMiddleware.verifyToken, idValidation, reviewController.unlikeReview);

// Admin routes (for moderation)
router.patch('/:reviewId/approve', authMiddleware.verifyToken, idValidation, reviewController.approveReview);
router.patch('/:reviewId/reject', authMiddleware.verifyToken, idValidation, reviewController.rejectReview);

module.exports = router; 