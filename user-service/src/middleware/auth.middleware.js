const admin = require('../../../common/src/config/firebase');
const TokenUtils = require('../../../common/src/utils/token.utils');
const User = require('../models/user.model');

const authenticate = async (req, res, next) => {
  try {
    console.log('Auth middleware called with:', {
      path: req.path,
      method: req.method,
      cookies: req.cookies,
      headers: {
        authorization: req.headers.authorization,
        cookie: req.headers.cookie,
        origin: req.headers.origin,
        referer: req.headers.referer
      }
    });

    const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);

    if (!token) {
      console.log('No token found in request');
      console.log('Available cookies:', Object.keys(req.cookies));
      console.log('Authorization header:', req.headers.authorization);
      return res.status(401).json({ message: 'Authentication required' });
    }

    console.log('Token found, attempting validation');

    // Verify custom token (not ID token)
    const decodedToken = await TokenUtils.validateCustomToken(token);
    
    console.log('Token validated successfully:', {
      uid: decodedToken.uid,
      claims: decodedToken.claims
    });
    
    // Get user profile from our database using the uid from the token
    const userProfile = await User.findById(decodedToken.uid);
    if (!userProfile) {
      console.log('User not found in database:', decodedToken.uid);
      return res.status(401).json({ message: 'User not found' });
    }

    console.log('User found in database:', {
      userId: userProfile.user_id,
      email: userProfile.email
    });

    if (userProfile.status !== 'active') {
      console.log('User account not active:', userProfile.status);
      return res.status(403).json({ message: 'Account is not active' });
    }

    req.user = userProfile;
    next();
  } catch (error) {
    console.error('Authentication error:', {
      message: error.message,
      stack: error.stack
    });
    return res.status(401).json({ 
      message: 'Invalid token',
      error: error.message 
    });
  }
};

module.exports = {
  authenticate
};