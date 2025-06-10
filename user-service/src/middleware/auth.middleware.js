const admin = require('../../../common/src/config/firebase');
const TokenUtils = require('../../../common/src/utils/token.utils');
const User = require('../models/user.model');

const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Verify custom token (not ID token)
    const decodedToken = await TokenUtils.validateCustomToken(token);
    
    // Get user profile from our database using the uid from the token
    const userProfile = await User.findById(decodedToken.uid);
    if (!userProfile) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (userProfile.status !== 'active') {
      return res.status(403).json({ message: 'Account is not active' });
    }

    req.user = userProfile;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ 
      message: 'Invalid token',
      error: error.message 
    });
  }
};

module.exports = {
  authenticate
};