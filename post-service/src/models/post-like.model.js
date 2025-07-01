const pool = require('../../../common/src/config/database');

class PostLike {
  static async create(post_id, user_id) {
    const query = `
      INSERT INTO likes (user_id, content_type, content_id, created_at)
      VALUES ($1, 'post', $2, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const { rows } = await pool.query(query, [user_id, post_id]);
    return rows[0];
  }

  static async delete(post_id, user_id) {
    const query = `
      DELETE FROM likes
      WHERE user_id = $1 AND content_type = 'post' AND content_id = $2
    `;
    const { rowCount } = await pool.query(query, [user_id, post_id]);
    return rowCount > 0;
  }

  static async findByPostId(post_id) {
    const query = `
      SELECT * FROM likes
      WHERE content_type = 'post' AND content_id = $1
      ORDER BY created_at DESC
    `;
    const { rows } = await pool.query(query, [post_id]);
    return rows;
  }

  static async findByContentId(content_id, content_type) {
    const query = `
      SELECT l.like_id, l.user_id, l.content_id, l.content_type, l.created_at
      FROM likes l
      WHERE l.content_id = $1 AND l.content_type = $2
      ORDER BY l.created_at DESC
    `;

    const { rows } = await pool.query(query, [content_id, content_type]);
    return rows;
  }

  static async hasLiked(post_id, user_id) {
    const query = `
      SELECT EXISTS (
        SELECT 1 FROM likes
        WHERE user_id = $1 AND content_type = 'post' AND content_id = $2
      ) as has_liked
    `;
    const { rows } = await pool.query(query, [user_id, post_id]);
    return rows[0].has_liked;
  }
}

module.exports = PostLike; 