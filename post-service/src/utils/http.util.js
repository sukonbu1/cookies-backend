const axios = require('axios');

// Try gateway first, fallback to direct service if needed
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://103.253.145.7:8080';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://103.253.145.7:3000';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'internal-service-token';
const USE_DIRECT_SERVICE = process.env.USE_DIRECT_SERVICE === 'true';

class HttpClient {
  static async getUserById(userId) {
    // If configured to use direct service, bypass gateway
    if (USE_DIRECT_SERVICE) {
      try {
        const url = `${USER_SERVICE_URL}/api/users/${userId}`;
        console.log('[HTTP CLIENT] Making direct service request to:', url);
        const response = await axios.get(url, {
          headers: {
            'Authorization': `Bearer ${INTERNAL_SERVICE_TOKEN}`,
            'X-Internal-Service': 'post-service'
          }
        });
        console.log('[HTTP CLIENT] Direct service response:', response.status, response.data);
        return response.data;
      } catch (error) {
        console.error(`[HTTP CLIENT] Direct service error for user ${userId}:`, error.message);
        return null;
      }
    }

    // Try gateway first
    try {
      const url = `${GATEWAY_URL}/api/users/${userId}`;
      const headers = {
        'Authorization': `Bearer ${INTERNAL_SERVICE_TOKEN}`,
        'X-Internal-Service': 'post-service'
      };
      
      console.log('[HTTP CLIENT] Making request to gateway:', url);
      console.log('[HTTP CLIENT] Request headers:', headers);
      
      const response = await axios.get(url, { headers });
      
      console.log('[HTTP CLIENT] Gateway response status:', response.status);
      console.log('[HTTP CLIENT] Gateway response data:', response.data);
      
      return response.data;
    } catch (gatewayError) {
      console.warn(`[HTTP CLIENT] Gateway request failed, trying direct service:`, gatewayError.message);
      
      // Fallback to direct service call
      try {
        const directUrl = `${USER_SERVICE_URL}/api/users/${userId}`;
        console.log('[HTTP CLIENT] Fallback - Making direct request to:', directUrl);
        
        const response = await axios.get(directUrl, {
          headers: {
            'Authorization': `Bearer ${INTERNAL_SERVICE_TOKEN}`,
            'X-Internal-Service': 'post-service'
          }
        });
        
        console.log('[HTTP CLIENT] Direct service fallback successful:', response.status);
        return response.data;
      } catch (directError) {
        console.error(`[HTTP CLIENT] Both gateway and direct service failed for user ${userId}:`, {
          gatewayError: gatewayError.message,
          directError: directError.message
        });
        return null;
      }
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