require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const { sendToQueue, consumeQueue } = require('./utils/rabbitmq.util');
const pool = require('../../common/src/config/database');
const axios = require('axios');

// Import routes
const shopRoutes = require('./routes/shop.routes');
const orderRoutes = require('./routes/order.routes');
const paymentRoutes = require('./routes/payment.routes');

// Import middleware
const { errorHandler } = require('./middleware/error.middleware');
const { notFoundHandler } = require('./middleware/notFound.middleware');

const app = express();

// Middleware
const allowedOrigins = [
  'https://cookies-next-mwpp.vercel.app',              // Deployed Frontend on Vercel
  process.env.CORS_ORIGIN || 'http://localhost:3000',  // Local Frontend
  'http://localhost:3001',                             // Local User Service
  'http://103.253.145.7:3001',                         // Production User Service
  'http://localhost:5173',                             // Vite dev server
  'http://localhost:8080',                             // Additional dev port
  'https://localhost:3000',                            // HTTPS local frontend
  'https://localhost:5173'                             // HTTPS Vite dev server
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Set-Cookie']
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/shops', shopRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'shop-service' });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Helper to fetch user info from user-service
async function fetchUserInfoFromUserService(user_id, token) {
  const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';
  try {
    // Check if the URL already includes /api/users
    const baseUrl = userServiceUrl.includes('/api/users') ? userServiceUrl : `${userServiceUrl}/api/users`;
    const fullUrl = `${baseUrl}/${user_id}`;
    
    const response = await axios.get(fullUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Cookie: `token=${token}`  // Keep cookie for backward compatibility
      },
      withCredentials: true
    });
    return response.data.data || response.data;
  } catch (err) {
    console.error('Failed to fetch user info:', err.message);
    return null;
  }
}

// Shop creation with user sync
app.post('/api/shop', async (req, res) => {
  const user_id = req.user.uid || req.user.userId || req.user.id || req.user.sub;
  const { name, description } = req.body;
  const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let userCheck = await client.query('SELECT id FROM users WHERE id = $1', [user_id]);
    if (userCheck.rowCount === 0) {
      // Fetch user info from user-service
      const userInfo = await fetchUserInfoFromUserService(user_id, token);
      if (!userInfo) {
        throw new Error('User does not exist in user-service');
      }
      await client.query(
        'INSERT INTO users (id, email, username) VALUES ($1, $2, $3)',
        [user_id, userInfo.email, userInfo.username]
      );
    } else {
      // Optionally update user info
      const userInfo = await fetchUserInfoFromUserService(user_id, token);
      if (userInfo) {
        await client.query(
          'UPDATE users SET email = $2, username = $3 WHERE id = $1',
          [user_id, userInfo.email, userInfo.username]
        );
      }
    }
    const result = await client.query(
      'INSERT INTO shops (user_id, name, description) VALUES ($1, $2, $3) RETURNING *',
      [user_id, name, description]
    );
    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.get('/api/shop', async (req, res) => {
  const result = await pool.query('SELECT * FROM shops');
  res.status(200).json(result.rows);
});

// Order creation: pass token in message
app.post('/api/shop/orders', async (req, res) => {
  const user_id = req.user.uid || req.user.userId || req.user.id || req.user.sub;
  const { items } = req.body;
  const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Items are required' });
  }
  const orderData = { user_id, items, order_number: `ORD-${Date.now()}`, token };
  await sendToQueue('order-queue', orderData);
  res.status(202).json({ message: 'Order accepted', order_number: orderData.order_number });
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Database connected successfully');
  }
});

// Start server
const PORT = process.env.PORT || 3002;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Shop service is running on port ${PORT}`);
});


// Order processor with user sync
async function startOrderProcessor() {
  await consumeQueue('order-queue', async (message, msg) => {
    const { user_id, items, order_number, token } = message;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      let userCheck = await client.query('SELECT id FROM users WHERE id = $1', [user_id]);
      if (userCheck.rowCount === 0) {
        // Fetch user info from user-service
        const userInfo = await fetchUserInfoFromUserService(user_id, token);
        if (!userInfo) throw new Error('User does not exist in user-service');
        await client.query(
          'INSERT INTO users (id, email, username) VALUES ($1, $2, $3)',
          [user_id, userInfo.email, userInfo.username]
        );
      }
      const orderResult = await client.query(
        'INSERT INTO orders (user_id, order_number, total_amount, subtotal) VALUES ($1, $2, $3, $4) RETURNING order_id',
        [user_id, order_number, 0, 0]
      );
      const order_id = orderResult.rows[0].order_id;
      let total = 0;
      for (const item of items) {
        const { product_id, shop_id, quantity } = item;
        const product = await client.query(
          'SELECT price, stock_quantity FROM products WHERE product_id = $1 FOR UPDATE',
          [product_id]
        );
        if (product.rows[0].stock_quantity < quantity) throw new Error('Insufficient stock');
        const unit_price = product.rows[0].price;
        const total_price = unit_price * quantity;
        await client.query(
          'INSERT INTO order_items (order_id, product_id, shop_id, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5, $6)',
          [order_id, product_id, shop_id, quantity, unit_price, total_price]
        );
        await sendToQueue('stock-update', { product_id, quantity_change: quantity });
        total += total_price;
      }
      await client.query(
        'UPDATE orders SET total_amount = $1, subtotal = $1 WHERE order_id = $2',
        [total, order_id]
      );
      await client.query('COMMIT');
      console.log(`Processed order ${order_number}`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }, {
    maxRetries: 3,
    ttl: 30000, // 30 seconds TTL
  });
}
startOrderProcessor();

process.on('SIGINT', async () => {
  await require('./utils/rabbitmq.util').close();
  process.exit(0);
});