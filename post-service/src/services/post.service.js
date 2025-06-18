const Post = require('../models/post.model');
const PostLike = require('../models/post-like.model');
const PostComment = require('../models/post-comment.model');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary.utils');

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

  static async createPost(postData, userId, imageFile) {
    try {
      let imageUrl = null;
      let imagePublicId = null;

      // Upload image to Cloudinary if provided
      if (imageFile) {
        const uploadResult = await uploadToCloudinary(imageFile, 'post-images');
        imageUrl = uploadResult.secure_url;
        imagePublicId = uploadResult.public_id;
      }

      const post = await Post.create({
        ...postData,
        user_id: userId,
        image_url: imageUrl,
        image_public_id: imagePublicId
      });

      return post;
    } catch (error) {
      // If there was an error and we uploaded an image, delete it from Cloudinary
      if (imageFile) {
        await deleteFromCloudinary(imageFile.public_id);
      }
      throw error;
    }
  }

  static async updatePost(postId, userId, updateData, imageFile) {
    try {
      // Get current post to check if there's an existing image
      const currentPost = await Post.findById(postId);
      if (!currentPost) {
        throw new Error('Post not found');
      }

      // Check if user owns the post
      if (currentPost.user_id !== userId) {
        throw new Error('Unauthorized to update this post');
      }

      let imageUrl = updateData.image_url;
      let imagePublicId = currentPost.image_public_id;

      // If new image is provided, upload it and delete the old one
      if (imageFile) {
        const uploadResult = await uploadToCloudinary(imageFile, 'post-images');
        imageUrl = uploadResult.secure_url;
        imagePublicId = uploadResult.public_id;

        // Delete old image if exists
        if (currentPost.image_public_id) {
          await deleteFromCloudinary(currentPost.image_public_id);
        }
      }

      const updatedPost = await Post.update(postId, userId, {
        ...updateData,
        image_url: imageUrl,
        image_public_id: imagePublicId
      });

      return updatedPost;
    } catch (error) {
      // If there was an error and we uploaded a new image, delete it from Cloudinary
      if (imageFile) {
        await deleteFromCloudinary(imageFile.public_id);
      }
      throw error;
    }
  }

  static async deletePost(postId, userId) {
    try {
      // Get current post to check if there's an image to delete
      const currentPost = await Post.findById(postId);
      if (!currentPost) {
        throw new Error('Post not found');
      }

      // Check if user owns the post
      if (currentPost.user_id !== userId) {
        throw new Error('Unauthorized to delete this post');
      }

      // Delete image from Cloudinary if exists
      if (currentPost.image_public_id) {
        await deleteFromCloudinary(currentPost.image_public_id);
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