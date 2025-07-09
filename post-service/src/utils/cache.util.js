const redis = require('../../../common/src/config/redis');

class CacheUtil {
  /**
   * Invalidate cache for a specific post
   * @param {string} postId - The post ID
   */
  static async invalidatePostCache(postId) {
    try {
      const cacheKey = `post:${postId}`;
      await redis.del(cacheKey);
      console.log(`Cache invalidated for post: ${postId}`);
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
      const keys = await this.getKeys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`Cache invalidated for user: ${userId}, keys: ${keys.length}`);
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
      const keys = await this.getKeys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`Cleared ${keys.length} post cache keys`);
      }
    } catch (error) {
      console.error('Error clearing post caches:', error);
    }
  }
}

module.exports = CacheUtil; 