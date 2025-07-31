const pool = require('../../../common/src/config/database');
const { v4: uuidv4 } = require('uuid');

class ProductVariant {
  static async create(variantData) {
    const query = `
      INSERT INTO "productvariants" (
        variant_id, product_id, sku, price, sale_price,
        stock_quantity, weight, weight_unit, dimensions,
        color, size, material, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    const values = [
      uuidv4(),
      variantData.product_id,
      variantData.sku && variantData.sku.trim() !== '' ? variantData.sku : null,
      variantData.price,
      variantData.sale_price || null,
      variantData.stock_quantity || 0,
      variantData.weight || null,
      variantData.weight_unit || null,
      variantData.dimensions || null,
      variantData.color || null,
      variantData.size || null,
      variantData.material || null
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async findById(variantId) {
    const query = 'SELECT * FROM "productvariants" WHERE variant_id = $1';
    const { rows } = await pool.query(query, [variantId]);
    return rows[0] || null;
  }

  static async findByProductId(productId) {
    const query = `
      SELECT * FROM "productvariants" 
      WHERE product_id = $1 
      ORDER BY created_at ASC
    `;
    const { rows } = await pool.query(query, [productId]);
    return rows;
  }

  static async update(variantId, updateData) {
    // Remove updated_at and created_at from updateData to avoid conflicts
    const cleanUpdateData = { ...updateData };
    delete cleanUpdateData.updated_at;
    delete cleanUpdateData.created_at;
    
    const setClause = Object.keys(cleanUpdateData)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const query = `
      UPDATE "productvariants" 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE variant_id = $1
      RETURNING *
    `;

    const values = [variantId, ...Object.values(cleanUpdateData)];
    const { rows } = await pool.query(query, values);
    return rows[0] || null;
  }

  static async delete(variantId) {
    const query = 'DELETE FROM "productvariants" WHERE variant_id = $1';
    const { rowCount } = await pool.query(query, [variantId]);
    return rowCount > 0;
  }

  static async updateStock(variantId, stockQuantity) {
    const query = `
      UPDATE "productvariants" 
      SET stock_quantity = $2, updated_at = CURRENT_TIMESTAMP
      WHERE variant_id = $1
      RETURNING *
    `;
    
    const { rows } = await pool.query(query, [variantId, stockQuantity]);
    return rows[0] || null;
  }

  static async deleteByProductId(productId) {
    const query = 'DELETE FROM "productvariants" WHERE product_id = $1';
    const { rowCount } = await pool.query(query, [productId]);
    return rowCount > 0;
  }
}

module.exports = ProductVariant; 