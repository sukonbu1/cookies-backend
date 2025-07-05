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
app.use(cors());
app.use(express.json());

app.use('/api/notifications', notificationRoutes);

const server = http.createServer(app);
initSocket(server);

server.listen(process.env.PORT, () => {
  console.log(`Notification service running on port ${process.env.PORT}`);
  startConsumer();
}); 