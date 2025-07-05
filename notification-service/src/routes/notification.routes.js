const express = require('express');
const controller = require('../controllers/notification.controller.js');

const router = express.Router();

router.get('/', controller.list);
router.get('/unread/count', controller.unreadCount);
router.patch('/:id/read', controller.read);
router.patch('/read-all', controller.readAll);
router.delete('/delete-all', controller.deleteAll);
router.patch('/:id/unread', controller.unread);

module.exports = router; 