const express = require('express');
const router = express.Router();
const {
  applyToProject,
  getMyApplications,
  getProjectApplications,
  updateApplicationStatus,
  withdrawApplication,
} = require('../controllers/applicationController');
const { protect } = require('../middleware/auth');

router.post('/', protect, applyToProject);
router.get('/my-applications', protect, getMyApplications);
router.get('/project/:projectId', protect, getProjectApplications);
router.put('/:id/status', protect, updateApplicationStatus);
router.put('/:id/withdraw', protect, withdrawApplication);

module.exports = router;
