const amqp = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds
const PREFETCH_COUNT = 1; // Process one message at a time per consumer

class RabbitMQClient {
  // [Existing connect, sendToQueue, consumeQueue, close methods remain unchanged]
}

const rabbitMQClient = new RabbitMQClient();

async function startOrderProcessor() {
  console.log('Starting order processor for order-queue...');
  await rabbitMQClient.consumeQueue('order-queue', async (message, msg) => {
    try {
      console.log('Processing order:', message);
      // Add order processing logic here (e.g., update database, notify user-service)
      await rabbitMQClient.channel.ack(msg);
    } catch (err) {
      console.error('Order processing failed:', err);
      throw err; // Handled by consumeQueue's retry logic
    }
  }, {
    maxRetries: MAX_RETRIES,
    ttl: 30000, // 30 seconds TTL
  });
}

module.exports = {
  sendToQueue: (queue, message, options) => rabbitMQClient.sendToQueue(queue, message, options),
  consumeQueue: (queue, callback, deadLetterConfig) => rabbitMQClient.consumeQueue(queue, callback, deadLetterConfig),
  close: () => rabbitMQClient.close(),
  startOrderProcessor, // Add this export
};