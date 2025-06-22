const Product = require('../models/product.model');
const ProductImage = require('../models/productImage.model');
const ProductVariant = require('../models/productVariant.model');
const slugify = require('slugify');
const { v4: uuidv4 } = require('uuid');

class ProductController {
  async getAllProducts(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      const filters = {};
      if (req.query.status) filters.status = req.query.status;
      if (req.query.shop_id) filters.shop_id = req.query.shop_id;
      if (req.query.category_id) filters.category_id = req.query.category_id;
      if (req.query.search) filters.search = req.query.search;
      if (req.query.is_featured !== undefined) filters.is_featured = req.query.is_featured === 'true';

      const pagination = { page, limit };
      const result = await Product.findAll(filters, pagination);

      res.json({
        status: 'success',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductById(req, res, next) {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({
          status: 'error',
          message: 'Product not found'
        });
      }
      res.json({
        status: 'success',
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  async createProduct(req, res, next) {
    try {
      const productData = {
        ...req.body,
        slug: slugify(req.body.name, { lower: true })
      };

      const product = await Product.create(productData);
      res.status(201).json({
        status: 'success',
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req, res, next) {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({
          status: 'error',
          message: 'Product not found'
        });
      }

      const updateData = {
        ...req.body,
        slug: req.body.name ? slugify(req.body.name, { lower: true }) : product.slug
      };

      const updatedProduct = await Product.update(req.params.id, updateData);

      res.json({
        status: 'success',
        data: updatedProduct
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req, res, next) {
    try {
      const success = await Product.delete(req.params.id);
      if (!success) {
        return res.status(404).json({
          status: 'error',
          message: 'Product not found'
        });
      }
      res.json({
        status: 'success',
        message: 'Product deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductsByShop(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const pagination = { page, limit };
      
      const result = await Product.findByShopId(req.params.shopId, pagination);
      res.json({
        status: 'success',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductsByCategory(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const pagination = { page, limit };
      
      const result = await Product.findByCategoryId(req.params.categoryId, pagination);
      res.json({
        status: 'success',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  async searchProducts(req, res, next) {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({
          status: 'error',
          message: 'Search query is required'
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const pagination = { page, limit };
      
      const result = await Product.searchProducts(q, pagination);
      res.json({
        status: 'success',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  async getFeaturedProducts(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const pagination = { page, limit };
      
      const result = await Product.getFeaturedProducts(pagination);
      res.json({
        status: 'success',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProductStatus(req, res, next) {
    try {
      const { status } = req.body;
      const product = await Product.updateStatus(req.params.id, status);

      if (!product) {
        return res.status(404).json({
          status: 'error',
          message: 'Product not found'
        });
      }

      res.json({
        status: 'success',
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProductStock(req, res, next) {
    try {
      const { stock_quantity } = req.body;
      const product = await Product.updateStockQuantity(req.params.id, stock_quantity);

      if (!product) {
        return res.status(404).json({
          status: 'error',
          message: 'Product not found'
        });
      }

      res.json({
        status: 'success',
        data: product
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController(); 