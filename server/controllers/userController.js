const User = require('../models/User');
const Project = require('../models/Project');
const Review = require('../models/Review');
const { calculateSkillMatch } = require('../services/skillMatching');

// @desc    Get user profile with stats and reviews
// @route   GET /api/users/:id
// @access  Public
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Developer profile not found',
      });
    }

    // Fetch projects where user is owner or member
    const userProjects = await Project.find({
      $or: [{ owner: user._id }, { 'members.user': user._id }],
    }).select('title category status difficulty technologies currentTeamSize showcase owner');

    // Fetch reviews received by this user
    const reviews = await Review.find({ reviewee: user._id })
      .populate('reviewer', 'name profileImage title')
      .populate('project', 'title category')
      .sort('-createdAt');

    const completedProjects = userProjects.filter((p) => p.status === 'Completed');
    const createdProjects = userProjects.filter(
      (p) => p.owner && p.owner.toString() === user._id.toString()
    );

    res.status(200).json({
      success: true,
      data: {
        user,
        projects: userProjects,
        completedProjectsCount: completedProjects.length,
        createdProjectsCount: createdProjects.length,
        activeProjectsCount: userProjects.filter((p) => p.status === 'In Progress' || p.status === 'Open').length,
        reviews,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current user's profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const {
      name,
      title,
      bio,
      location,
      profileImage,
      skills,
      interests,
      experienceLevel,
      github,
      linkedin,
      portfolio,
      availability,
    } = req.body;

    if (name) user.name = name;
    if (title !== undefined) user.title = title;
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (profileImage !== undefined) user.profileImage = profileImage;
    if (experienceLevel !== undefined) user.experienceLevel = experienceLevel;
    if (github !== undefined) user.github = github;
    if (linkedin !== undefined) user.linkedin = linkedin;
    if (portfolio !== undefined) user.portfolio = portfolio;
    if (availability !== undefined) user.availability = availability;

    if (skills && Array.isArray(skills)) {
      // Normalize and remove duplicates
      user.skills = Array.from(new Set(skills.map((s) => s.trim()))).filter(Boolean);
    }

    if (interests && Array.isArray(interests)) {
      user.interests = Array.from(new Set(interests.map((i) => i.trim()))).filter(Boolean);
    }

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get teammate recommendations for a specific project
// @route   GET /api/users/recommendations/teammates/:projectId
// @access  Private
const getTeammateRecommendations = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Get IDs of current team members
    const existingMemberIds = [
      project.owner.toString(),
      ...project.members.map((m) => m.user.toString()),
    ];

    // Find active developers not in current team
    const candidates = await User.find({
      _id: { $nin: existingMemberIds },
      status: 'active',
      role: 'developer',
    }).select('name title profileImage location skills experienceLevel availability ratingAverage ratingCount');

    // Score candidates against project requirements
    const scoredCandidates = candidates.map((cand) => {
      const match = calculateSkillMatch(cand.skills, project.requiredSkills);
      return {
        user: cand,
        matchPercentage: match.matchPercentage,
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills,
        explanation: match.explanation,
      };
    });

    // Sort by match percentage descending
    scoredCandidates.sort((a, b) => b.matchPercentage - a.matchPercentage);

    // Return top 15 matches
    res.status(200).json({
      success: true,
      data: scoredCandidates.slice(0, 15),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getTeammateRecommendations,
};
