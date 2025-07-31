const pool = require('../../../common/src/config/database');
const { v4: uuidv4 } = require('uuid');

class ProductCategorization {
  static async create({ product_id, category_id, is_primary = true }) {
    const query = `
      INSERT INTO "productcategorization" (
        product_category_id, product_id, category_id, is_primary, created_at
      ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const values = [uuidv4(), product_id, category_id, is_primary];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async findByProductId(product_id) {
    const query = 'SELECT * FROM "productcategorization" WHERE product_id = $1';
    const { rows } = await pool.query(query, [product_id]);
    return rows[0] || null;
  }

  static async updateByProductId(product_id, category_id) {
    const query = `
      UPDATE "productcategorization" 
      SET category_id = $2 
      WHERE product_id = $1
      RETURNING *
    `;
    const { rows } = await pool.query(query, [product_id, category_id]);
    return rows[0] || null;
  }

  static async deleteByProductId(product_id) {
    const query = 'DELETE FROM "productcategorization" WHERE product_id = $1';
    const { rowCount } = await pool.query(query, [product_id]);
    return rowCount > 0;
  }
}

module.exports = ProductCategorization; 