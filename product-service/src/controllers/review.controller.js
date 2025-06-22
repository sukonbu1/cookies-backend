const ReviewService = require('../services/review.service');

class ReviewController {
  async createReview(req, res, next) {
    try {
      const user_id = req.user.uid || req.user.userId || req.user.id || req.user.sub;
      const { productId } = req.params;
      
      const reviewData = {
        ...req.body,
        product_id: productId,
        user_id
      };

      const review = await ReviewService.createReview(reviewData);
      
      res.status(201).json({
        status: 'success',
        data: review
      });
    } catch (error) {
      next(error);
    }
  }

  async getReviewById(req, res, next) {
    try {
      const review = await ReviewService.getReviewById(req.params.reviewId);
      
      if (!review) {
        return res.status(404).json({
          status: 'error',
          message: 'Review not found'
        });
      }

      res.json({
        status: 'success',
        data: review
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductReviews(req, res, next) {
    try {
      const { productId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      const result = await ReviewService.getProductReviews(productId, { page, limit });
      
      res.json({
        status: 'success',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserReviews(req, res, next) {
    try {
      const user_id = req.user.uid || req.user.userId || req.user.id || req.user.sub;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      const result = await ReviewService.getUserReviews(user_id, { page, limit });
      
      res.json({
        status: 'success',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  async updateReview(req, res, next) {
    try {
      const { reviewId } = req.params;
      const user_id = req.user.uid || req.user.userId || req.user.id || req.user.sub;
      
      // Check if user owns the review
      const review = await ReviewService.getReviewById(reviewId);
      if (!review) {
        return res.status(404).json({
          status: 'error',
          message: 'Review not found'
        });
      }
      
      if (review.user_id !== user_id) {
        return res.status(403).json({
          status: 'error',
          message: 'You can only update your own reviews'
        });
      }

      const updatedReview = await ReviewService.updateReview(reviewId, req.body);
      
      res.json({
        status: 'success',
        data: updatedReview
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteReview(req, res, next) {
    try {
      const { reviewId } = req.params;
      const user_id = req.user.uid || req.user.userId || req.user.id || req.user.sub;
      
      // Check if user owns the review
      const review = await ReviewService.getReviewById(reviewId);
      if (!review) {
        return res.status(404).json({
          status: 'error',
          message: 'Review not found'
        });
      }
      
      if (review.user_id !== user_id) {
        return res.status(403).json({
          status: 'error',
          message: 'You can only delete your own reviews'
        });
      }

      await ReviewService.deleteReview(reviewId);
      
      res.json({
        status: 'success',
        message: 'Review deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductRatingStats(req, res, next) {
    try {
      const { productId } = req.params;
      const stats = await ReviewService.getProductRatingStats(productId);
      
      res.json({
        status: 'success',
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  async likeReview(req, res, next) {
    try {
      const { reviewId } = req.params;
      const review = await ReviewService.likeReview(reviewId);
      
      res.json({
        status: 'success',
        data: review
      });
    } catch (error) {
      next(error);
    }
  }

  async unlikeReview(req, res, next) {
    try {
      const { reviewId } = req.params;
      const review = await ReviewService.unlikeReview(reviewId);
      
      res.json({
        status: 'success',
        data: review
      });
    } catch (error) {
      next(error);
    }
  }

  async approveReview(req, res, next) {
    try {
      const { reviewId } = req.params;
      const review = await ReviewService.approveReview(reviewId);
      
      res.json({
        status: 'success',
        data: review
      });
    } catch (error) {
      next(error);
    }
  }

  async rejectReview(req, res, next) {
    try {
      const { reviewId } = req.params;
      const review = await ReviewService.rejectReview(reviewId);
      
      res.json({
        status: 'success',
        data: review
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReviewController(); 