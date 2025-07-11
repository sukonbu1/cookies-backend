const axios = require('axios');

class ProductService {
  static async getProductsByShop(shopId, filters = {}, pagination = {}) {
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      
      const queryParams = new URLSearchParams({
        shop_id: shopId,
        page: page.toString(),
        limit: limit.toString()
      });
      
      // Add filters to query params
      if (filters.category_id) queryParams.append('category_id', filters.category_id);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.min_price) queryParams.append('min_price', filters.min_price);
      if (filters.max_price) queryParams.append('max_price', filters.max_price);
      if (filters.search) queryParams.append('search', filters.search);
      
      const response = await axios.get(
        `${process.env.PRODUCT_SERVICE_URL}/api/products/shop/${shopId}?${queryParams.toString()}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error fetching products by shop:', error.message);
      throw new Error('Failed to fetch products from product service');
    }
  }

  static async getProductById(productId) {
    try {
      const response = await axios.get(
        `${process.env.PRODUCT_SERVICE_URL}/api/products/${productId}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error fetching product by ID:', error.message);
      throw new Error('Failed to fetch product from product service');
    }
  }
}

module.exports = ProductService; 