const pool = require('../../../common/src/config/database');
const { v4: uuidv4 } = require('uuid');

class Product {
  static async create(productData) {
    const query = `
      INSERT INTO "products" (
        product_id, shop_id, name, slug, description, price, sale_price, currency,
        stock_quantity, sku, weight, weight_unit, dimensions, condition_status, is_featured,
        rating, total_reviews, total_sales, status, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    const values = [
      uuidv4(),
      productData.shop_id,
      productData.name,
      productData.slug,
      productData.description,
      productData.price,
      productData.sale_price || null,
      productData.currency || 'USD',
      productData.stock_quantity || 0,
      productData.sku,
      productData.weight || null,
      productData.weight_unit || null,
      productData.dimensions || null,
      productData.condition_status || 'new',
      productData.is_featured || false,
      productData.rating || 0,
      productData.total_reviews || 0,
      productData.total_sales || 0,
      productData.status || 'active'
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async findById(productId) {
    const query = `
      SELECT p.*, 
             COALESCE(
               json_agg(
                 json_build_object(
                   'image_id', pi.image_id,
                   'image_url', pi.image_url,
                   'thumbnail_url', pi.thumbnail_url,
                   'alt_text', pi.alt_text,
                   'position', pi.position,
                   'is_primary', pi.is_primary
                 )
               ) FILTER (WHERE pi.image_id IS NOT NULL),
               '[]'
             ) as images,
             COALESCE(
               json_agg(
                 DISTINCT jsonb_build_object(
                   'category_id', pc.category_id,
                   'name', c.name
                 )
               ) FILTER (WHERE pc.category_id IS NOT NULL),
               '[]'
             ) as categories
      FROM "products" p
      LEFT JOIN "productimages" pi ON p.product_id = pi.product_id
      LEFT JOIN "productcategorization" pc ON p.product_id = pc.product_id
      LEFT JOIN "productcategories" c ON pc.category_id = c.category_id
      WHERE p.product_id = $1
      GROUP BY p.product_id
    `;
    
    const { rows } = await pool.query(query, [productId]);
    return rows[0] || null;
  }

  static async findAll(filters = {}, pagination = {}) {
    let query = `
      SELECT p.*, 
             COALESCE(
               json_agg(
                 json_build_object(
                   'image_id', pi.image_id,
                   'image_url', pi.image_url,
                   'thumbnail_url', pi.thumbnail_url,
                   'alt_text', pi.alt_text,
                   'position', pi.position,
                   'is_primary', pi.is_primary
                 )
               ) FILTER (WHERE pi.image_id IS NOT NULL),
               '[]'
             ) as images,
             COALESCE(
               json_agg(
                 DISTINCT jsonb_build_object(
                   'category_id', pc.category_id,
                   'name', c.name
                 )
               ) FILTER (WHERE pc.category_id IS NOT NULL),
               '[]'
             ) as categories
      FROM "products" p
      LEFT JOIN "productimages" pi ON p.product_id = pi.product_id
      LEFT JOIN "productcategorization" pc ON p.product_id = pc.product_id
      LEFT JOIN "productcategories" c ON pc.category_id = c.category_id
    `;

    const values = [];
    const conditions = [];

    if (filters.shop_id) {
      values.push(filters.shop_id);
      conditions.push(`p.shop_id = $${values.length}`);
    }
    if (filters.status) {
      values.push(filters.status);
      conditions.push(`p.status = $${values.length}`);
    }
    if (filters.category_id) {
      values.push(filters.category_id);
      conditions.push(`p.product_id IN (
        SELECT product_id FROM "productcategorization" 
        WHERE category_id = $${values.length}
      )`);
    }
    if (filters.search) {
      values.push(`%${filters.search}%`);
      conditions.push(`(p.name ILIKE $${values.length} OR p.description ILIKE $${values.length} OR p.sku ILIKE $${values.length})`);
    }
    if (filters.is_featured !== undefined) {
      values.push(filters.is_featured);
      conditions.push(`p.is_featured = $${values.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY p.product_id ORDER BY p.created_at DESC';

    // Get total count for pagination - simplified count query
    let countQuery = 'SELECT COUNT(*) as total FROM "products" p';
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0]?.total || 0);

    // Apply pagination
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const offset = (page - 1) * limit;
    
    query += ` LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const { rows } = await pool.query(query, values);

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async update(productId, updateData) {
    const setClause = Object.keys(updateData)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const query = `
      UPDATE "products" 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE product_id = $1
      RETURNING *
    `;

    const values = [productId, ...Object.values(updateData)];
    const { rows } = await pool.query(query, values);
    return rows[0] || null;
  }

  static async delete(productId) {
    const query = 'DELETE FROM "products" WHERE product_id = $1';
    const { rowCount } = await pool.query(query, [productId]);
    return rowCount > 0;
  }

  static async updateStatus(productId, status) {
    const query = `
      UPDATE "products" 
      SET status = $2, updated_at = CURRENT_TIMESTAMP
      WHERE product_id = $1
      RETURNING *
    `;
    
    const { rows } = await pool.query(query, [productId, status]);
    return rows[0] || null;
  }

  static async updateStockQuantity(productId, stockQuantity) {
    const query = `
      UPDATE "products" 
      SET stock_quantity = $2, updated_at = CURRENT_TIMESTAMP
      WHERE product_id = $1
      RETURNING *
    `;
    
    const { rows } = await pool.query(query, [productId, stockQuantity]);
    return rows[0] || null;
  }

  static async findByShopId(shopId, pagination = {}) {
    return this.findAll({ shop_id: shopId }, pagination);
  }

  static async findByCategoryId(categoryId, pagination = {}) {
    return this.findAll({ category_id: categoryId }, pagination);
  }

  static async searchProducts(searchTerm, pagination = {}) {
    return this.findAll({ search: searchTerm }, pagination);
  }

  static async getFeaturedProducts(pagination = {}) {
    return this.findAll({ is_featured: true }, pagination);
  }

  static async updateStock(productId, quantityChange, client = pool) {
    const query = `
      UPDATE "products"
      SET stock_quantity = stock_quantity + $2
      WHERE product_id = $1
      RETURNING *
    `;
    const { rows } = await client.query(query, [productId, quantityChange]);
    if (rows.length === 0) {
      throw new Error('Product not found for stock update.');
    }
    if (rows[0].stock_quantity < 0) {
      throw new Error('Stock cannot be negative.');
    }
    return rows[0];
  }
}

module.exports = Product; 