const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Project = require('../models/Project');
const Message = require('../models/Message');
const { createNotification } = require('../services/notificationService');

const initSocketIO = (io) => {
  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'developer_collaboration_hub_super_secret_jwt_key_2026_xyz987'
      );
      const user = await User.findById(decoded.id).select('-password');
      if (!user || user.status === 'suspended') {
        return next(new Error('Authentication error: Invalid or suspended user'));
      }

      socket.user = user;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    console.log(`[Socket] User connected: ${socket.user.name} (${userId})`);

    // Personal room for private notifications
    socket.join(`user_${userId}`);

    // Join Project Room with membership check
    socket.on('join_project', async ({ projectId }, callback) => {
      try {
        if (!projectId) {
          if (callback) callback({ success: false, message: 'Project ID required' });
          return;
        }

        const project = await Project.findById(projectId);
        if (!project) {
          if (callback) callback({ success: false, message: 'Project not found' });
          return;
        }

        const isOwner = project.owner.toString() === userId;
        const isMember = project.members.some((m) => (m.user?._id || m.user).toString() === userId);
        const isAdmin = socket.user.role === 'admin';

        if (!isOwner && !isMember && !isAdmin) {
          if (callback) callback({ success: false, message: 'Access denied: You are not a member of this project' });
          return;
        }

        const roomName = `project_${projectId}`;
        socket.join(roomName);
        console.log(`[Socket] ${socket.user.name} joined room: ${roomName}`);

        if (callback) callback({ success: true, room: roomName });
      } catch (err) {
        console.error('[Socket join_project error]', err);
        if (callback) callback({ success: false, message: err.message });
      }
    });

    // Leave Project Room
    socket.on('leave_project', ({ projectId }) => {
      if (projectId) {
        socket.leave(`project_${projectId}`);
        console.log(`[Socket] ${socket.user.name} left room project_${projectId}`);
      }
    });

    // Send Real-Time Project Message
    socket.on('send_message', async ({ projectId, message }, callback) => {
      try {
        if (!projectId || !message || !message.trim()) {
          if (callback) callback({ success: false, message: 'Message content is required' });
          return;
        }

        // Verify membership
        const project = await Project.findById(projectId);
        if (!project) {
          if (callback) callback({ success: false, message: 'Project not found' });
          return;
        }

        const isOwner = project.owner.toString() === userId;
        const isMember = project.members.some((m) => (m.user?._id || m.user).toString() === userId);
        const isAdmin = socket.user.role === 'admin';

        if (!isOwner && !isMember && !isAdmin) {
          if (callback) callback({ success: false, message: 'Only team members can post messages' });
          return;
        }

        // Persist message in MongoDB
        const newMessage = await Message.create({
          project: projectId,
          sender: socket.user._id,
          message: message.trim(),
        });

        // Populate sender info
        const populatedMessage = await Message.findById(newMessage._id).populate(
          'sender',
          'name profileImage title'
        );

        // Broadcast to all sockets in the project room
        io.to(`project_${projectId}`).emit('receive_message', populatedMessage);

        if (callback) callback({ success: true, data: populatedMessage });

        // Dispatch notifications to project teammates (excluding sender)
        const recipientIds = new Set();
        const ownerIdStr = project.owner.toString();
        if (ownerIdStr !== userId) {
          recipientIds.add(ownerIdStr);
        }

        if (Array.isArray(project.members)) {
          project.members.forEach((m) => {
            const memberIdStr = (m.user?._id || m.user).toString();
            if (memberIdStr !== userId) {
              recipientIds.add(memberIdStr);
            }
          });
        }

        console.log(`[Socket send_message] sender=${userId}, project=${projectId}, recipientIds=[${[...recipientIds].join(', ')}]`);

        const senderName = socket.user.name || 'Team member';
        const trimmedMessage = message.trim();
        const previewText =
          trimmedMessage.length > 60
            ? `${trimmedMessage.substring(0, 57)}...`
            : trimmedMessage;

        for (const recipientId of recipientIds) {
          console.log(`[Socket send_message] Creating notification for recipient: ${recipientId}`);
          const notifResult = await createNotification({
            recipient: recipientId,
            type: 'chat_message',
            title: `New message in "${project.title}"`,
            message: `${senderName}: "${previewText}"`,
            relatedProject: project._id,
          });
          console.log(`[Socket send_message] Notification result for ${recipientId}:`, notifResult ? `ID ${notifResult._id}` : 'null/failed');
        }
      } catch (err) {
        console.error('[Socket send_message error]', err);
        if (callback) callback({ success: false, message: err.message });
      }
    });

    // Typing indicators (verify membership before broadcasting)
    socket.on('typing_start', async ({ projectId }) => {
      if (!projectId) return;
      try {
        const project = await Project.findById(projectId).select('owner members');
        if (!project) return;
        const isAuthorized =
          project.owner.toString() === userId ||
          project.members.some((m) => (m.user?._id || m.user).toString() === userId) ||
          socket.user.role === 'admin';
        if (isAuthorized) {
          socket.to(`project_${projectId}`).emit('user_typing', {
            userId: socket.user._id,
            name: socket.user.name,
          });
        }
      } catch (_) {/* ignore */ }
    });

    socket.on('typing_stop', async ({ projectId }) => {
      if (!projectId) return;
      try {
        const project = await Project.findById(projectId).select('owner members');
        if (!project) return;
        const isAuthorized =
          project.owner.toString() === userId ||
          project.members.some((m) => (m.user?._id || m.user).toString() === userId) ||
          socket.user.role === 'admin';
        if (isAuthorized) {
          socket.to(`project_${projectId}`).emit('user_stop_typing', {
            userId: socket.user._id,
          });
        }
      } catch (_) {/* ignore */ }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${socket.user.name}`);
    });
  });
};

module.exports = { initSocketIO };
