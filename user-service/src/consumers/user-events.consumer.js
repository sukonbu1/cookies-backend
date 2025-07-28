require('dotenv').config();
const rabbitmq = require('../utils/rabbitmq.util');
const pool = require('../../../common/src/config/database');

async function updateCounts(event) {
  console.log('[USER EVENTS CONSUMER] Received event:', event);
  
  if (event.type === 'user_follow') {
    console.log('[USER EVENTS CONSUMER] Processing user_follow event:', {
      followerId: event.followerId,
      followingId: event.followingId
    });
    
    // Increment follower count for followingId
    await pool.query('UPDATE users SET followers_count = followers_count + 1 WHERE user_id = $1', [event.followingId]);
    console.log(`[USER EVENTS CONSUMER] Incremented followers_count for user: ${event.followingId}`);
    
    // Increment following count for followerId
    await pool.query('UPDATE users SET following_count = following_count + 1 WHERE user_id = $1', [event.followerId]);
    console.log(`[USER EVENTS CONSUMER] Incremented following_count for user: ${event.followerId}`);
    
  } else if (event.type === 'user_unfollow') {
    console.log('[USER EVENTS CONSUMER] Processing user_unfollow event:', {
      followerId: event.followerId,
      followingId: event.followingId
    });
    
    // Decrement follower count for followingId
    await pool.query('UPDATE users SET followers_count = GREATEST(followers_count - 1, 0) WHERE user_id = $1', [event.followingId]);
    console.log(`[USER EVENTS CONSUMER] Decremented followers_count for user: ${event.followingId}`);
    
    // Decrement following count for followerId
    await pool.query('UPDATE users SET following_count = GREATEST(following_count - 1, 0) WHERE user_id = $1', [event.followerId]);
    console.log(`[USER EVENTS CONSUMER] Decremented following_count for user: ${event.followerId}`);
    
  } else {
    console.log('[USER EVENTS CONSUMER] Unknown event type:', event.type);
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