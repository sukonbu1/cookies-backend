const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const shopController = require('../controllers/shop.controller');
const authMiddleware = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validation.middleware');

// Validation middleware
const shopValidation = [
  body('name').trim().notEmpty().withMessage('Shop name is required'),
  body('contact_email').optional().isEmail().withMessage('Invalid email'),
  body('contact_phone').optional().isString(),
  body('address').optional().isString(),
  body('city').optional().isString(),
  body('country').optional().isString(),
  body('postal_code').optional().isString(),
  body('business_registration').optional().isString(),
  body('status').optional().isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status value'),
  validateRequest
];

const idValidation = [
  param('id').isUUID().withMessage('Invalid shop ID'),
  validateRequest
];

const statusValidation = [
  param('id').isUUID().withMessage('Invalid shop ID'),
  body('status').isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status value'),
  validateRequest
];

// Routes
router.get('/', shopController.getAllShops);
router.post('/', authMiddleware.verifyToken, shopValidation, shopController.createShop);
router.get('/:id', idValidation, shopController.getShopById);
router.put('/:id', authMiddleware.verifyToken, idValidation.concat(shopValidation), shopController.updateShop);
router.delete('/:id', authMiddleware.verifyToken, idValidation, shopController.deleteShop);
router.patch('/:id/status', authMiddleware.verifyToken, statusValidation, shopController.updateShopStatus);


module.exports = router; 