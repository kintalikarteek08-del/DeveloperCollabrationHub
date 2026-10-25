require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const Application = require('../models/Application');
const Task = require('../models/Task');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const Review = require('../models/Review');
const Report = require('../models/Report');

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/devcollab';
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected to MongoDB...');

    // Clear existing collections
    await Promise.all([
      User.deleteMany(),
      Project.deleteMany(),
      Application.deleteMany(),
      Task.deleteMany(),
      Message.deleteMany(),
      Notification.deleteMany(),
      Review.deleteMany(),
      Report.deleteMany(),
    ]);
    console.log('[Seed] Cleared existing records.');

    // 1. Create Users
    const users = await User.create([
      {
        name: 'Admin Moderator',
        email: 'admin@devcollab.com',
        password: 'adminpassword123',
        role: 'admin',
        title: 'Platform Administrator',
        bio: 'Overseeing developer integrity, collaboration standards, and community safety.',
        location: 'San Francisco, CA',
        profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        skills: ['Node.js', 'System Architecture', 'Security', 'Docker'],
        interests: ['Community Moderation', 'Open Source'],
        experienceLevel: 'Expert',
        availability: 'Full-time',
      },
      {
        name: 'Karteek V.',
        email: 'karteek@devcollab.com',
        password: 'password123',
        role: 'developer',
        title: 'Full Stack Engineer & Cloud Architect',
        bio: 'Passionate about building scalable distributed systems, responsive modern SPAs, and developer productivity tooling.',
        location: 'Bengaluru, India',
        profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        skills: ['React', 'Node.js', 'MongoDB', 'Python', 'TailwindCSS', 'TypeScript', 'Docker'],
        interests: ['Web Development', 'AI/ML', 'Cloud Architecture'],
        experienceLevel: 'Advanced',
        github: 'https://github.com/karteek-dev',
        linkedin: 'https://linkedin.com/in/karteek-dev',
        portfolio: 'https://karteek.dev',
        availability: 'Full-time',
        ratingAverage: 4.9,
        ratingCount: 8,
      },
      {
        name: 'Rahul Sharma',
        email: 'rahul@devcollab.com',
        password: 'password123',
        role: 'developer',
        title: 'Frontend Specialist & UI/UX Craftsman',
        bio: 'Design engineer obsessed with fluid animations, micro-interactions, responsive accessibility, and design tokens.',
        location: 'Hyderabad, India',
        profileImage: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
        skills: ['React', 'TypeScript', 'TailwindCSS', 'Figma', 'UI/UX', 'Next.js'],
        interests: ['Design Systems', 'Web Performance'],
        experienceLevel: 'Advanced',
        github: 'https://github.com/rahul-ui',
        linkedin: 'https://linkedin.com/in/rahul-ui',
        portfolio: 'https://rahul.design',
        availability: 'Part-time',
        ratingAverage: 4.8,
        ratingCount: 5,
      },
      {
        name: 'Anu Priyadarshini',
        email: 'anu@devcollab.com',
        password: 'password123',
        role: 'developer',
        title: 'AI / Machine Learning Researcher',
        bio: 'Building neural search agents, fine-tuning LLMs, and deploying inference pipelines on GPU clusters.',
        location: 'Chennai, India',
        profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        skills: ['Python', 'PyTorch', 'FastAPI', 'Machine Learning', 'TensorFlow', 'Docker'],
        interests: ['AI/ML', 'Generative AI', 'Computer Vision'],
        experienceLevel: 'Intermediate',
        github: 'https://github.com/anu-ai',
        linkedin: 'https://linkedin.com/in/anu-ai',
        portfolio: 'https://anu-ml.io',
        availability: 'Part-time',
        ratingAverage: 5.0,
        ratingCount: 3,
      },
      {
        name: 'Elena Rostova',
        email: 'elena@devcollab.com',
        password: 'password123',
        role: 'developer',
        title: 'Cloud & Site Reliability Engineer',
        bio: 'Terraform, Kubernetes, zero-downtime blue/green CI/CD pipelines, and high availability database clusters.',
        location: 'Berlin, Germany',
        profileImage: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
        skills: ['Docker', 'Kubernetes', 'AWS', 'Go', 'CI/CD', 'PostgreSQL'],
        interests: ['DevOps', 'Distributed Systems'],
        experienceLevel: 'Expert',
        github: 'https://github.com/elena-sre',
        linkedin: 'https://linkedin.com/in/elena-sre',
        availability: 'Weekends',
        ratingAverage: 4.9,
        ratingCount: 6,
      },
      {
        name: 'Marcus Chen',
        email: 'marcus@devcollab.com',
        password: 'password123',
        role: 'developer',
        title: 'Backend Systems Engineer',
        bio: 'API designer, event-driven pipelines with Kafka & Redis, caching strategies, and performance benchmarking.',
        location: 'Toronto, Canada',
        profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        skills: ['Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'Redis', 'TypeScript'],
        interests: ['Backend Development', 'Security'],
        experienceLevel: 'Intermediate',
        github: 'https://github.com/marcus-backend',
        linkedin: 'https://linkedin.com/in/marcus-dev',
        availability: 'Part-time',
        ratingAverage: 4.7,
        ratingCount: 4,
      },
    ]);

    const [admin, karteek, rahul, anu, elena, marcus] = users;

    // 2. Create Projects
    const project1 = await Project.create({
      title: 'DevSync: Collaborative Live Code Editor',
      description:
        'A browser-based real-time collaborative code editor with instant syntax highlighting, AST parsing, WebRTC audio channels, and integrated code execution containers.',
      category: 'Web Development',
      technologies: ['React', 'Node.js', 'Socket.IO', 'TailwindCSS', 'Docker', 'MongoDB'],
      requiredSkills: [
        { skill: 'React', weight: 30 },
        { skill: 'Node.js', weight: 25 },
        { skill: 'MongoDB', weight: 20 },
        { skill: 'Docker', weight: 15 },
        { skill: 'TailwindCSS', weight: 10 },
      ],
      teamSize: 4,
      currentTeamSize: 2,
      difficulty: 'Advanced',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days ahead
      owner: karteek._id,
      status: 'Open',
      views: 142,
      members: [
        { user: karteek._id, role: 'Owner', joinedAt: new Date(Date.now() - 10 * 86400000) },
        { user: rahul._id, role: 'Frontend Developer', joinedAt: new Date(Date.now() - 5 * 86400000) },
      ],
    });

    const project2 = await Project.create({
      title: 'NeuroVision: AI Chest Radiography Diagnostic Assistant',
      description:
        'A HIPAA-conscious multimodal deep learning web app that assists radiologists by highlighting pulmonary lesions, detecting cardiomegaly, and generating structured clinical draft summaries.',
      category: 'AI/ML',
      technologies: ['Python', 'PyTorch', 'FastAPI', 'React', 'Docker'],
      requiredSkills: [
        { skill: 'Python', weight: 35 },
        { skill: 'PyTorch', weight: 30 },
        { skill: 'FastAPI', weight: 20 },
        { skill: 'Docker', weight: 15 },
      ],
      teamSize: 3,
      currentTeamSize: 2,
      difficulty: 'Advanced',
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      owner: anu._id,
      status: 'Open',
      views: 98,
      members: [
        { user: anu._id, role: 'Owner', joinedAt: new Date(Date.now() - 7 * 86400000) },
        { user: karteek._id, role: 'Full Stack Developer', joinedAt: new Date(Date.now() - 3 * 86400000) },
      ],
    });

    const project3 = await Project.create({
      title: 'CloudMesh: Kubernetes Multi-Cluster Cost Optimizer',
      description:
        'Automated FinOps agent that inspects telemetry from Prometheus across multi-region Kubernetes clusters to recommend right-sizing node pools, spot instance conversions, and idle resource culling.',
      category: 'Cloud',
      technologies: ['Go', 'Kubernetes', 'Docker', 'AWS', 'React'],
      requiredSkills: [
        { skill: 'Kubernetes', weight: 35 },
        { skill: 'Go', weight: 25 },
        { skill: 'Docker', weight: 20 },
        { skill: 'AWS', weight: 20 },
      ],
      teamSize: 3,
      currentTeamSize: 1,
      difficulty: 'Advanced',
      deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      owner: elena._id,
      status: 'Open',
      views: 76,
      members: [{ user: elena._id, role: 'Owner', joinedAt: new Date() }],
    });

    const project4 = await Project.create({
      title: 'ZeroShield: Decentralized Identity & Auth Protocol',
      description:
        'Privacy-preserving authentication protocol utilizing zero-knowledge proofs (zk-SNARKs) to verify user age and accreditation without disclosing personal identifier documents.',
      category: 'Cybersecurity',
      technologies: ['Node.js', 'TypeScript', 'React', 'Cryptography'],
      requiredSkills: [
        { skill: 'TypeScript', weight: 35 },
        { skill: 'Node.js', weight: 30 },
        { skill: 'React', weight: 25 },
        { skill: 'Security', weight: 10 },
      ],
      teamSize: 4,
      currentTeamSize: 1,
      difficulty: 'Intermediate',
      deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
      owner: marcus._id,
      status: 'Open',
      views: 64,
      members: [{ user: marcus._id, role: 'Owner', joinedAt: new Date() }],
    });

    // Completed project published in showcase
    const projectShowcase = await Project.create({
      title: 'PulseTrack: IoT Heart Rate & Heat Exhaustion Band for Athletes',
      description:
        'A comprehensive full-stack wearable health platform streaming Bluetooth LE telemetry from ESP32 microcontrollers to a Node/MongoDB time-series backend with real-time React dashboard warnings.',
      category: 'IoT',
      technologies: ['React', 'Node.js', 'MongoDB', 'TailwindCSS', 'Figma'],
      requiredSkills: [
        { skill: 'React', weight: 35 },
        { skill: 'Node.js', weight: 35 },
        { skill: 'MongoDB', weight: 30 },
      ],
      teamSize: 3,
      currentTeamSize: 3,
      difficulty: 'Intermediate',
      owner: karteek._id,
      status: 'Completed',
      views: 312,
      members: [
        { user: karteek._id, role: 'Owner', joinedAt: new Date(Date.now() - 40 * 86400000) },
        { user: rahul._id, role: 'Frontend Developer', joinedAt: new Date(Date.now() - 38 * 86400000) },
        { user: marcus._id, role: 'Backend Developer', joinedAt: new Date(Date.now() - 36 * 86400000) },
      ],
      showcase: {
        isPublished: true,
        summary:
          'Successfully built and delivered an end-to-end hardware-to-cloud telemetry dashboard supporting 60fps real-time ECG graphing and automated dehydration alerts.',
        demoUrl: 'https://pulsetrack-demo.devcollab.app',
        githubUrl: 'https://github.com/devcollab-community/pulsetrack-iot',
        screenshots: [
          'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
        ],
        completionDate: new Date(Date.now() - 5 * 86400000),
      },
    });

    // 3. Applications
    await Application.create([
      {
        project: project1._id,
        applicant: marcus._id,
        message: 'I have extensive experience with WebSocket architecture and Redis backplanes. Would love to build the concurrency engine for DevSync!',
        relevantSkills: ['Node.js', 'Express', 'Redis', 'MongoDB'],
        status: 'Pending',
      },
      {
        project: project3._id,
        applicant: karteek._id,
        message: 'I can build the React analytics dashboard and integrate Prometheus metrics with Tailwind UI cards.',
        relevantSkills: ['React', 'TailwindCSS', 'Docker'],
        status: 'Pending',
      },
      {
        project: project2._id,
        applicant: elena._id,
        message: 'I can package the PyTorch models into scalable Triton inference containers deployed with Docker.',
        relevantSkills: ['Docker', 'AWS', 'Kubernetes'],
        status: 'Pending',
      },
    ]);

    // 4. Tasks for DevSync project
    await Task.create([
      {
        project: project1._id,
        title: 'Architect operational transformation engine for multi-cursor synchronization',
        description: 'Implement CRDT or OT algorithms to handle concurrent keystrokes from multiple users without text conflict or drift.',
        assignedTo: karteek._id,
        createdBy: karteek._id,
        priority: 'Critical',
        status: 'IN PROGRESS',
        order: 0,
        deadline: new Date(Date.now() + 5 * 86400000),
        comments: [
          {
            user: rahul._id,
            text: 'I have prepared the Monaco Editor canvas wrapper on the frontend ready to receive cursor coordinates.',
            createdAt: new Date(Date.now() - 2 * 86400000),
          },
        ],
      },
      {
        project: project1._id,
        title: 'Build Dark Mode syntax theme selector and file explorer sidebar',
        description: 'Provide VSCode-like file tree with add/delete file triggers and dynamic tab switching.',
        assignedTo: rahul._id,
        createdBy: karteek._id,
        priority: 'High',
        status: 'TODO',
        order: 1,
        deadline: new Date(Date.now() + 8 * 86400000),
      },
      {
        project: project1._id,
        title: 'Setup sandboxed container runner for code execution',
        description: 'Ensure isolated Docker containers run user-submitted Python/JavaScript with CPU and memory limits.',
        assignedTo: karteek._id,
        createdBy: karteek._id,
        priority: 'High',
        status: 'REVIEW',
        order: 2,
        deadline: new Date(Date.now() + 3 * 86400000),
      },
      {
        project: project1._id,
        title: 'Initialize repository structure and Tailwind CSS design tokens',
        description: 'Base project setup with responsive layout and standard linting.',
        assignedTo: rahul._id,
        createdBy: karteek._id,
        priority: 'Medium',
        status: 'DONE',
        order: 3,
        deadline: new Date(Date.now() - 4 * 86400000),
      },
    ]);

    // 5. Messages for DevSync project
    await Message.create([
      {
        project: project1._id,
        sender: karteek._id,
        message: 'Welcome everyone to DevSync! Excited to kick off this collaborative editor.',
        createdAt: new Date(Date.now() - 4 * 86400000),
      },
      {
        project: project1._id,
        sender: rahul._id,
        message: 'Hey Karteek! Just finished reviewing the UX mockups. The responsive layout is looking sharp.',
        createdAt: new Date(Date.now() - 3 * 86400000),
      },
      {
        project: project1._id,
        sender: karteek._id,
        message: 'Awesome Rahul. I will be pushing the WebSocket room events today for cursor sharing.',
        createdAt: new Date(Date.now() - 1 * 86400000),
      },
    ]);

    // 6. Notifications for Karteek
    await Notification.create([
      {
        recipient: karteek._id,
        type: 'application_received',
        title: 'New Applicant for DevSync',
        message: 'Marcus Chen applied to join "DevSync: Collaborative Live Code Editor".',
        relatedProject: project1._id,
        read: false,
      },
      {
        recipient: karteek._id,
        type: 'task_assigned',
        title: 'Task Assigned',
        message: 'You have been assigned to "Architect operational transformation engine".',
        relatedProject: project1._id,
        read: false,
      },
      {
        recipient: karteek._id,
        type: 'system',
        title: 'Welcome to Developer Collaboration Hub!',
        message: 'Explore open projects, find talented teammates, and publish your work.',
        read: true,
      },
    ]);

    // 7. Peer Reviews on PulseTrack completed project
    await Review.create([
      {
        project: projectShowcase._id,
        reviewer: rahul._id,
        reviewee: karteek._id,
        rating: 5,
        categories: { communication: 5, technical: 5, reliability: 5, teamwork: 5 },
        comment: 'Karteek is an exceptional lead engineer. His backend telemetry design was rock solid and made frontend state management effortless.',
      },
      {
        project: projectShowcase._id,
        reviewer: marcus._id,
        reviewee: karteek._id,
        rating: 5,
        categories: { communication: 5, technical: 5, reliability: 5, teamwork: 5 },
        comment: 'Great architecture skills and prompt feedback during sprint planning. Highly recommend working with Karteek!',
      },
      {
        project: projectShowcase._id,
        reviewer: karteek._id,
        reviewee: rahul._id,
        rating: 5,
        categories: { communication: 5, technical: 5, reliability: 5, teamwork: 5 },
        comment: 'Rahul delivered stunning UI charts and real-time canvas widgets on time. Superb design sensibility.',
      },
    ]);

    // 8. Sample Report for Admin Moderation
    await Report.create({
      reporter: marcus._id,
      targetType: 'project',
      targetId: project4._id,
      targetName: 'ZeroShield: Decentralized Identity',
      reason: 'Verify smart contract audit references',
      description: 'Requesting review of documentation links for accuracy.',
      status: 'Pending',
    });

    console.log('[Seed] Database populated successfully with realistic sample data!');
    console.log('--- Credentials ---');
    console.log('Admin:     admin@devcollab.com     | adminpassword123');
    console.log('Developer: karteek@devcollab.com   | password123');
    console.log('Developer: rahul@devcollab.com     | password123');
    console.log('Developer: anu@devcollab.com       | password123');
    console.log('Developer: elena@devcollab.com     | password123');
    console.log('Developer: marcus@devcollab.com    | password123');
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]', err);
    process.exit(1);
  }
};

seedDatabase();
