const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: [true, 'Please provide an application message'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    requestedRole: {
      type: String,
      trim: true,
      default: 'Full Stack Developer',
    },
    relevantSkills: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Rejected', 'Withdrawn'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate applications
ApplicationSchema.index({ project: 1, applicant: 1 }, { unique: true });

module.exports = mongoose.model('Application', ApplicationSchema);
