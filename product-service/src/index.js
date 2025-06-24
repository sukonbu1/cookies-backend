require('dotenv').config({ path: '/home/cookies-backend/product-service/.env' });
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
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const imageRoutes = require('./routes/image.routes');
const reviewRoutes = require('./routes/review.routes');
const orderRoutes = require('./routes/order.routes');
const paymentRoutes = require('./routes/payment.routes');

// Import middleware
const { errorHandler } = require('./middleware/error.middleware');
const { notFoundHandler } = require('./middleware/notFound.middleware');

const app = express();

// Middleware
const allowedOrigins = [
  'https://cookies-next-mwpp.vercel.app',              // Deployed Frontend on Vercel
  'https://cookies2-next.vercel.app',                // Friend's Vercel deployment
  process.env.CORS_ORIGIN || 'http://localhost:3000',  // Local Frontend
  'http://localhost:3002',                             // Local shop service
  'http://103.253.145.7:3002',                         // Production shop service
  'http://localhost:3001',                             // Local user service
  'http://localhost:5173',                             // Vite dev server
  'http://localhost:8080',                             // Additional dev port
  'https://localhost:3000',                            // HTTPS local frontend
  'https://localhost:3001',                            // HTTPS local user service
  'https://localhost:5173',                            // HTTPS Vite dev server
  // Allow localhost to connect to production server
  'http://localhost:3000',                             // Local frontend to production backend
  'http://localhost:3001',                             // Local frontend to production backend
  'http://localhost:5173,',                              // Local frontend to production backend
  'http://103.253.145.7',
  'https://103.253.145.7',
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('Request with no origin - allowing');
      return callback(null, true);
    }
    
    console.log('CORS check for origin:', origin);
    
    if (allowedOrigins.indexOf(origin) !== -1 || 
        origin.startsWith('http://localhost:') || 
        origin.startsWith('https://localhost:')) {
      console.log('CORS origin allowed:', origin);
      return callback(null, true);
    }
    
    console.log('CORS origin not allowed:', origin);
    return callback(new Error('CORS not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Set-Cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));



app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Handle preflight requests explicitly
app.options('*', cors());

// Routes
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'product-service' });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Database connected successfully');
  }
});

// Start server
const PORT = process.env.PORT || 3003;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Product service is running on port ${PORT}`);
});

// Start background processors
require('./utils/rabbitmq.util').startOrderProcessor();

process.on('SIGINT', async () => {
  await require('./utils/rabbitmq.util').close();
  process.exit(0);
});
