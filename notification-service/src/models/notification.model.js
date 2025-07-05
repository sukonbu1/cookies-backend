const pool = require('../../../common/src/config/database');

async function createNotification(notification) {
  const {
    user_id, type, title, content, reference_type, reference_id, actors, count
  } = notification;
  const result = await pool.query(
    `INSERT INTO notifications
      (user_id, type, title, content, reference_type, reference_id, actors, count)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [user_id, type, title, content, reference_type, reference_id, JSON.stringify(actors || []), count || 1]
  );
  return result.rows[0];
}

async function findUnreadAggregated(user_id, type, reference_type, reference_id) {
  const result = await pool.query(
    `SELECT * FROM notifications WHERE user_id = $1 AND type = $2 AND reference_type = $3 AND reference_id = $4 AND is_read = false`,
    [user_id, type, reference_type, reference_id]
  );
  return result.rows[0];
}

async function updateAggregatedNotification(notification_id, actors, count, content) {
  const result = await pool.query(
    `UPDATE notifications SET actors = $1, count = $2, content = $3, updated_at = CURRENT_TIMESTAMP WHERE notification_id = $4 RETURNING *`,
    [JSON.stringify(actors), count, content, notification_id]
  );
  return result.rows[0];
}

async function getNotifications(user_id, limit = 20, offset = 0) {
  const result = await pool.query(
    `SELECT * FROM notifications WHERE user_id = $1
     ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [user_id, limit, offset]
  );
  return result.rows;
}

async function countUnread(user_id) {
  const result = await pool.query(
    `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`,
    [user_id]
  );
  return parseInt(result.rows[0].count, 10);
}

async function markAsRead(notification_id) {
  await pool.query(
    `UPDATE notifications SET is_read = true WHERE notification_id = $1`,
    [notification_id]
  );
}

async function markAllAsRead(user_id) {
  await pool.query(
    `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`,
    [user_id]
  );
}

async function deleteAllForUser(user_id) {
  await pool.query(
    `DELETE FROM notifications WHERE user_id = $1`,
    [user_id]
  );
}

async function markAsUnread(notification_id) {
  await pool.query(
    `UPDATE notifications SET is_read = false WHERE notification_id = $1`,
    [notification_id]
  );
}

module.exports = {
  createNotification,
  findUnreadAggregated,
  updateAggregatedNotification,
  getNotifications,
  countUnread,
  markAsRead,
  markAllAsRead,
  deleteAllForUser,
  markAsUnread
}; 