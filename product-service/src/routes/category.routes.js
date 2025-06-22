const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const categoryController = require('../controllers/category.controller');
const authMiddleware = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validation.middleware');

// Validation middleware
const categoryValidation = [
  body('name').trim().notEmpty().withMessage('Category name is required'),
  body('description').optional().isString(),
  body('parent_id').optional().isUUID().withMessage('Invalid parent category ID'),
  body('image_url').optional().isURL().withMessage('Invalid image URL'),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean'),
  body('sort_order').optional().isInt({ min: 0 }).withMessage('Sort order must be a positive integer'),
  validateRequest
];

const idValidation = [
  param('id').isUUID().withMessage('Invalid category ID'),
  validateRequest
];

const parentIdValidation = [
  param('parentId').isUUID().withMessage('Invalid parent category ID'),
  validateRequest
];

const searchValidation = [
  query('q').notEmpty().withMessage('Search query is required'),
  validateRequest
];

// Public routes
router.get('/', categoryController.getAllCategories);
router.get('/search', searchValidation, categoryController.searchCategories);
router.get('/root', categoryController.getRootCategories);
router.get('/subcategories/:parentId', parentIdValidation, categoryController.getSubcategories);
router.get('/:id', idValidation, categoryController.getCategoryById);

// Protected routes (require authentication)
router.post('/', authMiddleware.verifyToken, categoryValidation, categoryController.createCategory);
router.put('/:id', authMiddleware.verifyToken, idValidation.concat(categoryValidation), categoryController.updateCategory);
router.delete('/:id', authMiddleware.verifyToken, idValidation, categoryController.deleteCategory);

module.exports = router; 