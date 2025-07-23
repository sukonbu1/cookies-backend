require('dotenv').config();
const rabbitmq = require('../utils/rabbitmq.util');
const pool = require('../../../common/src/config/database');
const CacheUtil = require('../utils/cache.util');

async function updateCounts(event) {
  switch (event.type) {
    case 'post_create':
      await pool.query('UPDATE users SET posts_count = posts_count + 1 WHERE user_id = $1', [event.userId]);
      await CacheUtil.invalidateUserCache(event.userId);
      break;
    case 'post_delete':
      await pool.query('UPDATE users SET posts_count = GREATEST(posts_count - 1, 0) WHERE user_id = $1', [event.userId]);
      await CacheUtil.invalidateUserCache(event.userId);
      break;
    default:
      break;
  }
}

async function startPostEventsConsumer() {
  await rabbitmq.consumeQueue('post-events', async (event) => {
    await updateCounts(event);
  });
  console.log('User-service post-events consumer started.');
}

if (require.main === module) {
  startPostEventsConsumer();
}

module.exports = { startPostEventsConsumer }; 