const ProductVariant = require('../models/productVariant.model');

const ProductVariantService = {
  findByProductId: (product_id) => ProductVariant.findByProductId(product_id),
  findById: (variant_id) => ProductVariant.findById(variant_id),
  create: (data) => ProductVariant.create(data),
  update: (variant_id, data) => ProductVariant.update(variant_id, data),
  delete: (variant_id) => ProductVariant.delete(variant_id),
  updateStock: (variant_id, stock_quantity) => ProductVariant.updateStock(variant_id, stock_quantity)
};

module.exports = ProductVariantService; 