const Review = require('../models/Review');
const Project = require('../models/Project');
const User = require('../models/User');
const { createNotification } = require('../services/notificationService');

// @desc    Create review for teammate
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res, next) => {
  try {
    const { projectId, revieweeId, rating, categories, comment } = req.body;
    const reviewerId = req.user._id;

    if (!projectId || !revieweeId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Project ID, reviewee ID, and rating are required',
      });
    }

    // Prevent self-review
    if (reviewerId.toString() === revieweeId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot review yourself',
      });
    }

    // Verify project exists and is completed
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.status !== 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Reviews can only be submitted for completed projects',
      });
    }

    // Verify both were team members
    const allMemberIds = [
      project.owner.toString(),
      ...project.members.map((m) => m.user.toString()),
    ];

    if (!allMemberIds.includes(reviewerId.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You must be a member of this project to leave a review',
      });
    }

    if (!allMemberIds.includes(revieweeId.toString())) {
      return res.status(400).json({
        success: false,
        message: 'The person you are reviewing was not a member of this project',
      });
    }

    // Check duplicate review
    const existing = await Review.findOne({
      project: projectId,
      reviewer: reviewerId,
      reviewee: revieweeId,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You have already reviewed this teammate for this project',
      });
    }

    const review = await Review.create({
      project: projectId,
      reviewer: reviewerId,
      reviewee: revieweeId,
      rating: Number(rating),
      categories: {
        communication: categories?.communication || Number(rating),
        technical: categories?.technical || Number(rating),
        reliability: categories?.reliability || Number(rating),
        teamwork: categories?.teamwork || Number(rating),
      },
      comment: comment ? comment.trim() : '',
    });

    // Recalculate reviewee ratingAverage and ratingCount
    const allUserReviews = await Review.find({ reviewee: revieweeId });
    const count = allUserReviews.length;
    const avg =
      count > 0
        ? allUserReviews.reduce((sum, r) => sum + r.rating, 0) / count
        : 5.0;

    await User.findByIdAndUpdate(revieweeId, {
      ratingAverage: parseFloat(avg.toFixed(1)),
      ratingCount: count,
    });

    // Notify reviewee
    await createNotification({
      recipient: revieweeId,
      type: 'review_received',
      title: 'New Collaborator Review ⭐',
      message: `${req.user.name} submitted a ${rating}-star review for your collaboration on "${project.title}".`,
      relatedProject: project._id,
    });

    res.status(201).json({
      success: true,
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reviews for a user
// @route   GET /api/reviews/user/:userId
// @access  Public
const getUserReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.userId })
      .populate('reviewer', 'name profileImage title')
      .populate('project', 'title category')
      .sort('-createdAt');

    // Aggregate category averages
    let categoryAverages = {
      communication: 5,
      technical: 5,
      reliability: 5,
      teamwork: 5,
    };

    if (reviews.length > 0) {
      const sum = reviews.reduce(
        (acc, r) => ({
          comm: acc.comm + (r.categories?.communication || r.rating),
          tech: acc.tech + (r.categories?.technical || r.rating),
          rel: acc.rel + (r.categories?.reliability || r.rating),
          team: acc.team + (r.categories?.teamwork || r.rating),
        }),
        { comm: 0, tech: 0, rel: 0, team: 0 }
      );
      const len = reviews.length;
      categoryAverages = {
        communication: parseFloat((sum.comm / len).toFixed(1)),
        technical: parseFloat((sum.tech / len).toFixed(1)),
        reliability: parseFloat((sum.rel / len).toFixed(1)),
        teamwork: parseFloat((sum.team / len).toFixed(1)),
      };
    }

    res.status(200).json({
      success: true,
      data: {
        reviews,
        categoryAverages,
        totalReviews: reviews.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getUserReviews,
};
