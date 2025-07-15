require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const notificationRoutes = require('./routes/notification.routes.js');
const { initSocket } = require('./sockets/socket.js');
const { startConsumer } = require('./consumers/notificationConsumer.js');

dotenv.config();

const app = express();

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
app.use(express.json());

app.use('/api/notifications', notificationRoutes);

const server = http.createServer(app);
initSocket(server);

server.listen(process.env.PORT, () => {
  console.log(`Notification service running on port ${process.env.PORT}`);
  startConsumer();
}); 