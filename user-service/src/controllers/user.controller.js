const User = require('../models/user.model');
const redis = require('../../../common/src/config/redis');
const admin = require('../../../common/src/config/firebase');
const TokenUtils = require('../utils/token.utils');
const UserFollow = require('../models/user-follow.model');
const rabbitmq = require('../utils/rabbitmq.util');

// Cache TTL in seconds
const CACHE_TTL = 300; // 5 minutes

class UserController {


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
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      console.log('[GOOGLE AUTH] Decoded Firebase UID:', decodedToken.uid);
      let existingUser = await User.findById(decodedToken.uid);
      console.log('[GOOGLE AUTH] User from DB:', existingUser);
      if (!existingUser) {
        let username = user.username;
        if (!username && decodedToken.email) {
          username = User.generateUsernameFromEmail(decodedToken.email);
        }
        if (!username) {
          throw new Error('Unable to generate username from email');
        }
        existingUser = await User.create({
          user_id: decodedToken.uid,
          email: decodedToken.email,
          username: username,
          avatar_url: user.photoURL || decodedToken.picture
        });
      } else {
        const updates = {};
        if (user.username && user.username !== existingUser.username) {
          updates.username = user.username;
        }
        if (user.photoURL && user.photoURL !== existingUser.avatar_url) {
          updates.avatar_url = user.photoURL;
        }
        if (Object.keys(updates).length > 0) {
          existingUser = await User.update(decodedToken.uid, updates);
        }
      }

      const customToken = await TokenUtils.createCustomToken(decodedToken.uid, {
        email: existingUser.email,
        role: existingUser.role || 'user'
      });
      TokenUtils.setAuthCookie(res, customToken);
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
        authenticatedUser: req.user
          ? { id: req.user.user_id, email: req.user.email }
          : null,
        headers: {
          authorization: req.headers.authorization,
          cookie: req.headers.cookie
        }
      });

      // Debug log before DB query
      console.log('[DEBUG] Looking up user in DB:', userId);

      // Try to get from cache first
      const cachedUser = await redis.get(`user:${userId}`);
      if (cachedUser) {
        console.log('User found in cache');
        return res.json(JSON.parse(cachedUser));
      }

      console.log('User not in cache, querying database');

      // Get from database
      const user = await User.findById(userId);
      // Debug log after DB query
      console.log('[DEBUG] DB result for user:', user);
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

      // Default to not following
      let isFollowing = false;
      // Only check if the requester is authenticated and not viewing their own profile
      if (req.user && req.user.user_id !== userId) {
        isFollowing = await UserFollow.isFollowing(req.user.user_id, userId);
      }

      // Add isFollowing to the response
      const response = { ...userWithoutPassword, isFollowing };

      // Cache the result (cache only the user data, not isFollowing, since isFollowing is user-specific)
      await redis.set(`user:${userId}`, JSON.stringify(userWithoutPassword), 'EX', CACHE_TTL);
      console.log('User cached successfully');
      
      res.json(response);
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
      const updates = { ...req.body };
      if (req.body.avatar_url) updates.avatar_url = req.body.avatar_url;
      if (req.body.cover_url) updates.cover_url = req.body.cover_url;
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

  // Follow a user
  async followUser(req, res, next) {
    try {
      const followerId = req.user.user_id;
      const followingId = req.params.id;
      await UserFollow.follow(followerId, followingId);
      // Invalidate cache for both users
      await redis.del(`user:${followerId}`);
      await redis.del(`user:${followingId}`);
      console.log('About to emit user_follow event');
      await rabbitmq.sendToQueue('user-events', {
        type: 'user_follow',
        followerId,
        followingId
      });
      console.log('Emitted user_follow event');
      // Emit notification event
      if (followerId !== followingId) {
        // Fetch the actor's username (User model is already imported)
        const actor = await User.findById(followerId);
        const actorName = actor ? actor.username : followerId;
        await rabbitmq.sendToQueue('notification-events', {
          type: 'follow',
          actor_id: followerId,
          actor_name: actorName,
          target_user_id: followingId,
          reference_id: followerId
        });
      }
      res.json({ message: 'Followed successfully' });
    } catch (err) {
      next(err);
    }
  }

  // Unfollow a user
  async unfollowUser(req, res, next) {
    try {
      const followerId = req.user.user_id;
      const followingId = req.params.id;
      await UserFollow.unfollow(followerId, followingId);
      // Invalidate cache for both users
      await redis.del(`user:${followerId}`);
      await redis.del(`user:${followingId}`);
      // Emit event for count update
      await rabbitmq.sendToQueue('user-events', {
        type: 'user_unfollow',
        followerId,
        followingId
      });
      res.json({ message: 'Unfollowed successfully' });
    } catch (err) {
      next(err);
    }
  }

  // Get followers
  async getFollowers(req, res, next) {
    try {
      const userId = req.params.id;
      const { limit = 20, offset = 0 } = req.query;
      const followers = await UserFollow.getFollowers(userId, limit, offset);
      res.json(followers);
    } catch (err) {
      next(err);
    }
  }

  // Get following
  async getFollowing(req, res, next) {
    try {
      const userId = req.params.id;
      const { limit = 20, offset = 0 } = req.query;
      const following = await UserFollow.getFollowing(userId, limit, offset);
      res.json(following);
    } catch (err) {
      next(err);
    }
  }

  async searchUsers(req, res, next) {
    try {
      const { q = '', page = 1, limit = 10 } = req.query;
      if (!q) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Search query is required' 
        });
      }

      const pagination = { 
        page: parseInt(page), 
        limit: parseInt(limit) 
      };
      
      const users = await User.searchUsers(q, pagination);
      
      res.json({ 
        status: 'success', 
        data: users, 
        pagination 
      });
    } catch (error) {
      next(error);
    }
  }

  async getEmailByUsername(req, res, next) {
    try {
      const { username } = req.body;
      const user = await User.findByUsername(username);
      if (!user) return res.status(404).json({ message: 'Username not found' });
      res.json({ email: user.email });
    } catch (error) {
      next(error);
    }
  }
}

const userControllerInstance = new UserController();

module.exports = {
  logout: userControllerInstance.logout.bind(userControllerInstance),
  googleAuth: userControllerInstance.googleAuth.bind(userControllerInstance),
  getUser: userControllerInstance.getUser.bind(userControllerInstance),
  getUserById: userControllerInstance.getUser.bind(userControllerInstance),
  getMe: userControllerInstance.getMe.bind(userControllerInstance),
  updateUser: userControllerInstance.updateUser.bind(userControllerInstance),
  deleteUser: userControllerInstance.deleteUser.bind(userControllerInstance),
  getUserPosts: userControllerInstance.getUserPosts.bind(userControllerInstance),
  getUserFollowers: userControllerInstance.getUserFollowers.bind(userControllerInstance),
  getUserFollowing: userControllerInstance.getUserFollowing.bind(userControllerInstance),
  followUser: userControllerInstance.followUser.bind(userControllerInstance),
  unfollowUser: userControllerInstance.unfollowUser.bind(userControllerInstance),
  getFollowers: userControllerInstance.getFollowers.bind(userControllerInstance),
  getFollowing: userControllerInstance.getFollowing.bind(userControllerInstance),
  searchUsers: userControllerInstance.searchUsers.bind(userControllerInstance),
  getEmailByUsername: userControllerInstance.getEmailByUsername.bind(userControllerInstance)
}; 