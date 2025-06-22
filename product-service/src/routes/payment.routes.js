const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const paymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validation.middleware');

// Validation for creating a payment
const createPaymentValidation = [
  body('order_id').isUUID().withMessage('Order ID is required and must be a UUID'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
  body('payment_method').notEmpty().withMessage('Payment method is required'),
  validateRequest
];

// Validation for a UUID in the URL path
const idValidation = [
  param('id').isUUID().withMessage('Invalid payment ID'),
  validateRequest
];

const orderIdValidation = [
  param('orderId').isUUID().withMessage('Invalid order ID'),
  validateRequest
];

// All payment routes require a valid token
router.use(authMiddleware.verifyToken);

// Routes
router.post('/', createPaymentValidation, paymentController.createPayment);
router.get('/order/:orderId', orderIdValidation, paymentController.getPaymentsByOrderId);
router.get('/:id', idValidation, paymentController.getPaymentById);

module.exports = router; 