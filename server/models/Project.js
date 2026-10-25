const mongoose = require('mongoose');

const RequiredSkillSchema = new mongoose.Schema(
  {
    skill: {
      type: String,
      required: true,
      trim: true,
    },
    weight: {
      type: Number,
      default: 20,
      min: 1,
      max: 100,
    },
  },
  { _id: false }
);

const MemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: [
        'Owner',
        'Frontend Developer',
        'Backend Developer',
        'Full Stack Developer',
        'ML Engineer',
        'UI/UX Designer',
        'DevOps',
        'Tester',
        'Other',
      ],
      default: 'Full Stack Developer',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const ProjectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
      trim: true,
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Web Development',
        'Mobile Development',
        'AI/ML',
        'Data Science',
        'Cybersecurity',
        'IoT',
        'Cloud',
        'Blockchain',
        'UI/UX',
        'Other',
      ],
      default: 'Web Development',
    },
    technologies: {
      type: [String],
      default: [],
    },
    requiredSkills: {
      type: [RequiredSkillSchema],
      default: [],
    },
    rolesRequired: {
      type: [String],
      default: [],
    },
    teamSize: {
      type: Number,
      required: [true, 'Team size is required'],
      min: [2, 'Team size must be at least 2'],
      max: [20, 'Team size cannot exceed 20'],
      default: 4,
    },
    currentTeamSize: {
      type: Number,
      default: 1,
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Intermediate',
    },
    deadline: {
      type: Date,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: {
      type: [MemberSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Completed', 'Archived'],
      default: 'Open',
    },
    showcase: {
      isPublished: {
        type: Boolean,
        default: false,
      },
      summary: {
        type: String,
        default: '',
      },
      demoUrl: {
        type: String,
        default: '',
      },
      githubUrl: {
        type: String,
        default: '',
      },
      screenshots: {
        type: [String],
        default: [],
      },
      completionDate: {
        type: Date,
      },
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save to auto-sync currentTeamSize
ProjectSchema.pre('save', function (next) {
  if (this.members) {
    this.currentTeamSize = this.members.length;
  }
  next();
});

module.exports = mongoose.model('Project', ProjectSchema);
