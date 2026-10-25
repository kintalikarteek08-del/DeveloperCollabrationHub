const Task = require('../models/Task');
const Project = require('../models/Project');
const { createNotification } = require('../services/notificationService');

// @desc    Get all tasks for a project
// @route   GET /api/tasks/project/:projectId
// @access  Private (Project members only)
const getProjectTasks = async (req, res, next) => {
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
        message: 'Only verified project team members can view tasks',
      });
    }

    const tasks = await Task.find({ project: projectId })
      .populate('assignedTo', 'name profileImage title')
      .populate('createdBy', 'name profileImage')
      .populate('comments.user', 'name profileImage')
      .sort({ order: 1, createdAt: 1 });

    res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (Project members only)
const createTask = async (req, res, next) => {
  try {
    const projectId = req.body.project || req.body.projectId;
    const {
      title,
      description,
      assignedTo,
      priority,
      status,
      deadline,
    } = req.body;

    if (!projectId || !title) {
      return res.status(400).json({
        success: false,
        message: 'Project and task title are required',
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const userIdStr = req.user._id.toString();
    const isMember =
      project.owner.toString() === userIdStr ||
      project.members.some((m) => m.user.toString() === userIdStr) ||
      req.user.role === 'admin';

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Only project team members can create tasks',
      });
    }

    // Validate assignee is a team member
    if (assignedTo) {
      const assignedToStr = assignedTo.toString();
      const isAssigneeMember =
        project.owner.toString() === assignedToStr ||
        project.members.some((m) => (m.user?._id || m.user).toString() === assignedToStr);

      if (!isAssigneeMember) {
        return res.status(400).json({
          success: false,
          message: 'Cannot assign task to a user who is not a member of this project team',
        });
      }
    }

    // Determine order
    const taskCount = await Task.countDocuments({ project: projectId, status: status || 'TODO' });

    const task = await Task.create({
      project: projectId,
      title: title.trim(),
      description: description ? description.trim() : '',
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      priority: priority || 'Medium',
      status: status || 'TODO',
      deadline: deadline || null,
      order: taskCount,
    });

    if (assignedTo && assignedTo.toString() !== userIdStr) {
      await createNotification({
        recipient: assignedTo,
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: `${req.user.name} assigned you the task: "${title}" in "${project.title}".`,
        relatedProject: project._id,
        relatedTask: task._id,
      });
    }

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name profileImage title')
      .populate('createdBy', 'name profileImage');

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task details
// @route   PUT /api/tasks/:id
// @access  Private (Project members only)
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const project = await Project.findById(task.project);
    const userIdStr = req.user._id.toString();
    const isMember =
      project.owner.toString() === userIdStr ||
      project.members.some((m) => m.user.toString() === userIdStr) ||
      req.user.role === 'admin';

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Only team members can edit tasks',
      });
    }

    const { title, description, assignedTo, priority, deadline, status, order } = req.body;

    // Validate assignee is a team member if assigned
    if (assignedTo) {
      const assignedToStr = assignedTo.toString();
      const isAssigneeMember =
        project.owner.toString() === assignedToStr ||
        project.members.some((m) => (m.user?._id || m.user).toString() === assignedToStr);

      if (!isAssigneeMember) {
        return res.status(400).json({
          success: false,
          message: 'Cannot assign task to a user who is not a member of this project team',
        });
      }
    }

    const previousAssignee = task.assignedTo ? task.assignedTo.toString() : null;

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
    if (priority) task.priority = priority;
    if (deadline !== undefined) task.deadline = deadline;
    if (status) task.status = status;
    if (order !== undefined) task.order = order;

    await task.save();

    // Notify if assigned to someone new
    if (assignedTo && assignedTo.toString() !== previousAssignee && assignedTo.toString() !== userIdStr) {
      await createNotification({
        recipient: assignedTo,
        type: 'task_assigned',
        title: 'Task Assigned',
        message: `${req.user.name} assigned you the task: "${task.title}".`,
        relatedProject: project._id,
        relatedTask: task._id,
      });
    }

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name profileImage title')
      .populate('createdBy', 'name profileImage')
      .populate('comments.user', 'name profileImage');

    res.status(200).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task status (drag & drop Kanban movement)
// @route   PATCH /api/tasks/:id/status
// @access  Private (Project members only)
const updateTaskStatus = async (req, res, next) => {
  try {
    const { status, order } = req.body;
    if (!['TODO', 'IN PROGRESS', 'REVIEW', 'DONE'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be TODO, IN PROGRESS, REVIEW, or DONE',
      });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const project = await Project.findById(task.project);
    const userIdStr = req.user._id.toString();
    const isMember =
      project &&
      (project.owner.toString() === userIdStr ||
        project.members.some((m) => (m.user?._id || m.user).toString() === userIdStr) ||
        req.user.role === 'admin');

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Only project team members can update task status',
      });
    }

    task.status = status;
    if (order !== undefined) task.order = order;
    await task.save();

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name profileImage title')
      .populate('createdBy', 'name profileImage');

    res.status(200).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add comment to a task
// @route   POST /api/tasks/:id/comments
// @access  Private (Project members only)
const addTaskComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Verify caller is a project member
    const project = await Project.findById(task.project);
    const userIdStr = req.user._id.toString();
    const isMember =
      project &&
      (project.owner.toString() === userIdStr ||
        project.members.some((m) => (m.user?._id || m.user).toString() === userIdStr) ||
        req.user.role === 'admin');

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Only project team members can comment on tasks',
      });
    }

    task.comments.push({
      user: req.user._id,
      text: text.trim(),
      createdAt: new Date(),
    });

    await task.save();

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name profileImage title')
      .populate('createdBy', 'name profileImage')
      .populate('comments.user', 'name profileImage');

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private (Owner or task creator only)
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Verify caller is the project owner or the task creator
    const project = await Project.findById(task.project);
    const userIdStr = req.user._id.toString();
    const isOwner = project && project.owner.toString() === userIdStr;
    const isCreator = task.createdBy && task.createdBy.toString() === userIdStr;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner or task creator can delete a task',
      });
    }

    await task.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjectTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  addTaskComment,
  deleteTask,
};
