const pool = require('../../../common/src/config/database');
const { v4: uuidv4 } = require('uuid');

class ProductImage {
  static async create(imageData) {
    // Validate required fields
    if (!imageData.image_url || typeof imageData.image_url !== 'string' || imageData.image_url.trim() === '') {
      throw new Error('image_url is required and must be a non-empty string');
    }
    
    const query = `
      INSERT INTO "productimages" (
        image_id, product_id, image_url, thumbnail_url, alt_text,
        position, is_primary, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    const values = [
      uuidv4(),
      imageData.product_id,
      imageData.image_url,
      imageData.thumbnail_url || imageData.image_url,
      imageData.alt_text || null,
      imageData.position || 0,
      imageData.is_primary || false
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async findById(imageId) {
    const query = 'SELECT * FROM "productimages" WHERE image_id = $1';
    const { rows } = await pool.query(query, [imageId]);
    return rows[0] || null;
  }

  static async findByProductId(productId) {
    const query = `
      SELECT * FROM "productimages" 
      WHERE product_id = $1 
      ORDER BY position ASC, created_at ASC
    `;
    const { rows } = await pool.query(query, [productId]);
    return rows;
  }

  static async update(imageId, updateData) {
    const setClause = Object.keys(updateData)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const query = `
      UPDATE "productimages" 
      SET ${setClause}
      WHERE image_id = $1
      RETURNING *
    `;

    const values = [imageId, ...Object.values(updateData)];
    const { rows } = await pool.query(query, values);
    return rows[0] || null;
  }

  static async delete(imageId) {
    const query = 'DELETE FROM "productimages" WHERE image_id = $1';
    const { rowCount } = await pool.query(query, [imageId]);
    return rowCount > 0;
  }

  static async deleteByProductId(productId) {
    const query = 'DELETE FROM "productimages" WHERE product_id = $1';
    const { rowCount } = await pool.query(query, [productId]);
    return rowCount > 0;
  }

  static async setPrimaryImage(productId, imageId) {
    // First, unset all primary images for this product
    await pool.query(
      'UPDATE "productimages" SET is_primary = false WHERE product_id = $1',
      [productId]
    );

    // Then set the specified image as primary
    const query = `
      UPDATE "productimages" 
      SET is_primary = true 
      WHERE image_id = $1 AND product_id = $2
      RETURNING *
    `;
    
    const { rows } = await pool.query(query, [imageId, productId]);
    return rows[0] || null;
  }

  static async updatePosition(imageId, newPosition) {
    const query = `
      UPDATE "productimages" 
      SET position = $2 
      WHERE image_id = $1
      RETURNING *
    `;
    
    const { rows } = await pool.query(query, [imageId, newPosition]);
    return rows[0] || null;
  }

  static async getPrimaryImage(productId) {
    const query = `
      SELECT * FROM "productimages" 
      WHERE product_id = $1 AND is_primary = true
      LIMIT 1
    `;
    const { rows } = await pool.query(query, [productId]);
    return rows[0] || null;
  }

  static async reorderImages(productId, imageOrder) {
    // imageOrder should be an array of image IDs in the desired order
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      for (let i = 0; i < imageOrder.length; i++) {
        await client.query(
          'UPDATE "productimages" SET position = $1 WHERE image_id = $2 AND product_id = $3',
          [i, imageOrder[i], productId]
        );
      }
      
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = ProductImage; 