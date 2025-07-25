const TokenUtils = require('../../../common/src/utils/token.utils');

const authMiddleware = {
  verifyToken: async (req, res, next) => {
    console.log('Auth middleware called for', req.method, req.originalUrl);
    try {
      // Get token from cookie or Authorization header
      let token = req.cookies.token;
      if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
      }
      if (!token) {
        return res.status(401).json({ status: 'error', message: 'No token provided' });
      }
      const decodedToken = await TokenUtils.validateCustomToken(token);
      req.user = decodedToken; // Trust the token payload
      next();
    } catch (error) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token',
        error: error.message
      });
    }
  }
};

module.exports = authMiddleware; 