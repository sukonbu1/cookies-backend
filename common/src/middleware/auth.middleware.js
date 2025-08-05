const admin = require('../config/firebase');
const TokenUtils = require('../utils/token.utils');

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
        referer: req.headers.referer,
        'x-internal-service': req.headers['x-internal-service']
      }
    });

    // Check for internal service request
    const internalServiceHeader = req.headers['x-internal-service'];
    const authHeader = req.headers.authorization;
    const internalServiceToken = process.env.INTERNAL_SERVICE_TOKEN || 'internal-service-token';
    
    if (internalServiceHeader && authHeader && authHeader === `Bearer ${internalServiceToken}`) {
      console.log('Internal service request detected from:', internalServiceHeader);
      // For internal service requests, we'll skip user authentication
      // but we can set a dummy user object if needed
      req.user = { isInternalService: true, serviceName: internalServiceHeader };
      return next();
    }

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
    
    // Note: For services that need user data, they should fetch it from their own User model
    // This middleware just validates the token and sets the user ID
    req.user = {
      uid: decodedToken.uid,
      claims: decodedToken.claims
    };
    
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
  authenticate,
}; 