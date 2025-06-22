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
    try {
      if (!this.connection) {
        this.connection = await amqp.connect(RABBITMQ_URL);
        this.connection.on('error', (err) => console.error('Connection error:', err));
        this.connection.on('close', () => {
          console.warn('Connection closed, attempting to reconnect...');
          this.connection = null;
          this.channel = null;
          setTimeout(() => this.connect(), RETRY_DELAY);
        });
      }
      if (!this.channel) {
        this.channel = await this.connection.createChannel();
        await this.channel.prefetch(PREFETCH_COUNT); // Limit unacknowledged messages
      }
      return this.channel;
    } catch (err) {
      console.error('Failed to connect to RabbitMQ:', err);
      throw err;
    }
  }

  async sendToQueue(queue, message, options = {}) {
    const channel = await this.connect();
    try {
      await channel.assertQueue(queue, { durable: true });
      channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
        persistent: true,
        ...options,
      });
      console.info(`Sent message to ${queue}:`, message);
    } catch (err) {
      console.error(`Failed to send to ${queue}:`, err);
      throw err;
    } finally {
      // Channel is managed by the connection, no need to close per send
    }
  }

  async consumeQueue(queue, callback, deadLetterConfig = {}) {
    const channel = await this.connect();
    try {
      // Define dead-letter exchange and queue if configured
      const deadLetterExchange = deadLetterConfig.exchange || `${queue}.dlx`;
      const deadLetterQueue = deadLetterConfig.queue || `${queue}.dlq`;
      const maxRetries = deadLetterConfig.maxRetries || MAX_RETRIES;

      await channel.assertExchange(deadLetterExchange, 'direct', { durable: true });
      await channel.assertQueue(deadLetterQueue, { durable: true });
      await channel.bindQueue(deadLetterQueue, deadLetterExchange, '');

      await channel.assertQueue(queue, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': deadLetterExchange,
          'x-dead-letter-routing-key': '',
          'x-message-ttl': deadLetterConfig.ttl || 60000, // 1 minute TTL before dead-letter
          'x-max-length': deadLetterConfig.maxLength || 1000, // Limit queue size
        },
      });

      channel.consume(queue, async (msg) => {
        if (!msg) return;
        const message = JSON.parse(msg.content.toString());
        const retryCount = msg.properties.headers['x-death'] ? msg.properties.headers['x-death'].length : 0;

        try {
          await callback(message, msg);
          channel.ack(msg);
        } catch (err) {
          console.error(`Error processing message from ${queue}:`, err);
          if (retryCount < maxRetries) {
            console.info(`Retrying message ${msg.fields.deliveryTag} (attempt ${retryCount + 1}/${maxRetries})`);
            channel.nack(msg, false, false); // Requeue for retry
            setTimeout(() => channel.ack(msg), RETRY_DELAY); // Delay before requeue
          } else {
            console.warn(`Max retries reached for ${msg.fields.deliveryTag}, moving to dead-letter queue`);
            channel.nack(msg, false, false); // Move to dead-letter queue
          }
        }
      }, { noAck: false });
    } catch (err) {
      console.error(`Failed to set up consumer for ${queue}:`, err);
      throw err;
    }
  }

  async close() {
    if (this.channel) await this.channel.close();
    if (this.connection) await this.connection.close();
    this.channel = null;
    this.connection = null;
    console.info('RabbitMQ connection closed');
  }
}

const rabbitMQClient = new RabbitMQClient();

module.exports = {
  sendToQueue: (queue, message, options) => rabbitMQClient.sendToQueue(queue, message, options),
  consumeQueue: (queue, callback, deadLetterConfig) =>
    rabbitMQClient.consumeQueue(queue, callback, deadLetterConfig),
  close: () => rabbitMQClient.close(),
}; 