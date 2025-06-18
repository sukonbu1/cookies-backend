const axios = require('axios');

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006/api/notifications';

async function sendNotification({ user_id, type, title, content, reference_type, reference_id }) {
  try {
    const response = await axios.post(NOTIFICATION_SERVICE_URL, {
      user_id,
      type,
      title,
      content,
      reference_type,
      reference_id
    });
    return response.data;
  } catch (error) {
    console.error('Failed to send notification:', error.response?.data || error.message);
  }
}

module.exports = { sendNotification };