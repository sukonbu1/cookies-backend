require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const recipeRoutes = require('./routes/recipe.routes');

app.use(express.json());

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
  'http://localhost:3000',
  'http://103.253.145.7',
  'https://103.253.145.7',
  'http://103.253.145.7:5173',
  'https://cookiesnext.duckdns.org',
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

// Handle preflight requests explicitly
app.options('*', cors());

app.use('/api/recipes', recipeRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ status: 'error', message: err.message });
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  console.log(`Recipe service running on port ${PORT}`);
}); 