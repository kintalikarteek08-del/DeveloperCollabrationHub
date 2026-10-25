const mongoose = require('mongoose');
const Application = require('../models/Application');
const Project = require('../models/Project');
const { createNotification } = require('../services/notificationService');

// @desc    Apply to join a project
// @route   POST /api/applications
// @access  Private
const applyToProject = async (req, res, next) => {
  try {
    const { projectId, message, requestedRole, relevantSkills } = req.body;
    const applicantId = req.user._id;

    if (!projectId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Project ID and application message are required',
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Prevent applying to own project
    if (project.owner.toString() === applicantId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot apply to your own project',
      });
    }

    // Prevent applying if project is not Open
    if (project.status !== 'Open') {
      return res.status(400).json({
        success: false,
        message: `This project is currently ${project.status.toLowerCase()} and is not accepting applications`,
      });
    }

    // Prevent applying if already a member
    const alreadyMember = project.members.some(
      (m) => m.user.toString() === applicantId.toString()
    );
    if (alreadyMember) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this project team',
      });
    }

    // Prevent applying if team is at capacity
    if (project.currentTeamSize >= project.teamSize) {
      return res.status(400).json({
        success: false,
        message: 'This project team has reached maximum capacity',
      });
    }

    // Check for existing pending application
    const existingApp = await Application.findOne({
      project: projectId,
      applicant: applicantId,
    });

    if (existingApp) {
      if (existingApp.status === 'Pending') {
        return res.status(409).json({
          success: false,
          message: 'You already have a pending application for this project',
        });
      }
      if (existingApp.status === 'Accepted') {
        return res.status(400).json({
          success: false,
          message: 'You have already been accepted to this project',
        });
      }
    }

    const application = await Application.create({
      project: projectId,
      applicant: applicantId,
      message: message.trim(),
      requestedRole: (requestedRole || 'Full Stack Developer').trim(),
      relevantSkills: Array.isArray(relevantSkills) && relevantSkills.length > 0 ? relevantSkills : req.user.skills || [],
      status: 'Pending',
    });

    // Notify project owner
    await createNotification({
      recipient: project.owner,
      type: 'application_received',
      title: 'New Project Applicant',
      message: `${req.user.name} applied to join "${project.title}".`,
      relatedProject: project._id,
    });

    const populated = await Application.findById(application._id)
      .populate('applicant', 'name profileImage title skills experienceLevel')
      .populate('project', 'title category teamSize currentTeamSize');

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's sent applications
// @route   GET /api/applications/my-applications
// @access  Private
const getMyApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({ applicant: req.user._id })
      .populate('project', 'title category status teamSize currentTeamSize owner')
      .populate({
        path: 'project',
        populate: { path: 'owner', select: 'name profileImage' },
      })
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: applications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get applications for a project (Owner only)
// @route   GET /api/applications/project/:projectId
// @access  Private (Owner or Admin)
const getProjectApplications = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner can view applicants',
      });
    }

    const applications = await Application.find({ project: projectId })
      .populate('applicant', 'name email profileImage title skills experienceLevel github linkedin portfolio ratingAverage ratingCount')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: applications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update application status (Accept or Reject)
// @route   PUT /api/applications/:id/status
// @access  Private (Owner only)
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, role = 'Full Stack Developer' } = req.body;

    if (!['Accepted', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be Accepted or Rejected',
      });
    }

    const application = await Application.findById(id).populate('project');
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (application.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Application is already ${application.status.toLowerCase()} and cannot be updated`,
      });
    }

    const projectId = application.project?._id || application.project;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (application.project?._id && application.project._id.toString() !== project._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Application does not belong to this project',
      });
    }

    if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner can decide on applications',
      });
    }

    if (status === 'Accepted') {
      // Check team capacity
      if (project.currentTeamSize >= project.teamSize) {
        return res.status(400).json({
          success: false,
          message: 'Project team has reached maximum capacity',
        });
      }

      // Check if applicant is already a member
      const alreadyMember = project.members.some(
        (m) => m.user.toString() === application.applicant.toString()
      );

      if (alreadyMember) {
        return res.status(400).json({
          success: false,
          message: 'Applicant is already a member of this project team',
        });
      }

      const assignedRole = role || application.requestedRole || 'Full Stack Developer';

      project.members.push({
        user: application.applicant,
        role: assignedRole,
        joinedAt: new Date(),
      });
      project.currentTeamSize = project.members.length;

      // If team reached capacity, set status to In Progress
      if (project.currentTeamSize >= project.teamSize && project.status === 'Open') {
        project.status = 'In Progress';
      }

      application.status = 'Accepted';

      let session = null;
      try {
        session = await mongoose.startSession();
        session.startTransaction();
        await project.save({ session });
        await application.save({ session });
        await session.commitTransaction();
      } catch (txErr) {
        if (session) {
          try {
            await session.abortTransaction();
          } catch (abortErr) {
            // Ignore abort error
          }
        }
        // Fallback for MongoDB environments that do not support transactions
        if (
          txErr.message &&
          (txErr.message.includes('replica set') || txErr.message.includes('Transaction numbers'))
        ) {
          await project.save();
          await application.save();
        } else {
          throw txErr;
        }
      } finally {
        if (session) {
          session.endSession();
        }
      }

      // Create persistent notification and emit real-time event
      await createNotification({
        recipient: application.applicant,
        type: 'application_accepted',
        title: 'Application Accepted! 🎉',
        message: `Congratulations! You were accepted into "${project.title}" as a ${assignedRole}.`,
        relatedProject: project._id,
      });
    } else {
      // Rejected
      application.status = 'Rejected';
      await application.save();

      // Create persistent notification and emit real-time event
      await createNotification({
        recipient: application.applicant,
        type: 'application_rejected',
        title: 'Application Status Update',
        message: `Your application to join "${project.title}" was not accepted at this time.`,
        relatedProject: project._id,
      });
    }

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Withdraw application
// @route   PUT /api/applications/:id/withdraw
// @access  Private (Applicant only)
const withdrawApplication = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (application.applicant.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only withdraw your own applications',
      });
    }

    if (application.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot withdraw application with status "${application.status}"`,
      });
    }

    application.status = 'Withdrawn';
    await application.save();

    res.status(200).json({
      success: true,
      message: 'Application withdrawn successfully',
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applyToProject,
  getMyApplications,
  getProjectApplications,
  updateApplicationStatus,
  withdrawApplication,
};
