const pool = require('../../../common/src/config/database');

class PostComment {
  static async create(post_id, user_id, content) {
    const query = `
      INSERT INTO comments (post_id, user_id, content, created_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const { rows } = await pool.query(query, [post_id, user_id, content]);
    return rows[0];
  }

  static async delete(id, user_id) {
    const query = `
      DELETE FROM comments
      WHERE comment_id = $1 AND user_id = $2
    `;

    const { rowCount } = await pool.query(query, [id, user_id]);
    return rowCount > 0;
  }

  static async findByPostId(post_id) {
    const query = `
      SELECT pc.comment_id, pc.post_id, pc.user_id, pc.content, pc.parent_comment_id, pc.created_at, pc.updated_at
      FROM comments pc
      WHERE pc.post_id = $1
      ORDER BY pc.created_at ASC
    `;

    const { rows } = await pool.query(query, [post_id]);
    return rows;
  }

  static async update(id, user_id, content) {
    const query = `
      UPDATE comments
      SET content = $3, updated_at = CURRENT_TIMESTAMP
      WHERE comment_id = $1 AND user_id = $2
      RETURNING *
    `;

    const { rows } = await pool.query(query, [id, user_id, content]);
    return rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT *
      FROM comments
      WHERE comment_id = $1
    `;

    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }
}

module.exports = PostComment; 