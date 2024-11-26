const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { verifyToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(verifyToken);

// Room routes
router.post('/rooms', chatController.createRoom);
router.get('/rooms', chatController.getRooms);
router.post('/rooms/:roomId/join', chatController.joinRoom);
router.post('/rooms/:roomId/leave', chatController.leaveRoom);

// Message routes
router.post('/messages', chatController.sendMessage);
router.get('/rooms/:roomId/messages', chatController.getMessages);

module.exports = router;
