const pool = require('../../../common/src/config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    try {
      const query = `
        INSERT INTO users (
          user_id, username, email, phone_number, bio, 
          date_of_birth, gender, country, city, is_verified, 
          is_chef, followers_count, following_count, posts_count, 
          total_likes, status, avatar_url, cover_photo_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING *
      `;

      const values = [
        userData.user_id,
        userData.username,
        userData.email,
        userData.phone_number,
        userData.bio,
        userData.date_of_birth,
        userData.gender,
        userData.country,
        userData.city,
        false,
        userData.is_chef || false,
        0,
        0,
        0,
        0,
        'active',
        null,
        null
      ];

      const { rows } = await pool.query(query, values);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const query = 'SELECT * FROM users WHERE email = $1';
      const { rows } = await pool.query(query, [email]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async findById(userId) {
    try {
      const query = 'SELECT * FROM users WHERE user_id = $1';
      const { rows } = await pool.query(query, [userId]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async update(userId, updateData) {
    try {
      const setClause = Object.keys(updateData)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');
      
      const query = `
        UPDATE users 
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
        RETURNING *
      `;

      const values = [userId, ...Object.values(updateData)];
      const { rows } = await pool.query(query, values);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async updateProfilePicture(userId, avatarUrl) {
    try {
      const query = `
        UPDATE users 
        SET avatar_url = $2, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
        RETURNING *
      `;
      
      const { rows } = await pool.query(query, [userId, avatarUrl]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async updateCoverPhoto(userId, coverPhotoUrl) {
    try {
      const query = `
        UPDATE users 
        SET cover_photo_url = $2, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
        RETURNING *
      `;
      
      const { rows } = await pool.query(query, [userId, coverPhotoUrl]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async updateNotificationSettings(userId, settings) {
    try {
      const query = `
        UPDATE users 
        SET notification_settings = $2, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
        RETURNING *
      `;
      
      const { rows } = await pool.query(query, [userId, settings]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async delete(userId) {
    try {
      const query = 'DELETE FROM users WHERE user_id = $1';
      await pool.query(query, [userId]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  static async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  }
}

module.exports = User; 