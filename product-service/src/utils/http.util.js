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
      return user ? user.username : userId;
    } catch (error) {
      console.error(`Error fetching username for ${userId}:`, error.message);
      return userId;
    }
  }
}

module.exports = HttpClient; 