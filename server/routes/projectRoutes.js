const express = require('express');
const router = express.Router();
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  updateMemberRole,
  removeMember,
  publishShowcase,
  getRecommendedProjects,
  getMyProjects,
  getShowcaseProjects,
} = require('../controllers/projectController');
const { protect, optionalAuth } = require('../middleware/auth');

// Public & specialized routes
router.get('/', optionalAuth, getProjects);
router.get('/recommendations', protect, getRecommendedProjects);
router.get('/my-projects', protect, getMyProjects);
router.get('/showcase', getShowcaseProjects);

// CRUD
router.post('/', protect, createProject);
router.get('/:id', optionalAuth, getProjectById);
router.put('/:id', protect, updateProject);
router.delete('/:id', protect, deleteProject);

// Team membership & roles
router.put('/:id/members/:userId/role', protect, updateMemberRole);
router.delete('/:id/members/:userId', protect, removeMember);

// Showcase publish
router.post('/:id/showcase', protect, publishShowcase);

module.exports = router;
