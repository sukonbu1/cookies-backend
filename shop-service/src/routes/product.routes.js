const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
const productController = require('../controllers/product.controller');
const authMiddleware = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validation.middleware');

// Validation middleware
const shopIdValidation = [
  param('shopId').isUUID().withMessage('Invalid shop ID'),
  validateRequest
];

const productIdValidation = [
  param('productId').isUUID().withMessage('Invalid product ID'),
  validateRequest
];

// Routes
router.get('/shop/:shopId', authMiddleware.verifyToken, shopIdValidation, productController.getProductsByShop);
router.get('/:productId', authMiddleware.verifyToken, productIdValidation, productController.getProductById);

module.exports = router; 