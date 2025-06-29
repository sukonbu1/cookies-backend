const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const imageController = require('../controllers/image.controller');
const authMiddleware = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validation.middleware');

// Validation middleware
const imageValidation = [
  body('alt_text').optional().isString(),
  body('position').optional().isInt({ min: 0 }).withMessage('Position must be a non-negative integer'),
  body('is_primary').optional().isBoolean().withMessage('is_primary must be a boolean'),
  validateRequest
];

const productIdValidation = [
  param('productId').isUUID().withMessage('Invalid product ID'),
  validateRequest
];

const imageIdValidation = [
  param('imageId').isUUID().withMessage('Invalid image ID'),
  validateRequest
];

const positionValidation = [
  body('position').isInt({ min: 0 }).withMessage('Position must be a non-negative integer'),
  validateRequest
];

const reorderValidation = [
  body('imageOrder').isArray().withMessage('imageOrder must be an array'),
  body('imageOrder.*').isUUID().withMessage('Each image ID must be a valid UUID'),
  validateRequest
];

// Public routes
router.get('/product/:productId', productIdValidation, imageController.getProductImages);
router.get('/:imageId', imageIdValidation, imageController.getImageById);

// Protected routes (require authentication)
router.post('/product/:productId', 
  authMiddleware.verifyToken, 
  productIdValidation,
  imageValidation,
  imageController.uploadImage
);

router.put('/:imageId', 
  authMiddleware.verifyToken, 
  imageIdValidation,
  imageValidation,
  imageController.updateImage
);

router.delete('/:imageId', 
  authMiddleware.verifyToken, 
  imageIdValidation,
  imageController.deleteImage
);

router.patch('/product/:productId/primary/:imageId', 
  authMiddleware.verifyToken, 
  productIdValidation,
  imageIdValidation,
  imageController.setPrimaryImage
);

router.patch('/:imageId/position', 
  authMiddleware.verifyToken, 
  imageIdValidation,
  positionValidation,
  imageController.updateImagePosition
);

router.patch('/product/:productId/reorder', 
  authMiddleware.verifyToken, 
  productIdValidation,
  reorderValidation,
  imageController.reorderImages
);

module.exports = router; 