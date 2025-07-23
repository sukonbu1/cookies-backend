require('dotenv').config();
const rabbitmq = require('../utils/rabbitmq.util');
const pool = require('../../common/src/config/database');

async function updateCounts(event) {
  switch (event.type) {
    case 'post_like':
      await pool.query('UPDATE posts SET likes_count = likes_count + 1 WHERE post_id = $1', [event.postId]);
      break;
    case 'post_unlike':
      await pool.query('UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE post_id = $1', [event.postId]);
      break;
    case 'post_create':
      await pool.query('UPDATE users SET posts_count = posts_count + 1 WHERE user_id = $1', [event.userId]);
      break;
    case 'post_delete':
      await pool.query('UPDATE users SET posts_count = GREATEST(posts_count - 1, 0) WHERE user_id = $1', [event.userId]);
      break;
    default:
      break;
  }
}

async function startPostEventsConsumer() {
  await rabbitmq.consumeQueue('post-events', async (event) => {
    await updateCounts(event);
  });
  console.log('Post events consumer started.');
}

if (require.main === module) {
  startPostEventsConsumer();
}

module.exports = { startPostEventsConsumer }; 