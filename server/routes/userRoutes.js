const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getTeammateRecommendations,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.get('/:id', getProfile);
router.put('/profile', protect, updateProfile);
router.get('/recommendations/teammates/:projectId', protect, getTeammateRecommendations);

module.exports = router;
