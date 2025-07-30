const axios = require('axios');

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://103.253.145.7:8080';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'internal-service-token';

class HttpClient {
  static async getUserById(userId) {
    try {
      // Use gateway URL and include internal service token for authentication
      const response = await axios.get(`${GATEWAY_URL}/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${INTERNAL_SERVICE_TOKEN}`,
          'X-Internal-Service': 'post-service'
        }
      });
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
      // Final fallback - return userId
      console.warn(`User ${userId} has no username or email, using fallback`);
      return userId;
    } catch (error) {
      console.error(`Error fetching username for ${userId}:`, error.message);
      return userId;
    }
  }
}

module.exports = HttpClient; 