const pool = require('../../../common/src/config/database');

class PostMedia {
  static async create({ post_id, media_type, media_url, thumbnail_url = null, duration = null, width = null, height = null, file_size = null, position = null }) {
    const query = `
      INSERT INTO postmedia (
        post_id, media_type, media_url, thumbnail_url, duration,
        width, height, file_size, position, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const values = [
      post_id, media_type, media_url, thumbnail_url, duration,
      width, height, file_size, position
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async findByPostId(post_id) {
    const query = `
      SELECT pm.*, 
             json_build_object(
               'post_id', p.post_id,
               'title', p.title
             ) as post
      FROM postmedia pm
      LEFT JOIN posts p ON pm.post_id = p.post_id
      WHERE pm.post_id = $1
      ORDER BY pm.position ASC
    `;

    const { rows } = await pool.query(query, [post_id]);
    return rows;
  }

  static async delete(media_id, post_id) {
    const query = `
      DELETE FROM post_media
      WHERE media_id = $1 AND post_id = $2
    `;

    const { rowCount } = await pool.query(query, [media_id, post_id]);
    return rowCount > 0;
  }

  static async updatePosition(media_id, post_id, new_position) {
    const query = `
      UPDATE postmedia
      SET position = $3
      WHERE media_id = $1 AND post_id = $2
      RETURNING *
    `;

    const { rows } = await pool.query(query, [media_id, post_id, new_position]);
    return rows[0];
  }
}

module.exports = PostMedia; 