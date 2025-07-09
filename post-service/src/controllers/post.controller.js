const Post = require('../models/post.model');
const PostLike = require('../models/post-like.model');
const PostComment = require('../models/post-comment.model');
const PostMedia = require('../models/post-media.model');
const PostShare = require('../models/post-share.model');

const redis = require('../../../common/src/config/redis');
const { v4: uuidv4 } = require('uuid');
const Hashtag = require('../models/hashtag.model');
const rabbitmq = require('../utils/rabbitmq.util');
const PostService = require('../services/post.service');
const HttpClient = require('../utils/http.util');
const CacheUtil = require('../utils/cache.util');

const CACHE_TTL = 60; // 1 minute (reduced from 5 minutes for better responsiveness)

// Utility to extract hashtags from text (e.g. #food)
function extractHashtags(text) {
  if (!text) return [];
  const matches = text.match(/#(\w+)/g);
  return matches ? matches.map(tag => tag.slice(1).toLowerCase()) : [];
}

class PostController {
  async createPost(req, res, next) {
    try {
      const { content_type, title, description, cooking_time, difficulty_level, serving_size, has_recipe, is_premium, premium_price, status, is_featured, media } = req.body;
      const userId = req.user.uid || req.user.userId;
      const post = await Post.create({
        user_id: userId,
        content_type,
        title,
        description,
        cooking_time,
        difficulty_level,
        serving_size,
        has_recipe,
        is_premium,
        premium_price,
        status,
        is_featured
      });
      // Save media URLs if provided
      if (Array.isArray(media)) {
        for (const m of media) {
          // m should be { url: string, type: 'image' | 'video', ... }
          await PostMedia.create({
            post_id: post.post_id,
            media_type: m.type || 'image',
            media_url: m.url,
            thumbnail_url: m.thumbnail_url || null,
            duration: m.duration || null,
            width: m.width || null,
            height: m.height || null,
            file_size: m.file_size || null,
            position: m.position || null
          });
        }
      }
      // Extract hashtags from content
      const hashtags = extractHashtags(description);
      if (hashtags.length > 0) {
        await Hashtag.linkPostHashtags(post.post_id, hashtags);
      }
      
      // Invalidate user-related caches since post count changed
      await CacheUtil.invalidateUserCache(userId);
      
      // Emit event for post count update
      await rabbitmq.sendToQueue('post-events', {
        type: 'post_create',
        userId: userId,
        postId: post.post_id
      });
      // Attach hashtags to response
      post.hashtags = hashtags;
      res.status(201).json(post);
    } catch (error) {
      next(error);
    }
  }

  async getAllPosts(req, res, next) {
    try {
      const posts = await Post.findAll();
      res.json({ status: 'success', data: posts });
    } catch (error) {
      next(error);
    }
  }

  async getPostById(req, res, next) {
    try {
      const { id } = req.params;
      const { refresh } = req.query; // Add refresh parameter to bypass cache
      const cacheKey = `post:${id}`;
      console.log(`[DEBUG] Getting post ${id}, checking cache key: ${cacheKey}`);
      
      // If refresh parameter is provided, skip cache
      if (refresh === 'true') {
        console.log(`[DEBUG] Force refresh requested for post ${id}, bypassing cache`);
        await CacheUtil.invalidatePostCache(id);
      }
      
      const cached = await redis.get(cacheKey);
      if (cached) {
        console.log(`[DEBUG] Cache HIT for post ${id}, returning cached data`);
        return res.json(JSON.parse(cached));
      }
      
      console.log(`[DEBUG] Cache MISS for post ${id}, fetching from database`);
      const startTime = Date.now();
      
      // Use service layer to get post with comments and likes
      const post = await PostService.getPostById(id);
      
      console.log(`[DEBUG] Database fetch took ${Date.now() - startTime}ms for post ${id}`);
      
      // Get real-time views from Redis
      const redisKey = `post:${id}:views`;
      const redisViews = parseInt(await redis.get(redisKey) || '0', 10);
      post.views_count = (post.views_count || 0) + redisViews;
      
      const response = { status: 'success', data: post };
      await redis.set(cacheKey, JSON.stringify(response), 'EX', CACHE_TTL);
      console.log(`[DEBUG] Cached post ${id} for ${CACHE_TTL} seconds`);
      
      res.json(response);
    } catch (error) {
      if (error.message === 'Post not found') {
        return res.status(404).json({ status: 'error', message: 'Post not found' });
      }
      next(error);
    }
  }

  // New method to get fresh post data without cache
  async getFreshPostById(req, res, next) {
    try {
      const { id } = req.params;
      console.log(`[DEBUG] Getting fresh post data for ${id}`);
      
      // Force invalidate cache
      await CacheUtil.invalidatePostCache(id);
      
      const startTime = Date.now();
      
      // Use service layer to get post with comments and likes
      const post = await PostService.getPostById(id);
      
      console.log(`[DEBUG] Fresh database fetch took ${Date.now() - startTime}ms for post ${id}`);
      
      // Get real-time views from Redis
      const redisKey = `post:${id}:views`;
      const redisViews = parseInt(await redis.get(redisKey) || '0', 10);
      post.views_count = (post.views_count || 0) + redisViews;
      
      const response = { status: 'success', data: post };
      
      res.json(response);
    } catch (error) {
      if (error.message === 'Post not found') {
        return res.status(404).json({ status: 'error', message: 'Post not found' });
      }
      next(error);
    }
  }

  async getUserPosts(req, res, next) {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      // Try to get from cache first
      const cacheKey = `user:${userId}:posts:${page}:${limit}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      const posts = await Post.findByUserId(userId, limit, offset);
      
      // Cache the result
      await redis.set(cacheKey, JSON.stringify({ 
        status: 'success', 
        data: posts,
        pagination: {
          page,
          limit,
          offset
        }
      }), 'EX', CACHE_TTL);

      res.json({ 
        status: 'success', 
        data: posts,
        pagination: {
          page,
          limit,
          offset
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async updatePost(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.uid || req.user.userId;
      const allowedFields = [
        'title', 'description', 'content_type', 'cooking_time', 'difficulty_level',
        'serving_size', 'has_recipe', 'is_premium', 'premium_price', 'status', 'is_featured'
      ];
      const updates = {};
      for (const key of allowedFields) {
        if (req.body[key] !== undefined) {
          updates[key] = req.body[key];
        }
      }
      const post = await Post.update(id, userId, updates);
      if (!post) return res.status(404).json({ status: 'error', message: 'Post not found or unauthorized' });
      
      // Invalidate cache for this post
      await CacheUtil.invalidatePostCache(id);
      
      // Remove old hashtags and add new ones
      if (updates.description) {
        const hashtags = extractHashtags(updates.description);
        await Hashtag.linkPostHashtags(id, hashtags);
        post.hashtags = hashtags;
      }
      res.json({ status: 'success', data: post });
    } catch (error) {
      next(error);
    }
  }

  async deletePost(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.uid || req.user.userId;
      const deleted = await Post.delete(id, userId);
      if (!deleted) return res.status(404).json({ status: 'error', message: 'Post not found or unauthorized' });
      
      // Invalidate cache for this post
      await CacheUtil.invalidatePostCache(id);
      
      // Emit event for post count update
      await rabbitmq.sendToQueue('post-events', {
        type: 'post_delete',
        userId: userId,
        postId: id
      });
      res.json({ status: 'success', message: 'Post deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async likePost(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.uid || req.user.userId;
      const like = await PostLike.create(id, userId);
      const updatedPost = await Post.updateCounts(id, 'likes', true);
      
      // Invalidate cache for this post
      await CacheUtil.invalidatePostCache(id);
      
      // Emit event for like count update
      await rabbitmq.sendToQueue('post-events', {
        type: 'post_like',
        postId: id
      });
      
      // Fetch the post to get the owner
      const post = await Post.findById(id);
      // Fetch the actor's username
      const actorName = await HttpClient.getUsernameById(userId);
      if (post && post.user_id && post.user_id !== userId) {
        await rabbitmq.sendToQueue('notification-events', {
          type: 'like',
          actor_id: userId,
          actor_name: actorName,
          target_user_id: post.user_id,
          post_id: id
        });
      }
      
      // Return the updated post data immediately
      res.json({ 
        status: 'success', 
        data: like,
        updatedPost: {
          post_id: id,
          likes_count: updatedPost.likes_count
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async unlikePost(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.uid || req.user.userId;
      const unliked = await PostLike.delete(id, userId);
      const updatedPost = await Post.updateCounts(id, 'likes', false);
      
      // Invalidate cache for this post
      await CacheUtil.invalidatePostCache(id);
      
      // Emit event for like count update
      await rabbitmq.sendToQueue('post-events', {
        type: 'post_unlike',
        postId: id
      });
      
      // Return the updated post data immediately
      res.json({ 
        status: 'success', 
        message: 'Post unliked successfully', 
        data: unliked,
        updatedPost: {
          post_id: id,
          likes_count: updatedPost.likes_count
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async addComment(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.uid || req.user.userId;
      const { content, parent_comment_id } = req.body;
      const comment = await PostService.addComment(id, userId, content, parent_comment_id);
      await Post.updateCounts(id, 'comments', true);
      
      // Invalidate cache for this post
      await CacheUtil.invalidatePostCache(id);
      
      // Fetch the post to get the owner
      const post = await Post.findById(id);
      // Fetch the actor's username
      const actorName = await HttpClient.getUsernameById(userId);
      if (post && post.user_id && post.user_id !== userId) {
        await rabbitmq.sendToQueue('notification-events', {
          type: 'comment',
          actor_id: userId,
          actor_name: actorName,
          target_user_id: post.user_id,
          post_id: id,
          comment_id: comment.comment_id
        });
      }
      res.status(201).json({ status: 'success', data: comment });
    } catch (error) {
      next(error);
    }
  }

  async deleteComment(req, res, next) {
    try {
      const { commentId } = req.params;
      const userId = req.user.uid || req.user.userId;
      // Fetch the comment to get post_id before deleting
      const comment = await PostComment.findById(commentId);
      const deleted = await PostComment.delete(commentId, userId);
      if (!deleted) return res.status(404).json({ status: 'error', message: 'Comment not found or unauthorized' });
      if (comment && comment.post_id) {
        await Post.updateCounts(comment.post_id, 'comments', false);
        
        // Invalidate cache for this post
        await CacheUtil.invalidatePostCache(comment.post_id);
      }
      res.json({ status: 'success', message: 'Comment deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async uploadMedia(req, res, next) {
    // This endpoint is deprecated in the new flow (media is handled in createPost)
    return res.status(410).json({ status: 'error', message: 'Upload via backend is deprecated. Please upload to Cloudinary from the frontend and send URLs.' });
  }

  async sharePost(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.uid || req.user.userId;
      const { platform = 'app' } = req.body;

      // Validate platform
      const validPlatforms = ['app', 'facebook', 'twitter', 'instagram', 'whatsapp', 'other'];
      if (!validPlatforms.includes(platform)) {
        return res.status(400).json({ 
          status: 'error', 
          message: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}` 
        });
      }

      const share = await PostShare.create(id, userId, platform);
      await Post.updateCounts(id, 'shares', true);
      
      // Invalidate cache for this post
      await CacheUtil.invalidatePostCache(id);
      
      // Fetch the post to get the owner
      const post = await Post.findById(id);
      // Fetch the actor's username
      const actorName = await HttpClient.getUsernameById(userId);
      if (post && post.user_id && post.user_id !== userId) {
        await rabbitmq.sendToQueue('notification-events', {
          type: 'share',
          actor_id: userId,
          actor_name: actorName,
          target_user_id: post.user_id,
          post_id: id
        });
      }
      res.status(201).json({ status: 'success', data: share });
    } catch (error) {
      next(error);
    }
  }

  async getPostShares(req, res, next) {
    try {
      const { id } = req.params;
      const shares = await PostShare.findByPostId(id);
      res.json({ status: 'success', data: shares });
    } catch (error) {
      next(error);
    }
  }

  async getPostsByHashtag(req, res, next) {
    try {
      const { name } = req.params;
      const { limit = 20, offset = 0 } = req.query;
      const posts = await Hashtag.getPostsByHashtag(name, limit, offset);
      res.json(posts);
    } catch (error) {
      next(error);
    }
  }

  async searchHashtags(req, res, next) {
    try {
      const { q = '', limit = 10 } = req.query;
      if (!q) return res.json([]);
      const hashtags = await Hashtag.searchByPrefix(q, limit);
      res.json(hashtags);
    } catch (error) {
      next(error);
    }
  }

  async searchPosts(req, res, next) {
    try {
      const { q = '', page = 1, limit = 10 } = req.query;
      if (!q) return res.status(400).json({ status: 'error', message: 'Search query is required' });
      const pagination = { page: parseInt(page), limit: parseInt(limit) };
      const posts = await Post.searchPosts(q, pagination);
      res.json({ status: 'success', data: posts, pagination });
    } catch (error) {
      next(error);
    }
  }

  async incrementView(req, res, next) {
    try {
      const { id } = req.params;
      // Increment view count in Redis
      const redisKey = `post:${id}:views`;
      const redisCount = await redis.incr(redisKey);
      res.json({ status: 'success', views: redisCount });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PostController(); 