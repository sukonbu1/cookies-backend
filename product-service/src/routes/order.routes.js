const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const orderController = require('../controllers/order.controller');
const authMiddleware = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validation.middleware');

// Validation for creating an order
const createOrderValidation = [
  body('items').isArray({ min: 1 }).withMessage('Items must be a non-empty array'),
  body('items.*.product_id').isUUID().withMessage('Invalid product ID in items'),
  body('items.*.quantity').isInt({ gt: 0 }).withMessage('Item quantity must be a positive integer'),
  validateRequest
];

// Validation for a UUID in the URL path
const idValidation = [
  param('id').isUUID().withMessage('Invalid order ID'),
  validateRequest
];

// All order routes require a valid token
router.use(authMiddleware.verifyToken);

// Routes
router.post('/', createOrderValidation, orderController.createOrder);
router.get('/', orderController.getAllOrders);
router.get('/user', orderController.getOrdersByUser);
router.get('/shop/:shopId', orderController.getOrdersByShop);
router.get('/:id', idValidation, orderController.getOrderById);
router.put('/:id', idValidation, orderController.updateOrder);
router.delete('/:id', idValidation, orderController.deleteOrder);

module.exports = router; 