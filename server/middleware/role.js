const Project = require('../models/Project');

// Ensure user is an admin
const authorizeAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied: Administrator privileges required',
  });
};

// Check if user is the owner of the project specified in params or body
const requireProjectOwner = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id || req.body.project;
    if (!projectId) {
      return res.status(400).json({ success: false, message: 'Project ID is required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const isOwner = project.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only project owner can perform this operation',
      });
    }

    req.project = project;
    next();
  } catch (error) {
    next(error);
  }
};

// Check if user is a member or owner of the project
const requireProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id || req.body.project;
    if (!projectId) {
      return res.status(400).json({ success: false, message: 'Project ID is required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const userIdStr = req.user._id.toString();
    const isOwner = project.owner.toString() === userIdStr;
    const isMember = project.members.some((m) => m.user.toString() === userIdStr);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isMember && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only team members can access this project workspace',
      });
    }

    req.project = project;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authorizeAdmin,
  requireProjectOwner,
  requireProjectMember,
};
