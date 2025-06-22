const Category = require('../models/category.model');
const slugify = require('slugify');

class CategoryController {
  async getAllCategories(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      const filters = {};
      if (req.query.parent_id !== undefined) {
        filters.parent_id = req.query.parent_id === 'null' ? null : req.query.parent_id;
      }
      if (req.query.is_active !== undefined) {
        filters.is_active = req.query.is_active === 'true';
      }
      if (req.query.search) {
        filters.search = req.query.search;
      }

      const pagination = { page, limit };
      const result = await Category.findAll(filters, pagination);

      res.json({
        status: 'success',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategoryById(req, res, next) {
    try {
      const category = await Category.findById(req.params.id);
      if (!category) {
        return res.status(404).json({
          status: 'error',
          message: 'Category not found'
        });
      }
      res.json({
        status: 'success',
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  async createCategory(req, res, next) {
    try {
      const categoryData = {
        ...req.body,
        slug: slugify(req.body.name, { lower: true })
      };

      const category = await Category.create(categoryData);
      res.status(201).json({
        status: 'success',
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req, res, next) {
    try {
      const category = await Category.findById(req.params.id);
      if (!category) {
        return res.status(404).json({
          status: 'error',
          message: 'Category not found'
        });
      }

      const updateData = {
        ...req.body,
        slug: req.body.name ? slugify(req.body.name, { lower: true }) : category.slug
      };

      const updatedCategory = await Category.update(req.params.id, updateData);

      res.json({
        status: 'success',
        data: updatedCategory
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req, res, next) {
    try {
      const success = await Category.delete(req.params.id);
      if (!success) {
        return res.status(404).json({
          status: 'error',
          message: 'Category not found'
        });
      }
      res.json({
        status: 'success',
        message: 'Category deleted successfully'
      });
    } catch (error) {
      if (error.message.includes('Cannot delete category')) {
        return res.status(400).json({
          status: 'error',
          message: error.message
        });
      }
      next(error);
    }
  }

  async getRootCategories(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const pagination = { page, limit };
      
      const result = await Category.getRootCategories(pagination);
      res.json({
        status: 'success',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  async getSubcategories(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const pagination = { page, limit };
      
      const result = await Category.getSubcategories(req.params.parentId, pagination);
      res.json({
        status: 'success',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  async searchCategories(req, res, next) {
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
      
      const result = await Category.searchCategories(q, pagination);
      res.json({
        status: 'success',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CategoryController(); 