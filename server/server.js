const path = require('path');
// Ensure environment variables are loaded from server/.env regardless of CWD,
// while preserving any environment variables set by cloud providers (Render, etc.) or project root .env
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { Server } = require('socket.io');

const mongoose = require('mongoose');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { initSocketIO } = require('./socket/chatSocket');
const { setSocketIO } = require('./services/notificationService');

// Route files
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const taskRoutes = require('./routes/taskRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Configure dynamic CORS origin validation
const getAllowedOrigins = () => {
  const rawClientUrl = process.env.CLIENT_URL || '';
  const configured = rawClientUrl
    .split(',')
    .map((origin) => {
      let trimmed = origin.trim();
      // Remove surrounding single or double quotes
      trimmed = trimmed.replace(/^['"]+|['"]+$/g, '');
      // Remove trailing slashes
      trimmed = trimmed.replace(/\/+$/, '');
      return trimmed;
    })
    .filter((origin) => origin.length > 0);

  const devOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://localhost:5000',
  ];

  if (process.env.NODE_ENV === 'production') {
    // In production, strictly allow ONLY configured origins from CLIENT_URL
    return configured;
  }

  // Outside production, allow configured origins plus local development origins
  return Array.from(new Set([...configured, ...devOrigins]));
};

const isOriginAllowed = (origin) => {
  // Allow requests without an Origin header (e.g. mobile, curl, server-to-server, health monitors)
  if (!origin) return true;

  const normalizedOrigin = origin.trim().replace(/^['"]+|['"]+$/g, '').replace(/\/+$/, '');
  const allowed = getAllowedOrigins();

  if (allowed.includes(normalizedOrigin)) {
    return true;
  }

  // Allow localhost origins only outside production
  if (
    process.env.NODE_ENV !== 'production' &&
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalizedOrigin)
  ) {
    return true;
  }

  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }

    const corsError = new Error(`CORS blocked: Origin ${origin} is not allowed`);
    corsError.statusCode = 403;
    return callback(corsError);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 204,
};

// Initialize Socket.IO with CORS & transports
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
});

// Configure Socket.IO & notification dispatcher
initSocketIO(io);
setSocketIO(io);

// Middlewares
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint (probed by Render, cloud load balancers, and monitors)
const healthHandler = (req, res) => {
  const dbState = mongoose.connection.readyState;
  const isHealthy = dbState === 1;
  const statusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    status: isHealthy ? 'online' : 'degraded',
    database: statusMap[dbState] || 'unknown',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    service: 'Developer Collaboration Hub API',
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);

// 404 Route Catch-all for API
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.originalUrl}`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`[Server] Developer Collaboration Hub API running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);

    if (process.env.NODE_ENV === 'production') {
      if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('super_secret_jwt_key_2026_xyz987')) {
        console.warn('⚠️ [SECURITY WARNING] Default or missing JWT_SECRET in production! Please define a strong random JWT_SECRET in your production environment variables.');
      }
    }
  });
}

module.exports = { app, server, io, getAllowedOrigins, isOriginAllowed, corsOptions };
