const admin = require('../config/firebase');

class TokenUtils {

  // Creates a Firebase custom token for a user
  // @param {string} uid - User ID
  // @param {Object} additionalClaims - Additional claims
  // @returns {Promise<string>} - Firebase custom token
   
  static async createCustomToken(uid, additionalClaims = {}) {
    try {
      console.log('Creating custom token for:', {
        uid,
        claims: additionalClaims
      });
      const customToken = await admin.auth().createCustomToken(uid, additionalClaims);
      return customToken;
    } catch (error) {
      console.error('Token creation error:', error);
      throw new Error(`Failed to create token: ${error.message}`);
    }
  }

  // Validates a custom token and verifies the user exists
  // @param {string} token - Firebase custom token
  // @returns {Promise<Object>} - Decoded token payload

  static async validateCustomToken(token) {
    try {
      if (!token) {
        throw new Error('No token provided');
      }

      // Decode the custom token (JWT format)
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(token);
      
      if (!decoded || !decoded.uid) {
        throw new Error('Invalid token format');
      }

      // Check if token is expired
      if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        throw new Error('Token has expired');
      }

      // Verify the user exists in Firebase Auth
      try {
        const userRecord = await admin.auth().getUser(decoded.uid);
        console.log('User verified in Firebase:', {
          uid: userRecord.uid,
          email: userRecord.email
        });
        return decoded;
      } catch (userError) {
        console.error('User verification failed:', userError);
        throw new Error('Invalid user');
      }
    } catch (error) {
      console.error('Token validation error:', {
        message: error.message
      });
      throw error;
    }
  }

  // Sets the authentication token in the response cookie
  // @param {Object} res - Express response object
  // @param {string} token - Firebase custom token
  
  static setAuthCookie(res, token) {
    console.log('Setting auth cookie');
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'Lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
  }

  // Clears the authentication cookie
  // @param {Object} res - Express response object
  
  static clearAuthCookie(res) {
    console.log('Clearing auth cookie');
    res.clearCookie('token');
  }
}

module.exports = TokenUtils; 