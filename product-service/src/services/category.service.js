const Category = require('../models/category.model');

const CategoryService = {
  getAllCategories: () => Category.findAll(),
  getCategoryById: (id) => Category.findById(id),
  createCategory: (data) => Category.create(data),
  updateCategory: (id, data) => Category.update(id, data),
  deleteCategory: (id) => Category.delete(id),
  getSubcategories: (parentId) => Category.findSubcategories(parentId),
  updateCategoryStatus: (id, status) => Category.updateStatus(id, status)
};

module.exports = CategoryService; 