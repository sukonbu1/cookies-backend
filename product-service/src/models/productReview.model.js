const pool = require('../../../common/src/config/database');
const { v4: uuidv4 } = require('uuid');

class ProductReview {
  static async create(reviewData) {
    const query = `
      INSERT INTO "productreviews" (
        review_id, product_id, user_id, order_item_id, rating, title, content,
        likes_count, media_urls, is_verified_purchase, status, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    const values = [
      uuidv4(),
      reviewData.product_id,
      reviewData.user_id,
      reviewData.order_item_id || null,
      reviewData.rating,
      reviewData.title || null,
      reviewData.content || null,
      reviewData.likes_count || 0,
      reviewData.media_urls ? JSON.stringify(reviewData.media_urls) : null,
      reviewData.is_verified_purchase || false,
      reviewData.status || 'approved'
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async findById(reviewId) {
    const query = 'SELECT * FROM "productreviews" WHERE review_id = $1';
    const { rows } = await pool.query(query, [reviewId]);
    return rows[0] || null;
  }

  static async findByProductId(productId, pagination = {}) {
    let query = 'SELECT * FROM "productreviews" WHERE product_id = $1 AND status = $2';
    const values = [productId, 'approved'];

    query += ' ORDER BY created_at DESC';

    // Get total count for pagination
    const countQuery = 'SELECT COUNT(*) as total FROM "productreviews" WHERE product_id = $1 AND status = $2';
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

  static async findByUserId(userId, pagination = {}) {
    let query = 'SELECT * FROM "productreviews" WHERE user_id = $1';
    const values = [userId];

    query += ' ORDER BY created_at DESC';

    // Get total count for pagination
    const countQuery = 'SELECT COUNT(*) as total FROM "productreviews" WHERE user_id = $1';
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

  static async update(reviewId, updateData) {
    const setClause = Object.keys(updateData)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const query = `
      UPDATE "productreviews" 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE review_id = $1
      RETURNING *
    `;

    const values = [reviewId, ...Object.values(updateData)];
    const { rows } = await pool.query(query, values);
    return rows[0] || null;
  }

  static async delete(reviewId) {
    const query = 'DELETE FROM "productreviews" WHERE review_id = $1';
    const { rowCount } = await pool.query(query, [reviewId]);
    return rowCount > 0;
  }

  static async deleteByProductId(productId) {
    const query = 'DELETE FROM "productreviews" WHERE product_id = $1';
    const { rowCount } = await pool.query(query, [productId]);
    return rowCount > 0;
  }

  static async getProductAverageRating(productId) {
    const query = `
      SELECT 
        AVG(rating) as average_rating,
        COUNT(*) as total_reviews,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
      FROM "productreviews" 
      WHERE product_id = $1 AND status = 'approved'
    `;
    
    const { rows } = await pool.query(query, [productId]);
    return rows[0] || {
      average_rating: 0,
      total_reviews: 0,
      five_star: 0,
      four_star: 0,
      three_star: 0,
      two_star: 0,
      one_star: 0
    };
  }

  static async updateProductRating(productId) {
    const ratingData = await this.getProductAverageRating(productId);
    
    const query = `
      UPDATE "products" 
      SET rating = $2, total_reviews = $3, updated_at = CURRENT_TIMESTAMP
      WHERE product_id = $1
      RETURNING *
    `;
    
    const { rows } = await pool.query(query, [
      productId, 
      parseFloat(ratingData.average_rating) || 0,
      parseInt(ratingData.total_reviews) || 0
    ]);
    
    return rows[0] || null;
  }

  static async checkUserReviewExists(productId, userId) {
    const query = 'SELECT review_id FROM "productreviews" WHERE product_id = $1 AND user_id = $2';
    const { rows } = await pool.query(query, [productId, userId]);
    return rows[0] || null;
  }

  static async updateLikesCount(reviewId, increment = true) {
    const query = `
      UPDATE "productreviews" 
      SET likes_count = likes_count + $2, updated_at = CURRENT_TIMESTAMP
      WHERE review_id = $1
      RETURNING *
    `;
    
    const { rows } = await pool.query(query, [reviewId, increment ? 1 : -1]);
    return rows[0] || null;
  }
}

module.exports = ProductReview; 