const User = require('../models/User');
const Project = require('../models/Project');
const Application = require('../models/Application');
const Report = require('../models/Report');

// @desc    Get system-wide analytics for admin
// @route   GET /api/admin/analytics
// @access  Private (Admin)
const getAnalytics = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const suspendedUsers = await User.countDocuments({ status: 'suspended' });

    const totalProjects = await Project.countDocuments();
    const openProjects = await Project.countDocuments({ status: 'Open' });
    const inProgressProjects = await Project.countDocuments({ status: 'In Progress' });
    const completedProjects = await Project.countDocuments({ status: 'Completed' });

    const totalApplications = await Application.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'Pending' });

    // Category distribution
    const categoryDistribution = await Project.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Recent activity metrics
    const recentUsers = await User.find().sort('-createdAt').limit(5).select('name email role createdAt');
    const recentProjects = await Project.find().sort('-createdAt').limit(5).populate('owner', 'name');

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        totalProjects,
        openProjects,
        inProgressProjects,
        completedProjects,
        activeTeams: openProjects + inProgressProjects,
        totalApplications,
        pendingReports,
        categoryDistribution,
        recentUsers,
        recentProjects,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get paginated user list
// @route   GET /api/admin/users
// @access  Private (Admin)
const getUsers = async (req, res, next) => {
  try {
    const { role, status, search, page = 1, limit = 10 } = req.query;
    const query = {};

    if (role && role !== 'All') query.role = role;
    if (status && status !== 'All') query.status = status;
    if (search && search.trim()) {
      const reg = new RegExp(search.trim(), 'i');
      query.$or = [{ name: reg }, { email: reg }, { title: reg }];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Suspend or activate user
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin)
const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be active or suspended',
      });
    }

    // Protect against self-suspension
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Admin cannot suspend their own account',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: get all projects with moderation details
// @route   GET /api/admin/projects
// @access  Private (Admin)
const getAdminProjects = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status && status !== 'All') query.status = status;
    if (search && search.trim()) {
      const reg = new RegExp(search.trim(), 'i');
      query.$or = [{ title: reg }, { category: reg }];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const total = await Project.countDocuments(query);
    const projects = await Project.find(query)
      .populate('owner', 'name email profileImage')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      data: projects,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: delete project
// @route   DELETE /api/admin/projects/:id
// @access  Private (Admin)
const deleteAdminProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    await project.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Project deleted by administrator',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: get reports list
// @route   GET /api/admin/reports
// @access  Private (Admin)
const getReports = async (req, res, next) => {
  try {
    const { status = 'Pending' } = req.query;
    const query = {};
    if (status !== 'All') query.status = status;

    const reports = await Report.find(query)
      .populate('reporter', 'name email profileImage')
      .populate('resolvedBy', 'name email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: update report status
// @route   PUT /api/admin/reports/:id
// @access  Private (Admin)
const updateReportStatus = async (req, res, next) => {
  try {
    const { status, resolutionNotes } = req.body;
    if (!['Reviewed', 'Resolved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report status',
      });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    report.status = status;
    if (resolutionNotes) report.resolutionNotes = resolutionNotes;
    report.resolvedBy = req.user._id;

    await report.save();

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    User: submit a report
// @route   POST /api/admin/reports
// @access  Private
const createReport = async (req, res, next) => {
  try {
    const { targetType, targetId, targetName, reason, description } = req.body;

    if (!targetType || !targetId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Target type, target ID, and reason are required',
      });
    }

    const report = await Report.create({
      reporter: req.user._id,
      targetType,
      targetId,
      targetName: targetName || '',
      reason,
      description: description || '',
      status: 'Pending',
    });

    res.status(201).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnalytics,
  getUsers,
  updateUserStatus,
  getAdminProjects,
  deleteAdminProject,
  getReports,
  updateReportStatus,
  createReport,
};
