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
}

module.exports = ProductCategorization; 