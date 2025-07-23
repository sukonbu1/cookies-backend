const redis = require('../../../common/src/config/redis');

class CacheUtil {
  /**
   * Invalidate cache for a specific post
   * @param {string} postId - The post ID
   */
  static async invalidatePostCache(postId) {
    try {
      const cacheKey = `post:${postId}`;
      console.log(`[DEBUG] Invalidating cache for post: ${postId}, key: ${cacheKey}`);
      const result = await redis.del(cacheKey);
      console.log(`[DEBUG] Cache invalidation result for post ${postId}: ${result} keys deleted`);
    } catch (error) {
      console.error('Error invalidating post cache:', error);
    }
  }

  /**
   * Invalidate all user-related caches
   * @param {string} userId - The user ID
   */
  static async invalidateUserCache(userId) {
    try {
      const pattern = `user:${userId}:*`;
      console.log(`[DEBUG] Invalidating user cache for user: ${userId}, pattern: ${pattern}`);
      const keys = await this.getKeys(pattern);
      if (keys.length > 0) {
        const result = await redis.del(...keys);
        console.log(`[DEBUG] Cache invalidation result for user ${userId}: ${result} keys deleted`);
      } else {
        console.log(`[DEBUG] No cache keys found for user ${userId}`);
      }
    } catch (error) {
      console.error('Error invalidating user cache:', error);
    }
  }

  /**
   * Get all keys matching a pattern
   * @param {string} pattern - Redis key pattern
   * @returns {Promise<string[]>} Array of matching keys
   */
  static async getKeys(pattern) {
    return new Promise((resolve, reject) => {
      const stream = redis.scanStream({ match: pattern });
      const keys = [];
      stream.on('data', (resultKeys) => keys.push(...resultKeys));
      stream.on('end', () => resolve(keys));
      stream.on('error', reject);
    });
  }

  /**
   * Clear all post-related caches
   */
  static async clearAllPostCaches() {
    try {
      const pattern = 'post:*';
      console.log(`[DEBUG] Clearing all post caches with pattern: ${pattern}`);
      const keys = await this.getKeys(pattern);
      if (keys.length > 0) {
        const result = await redis.del(...keys);
        console.log(`[DEBUG] Cleared ${result} post cache keys`);
      } else {
        console.log(`[DEBUG] No post cache keys found to clear`);
      }
    } catch (error) {
      console.error('Error clearing post caches:', error);
    }
  }
}

module.exports = CacheUtil; 