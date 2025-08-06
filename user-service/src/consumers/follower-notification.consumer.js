const path = require('path');

// Try multiple paths to load the .env file
const envPath1 = path.resolve(__dirname, '../../.env');
const envPath2 = path.resolve(process.cwd(), 'user-service/.env');
const envPath3 = path.resolve('/home/cookies-backend/user-service/.env');

console.log('Attempting to load .env from paths:');
console.log('Path 1:', envPath1);
console.log('Path 2:', envPath2);
console.log('Path 3:', envPath3);

// Try loading from different paths
const fs = require('fs');
let loadedFromPath = null;

if (fs.existsSync(envPath1)) {
  console.log('Loading .env from path 1:', envPath1);
  require('dotenv').config({ path: envPath1 });
  loadedFromPath = envPath1;
} else if (fs.existsSync(envPath2)) {
  console.log('Loading .env from path 2:', envPath2);
  require('dotenv').config({ path: envPath2 });
  loadedFromPath = envPath2;
} else if (fs.existsSync(envPath3)) {
  console.log('Loading .env from path 3:', envPath3);
  require('dotenv').config({ path: envPath3 });
  loadedFromPath = envPath3;
} else {
  console.log('No .env file found, trying default dotenv config');
  require('dotenv').config();
}

console.log('Loaded .env from:', loadedFromPath);
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);


const rabbitmq = require('../utils/rabbitmq.util');
const pool = require('../../../common/src/config/database');
const HttpClient = require('../utils/http.util');

async function notifyFollowers(event) {
  try {
    console.log('Processing follower notification event:', event);
    
    if (event.type === 'new_post') {
      // Get all followers of the post author
      const query = `
        SELECT follower_id 
        FROM user_followers 
        WHERE following_id = $1
      `;
      const { rows } = await pool.query(query, [event.author_id]);
      
      if (rows.length === 0) {
        console.log(`No followers found for user ${event.author_id}`);
        return;
      }
      
      // Get the author's username
      const authorName = await HttpClient.getUsernameById(event.author_id);
      
      // Send notification to each follower
      for (const follower of rows) {
        await rabbitmq.sendToQueue('notification-events', {
          type: 'new_post',
          actor_id: event.author_id,
          actor_name: authorName,
          target_user_id: follower.follower_id,
          reference_id: event.post_id,
          post_title: event.post_title
        });
      }
      
      console.log(`Sent new post notifications to ${rows.length} followers`);
    }
  } catch (error) {
    console.error('Error processing follower notification:', error);
  }
}

async function startFollowerNotificationConsumer() {
  await rabbitmq.consumeQueue('follower-notification-events', async (event) => {
    await notifyFollowers(event);
  });
  console.log('Follower notification consumer started.');
}

if (require.main === module) {
  startFollowerNotificationConsumer();
}

module.exports = { startFollowerNotificationConsumer }; 