const pool = require('../../../common/src/config/database');

class Hashtag {
  static async findOrCreate(name) {
    // Always store hashtags in lowercase
    const tag = name.toLowerCase();
    let result = await pool.query('SELECT * FROM hashtags WHERE name = $1', [tag]);
    if (result.rows.length > 0) return result.rows[0];
    result = await pool.query('INSERT INTO hashtags (name) VALUES ($1) RETURNING *', [tag]);
    return result.rows[0];
  }

  static async getByName(name) {
    const tag = name.toLowerCase();
    const result = await pool.query('SELECT * FROM hashtags WHERE name = $1', [tag]);
    return result.rows[0] || null;
  }

  static async getPostsByHashtag(name, limit = 20, offset = 0) {
    const tag = name.toLowerCase();
    const result = await pool.query(`
      SELECT p.* FROM posts p
      JOIN post_hashtags ph ON p.post_id = ph.post_id
      JOIN hashtags h ON ph.hashtag_id = h.hashtag_id
      WHERE h.name = $1
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `, [tag, limit, offset]);
    return result.rows;
  }

  static async linkPostHashtags(postId, hashtags) {
    for (const tag of hashtags) {
      const hashtag = await Hashtag.findOrCreate(tag);
      await pool.query(
        'INSERT INTO post_hashtags (post_id, hashtag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [postId, hashtag.hashtag_id]
      );
    }
  }

  static async getHashtagsForPost(postId) {
    const result = await pool.query(`
      SELECT h.* FROM hashtags h
      JOIN post_hashtags ph ON h.hashtag_id = ph.hashtag_id
      WHERE ph.post_id = $1
    `, [postId]);
    return result.rows;
  }
}

module.exports = Hashtag; 