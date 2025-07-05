const pool = require('../../../common/src/config/database');

class Post {
  static async create(postData) {
    const query = `
      INSERT INTO posts (
        user_id, content_type, title, description,
        cooking_time, difficulty_level, serving_size, has_recipe,
        is_premium, premium_price, status, is_featured,
        views_count, likes_count, comments_count, shares_count,
        created_at, updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
        0, 0, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING *
    `;
    
    const values = [
      postData.user_id,
      postData.content_type,
      postData.title,
      postData.description,
      postData.cooking_time,
      postData.difficulty_level,
      postData.serving_size,
      postData.has_recipe || false,
      postData.is_premium || false,
      postData.premium_price,
      postData.status || 'published',
      postData.is_featured || false
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async findById(postId) {
    const query = `
      SELECT p.*, 
             COALESCE(
               json_agg(
                 json_build_object(
                   'media_id', pm.media_id,
                   'url', pm.media_url,
                   'media_type', pm.media_type,
                   'thumbnail_url', pm.thumbnail_url,
                   'position', pm.position
                 )
               ) FILTER (WHERE pm.media_id IS NOT NULL),
               '[]'
             ) as media
      FROM posts p
      LEFT JOIN postmedia pm ON p.post_id = pm.post_id
      WHERE p.post_id = $1
      GROUP BY p.post_id
    `;

    const { rows } = await pool.query(query, [postId]);
    return rows[0] || null;
  }

  static async findByUserId(userId, limit = 10, offset = 0) {
    const query = `
      SELECT p.*, 
             COALESCE(
               json_agg(
                 json_build_object(
                   'media_id', pm.media_id,
                   'url', pm.media_url,
                   'media_type', pm.media_type,
                   'thumbnail_url', pm.thumbnail_url,
                   'position', pm.position
                 )
               ) FILTER (WHERE pm.media_id IS NOT NULL),
               '[]'
             ) as media
      FROM posts p
      LEFT JOIN postmedia pm ON p.post_id = pm.post_id
      WHERE p.user_id = $1
      GROUP BY p.post_id
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const { rows } = await pool.query(query, [userId, limit, offset]);
    return rows;
  }

  static async findAll(filters = {}) {
    let query = `
      SELECT p.*, 
             COALESCE(
               json_agg(
                 json_build_object(
                   'media_id', pm.media_id,
                   'url', pm.media_url,
                   'media_type', pm.media_type,
                   'thumbnail_url', pm.thumbnail_url,
                   'position', pm.position
                 )
               ) FILTER (WHERE pm.media_id IS NOT NULL),
               '[]'
             ) as media
      FROM posts p
      LEFT JOIN postmedia pm ON p.post_id = pm.post_id
    `;

    const values = [];
    const conditions = [];

    if (filters.user_id) {
      values.push(filters.user_id);
      conditions.push(`p.user_id = $${values.length}`);
    }
    if (filters.content_type) {
      values.push(filters.content_type);
      conditions.push(`p.content_type = $${values.length}`);
    }
    if (filters.status) {
      values.push(filters.status);
      conditions.push(`p.status = $${values.length}`);
    }
    if (filters.is_premium !== undefined) {
      values.push(filters.is_premium);
      conditions.push(`p.is_premium = $${values.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY p.post_id ORDER BY p.created_at DESC';

    const { rows } = await pool.query(query, values);
    return rows;
  }

  static async update(postId, userId, updates) {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    const query = `
      UPDATE posts
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE post_id = $1 AND user_id = $2
      RETURNING *
    `;

    const values = [postId, userId, ...Object.values(updates)];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async delete(postId, userId) {
    const query = `
      DELETE FROM posts
      WHERE post_id = $1 AND user_id = $2
    `;

    const { rowCount } = await pool.query(query, [postId, userId]);
    return rowCount > 0;
  }

  static async incrementViews(postId, count = 1) {
    const query = `
      UPDATE posts
      SET views_count = views_count + $2
      WHERE post_id = $1
      RETURNING views_count
    `;
    const { rows } = await pool.query(query, [postId, count]);
    return rows[0];
  }

  static async updateCounts(postId, type, increment = true) {
    const countField = `${type}_count`;
    const query = `
      UPDATE posts
      SET ${countField} = ${countField} ${increment ? '+' : '-'} 1
      WHERE post_id = $1
      RETURNING *
    `;

    const { rows } = await pool.query(query, [postId]);
    return rows[0];
  }

  static async searchPosts(query, pagination = {}) {
    let sql = `
      SELECT p.*, 
             COALESCE(
               json_agg(
                 json_build_object(
                   'media_id', pm.media_id,
                   'url', pm.media_url,
                   'media_type', pm.media_type,
                   'thumbnail_url', pm.thumbnail_url,
                   'position', pm.position
                 )
               ) FILTER (WHERE pm.media_id IS NOT NULL),
               '[]'
             ) as media
      FROM posts p
      LEFT JOIN postmedia pm ON p.post_id = pm.post_id
      WHERE p.title ILIKE $1 OR p.description ILIKE $1
      GROUP BY p.post_id
      ORDER BY p.created_at DESC
    `;
    const values = [`%${query}%`];
    // Pagination
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const offset = (page - 1) * limit;
    sql += ` LIMIT $2 OFFSET $3`;
    values.push(limit, offset);
    const { rows } = await pool.query(sql, values);
    return rows;
  }
}

module.exports = Post; 