const ProductReview = require('../models/productReview.model');

class ReviewService {
  static async createReview(reviewData) {
    const existingReview = await ProductReview.checkUserReviewExists(
      reviewData.product_id, 
      reviewData.user_id
    );
    if (existingReview) {
      throw new Error('User has already reviewed this product');
    }
    const review = await ProductReview.create(reviewData);
    await ProductReview.updateProductRating(reviewData.product_id);
    return review;
  }

  static async getReviewById(reviewId) {
    return ProductReview.findById(reviewId);
  }

  static async getProductReviews(productId, pagination = {}) {
    return ProductReview.findByProductId(productId, pagination);
  }

  static async getUserReviews(userId, pagination = {}) {
    return ProductReview.findByUserId(userId, pagination);
  }

  static async updateReview(reviewId, updateData) {
    const review = await ProductReview.update(reviewId, updateData);
    if (review && (updateData.rating || updateData.status)) {
      await ProductReview.updateProductRating(review.product_id);
    }
    return review;
  }

  static async deleteReview(reviewId) {
    const review = await ProductReview.findById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }
    const deleted = await ProductReview.delete(reviewId);
    if (deleted) {
      await ProductReview.updateProductRating(review.product_id);
    }
    return deleted;
  }

  static async getProductRatingStats(productId) {
    return ProductReview.getProductAverageRating(productId);
  }

  static async likeReview(reviewId) {
    return ProductReview.updateLikesCount(reviewId, true);
  }

  static async unlikeReview(reviewId) {
    return ProductReview.updateLikesCount(reviewId, false);
  }

  static async approveReview(reviewId) {
    const review = await ProductReview.update(reviewId, { status: 'approved' });
    if (review) {
      await ProductReview.updateProductRating(review.product_id);
    }
    return review;
  }

  static async rejectReview(reviewId) {
    const review = await ProductReview.update(reviewId, { status: 'rejected' });
    if (review) {
      await ProductReview.updateProductRating(review.product_id);
    }
    return review;
  }
}

module.exports = ReviewService; 