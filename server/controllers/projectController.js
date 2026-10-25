const Project = require('../models/Project');
const User = require('../models/User');
const Application = require('../models/Application');
const { calculateSkillMatch } = require('../services/skillMatching');
const { createNotification } = require('../services/notificationService');

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      technologies,
      requiredSkills,
      rolesRequired,
      teamSize,
      difficulty,
      deadline,
    } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, and category',
      });
    }

    // Format technologies and skills arrays
    const formattedTechs = Array.isArray(technologies)
      ? Array.from(new Set(technologies.map((t) => t.trim()))).filter(Boolean)
      : [];

    const formattedRoles = Array.isArray(rolesRequired)
      ? Array.from(new Set(rolesRequired.map((r) => r.trim()))).filter(Boolean)
      : [];

    const formattedSkills = Array.isArray(requiredSkills)
      ? requiredSkills.map((s) => {
          if (typeof s === 'string') {
            return { skill: s.trim(), weight: 20 };
          }
          return {
            skill: (s.skill || '').trim(),
            weight: Number(s.weight) || 20,
          };
        }).filter((s) => s.skill)
      : [];

    const project = await Project.create({
      title,
      description,
      category,
      technologies: formattedTechs,
      requiredSkills: formattedSkills,
      rolesRequired: formattedRoles,
      teamSize: Number(teamSize) || 4,
      currentTeamSize: 1,
      difficulty: difficulty || 'Intermediate',
      deadline: deadline || null,
      owner: req.user._id,
      status: 'Open',
      members: [
        {
          user: req.user._id,
          role: 'Owner',
          joinedAt: new Date(),
        },
      ],
    });

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name profileImage title skills')
      .populate('members.user', 'name profileImage title skills');

    res.status(201).json({
      success: true,
      data: populatedProject,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all projects with server-side filter, search, sort & pagination
// @route   GET /api/projects
// @access  Public
const getProjects = async (req, res, next) => {
  try {
    const {
      search,
      category,
      technology,
      skill,
      difficulty,
      status,
      sort = 'newest',
      page = 1,
      limit = 9,
    } = req.query;

    const query = {};

    // Search in title and description
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Difficulty filter
    if (difficulty && difficulty !== 'All') {
      query.difficulty = difficulty;
    }

    // Status filter
    if (status && status !== 'All') {
      query.status = status;
    }

    // Technology filter
    if (technology && technology !== 'All') {
      query.technologies = { $in: [new RegExp(technology.trim(), 'i')] };
    }

    // Skill filter
    if (skill && skill !== 'All') {
      query['requiredSkills.skill'] = { $in: [new RegExp(skill.trim(), 'i')] };
    }

    // Sorting
    let sortOptions = { createdAt: -1 }; // default newest
    if (sort === 'oldest') {
      sortOptions = { createdAt: 1 };
    } else if (sort === 'popular') {
      sortOptions = { views: -1, currentTeamSize: -1 };
    } else if (sort === 'deadline') {
      sortOptions = { deadline: 1 };
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 9;
    const skip = (pageNum - 1) * limitNum;

    const total = await Project.countDocuments(query);
    const projects = await Project.find(query)
      .populate('owner', 'name profileImage title')
      .populate('members.user', 'name profileImage title')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    // Compute skill match score if a logged in user is making request
    const userSkills = req.user ? req.user.skills : [];
    const formattedProjects = projects.map((p) => {
      const pObj = p.toObject();
      if (req.user) {
        const match = calculateSkillMatch(userSkills, p.requiredSkills);
        pObj.skillMatch = match;
      }
      return pObj;
    });

    res.status(200).json({
      success: true,
      data: formattedProjects,
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

// @desc    Get single project details by ID
// @route   GET /api/projects/:id
// @access  Public (optionalAuth)
const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name profileImage title email github linkedin portfolio skills ratingAverage ratingCount')
      .populate('members.user', 'name profileImage title email skills experienceLevel availability');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Increment view count asynchronously
    Project.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }).exec();

    const pObj = project.toObject();
    pObj.availablePositions = Math.max(0, project.teamSize - (project.members?.length || project.currentTeamSize || 1));

    // Check relationship for requesting user
    if (req.user) {
      const userIdStr = req.user._id.toString();
      pObj.isOwner = project.owner._id.toString() === userIdStr;
      pObj.isMember = project.members.some((m) => m.user?._id?.toString() === userIdStr);
      pObj.userSkillMatch = calculateSkillMatch(req.user.skills, project.requiredSkills);

      const userApp = await Application.findOne({
        project: project._id,
        applicant: req.user._id,
      }).select('status requestedRole relevantSkills message createdAt');
      pObj.userApplication = userApp || null;
    }

    res.status(200).json({
      success: true,
      data: pObj,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update project details
// @route   PUT /api/projects/:id
// @access  Private (Owner or Admin)
const updateProject = async (req, res, next) => {
  try {
    let project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const isOwner = project.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Only project owner or administrator can edit this project',
      });
    }

    const {
      title,
      description,
      category,
      technologies,
      requiredSkills,
      rolesRequired,
      teamSize,
      difficulty,
      deadline,
      status,
    } = req.body;

    if (title) project.title = title;
    if (description) project.description = description;
    if (category) project.category = category;
    if (difficulty) project.difficulty = difficulty;
    if (deadline !== undefined) project.deadline = deadline;
    if (status) project.status = status;

    if (teamSize !== undefined) {
      const newSize = Number(teamSize);
      if (newSize < project.members.length) {
        return res.status(400).json({
          success: false,
          message: `Team size cannot be smaller than current member count (${project.members.length})`,
        });
      }
      project.teamSize = newSize;
    }

    if (technologies && Array.isArray(technologies)) {
      project.technologies = Array.from(new Set(technologies.map((t) => t.trim()))).filter(Boolean);
    }

    if (rolesRequired && Array.isArray(rolesRequired)) {
      project.rolesRequired = Array.from(new Set(rolesRequired.map((r) => r.trim()))).filter(Boolean);
    }

    if (requiredSkills && Array.isArray(requiredSkills)) {
      project.requiredSkills = requiredSkills.map((s) => ({
        skill: (typeof s === 'string' ? s : s.skill).trim(),
        weight: Number(s.weight) || 20,
      })).filter((s) => s.skill);
    }

    await project.save();

    const updated = await Project.findById(project._id)
      .populate('owner', 'name profileImage title')
      .populate('members.user', 'name profileImage title skills');

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete or Archive Project
// @route   DELETE /api/projects/:id
// @access  Private (Owner or Admin)
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const isOwner = project.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Only project owner or administrator can delete this project',
      });
    }

    await project.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a team member's role
// @route   PUT /api/projects/:id/members/:userId/role
// @access  Private (Owner only)
const updateMemberRole = async (req, res, next) => {
  try {
    const { id: projectId, userId } = req.params;
    const { role } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner can assign member roles',
      });
    }

    const memberIndex = project.members.findIndex(
      (m) => m.user.toString() === userId.toString()
    );

    if (memberIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'User is not a member of this project team',
      });
    }

    project.members[memberIndex].role = role;
    await project.save();

    await createNotification({
      recipient: userId,
      type: 'team_joined',
      title: 'Project Role Updated',
      message: `Your role in "${project.title}" has been updated to "${role}".`,
      relatedProject: project._id,
    });

    const updated = await Project.findById(projectId).populate(
      'members.user',
      'name profileImage title skills experienceLevel'
    );

    res.status(200).json({
      success: true,
      data: updated.members,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove member from project or leave project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private (Owner or Self)
const removeMember = async (req, res, next) => {
  try {
    const { id: projectId, userId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const isOwner = project.owner.toString() === req.user._id.toString();
    const isSelf = req.user._id.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isSelf && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to remove this member',
      });
    }

    // Owner cannot be removed from members unless project is deleted
    if (project.owner.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Project owner cannot leave the team. Transfer ownership or archive project.',
      });
    }

    project.members = project.members.filter((m) => m.user.toString() !== userId);
    project.currentTeamSize = project.members.length;

    // If project was In Progress and capacity is now below full, it can reopen
    if (project.status === 'In Progress' && project.currentTeamSize < project.teamSize) {
      project.status = 'Open';
    }

    await project.save();

    if (isOwner && !isSelf) {
      await createNotification({
        recipient: userId,
        type: 'system',
        title: 'Removed from Project',
        message: `You were removed from the team for "${project.title}".`,
        relatedProject: project._id,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Member removed successfully',
      data: project.members,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Publish completed project to public showcase
// @route   POST /api/projects/:id/showcase
// @access  Private (Owner only)
const publishShowcase = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner can publish to showcase',
      });
    }

    const { summary, demoUrl, githubUrl, screenshots } = req.body;

    project.status = 'Completed';
    project.showcase = {
      isPublished: true,
      summary: summary || project.description,
      demoUrl: demoUrl || '',
      githubUrl: githubUrl || '',
      screenshots: Array.isArray(screenshots) ? screenshots : [],
      completionDate: new Date(),
    };

    await project.save();

    // Notify all members that project is completed and ready for reviews
    for (const member of project.members) {
      await createNotification({
        recipient: member.user,
        type: 'system',
        title: 'Project Published to Showcase! 🚀',
        message: `"${project.title}" has been completed and published. You can now rate and review your teammates!`,
        relatedProject: project._id,
      });
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recommended projects for logged in user
// @route   GET /api/projects/recommendations
// @access  Private
const getRecommendedProjects = async (req, res, next) => {
  try {
    const user = req.user;
    const userSkills = user.skills || [];

    // Find open projects where user is NOT owner and NOT member
    const projects = await Project.find({
      status: 'Open',
      owner: { $ne: user._id },
      'members.user': { $ne: user._id },
    })
      .populate('owner', 'name profileImage title')
      .populate('members.user', 'name profileImage title')
      .limit(30);

    const scoredProjects = projects.map((p) => {
      const match = calculateSkillMatch(userSkills, p.requiredSkills);
      const pObj = p.toObject();
      pObj.skillMatch = match;
      return pObj;
    });

    // Sort by match percentage descending
    scoredProjects.sort((a, b) => b.skillMatch.matchPercentage - a.skillMatch.matchPercentage);

    res.status(200).json({
      success: true,
      data: scoredProjects.slice(0, 10),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's joined and created projects
// @route   GET /api/projects/my-projects
// @access  Private
const getMyProjects = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const projects = await Project.find({
      $or: [{ owner: userId }, { 'members.user': userId }],
    })
      .populate('owner', 'name profileImage title')
      .populate('members.user', 'name profileImage title')
      .sort('-updatedAt');

    res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get public completed projects showcase
// @route   GET /api/projects/showcase
// @access  Public
const getShowcaseProjects = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const query = {
      status: 'Completed',
      'showcase.isPublished': true,
    };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search && search.trim()) {
      const reg = new RegExp(search.trim(), 'i');
      query.$or = [{ title: reg }, { 'showcase.summary': reg }];
    }

    const projects = await Project.find(query)
      .populate('owner', 'name profileImage title')
      .populate('members.user', 'name profileImage title')
      .sort('-showcase.completionDate');

    res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
