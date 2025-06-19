const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const paymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validation.middleware');

// Validation middleware
const paymentValidation = [
  body('order_id').notEmpty().withMessage('Order ID is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('payment_method').notEmpty().withMessage('Payment method is required'),
  validateRequest
];

const idValidation = [
  param('id').isUUID().withMessage('Invalid payment ID'),
  validateRequest
];

// Routes
router.get('/', authMiddleware.verifyToken, paymentController.getAllPayments);
router.get('/:id', authMiddleware.verifyToken, idValidation, paymentController.getPaymentById);
router.post('/', authMiddleware.verifyToken, paymentValidation, paymentController.createPayment);

module.exports = router; 