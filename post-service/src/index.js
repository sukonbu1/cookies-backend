const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const postRoutes = require('./routes/post.routes');
require('./utils/redisViewSync.util');

const app = express();

// Middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  'https://cookies-next-mwpp.vercel.app',
  'https://cookies2-next.vercel.app',
  process.env.CORS_ORIGIN || 'http://localhost:3000',
  'http://localhost:3002',
  'http://103.253.145.7:3002',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://localhost:8080',
  'https://localhost:3000',
  'https://localhost:3001',
  'https://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173,',
  'http://103.253.145.7',
  'https://103.253.145.7',
  'http://103.253.145.7:5173',
  'https://cookiesnext.duckdns.org',
  'http://localhost:8080',
];

app.use(cors({
  origin: function(origin, callback) {
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

app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

// No static file serving needed; all media is handled by the frontend

// Handle preflight requests explicitly
app.options('*', cors());

// Routes
app.use('/api/posts', postRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'post-service' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Something went wrong!',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Post service is running on port ${PORT}`);
});

module.exports = app;
