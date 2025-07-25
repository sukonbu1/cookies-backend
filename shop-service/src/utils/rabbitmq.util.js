const amqp = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds
const PREFETCH_COUNT = 1; // Process one message at a time per consumer

class RabbitMQClient {
  constructor() {
    this.connection = null;
    this.channel = null;
  }

  async connect() {
    if (!this.connection) {
      this.connection = await amqp.connect(RABBITMQ_URL);
      this.channel = await this.connection.createChannel();
      await this.channel.prefetch(PREFETCH_COUNT);
    }
  }

  async sendToQueue(queue, message, options = {}) {
    await this.connect();
    await this.channel.assertQueue(queue, { durable: true });
    this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), options);
  }

  async consumeQueue(queue, callback, deadLetterConfig = {}) {
    await this.connect();
    await this.channel.assertQueue(queue, { durable: true });
    this.channel.consume(queue, async (msg) => {
      if (msg !== null) {
        const message = JSON.parse(msg.content.toString());
        try {
          await callback(message, msg);
          this.channel.ack(msg);
        } catch (err) {
          console.error('Error processing message:', err);
          this.channel.nack(msg, false, false); // Discard message
        }
      }
    });
  }

  async close() {
    if (this.channel) await this.channel.close();
    if (this.connection) await this.connection.close();
    this.channel = null;
    this.connection = null;
  }
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
  startOrderProcessor, 
};