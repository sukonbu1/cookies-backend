const pool = require('../../../common/src/config/database');

class PostShare {
  static async create(post_id, user_id, share_platform = 'app') {
    const query = `
      INSERT INTO shares (post_id, user_id, share_platform, created_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const { rows } = await pool.query(query, [post_id, user_id, share_platform]);
    return rows[0];
  }

  static async findByPostId(post_id) {
    const query = `
      SELECT *
      FROM shares
      WHERE post_id = $1
      ORDER BY created_at DESC
    `;

    const { rows } = await pool.query(query, [post_id]);
    return rows;
  }

  static async findByUserId(user_id) {
    const query = `
      SELECT *
      FROM shares
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;

    const { rows } = await pool.query(query, [user_id]);
    return rows;
  }
}

module.exports = PostShare; 