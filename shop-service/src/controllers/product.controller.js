const ProductService = require('../services/product.service');

class ProductController {
  async getProductsByShop(req, res, next) {
    try {
      const { shopId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const filters = {};
      
      // Add filters from query parameters
      if (req.query.category_id) filters.category_id = req.query.category_id;
      if (req.query.status) filters.status = req.query.status;
      if (req.query.min_price) filters.min_price = req.query.min_price;
      if (req.query.max_price) filters.max_price = req.query.max_price;
      if (req.query.search) filters.search = req.query.search;
      
      const products = await ProductService.getProductsByShop(shopId, filters, { page, limit });
      res.json({ status: 'success', data: products });
    } catch (error) {
      next(error);
    }
  }

  async getProductById(req, res, next) {
    try {
      const { productId } = req.params;
      const product = await ProductService.getProductById(productId);
      if (!product) {
        return res.status(404).json({ status: 'error', message: 'Product not found' });
      }
      res.json({ status: 'success', data: product });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController(); 