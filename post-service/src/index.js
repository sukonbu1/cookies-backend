const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const postRoutes = require('./routes/post.routes');

const app = express();

// Middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  'https://cookies-next-mwpp.vercel.app',              // Deployed Frontend on Vercel
  process.env.CORS_ORIGIN || 'http://localhost:3000',  // Local Frontend
  'http://localhost:3001',                             // Local User Service
  'http://localhost:5173',                             // Vite dev server
  'http://localhost:8080',                             // Additional dev port
  'https://localhost:3000',                            // HTTPS local frontend
  'https://localhost:5173'                             // HTTPS Vite dev server
];

app.use(cors({
  origin: function(origin, callback) {
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

app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

// Static files (if you want to serve uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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
