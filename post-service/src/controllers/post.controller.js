const Post = require('../models/post.model');
const PostLike = require('../models/post-like.model');
const PostComment = require('../models/post-comment.model');
const PostMedia = require('../models/post-media.model');
const PostShare = require('../models/post-share.model');
const redis = require('../../../common/src/config/redis');
const { v4: uuidv4 } = require('uuid');
const Hashtag = require('../models/hashtag.model');
const rabbitmq = require('../utils/rabbitmq.util');

const CACHE_TTL = 300; // 5 minutes

// Utility to extract hashtags from text (e.g. #food)
function extractHashtags(text) {
  if (!text) return [];
  const matches = text.match(/#(\w+)/g);
  return matches ? matches.map(tag => tag.slice(1).toLowerCase()) : [];
}

class PostController {
  async createPost(req, res, next) {
    try {
      const { content_type, title, description, cooking_time, difficulty_level, serving_size, has_recipe, is_premium, premium_price, status, is_featured } = req.body;
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
      // Extract hashtags from content
      const hashtags = extractHashtags(description);
      if (hashtags.length > 0) {
        await Hashtag.linkPostHashtags(post.post_id, hashtags);
      }
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
      const cacheKey = `post:${id}`;
      const cached = await redis.get(cacheKey);
      if (cached) return res.json(JSON.parse(cached));
      const post = await Post.findById(id);
      if (!post) return res.status(404).json({ message: 'Post not found' });
      await redis.set(cacheKey, JSON.stringify(post), 'EX', CACHE_TTL);
      res.json({ status: 'success', data: post });
    } catch (error) {
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
      await Post.updateCounts(id, 'likes', true);
      // Emit event for like count update
      await rabbitmq.sendToQueue('post-events', {
        type: 'post_like',
        postId: id
      });
      res.json({ status: 'success', data: like });
    } catch (error) {
      next(error);
    }
  }

  async unlikePost(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.uid || req.user.userId;
      const unliked = await PostLike.delete(id, userId);
      await Post.updateCounts(id, 'likes', false);
      // Emit event for like count update
      await rabbitmq.sendToQueue('post-events', {
        type: 'post_unlike',
        postId: id
      });
      res.json({ status: 'success', message: 'Post unliked successfully', data: unliked });
    } catch (error) {
      next(error);
    }
  }

  async addComment(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.uid || req.user.userId;
      const { content } = req.body;
      const comment = await PostComment.create(id, userId, content);
      await Post.updateCounts(id, 'comments', true);
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
      }
      res.json({ status: 'success', message: 'Comment deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async uploadMedia(req, res, next) {
    try {
      const { id: postId } = req.params;
      const files = req.files;
      if (!files || files.length === 0) {
        return res.status(400).json({ status: 'error', message: 'No files uploaded' });
      }
      const mediaRecords = [];
      for (const file of files) {
        const mediaUrl = file.path;
        const mediaType = file.mimetype.startsWith('image') ? 'image' : 'video';
        const media = await PostMedia.create({
          post_id: postId,
          media_type: mediaType,
          media_url: mediaUrl
        });
        mediaRecords.push(media);
      }
      res.status(201).json({ status: 'success', data: mediaRecords });
    } catch (error) {
      next(error);
    }
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
}

module.exports = new PostController(); 