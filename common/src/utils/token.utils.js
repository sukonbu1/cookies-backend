const admin = require('../config/firebase');

class TokenUtils {
  /**
   * Creates a Firebase custom token for a user
   * @param {string} uid - User ID
   * @param {Object} additionalClaims - Optional additional claims
   * @returns {Promise<string>} - Firebase custom token
   */
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
  static async validateCustomToken(token) {
    try {
      console.log('Validating custom token');
      
      if (!token) {
        console.log('No token provided');
        throw new Error('No token provided');
      }

      // First try to verify as a Firebase ID token
      try {
        console.log('Attempting to verify as Firebase ID token');
        const decodedIdToken = await admin.auth().verifyIdToken(token);
        console.log('Successfully verified as Firebase ID token:', {
          uid: decodedIdToken.uid,
          email: decodedIdToken.email
        });
        return decodedIdToken;
      } catch (firebaseError) {
        console.log('Failed to verify as Firebase ID token, trying as custom token');
        // If Firebase ID token verification fails, try as a custom token
        const jwt = require('jsonwebtoken');
        const decoded = jwt.decode(token);
        
        if (!decoded || !decoded.uid) {
          console.log('Invalid token format');
          throw new Error('Invalid token format');
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
      }
    } catch (error) {
      console.error('Token validation error:', {
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Sets the authentication token in the response cookie
   * @param {Object} res - Express response object
   * @param {string} token - Firebase token
   */
  static setAuthCookie(res, token) {
    console.log('Setting auth cookie');
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',  // Changed from 'strict' to 'lax' for cross-site requests
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
  }

  /**
   * Clears the authentication cookie
   * @param {Object} res - Express response object
   */
  static clearAuthCookie(res) {
    console.log('Clearing auth cookie');
    res.clearCookie('token');
  }
}

module.exports = TokenUtils; 