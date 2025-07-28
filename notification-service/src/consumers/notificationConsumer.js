const amqp = require('amqplib');
const {
  createNotification,
  findUnreadAggregated,
  updateAggregatedNotification
} = require('../models/notification.model.js');
const { sendNotification } = require('../sockets/socket.js');

function formatContent(type, actors, reference_type) {
  if (type === 'like') {
    if (actors.length === 1) return `${actors[0]} liked your ${reference_type}.`;
    if (actors.length === 2) return `${actors[0]} and ${actors[1]} liked your ${reference_type}.`;
    if (actors.length > 2) return `${actors[0]}, ${actors[1]}, and ${actors.length - 2} others liked your ${reference_type}.`;
  }
  if (type === 'comment') {
    if (actors.length === 1) return `${actors[0]} commented on your ${reference_type}.`;
    if (actors.length === 2) return `${actors[0]} and ${actors[1]} commented on your ${reference_type}.`;
    if (actors.length > 2) return `${actors[0]}, ${actors[1]}, and ${actors.length - 2} others commented on your ${reference_type}.`;
  }
  if (type === 'share') {
    if (actors.length === 1) return `${actors[0]} shared your ${reference_type}.`;
    if (actors.length === 2) return `${actors[0]} and ${actors[1]} shared your ${reference_type}.`;
    if (actors.length > 2) return `${actors[0]}, ${actors[1]}, and ${actors.length - 2} others shared your ${reference_type}.`;
  }
  if (type === 'follow') {
    if (actors.length === 1) return `${actors[0]} followed you.`;
    if (actors.length === 2) return `${actors[0]} and ${actors[1]} followed you.`;
    if (actors.length > 2) return `${actors[0]}, ${actors[1]}, and ${actors.length - 2} others followed you.`;
  }
  if (type === 'new_post') {
    if (actors.length === 1) return `${actors[0]} posted something new.`;
    if (actors.length === 2) return `${actors[0]} and ${actors[1]} posted new content.`;
    if (actors.length > 2) return `${actors[0]}, ${actors[1]}, and ${actors.length - 2} others posted new content.`;
  }
  return '';
}

async function startConsumer() {
  const conn = await amqp.connect(process.env.RABBITMQ_URL);
  const channel = await conn.createChannel();
  const queue = 'notification-events';

  await channel.assertQueue(queue, { durable: true });

  channel.consume(queue, async (msg) => {
    if (msg !== null) {
      const event = JSON.parse(msg.content.toString());
      if (event.type === 'like') {
        console.log('LIKE EVENT:', event);
      }
      let notification = {
        user_id: event.target_user_id,
        type: event.type,
        title: '',
        content: '',
        reference_type: '',
        reference_id: null,
        actors: [],
        count: 1
      };

      let refType = 'post';
      let refId = event.post_id || null;
      if (event.type === 'follow') {
        refType = 'user';
        refId = event.target_user_id;
      }
      if (event.type === 'order') {
        refType = 'order';
        refId = event.order_id;
      }
      if (event.type === 'new_post') {
        refType = 'author';
        refId = event.actor_id; // Group by author, not individual post
      }
      notification.reference_type = refType;
      notification.reference_id = refId;

      const existing = await findUnreadAggregated(
        event.target_user_id, event.type, refType, refId
      );
      if (existing) {
        let actors = Array.isArray(existing.actors) ? existing.actors : JSON.parse(existing.actors || '[]');
        if (!actors.includes(event.actor_name)) actors.push(event.actor_name);
        const content = formatContent(event.type, actors, refType);
        const updated = await updateAggregatedNotification(existing.notification_id, actors, actors.length, content);
        sendNotification(event.target_user_id, updated);
        channel.ack(msg);
        return;
      } else {
        notification.actors = [event.actor_name];
        notification.count = 1;
        if (event.type === 'order') {
          // Shop owner notification
          if (event.for_shop_owner) {
            notification.title = 'New Order Received';
            notification.content = `You have an order (${event.order_number || event.order_id}) from user ${event.actor_name}.`;
          } else {
            // Buyer notification
            notification.title = 'Order Placed';
            notification.content = `Your order (${event.order_number || event.order_id}) is being processed.`;
          }
        } else {
        notification.content = formatContent(event.type, notification.actors, refType);
        switch (event.type) {
          case 'like':
            notification.title = 'New like on your post';
            break;
          case 'comment':
            notification.title = 'New comment on your post';
            break;
          case 'share':
            notification.title = 'New share on your post';
            break;
          case 'follow':
            notification.title = 'New follower';
            break;
          case 'new_post':
            notification.title = 'New posts from people you follow';
            break;
          default:
            notification.title = 'Notification';
        }
        }
      }

      const saved = await createNotification(notification);
      sendNotification(notification.user_id, saved);
      channel.ack(msg);
    }
  });
}

module.exports = { startConsumer }; 