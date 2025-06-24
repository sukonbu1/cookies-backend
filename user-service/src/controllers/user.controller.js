const User = require('../models/user.model');
const redis = require('../../../common/src/config/redis');
const admin = require('../../../common/src/config/firebase');
const TokenUtils = require('../utils/token.utils');

// Cache TTL in seconds
const CACHE_TTL = 300; // 5 minutes

class UserController {
  async register(req, res, next) {
    try {
      const { email, password, username, ...userData } = req.body;
      
      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: 'Email already registered' });
      }

      // Generate username from email if not provided
      let finalUsername = username;
      if (!finalUsername && email) {
        finalUsername = User.generateUsernameFromEmail(email);
      }

      // Create user in Firebase
      const userRecord = await admin.auth().createUser({
        email,
        password,
        emailVerified: false,
        disabled: false
      });

      // Create user profile in our database
      const user = await User.create({
        user_id: userRecord.uid,
        email,
        username: finalUsername,
        ...userData
      });

      // Create custom token
      const token = await TokenUtils.createCustomToken(userRecord.uid);
      
      // Set cookie with custom token
      TokenUtils.setAuthCookie(res, token);

      // Remove sensitive data
      const { password_hash, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, username, password } = req.body;
  
      // Check if user provided email or username
      const identifier = email || username;
      if (!identifier || !password) {
        return res.status(400).json({ message: 'Email/username and password are required' });
      }

      // Find user by email or username
      const user = await User.findByEmailOrUsername(identifier);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Get Firebase user record using the email from our database
      const userRecord = await admin.auth().getUserByEmail(user.email);
      
      if (user.status !== 'active') {
        return res.status(403).json({ message: 'Account is not active' });
      }
  
      // Create custom token using Firebase UID (not database _id)
      const token = await TokenUtils.createCustomToken(userRecord.uid, {
        email: user.email,
        role: user.role
      });
      
      // Set cookie with custom token
      TokenUtils.setAuthCookie(res, token);
  
      // Remove sensitive data
      const { password_hash, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res) {
    try {
      TokenUtils.clearAuthCookie(res);
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }
  async googleAuth(req, res, next) {
    try {
      const { idToken, user } = req.body;
  
      if (!idToken) {
        return res.status(400).json({ message: 'ID token is required' });
      }
  
      // Verify the ID token with Firebase Admin
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      
      // Check if user exists in our database
      let existingUser = await User.findById(decodedToken.uid);
      
      if (!existingUser) {
        // Generate username from email if not provided
        let username = user.username;
        if (!username && decodedToken.email) {
          username = User.generateUsernameFromEmail(decodedToken.email);
        }

        // Ensure we have a username
        if (!username) {
          throw new Error('Unable to generate username from email');
        }

        // Create new user if doesn't exist
        existingUser = await User.create({
          user_id: decodedToken.uid,
          email: decodedToken.email,
          username: username,
          profile_picture: user.photoURL || decodedToken.picture,
          email_verified: decodedToken.email_verified,
          provider: 'google',
          status: 'active'
        });
      } else {
        // Update existing user info if needed
        const updates = {};
        // Remove displayName logic, just update username if needed
        if (user.username && user.username !== existingUser.username) {
          updates.username = user.username;
        }
        if (user.photoURL && user.photoURL !== existingUser.profile_picture) {
          updates.profile_picture = user.photoURL;
        }
        if (decodedToken.email_verified !== existingUser.email_verified) {
          updates.email_verified = decodedToken.email_verified;
        }
        
        if (Object.keys(updates).length > 0) {
          existingUser = await User.update(decodedToken.uid, updates);
        }
      }
  
      if (existingUser.status !== 'active') {
        return res.status(403).json({ message: 'Account is not active' });
      }
  
      // Create custom token for the user
      const customToken = await TokenUtils.createCustomToken(decodedToken.uid, {
        email: existingUser.email,
        role: existingUser.role || 'user',
        provider: 'google'
      });
  
      // Set auth cookie
      TokenUtils.setAuthCookie(res, customToken);
  
      // Remove sensitive data
      const { password_hash, ...userWithoutPassword } = existingUser;
      
      res.json({
        message: 'Google authentication successful',
        user: userWithoutPassword
      });
  
    } catch (error) {
      console.error('Google auth error:', error);
      
      if (error.code === 'auth/id-token-expired') {
        return res.status(401).json({ message: 'Token expired' });
      }
      if (error.code === 'auth/id-token-revoked') {
        return res.status(401).json({ message: 'Token revoked' });
      }
      
      next(error);
    }
  }
  async getUser(req, res, next) {
    try {
      const { userId } = req.params;

      console.log('getUser called:', {
        userId: req.params.userId,
        authenticatedUser: {
          id: req.user.user_id,
          email: req.user.email
        },
        headers: {
          authorization: req.headers.authorization,
          cookie: req.headers.cookie
        }
      });

      // Try to get from cache first
      const cachedUser = await redis.get(`user:${userId}`);
      if (cachedUser) {
        console.log('User found in cache');
        return res.json(JSON.parse(cachedUser));
      }

      console.log('User not in cache, querying database');

      // Get from database
      const user = await User.findById(userId);
      if (!user) {
        console.log('User not found in database');
        return res.status(404).json({ message: 'User not found' });
      }

      console.log('User found in database:', {
        userId: user.user_id,
        email: user.email
      });

      // Remove sensitive data
      const { password_hash, ...userWithoutPassword } = user;

      // Cache the result
      await redis.set(`user:${userId}`, JSON.stringify(userWithoutPassword), 'EX', CACHE_TTL);
      console.log('User cached successfully');
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error in getUser:', {
        message: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      console.log('getMe called for user:', {
        userId: req.user.user_id,
        email: req.user.email
      });

      const cachedUser = await redis.get(`user:${req.user.user_id}`);
      if (cachedUser) {
        console.log('User found in cache');
        return res.json(JSON.parse(cachedUser));
      }

      console.log('User not in cache, querying database');

      // Get from database
      const user = await User.findById(req.user.user_id);
      if (!user) {
        console.log('User not found in database');
        return res.status(404).json({ message: 'User not found' });
      }

      console.log('User found in database:', {
        userId: user.user_id,
        email: user.email
      });

      // Remove sensitive data
      const { password_hash, ...userWithoutPassword } = user;

      // Cache the result
      await redis.set(`user:${req.user.user_id}`, JSON.stringify(userWithoutPassword), 'EX', CACHE_TTL);
      console.log('User cached successfully');
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error in getMe:', {
        message: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      const { userId } = req.params;
      const updates = req.body;

      const user = await User.update(userId, updates);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Invalidate cache
      await redis.del(`user:${userId}`);

      // Remove sensitive data
      const { password_hash, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const { userId } = req.params;

      const deleted = await User.delete(userId);
      if (!deleted) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Invalidate cache
      await redis.del(`user:${userId}`);

      // Clear cookie
      res.clearCookie('token');
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async getUserPosts(req, res, next) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      // Try to get from cache first
      const cacheKey = `user:${userId}:posts:${page}:${limit}`;
      const cachedPosts = await redis.get(cacheKey);
      if (cachedPosts) {
        return res.json(JSON.parse(cachedPosts));
      }

      // Get from database
      const query = `
        SELECT * FROM posts 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2 OFFSET $3
      `;
      const { rows } = await pool.query(query, [userId, limit, (page - 1) * limit]);

      // Cache the result
      await redis.set(cacheKey, JSON.stringify(rows), 'EX', CACHE_TTL);

      res.json(rows);
    } catch (error) {
      next(error);
    }
  }

  async getUserFollowers(req, res, next) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      // Try to get from cache first
      const cacheKey = `user:${userId}:followers:${page}:${limit}`;
      const cachedFollowers = await redis.get(cacheKey);
      if (cachedFollowers) {
        return res.json(JSON.parse(cachedFollowers));
      }

      // Get from database
      const query = `
        SELECT u.* FROM users u
        INNER JOIN user_followers f ON u.user_id = f.follower_id
        WHERE f.following_id = $1
        ORDER BY f.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      const { rows } = await pool.query(query, [userId, limit, (page - 1) * limit]);

      // Cache the result
      await redis.set(cacheKey, JSON.stringify(rows), 'EX', CACHE_TTL);

      res.json(rows);
    } catch (error) {
      next(error);
    }
  }

  async getUserFollowing(req, res, next) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      // Try to get from cache first
      const cacheKey = `user:${userId}:following:${page}:${limit}`;
      const cachedFollowing = await redis.get(cacheKey);
      if (cachedFollowing) {
        return res.json(JSON.parse(cachedFollowing));
      }

      const query = `
        SELECT u.* FROM users u
        INNER JOIN user_followers f ON u.user_id = f.following_id
        WHERE f.follower_id = $1
        ORDER BY f.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      const { rows } = await pool.query(query, [userId, limit, (page - 1) * limit]);

      // Cache the result
      await redis.set(cacheKey, JSON.stringify(rows), 'EX', CACHE_TTL);

      res.json(rows);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController(); 