const {
  getNotifications,
  countUnread,
  markAsRead,
  markAllAsRead,
  deleteAllForUser,
  markAsUnread
} = require('../models/notification.model.js');

async function list(req, res) {
  const user_id = req.query.user_id;
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;
  const notifications = await getNotifications(user_id, limit, offset);
  res.json({ notifications });
}

async function unreadCount(req, res) {
  const user_id = req.query.user_id;
  const count = await countUnread(user_id);
  res.json({ unread: count });
}

async function read(req, res) {
  const { id } = req.params;
  await markAsRead(id);
  res.json({ success: true });
}

async function readAll(req, res) {
  const user_id = req.body.user_id;
  await markAllAsRead(user_id);
  res.json({ success: true });
}

async function deleteAll(req, res) {
  const user_id = req.body.user_id;
  await deleteAllForUser(user_id);
  res.json({ success: true });
}

async function unread(req, res) {
  const { id } = req.params;
  await markAsUnread(id);
  res.json({ success: true });
}

module.exports = {
  list,
  unreadCount,
  read,
  readAll,
  deleteAll,
  unread
}; 