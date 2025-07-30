const axios = require('axios');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';

class HttpClient {
  static async getUserById(userId) {
    try {
      const response = await axios.get(`${USER_SERVICE_URL}/api/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error.message);
      return null;
    }
  }

  static async getUsernameById(userId) {
    try {
      const user = await this.getUserById(userId);
      if (user && user.username) {
        return user.username;
      }
      // If user exists but has no username, try to use email prefix or generate one
      if (user && user.email) {
        const emailPrefix = user.email.split('@')[0];
        return emailPrefix;
      }
      // Final fallback - return a more descriptive string instead of just userId
      console.warn(`User ${userId} has no username or email, using fallback`);
      return `User ${userId}`;
    } catch (error) {
      console.error(`Error fetching username for ${userId}:`, error.message);
      return `User ${userId}`;
    }
  }
}

module.exports = HttpClient; 