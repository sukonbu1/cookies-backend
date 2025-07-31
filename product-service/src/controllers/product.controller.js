const Product = require('../models/product.model');
const ProductImage = require('../models/productImage.model');
const ProductVariant = require('../models/productVariant.model');
const slugify = require('slugify');
const { v4: uuidv4 } = require('uuid');
const ProductCategorization = require('../models/productCategorization.model');

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
      // Fetch variants for this product
      const variants = await ProductVariant.findByProductId(req.params.id);
      res.json({
        status: 'success',
        data: {
          ...product,
          variants
        }
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
      const images = req.body.images || [];
      const variants = req.body.variants || [];
      const category_id = req.body.category_id; // extract category_id
      delete productData.images;
      delete productData.variants;
      delete productData.category_id; // remove from productData
      const product = await Product.create(productData);
      // Save images if provided
      if (Array.isArray(images)) {
        // Filter out images without valid URLs
        const validImages = images.filter(img => 
          img && (img.url || img.image_url) && 
          typeof (img.url || img.image_url) === 'string' && 
          (img.url || img.image_url).trim() !== ''
        );
        
        for (const img of validImages) {
          const imageUrl = img.url || img.image_url;
          await ProductImage.create({
            product_id: product.product_id,
            image_url: imageUrl,
            thumbnail_url: img.thumbnail_url || imageUrl,
            alt_text: img.alt_text || null,
            position: img.position || 0,
            is_primary: img.is_primary || false
          });
        }
      }
      // Save variants if provided
      if (Array.isArray(variants)) {
        for (const variant of variants) {
          await ProductVariant.create({
            product_id: product.product_id,
            ...variant
          });
        }
      }
      // Insert into productcategorization if category_id is provided
      if (category_id) {
        await ProductCategorization.create({
          product_id: product.product_id,
          category_id,
          is_primary: true
        });
      }
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
      const images = req.body.images || [];
      const variants = req.body.variants || [];
      const category_id = req.body.category_id; // extract category_id
      delete updateData.images;
      delete updateData.variants;
      delete updateData.category_id; // remove from updateData
      const updatedProduct = await Product.update(req.params.id, updateData);
      // Optionally update images (add logic as needed)
      if (Array.isArray(images) && images.length > 0) {
        // Filter out images without valid URLs
        const validImages = images.filter(img => 
          img && (img.url || img.image_url) && 
          typeof (img.url || img.image_url) === 'string' && 
          (img.url || img.image_url).trim() !== ''
        );
        
        if (validImages.length > 0) {
          await ProductImage.deleteByProductId(req.params.id);
          for (const img of validImages) {
            const imageUrl = img.url || img.image_url;
            await ProductImage.create({
              product_id: req.params.id,
              image_url: imageUrl,
              thumbnail_url: img.thumbnail_url || imageUrl,
              alt_text: img.alt_text || null,
              position: img.position || 0,
              is_primary: img.is_primary || false
            });
          }
        }
      }
      if (Array.isArray(variants)) {
        // Smart variant update: update existing, create new, handle deletions carefully
        const existingVariants = await ProductVariant.findByProductId(req.params.id);
        const existingVariantIds = existingVariants.map(v => v.variant_id);
        
        // Track which variants are being updated/kept
        const variantsToKeep = [];
        
        for (const variant of variants) {
          if (variant.variant_id && existingVariantIds.includes(variant.variant_id)) {
            // Update existing variant
            await ProductVariant.update(variant.variant_id, {
              sku: variant.sku && variant.sku.trim() !== '' ? variant.sku : null,
              price: variant.price,
              sale_price: variant.sale_price || null,
              stock_quantity: variant.stock_quantity || 0,
              color: variant.color && variant.color.trim() !== '' ? variant.color : null,
              size: variant.size && variant.size.trim() !== '' ? variant.size : null,
              material: variant.material && variant.material.trim() !== '' ? variant.material : null,
              weight: variant.weight || null,
              weight_unit: variant.weight_unit || null,
              dimensions: variant.dimensions || null
            });
            variantsToKeep.push(variant.variant_id);
          } else {
            // Create new variant
            const newVariant = await ProductVariant.create({
              product_id: req.params.id,
              sku: variant.sku && variant.sku.trim() !== '' ? variant.sku : null,
              price: variant.price,
              sale_price: variant.sale_price || null,
              stock_quantity: variant.stock_quantity || 0,
              color: variant.color && variant.color.trim() !== '' ? variant.color : null,
              size: variant.size && variant.size.trim() !== '' ? variant.size : null,
              material: variant.material && variant.material.trim() !== '' ? variant.material : null,
              weight: variant.weight || null,
              weight_unit: variant.weight_unit || null,
              dimensions: variant.dimensions || null
            });
            variantsToKeep.push(newVariant.variant_id);
          }
        }
        
        // Only attempt to delete variants that are not being kept and not referenced by orders
        const variantsToDelete = existingVariants.filter(v => !variantsToKeep.includes(v.variant_id));
        for (const variant of variantsToDelete) {
          try {
            await ProductVariant.delete(variant.variant_id);
          } catch (error) {
            // If deletion fails due to foreign key constraint, log it but don't fail the whole update
            console.warn(`Could not delete variant ${variant.variant_id}: still referenced by orders`);
          }
        }
      }
      // Handle category update
      if (category_id !== undefined) {
        const existingCategorization = await ProductCategorization.findByProductId(req.params.id);
        if (category_id) {
          // Update or create categorization
          if (existingCategorization) {
            await ProductCategorization.updateByProductId(req.params.id, category_id);
          } else {
            await ProductCategorization.create({
              product_id: req.params.id,
              category_id,
              is_primary: true
            });
          }
        } else {
          // Remove categorization if category_id is null/empty
          if (existingCategorization) {
            await ProductCategorization.deleteByProductId(req.params.id);
          }
        }
      }
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