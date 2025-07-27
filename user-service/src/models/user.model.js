const pool = require('../../../common/src/config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    try {
      // Generate username from email if not provided
      let username = userData.username;
      if (!username && userData.email) {
        username = this.generateUsernameFromEmail(userData.email);
      }

      // Ensure we have a username
      if (!username) {
        throw new Error('Username is required or email must be provided to generate username');
      }

      const query = `
        INSERT INTO users (
          user_id, username, email, phone_number, bio, 
          date_of_birth, gender, country, city, 
          is_chef, followers_count, following_count, posts_count, 
          avatar_url, cover_photo_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `;

      const values = [
        userData.user_id,
        username,
        userData.email,
        userData.phone_number || null,
        userData.bio || null,
        userData.date_of_birth || null,
        userData.gender || null,
        userData.country || null,
        userData.city || null,
        userData.is_chef || false,
        0,
        0,
        0,
        userData.avatar_url || null,
        userData.cover_photo_url || null
      ];

      const { rows } = await pool.query(query, values);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  static generateUsernameFromEmail(email) {
    // Extract username part from email and add random suffix
    const emailPart = email.split('@')[0];
    const randomSuffix = Math.floor(Math.random() * 1000);
    return `${emailPart}${randomSuffix}`;
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

  static async findByUsername(username) {
    try {
      const query = 'SELECT * FROM users WHERE username = $1';
      const { rows } = await pool.query(query, [username]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async findByEmailOrUsername(identifier) {
    try {
      // Check if identifier looks like an email
      const isEmail = identifier.includes('@');
      
      if (isEmail) {
        return await this.findByEmail(identifier);
      } else {
        // For username lookup, also check if it's null
        const query = 'SELECT * FROM users WHERE username = $1 OR (username IS NULL AND email = $1)';
        const { rows } = await pool.query(query, [identifier]);
        return rows[0] || null;
      }
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

  static async searchUsers(query, pagination = {}) {
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      const offset = (page - 1) * limit;

      const sql = `
        SELECT user_id, username, email, bio, avatar_url, cover_photo_url, 
               is_chef, followers_count, following_count, posts_count,
               country, city, created_at, updated_at
        FROM users 
        WHERE (username ILIKE $1 OR email ILIKE $1)
        ORDER BY username ASC
        LIMIT $2 OFFSET $3
      `;
      
      const values = [`%${query}%`, limit, offset];
      const { rows } = await pool.query(sql, values);
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User; 