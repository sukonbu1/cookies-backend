const pool = require('../../../common/src/config/database');
const { v4: uuidv4 } = require('uuid');

class Category {
  static async create(categoryData) {
    const query = `
      INSERT INTO "productcategories" (
        category_id, parent_id, name, slug, description, icon_url, image_url,
        level, position, product_count, status, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    const values = [
      uuidv4(),
      categoryData.parent_id || null,
      categoryData.name,
      categoryData.slug || categoryData.name.toLowerCase().replace(/\s+/g, '-'),
      categoryData.description || null,
      categoryData.icon_url || null,
      categoryData.image_url || null,
      categoryData.level || 0,
      categoryData.position || 0,
      categoryData.product_count || 0,
      categoryData.status || 'active'
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async findById(categoryId) {
    const query = 'SELECT * FROM "productcategories" WHERE category_id = $1';
    const { rows } = await pool.query(query, [categoryId]);
    return rows[0] || null;
  }

  static async findAll(filters = {}, pagination = {}) {
    let query = 'SELECT * FROM "productcategories"';
    const values = [];
    const conditions = [];

    if (filters.parent_id !== undefined) {
      if (filters.parent_id === null) {
        conditions.push('parent_id IS NULL');
      } else {
        values.push(filters.parent_id);
        conditions.push(`parent_id = $${values.length}`);
      }
    }
    if (filters.status) {
      values.push(filters.status);
      conditions.push(`status = $${values.length}`);
    }
    if (filters.search) {
      values.push(`%${filters.search}%`);
      conditions.push(`(name ILIKE $${values.length} OR description ILIKE $${values.length})`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY position ASC, name ASC';

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM "productcategories"';
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

  static async update(categoryId, updateData) {
    const setClause = Object.keys(updateData)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const query = `
      UPDATE "productcategories" 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE category_id = $1
      RETURNING *
    `;

    const values = [categoryId, ...Object.values(updateData)];
    const { rows } = await pool.query(query, values);
    return rows[0] || null;
  }

  static async delete(categoryId) {
    const query = 'DELETE FROM "productcategories" WHERE category_id = $1';
    const { rowCount } = await pool.query(query, [categoryId]);
    return rowCount > 0;
  }

  static async getRootCategories(pagination = {}) {
    return this.findAll({ parent_id: null }, pagination);
  }

  static async getSubcategories(parentId, pagination = {}) {
    return this.findAll({ parent_id: parentId }, pagination);
  }

  static async searchCategories(searchTerm, pagination = {}) {
    return this.findAll({ search: searchTerm }, pagination);
  }
}

module.exports = Category; 