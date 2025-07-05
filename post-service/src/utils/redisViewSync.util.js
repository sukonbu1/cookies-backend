const cron = require('node-cron');
const redis = require('../../../common/src/config/redis');
const Post = require('../models/post.model');

// Helper to get all keys matching pattern
async function getKeys(pattern) {
  return new Promise((resolve, reject) => {
    const stream = redis.scanStream({ match: pattern });
    const keys = [];
    stream.on('data', (resultKeys) => keys.push(...resultKeys));
    stream.on('end', () => resolve(keys));
    stream.on('error', reject);
  });
}

// Sync function
async function syncViews() {
  try {
    const keys = await getKeys('post:*:views');
    for (const key of keys) {
      const postId = key.split(':')[1];
      const count = parseInt(await redis.get(key) || '0', 10);
      if (count > 0) {
        await Post.incrementViews(postId, count); // We'll update this method to accept a count
        await redis.del(key);
        console.log(`Synced ${count} views for post ${postId}`);
      }
    }
  } catch (err) {
    console.error('Error syncing post views:', err);
  }
}

// Schedule every 5 minutes
cron.schedule('*/5 * * * *', syncViews);

module.exports = { syncViews }; 