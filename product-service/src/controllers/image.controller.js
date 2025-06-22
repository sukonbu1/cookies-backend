const ProductImage = require('../models/productImage.model');
const upload = require('../middleware/uploadMiddleware');

class ImageController {
  async uploadImage(req, res, next) {
    try {
      const { productId } = req.params;
      const files = req.files;

      if (!files || files.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'No files uploaded'
        });
      }

      const uploadedImages = [];

      for (const file of files) {
        const imageData = {
          product_id: productId,
          image_url: file.path, // Cloudinary URL
          thumbnail_url: file.path, // You can generate thumbnail URL if needed
          alt_text: req.body.alt_text || file.originalname,
          position: req.body.position || 0,
          is_primary: req.body.is_primary === 'true' || false
        };

        const image = await ProductImage.create(imageData);
        uploadedImages.push(image);
      }

      res.status(201).json({
        status: 'success',
        data: uploadedImages
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductImages(req, res, next) {
    try {
      const { productId } = req.params;
      const images = await ProductImage.findByProductId(productId);

      res.json({
        status: 'success',
        data: images
      });
    } catch (error) {
      next(error);
    }
  }

  async getImageById(req, res, next) {
    try {
      const image = await ProductImage.findById(req.params.imageId);
      if (!image) {
        return res.status(404).json({
          status: 'error',
          message: 'Image not found'
        });
      }

      res.json({
        status: 'success',
        data: image
      });
    } catch (error) {
      next(error);
    }
  }

  async updateImage(req, res, next) {
    try {
      const { imageId } = req.params;
      const updateData = req.body;

      const image = await ProductImage.update(imageId, updateData);
      if (!image) {
        return res.status(404).json({
          status: 'error',
          message: 'Image not found'
        });
      }

      res.json({
        status: 'success',
        data: image
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteImage(req, res, next) {
    try {
      const { imageId } = req.params;
      const success = await ProductImage.delete(imageId);

      if (!success) {
        return res.status(404).json({
          status: 'error',
          message: 'Image not found'
        });
      }

      res.json({
        status: 'success',
        message: 'Image deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async setPrimaryImage(req, res, next) {
    try {
      const { productId, imageId } = req.params;
      const image = await ProductImage.setPrimaryImage(productId, imageId);

      if (!image) {
        return res.status(404).json({
          status: 'error',
          message: 'Image not found'
        });
      }

      res.json({
        status: 'success',
        data: image
      });
    } catch (error) {
      next(error);
    }
  }

  async updateImagePosition(req, res, next) {
    try {
      const { imageId } = req.params;
      const { position } = req.body;

      if (typeof position !== 'number' || position < 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Position must be a non-negative number'
        });
      }

      const image = await ProductImage.updatePosition(imageId, position);
      if (!image) {
        return res.status(404).json({
          status: 'error',
          message: 'Image not found'
        });
      }

      res.json({
        status: 'success',
        data: image
      });
    } catch (error) {
      next(error);
    }
  }

  async reorderImages(req, res, next) {
    try {
      const { productId } = req.params;
      const { imageOrder } = req.body;

      if (!Array.isArray(imageOrder)) {
        return res.status(400).json({
          status: 'error',
          message: 'imageOrder must be an array'
        });
      }

      await ProductImage.reorderImages(productId, imageOrder);

      res.json({
        status: 'success',
        message: 'Images reordered successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ImageController(); 