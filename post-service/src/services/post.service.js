const Post = require('../models/post.model');
const PostLike = require('../models/post-like.model');
const PostComment = require('../models/post-comment.model');

class PostService {
  static async getAllPosts() {
    try {
      const posts = await Post.findAll();
      // Fetch likes and comments for each post separately
      for (const post of posts) {
        const likes = await PostLike.findByContentId(post.post_id, 'post');
        post.likes = likes;
        const comments = await PostComment.findByPostId(post.post_id);
        post.comments = comments;
      }
      return posts;
    } catch (error) {
      throw error;
    }
  }

  static async getPostById(postId) {
    try {
      const post = await Post.findById(postId);
      if (!post) {
        throw new Error('Post not found');
      }
      // Fetch likes and comments for this post
      const likes = await PostLike.findByContentId(post.post_id, 'post');
      post.likes = likes;
      const comments = await PostComment.findByPostId(post.post_id);
      post.comments = comments;
      return post;
    } catch (error) {
      throw error;
    }
  }

  static async createPost(postData, userId) {
    try {
      const post = await Post.create({
        ...postData,
        user_id: userId
      });

      return post;
    } catch (error) {
      throw error;
    }
  }

  static async updatePost(postId, userId, updateData) {
    try {
      // Get current post to verify it exists
      const currentPost = await Post.findById(postId);
      if (!currentPost) {
        throw new Error('Post not found');
      }

      // Check if user owns the post
      if (currentPost.user_id !== userId) {
        throw new Error('Unauthorized to update this post');
      }

      const updatedPost = await Post.update(postId, userId, updateData);
      return updatedPost;
    } catch (error) {
      throw error;
    }
  }

  static async deletePost(postId, userId) {
    try {
      // Get current post to verify it exists
      const currentPost = await Post.findById(postId);
      if (!currentPost) {
        throw new Error('Post not found');
      }

      // Check if user owns the post
      if (currentPost.user_id !== userId) {
        throw new Error('Unauthorized to delete this post');
      }

      await Post.delete(postId, userId);
      return true;
    } catch (error) {
      throw error;
    }
  }

  static async likePost(postId, userId) {
    try {
      // Check if post exists
      const post = await Post.findById(postId);
      if (!post) {
        throw new Error('Post not found');
      }

      // Check if user already liked the post
      const existingLike = await PostLike.findByPostId(postId);
      if (existingLike.some(like => like.user_id === userId)) {
        throw new Error('Post already liked by user');
      }

      const like = await PostLike.create(postId, userId);
      return like;
    } catch (error) {
      throw error;
    }
  }

  static async unlikePost(postId, userId) {
    try {
      // Check if post exists
      const post = await Post.findById(postId);
      if (!post) {
        throw new Error('Post not found');
      }

      // Check if user has liked the post
      const existingLike = await PostLike.findByPostId(postId);
      if (!existingLike.some(like => like.user_id === userId)) {
        throw new Error('Post not liked by user');
      }

      await PostLike.delete(postId, userId);
      return true;
    } catch (error) {
      throw error;
    }
  }

  static async addComment(postId, userId, content) {
    try {
      // Check if post exists
      const post = await Post.findById(postId);
      if (!post) {
        throw new Error('Post not found');
      }

      const comment = await PostComment.create(postId, userId, content);
      return comment;
    } catch (error) {
      throw error;
    }
  }

  static async deleteComment(commentId, userId) {
    try {
      // Check if comment exists and belongs to user
      const comment = await PostComment.findById(commentId);
      if (!comment) {
        throw new Error('Comment not found');
      }

      if (comment.user_id !== userId) {
        throw new Error('Unauthorized to delete this comment');
      }

      await PostComment.delete(commentId, userId);
      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = PostService; 