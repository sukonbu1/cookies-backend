require('dotenv').config();
const rabbitmq = require('../utils/rabbitmq.util');
const pool = require('../../../common/src/config/database');

async function updateCounts(event) {
  if (event.type === 'user_follow') {
    // Increment follower count for followingId
    await pool.query('UPDATE users SET followers_count = followers_count + 1 WHERE user_id = $1', [event.followingId]);
    // Increment following count for followerId
    await pool.query('UPDATE users SET following_count = following_count + 1 WHERE user_id = $1', [event.followerId]);
  } else if (event.type === 'user_unfollow') {
    // Decrement follower count for followingId
    await pool.query('UPDATE users SET followers_count = GREATEST(followers_count - 1, 0) WHERE user_id = $1', [event.followingId]);
    // Decrement following count for followerId
    await pool.query('UPDATE users SET following_count = GREATEST(following_count - 1, 0) WHERE user_id = $1', [event.followerId]);
  }
}

async function startUserEventsConsumer() {
  await rabbitmq.consumeQueue('user-events', async (event) => {
    await updateCounts(event);
  });
  console.log('User events consumer started.');
}

if (require.main === module) {
  startUserEventsConsumer();
}

module.exports = { startUserEventsConsumer }; 