const Message = require('../models/Message');
const Project = require('../models/Project');

// @desc    Get message history for project chat
// @route   GET /api/chat/:projectId/messages
// @access  Private (Project members only)
const getProjectMessages = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const userIdStr = req.user._id.toString();
    const isMember =
      project.owner.toString() === userIdStr ||
      project.members.some((m) => (m.user?._id || m.user).toString() === userIdStr) ||
      req.user.role === 'admin';

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Only verified team members can view project chat history',
      });
    }

    const messages = await Message.find({ project: projectId })
      .populate('sender', 'name profileImage title role')
      .sort({ createdAt: 1 })
      .limit(100);

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjectMessages,
};
