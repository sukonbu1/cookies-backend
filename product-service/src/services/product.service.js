const Product = require('../models/product.model');

const ProductService = {
  findAll: (filters, pagination) => Product.findAll(filters, pagination),
  findById: (id) => Product.findById(id),
  create: (data) => Product.create(data),
  update: (id, data) => Product.update(id, data),
  delete: (id) => Product.delete(id),
  updateStatus: (id, status) => Product.updateStatus(id, status),
  updateStockQuantity: (id, stock_quantity) => Product.updateStockQuantity(id, stock_quantity)
};

module.exports = ProductService; 