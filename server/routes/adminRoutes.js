const express = require('express');
const router = express.Router();
const {
  getAnalytics,
  getUsers,
  updateUserStatus,
  getAdminProjects,
  deleteAdminProject,
  getReports,
  updateReportStatus,
  createReport,
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorizeAdmin } = require('../middleware/role');

// Any authenticated user can submit a report
router.post('/reports', protect, createReport);

// All subsequent routes require Admin role
router.use(protect, authorizeAdmin);

router.get('/analytics', getAnalytics);
router.get('/users', getUsers);
router.put('/users/:id/status', updateUserStatus);
router.get('/projects', getAdminProjects);
router.delete('/projects/:id', deleteAdminProject);
router.get('/reports', getReports);
router.put('/reports/:id', updateReportStatus);

module.exports = router;
