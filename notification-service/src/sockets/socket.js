const { Server } = require('socket.io');

let io;
const userSockets = new Map();

function initSocket(server) {
  io = new Server(server, { cors: { origin: '*' } });

  io.on('connection', (socket) => {
    const user_id = socket.handshake.query.user_id;
    if (user_id) {
      userSockets.set(user_id, socket);
    }

    socket.on('disconnect', () => {
      if (user_id) userSockets.delete(user_id);
    });
  });
}

function sendNotification(user_id, notification) {
  const socket = userSockets.get(user_id);
  if (socket) {
    socket.emit('notification', notification);
  }
}

module.exports = {
  initSocket,
  sendNotification
}; 