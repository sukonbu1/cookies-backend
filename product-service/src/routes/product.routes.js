const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const productController = require('../controllers/product.controller');
const authMiddleware = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validation.middleware');

// Validation middleware
const productValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('description').optional().isString(),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('shop_id').notEmpty().withMessage('Shop ID is required'),
  body('stock_quantity').optional().isInt({ min: 0 }).withMessage('Stock quantity must be a positive integer'),
  body('sku').optional().isString(),
  body('status').optional().isIn(['active', 'inactive', 'out_of_stock', 'discontinued']).withMessage('Invalid status value'),
  body('condition_status').optional().isIn(['new', 'used', 'refurbished']).withMessage('Invalid condition value'),
  validateRequest
];

const idValidation = [
  param('id').isUUID().withMessage('Invalid product ID'),
  validateRequest
];

const shopIdValidation = [
  param('shopId').isUUID().withMessage('Invalid shop ID'),
  validateRequest
];

const categoryIdValidation = [
  param('categoryId').isUUID().withMessage('Invalid category ID'),
  validateRequest
];

const searchValidation = [
  query('q').notEmpty().withMessage('Search query is required'),
  validateRequest
];

// Public routes
router.get('/', productController.getAllProducts);
router.get('/search', searchValidation, productController.searchProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/shop/:shopId', shopIdValidation, productController.getProductsByShop);
router.get('/category/:categoryId', categoryIdValidation, productController.getProductsByCategory);
router.get('/:id', idValidation, productController.getProductById);

// Protected routes (require authentication)
router.post('/', authMiddleware.verifyToken, productValidation, productController.createProduct);
router.put('/:id', authMiddleware.verifyToken, idValidation.concat(productValidation), productController.updateProduct);
router.delete('/:id', authMiddleware.verifyToken, idValidation, productController.deleteProduct);
router.patch('/:id/status', authMiddleware.verifyToken, idValidation, [
  body('status').isIn(['active', 'inactive', 'out_of_stock', 'discontinued']).withMessage('Invalid status value'),
  validateRequest
], productController.updateProductStatus);
router.patch('/:id/stock', authMiddleware.verifyToken, idValidation, [
  body('stock_quantity').isInt({ min: 0 }).withMessage('Stock quantity must be a positive integer'),
  validateRequest
], productController.updateProductStock);

module.exports = router; 