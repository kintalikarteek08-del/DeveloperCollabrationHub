const express = require('express');
const router = express.Router();
const { getProjectMessages } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.get('/:projectId/messages', protect, getProjectMessages);

module.exports = router;
