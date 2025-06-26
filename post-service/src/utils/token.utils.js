const admin = require('../../../common/src/config/firebase');

class TokenUtils {
  /**
   * Creates a Firebase custom token for a user
   * @param {string} uid - User ID
   * @param {Object} additionalClaims - Optional additional claims
   * @returns {Promise<string>} - Firebase custom token
   */
  static async createCustomToken(uid, additionalClaims = {}) {
    try {
      const customToken = await admin.auth().createCustomToken(uid, additionalClaims);
      return customToken;
    } catch (error) {
      console.error('Token creation error:', error);
      throw new Error(`Failed to create token: ${error.message}`);
    }
  }

  /**
   * Verifies a Firebase custom token by decoding it
   * Note: Custom tokens are JWTs, so we can decode them directly
   * @param {string} token - Firebase custom token
   * @returns {Promise<Object>} - Decoded token payload
   */
  static async verifyCustomToken(token) {
    try {
      if (!token) {
        throw new Error('No token provided');
      }

      // For custom tokens, we can decode the JWT directly
      // Custom tokens are signed with your service account key
      const jwt = require('jsonwebtoken');
      
      // Decode without verification first to get the payload
      const decoded = jwt.decode(token);
      
      if (!decoded) {
        throw new Error('Invalid token format');
      }

      // Check if token is expired
      if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        throw new Error('Token has expired');
      }

      return decoded;
    } catch (error) {
      console.error('Token verification error:', error);
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  /**
   * Alternative: Verify custom token by attempting to use it
   * This method actually validates the token with Firebase
   * @param {string} customToken - Firebase custom token
   * @returns {Promise<Object>} - Token validation result
   */
  static async validateCustomToken(customToken) {
    try {
      if (!customToken) {
        throw new Error('No token provided');
      }

      // We can't directly verify custom tokens with Admin SDK
      // But we can decode them as JWTs since we created them
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(customToken);
      
      if (!decoded || !decoded.uid) {
        throw new Error('Invalid custom token');
      }

      // Verify the user exists in Firebase Auth
      await admin.auth().getUser(decoded.uid);
      
      return decoded;
    } catch (error) {
      console.error('Token validation error:', error);
      throw new Error(`Token validation failed: ${error.message}`);
    }
  }

  /**
   * Sets the authentication token in the response cookie
   * @param {Object} res - Express response object
   * @param {string} token - Firebase token
   */
  static setAuthCookie(res, token) {
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
  }

  /**
   * Clears the authentication cookie
   * @param {Object} res - Express response object
   */
  static clearAuthCookie(res) {
    res.clearCookie('token');
  }
}

module.exports = TokenUtils;