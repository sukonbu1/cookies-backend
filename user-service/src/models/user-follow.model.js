const pool = require('../../../common/src/config/database');

class UserFollow {
  static async follow(followerId, followingId) {
    if (followerId === followingId) throw new Error('Cannot follow self');
    await pool.query(
      'INSERT INTO user_followers (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [followerId, followingId]
    );
    return true;
  }

  static async unfollow(followerId, followingId) {
    await pool.query(
      'DELETE FROM user_followers WHERE follower_id = $1 AND following_id = $2',
      [followerId, followingId]
    );
    return true;
  }

  static async isFollowing(followerId, followingId) {
    const { rows } = await pool.query(
      'SELECT 1 FROM user_followers WHERE follower_id = $1 AND following_id = $2',
      [followerId, followingId]
    );
    return rows.length > 0;
  }

  static async getFollowers(userId, limit = 20, offset = 0) {
    const { rows } = await pool.query(
      `SELECT u.* FROM users u
       JOIN user_followers f ON u.user_id = f.follower_id
       WHERE f.following_id = $1
       ORDER BY f.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return rows;
  }

  static async getFollowing(userId, limit = 20, offset = 0) {
    const { rows } = await pool.query(
      `SELECT u.* FROM users u
       JOIN user_followers f ON u.user_id = f.following_id
       WHERE f.follower_id = $1
       ORDER BY f.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return rows;
  }
}

module.exports = UserFollow; 