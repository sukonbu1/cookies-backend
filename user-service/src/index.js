const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
require('dotenv').config();

const userRoutes = require('./routes/user.routes');
const { errorHandler } = require('./middleware/error.middleware');

const app = express();

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));

// CORS configuration
const allowedOrigins = [
  'https://cookies-next-mwpp.vercel.app',              // Deployed Frontend on Vercel
  process.env.CORS_ORIGIN || 'http://localhost:3000',  // Local Frontend
  'http://localhost:3002',                             // Local shop service
  'http://103.253.145.7:3002',                        
  'http://localhost:3001',                             
  'http://localhost:5173',                             
  'http://localhost:8080',                             
  'https://localhost:3000',                           
  'https://localhost:3001',                            
  'https://localhost:5173'                             
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('Request with no origin - allowing');
      return callback(null, true);
    }
    
    console.log('CORS check for origin:', origin);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      console.log('CORS origin not allowed:', origin);
      return callback(new Error('CORS not allowed'));
    }
    
    console.log('CORS origin allowed:', origin);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Set-Cookie']
}));

app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Load Swagger document
const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));

// Routes
app.use('/api/users', userRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 
