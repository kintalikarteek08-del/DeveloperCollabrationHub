const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reviewee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    categories: {
      communication: { type: Number, min: 1, max: 5, default: 5 },
      technical: { type: Number, min: 1, max: 5, default: 5 },
      reliability: { type: Number, min: 1, max: 5, default: 5 },
      teamwork: { type: Number, min: 1, max: 5, default: 5 },
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Review comment cannot exceed 1000 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// One review per reviewer per reviewee per project
ReviewSchema.index({ project: 1, reviewer: 1, reviewee: 1 }, { unique: true });

module.exports = mongoose.model('Review', ReviewSchema);
