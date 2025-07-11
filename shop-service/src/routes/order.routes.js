const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const orderController = require('../controllers/order.controller');
const authMiddleware = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validation.middleware');

// Validation middleware
const orderValidation = [
  body('total_amount').isNumeric().withMessage('Total amount must be a number'),
  validateRequest
];

const idValidation = [
  param('id').isUUID().withMessage('Invalid order ID'),
  validateRequest
];

const shopIdValidation = [
  param('shopId').isUUID().withMessage('Invalid shop ID'),
  validateRequest
];

// Routes
router.get('/', authMiddleware.verifyToken, orderController.getAllOrders);
router.post('/', authMiddleware.verifyToken, orderValidation, orderController.createOrder);
router.get('/shop/:shopId', authMiddleware.verifyToken, shopIdValidation, orderController.getOrdersByShop);
router.get('/:id', authMiddleware.verifyToken, idValidation, orderController.getOrderById);
router.put('/:id', authMiddleware.verifyToken, idValidation.concat(orderValidation), orderController.updateOrder);
router.delete('/:id', authMiddleware.verifyToken, idValidation, orderController.deleteOrder);

module.exports = router; 