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
  console.log('[NOTIFICATION CONSUMER] Starting consumer...');
  const conn = await amqp.connect(process.env.RABBITMQ_URL);
  console.log('[NOTIFICATION CONSUMER] Connected to RabbitMQ');
  const channel = await conn.createChannel();
  console.log('[NOTIFICATION CONSUMER] Channel created');
  const queue = 'notification-events';

  await channel.assertQueue(queue, { durable: true });
  console.log(`[NOTIFICATION CONSUMER] Queue '${queue}' asserted`);

  channel.consume(queue, async (msg) => {
    if (msg !== null) {
      try {
        console.log('[NOTIFICATION CONSUMER] Raw message received:', msg.content.toString());
        const event = JSON.parse(msg.content.toString());
        console.log('[NOTIFICATION CONSUMER] Received event:', event);
        
        // Validate required fields
        if (!event.target_user_id) {
          console.error('[NOTIFICATION CONSUMER] Missing target_user_id in event:', event);
          channel.ack(msg);
          return;
        }
        
        if (!event.type) {
          console.error('[NOTIFICATION CONSUMER] Missing type in event:', event);
          channel.ack(msg);
          return;
        }
        
        if (event.type === 'like') {
          console.log('LIKE EVENT:', event);
        }
        if (event.type === 'follow') {
          console.log('[FOLLOW EVENT] Processing follow notification:', event);
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
          refType = 'followers';
          refId = event.target_user_id; // Group all follow notifications for this user
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
        console.log(`[NOTIFICATION CONSUMER] Checking for existing notification: userId=${event.target_user_id}, type=${event.type}, refType=${refType}, refId=${refId}`);
        console.log(`[NOTIFICATION CONSUMER] Existing notification found:`, existing);
        
        if (existing) {
          console.log(`[NOTIFICATION CONSUMER] Updating existing notification:`, existing.notification_id);
          let actors = Array.isArray(existing.actors) ? existing.actors : JSON.parse(existing.actors || '[]');
          if (!actors.includes(event.actor_name)) actors.push(event.actor_name);
          const content = formatContent(event.type, actors, refType);
          const updated = await updateAggregatedNotification(existing.notification_id, actors, actors.length, content);
          console.log(`[NOTIFICATION CONSUMER] Updated notification:`, updated);
          sendNotification(event.target_user_id, updated);
          channel.ack(msg);
          return;
        } else {
          console.log(`[NOTIFICATION CONSUMER] Creating new notification for:`, {
            user_id: event.target_user_id,
            type: event.type,
            refType,
            refId
          });
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

        console.log(`[NOTIFICATION CONSUMER] Final notification object:`, notification);
        const saved = await createNotification(notification);
        console.log(`[NOTIFICATION CONSUMER] Notification saved successfully:`, saved);
        sendNotification(notification.user_id, saved);
        console.log(`[NOTIFICATION CONSUMER] Notification sent to user:`, notification.user_id);
        channel.ack(msg);
      } catch (error) {
        console.error('[NOTIFICATION CONSUMER] Error processing notification:', error);
        console.error('[NOTIFICATION CONSUMER] Event data:', msg.content.toString());
        channel.ack(msg); // Acknowledge to prevent reprocessing
      }
    }
  });
}

module.exports = { startConsumer }; 