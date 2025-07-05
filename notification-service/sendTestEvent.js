const amqp = require('amqplib');

async function sendTestEvent() {
  const conn = await amqp.connect('amqp://admin:password@localhost:5672'); // Use your RABBITMQ_URL
  const channel = await conn.createChannel();
  const queue = 'notification-events';

  const events = [
    // Likes
    { type: 'like', actor_id: 'userA', target_user_id: '1SIrfb41r4hVj0YqRlWeqoW5Idw1', post_id: '7fceb296-a16e-4fbd-8364-5125ee014b79' },
    { type: 'like', actor_id: 'userB', target_user_id: '1SIrfb41r4hVj0YqRlWeqoW5Idw1', post_id: '7fceb296-a16e-4fbd-8364-5125ee014b79' },
    // Comments
    { type: 'comment', actor_id: 'userC', target_user_id: '1SIrfb41r4hVj0YqRlWeqoW5Idw1', post_id: '7fceb296-a16e-4fbd-8364-5125ee014b79', comment_id: 'cmt-1' },
    { type: 'comment', actor_id: 'userD', target_user_id: '1SIrfb41r4hVj0YqRlWeqoW5Idw1', post_id: '7fceb296-a16e-4fbd-8364-5125ee014b79', comment_id: 'cmt-2' },
    // Shares
    { type: 'share', actor_id: 'userE', target_user_id: '1SIrfb41r4hVj0YqRlWeqoW5Idw1', post_id: '7fceb296-a16e-4fbd-8364-5125ee014b79' },
    { type: 'share', actor_id: 'userF', target_user_id: '1SIrfb41r4hVj0YqRlWeqoW5Idw1', post_id: '7fceb296-a16e-4fbd-8364-5125ee014b79' },
    // Follows
    { type: 'follow', actor_id: 'userG', target_user_id: '1SIrfb41r4hVj0YqRlWeqoW5Idw1' },
    { type: 'follow', actor_id: 'userH', target_user_id: '1SIrfb41r4hVj0YqRlWeqoW5Idw1' }
  ];

  await channel.assertQueue(queue, { durable: true });
  for (const event of events) {
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(event)));
    await new Promise(res => setTimeout(res, 500)); // 500ms delay
  }
  console.log('Test events sent!');
  await channel.close();
  await conn.close();
}

sendTestEvent();