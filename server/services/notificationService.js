const Notification = require('../models/Notification');

let ioInstance = null;

const setSocketIO = (io) => {
  ioInstance = io;
};

/**
 * Dispatch notification, persist in database, and emit via Socket.IO
 */
const createNotification = async ({
  recipient,
  type,
  title,
  message,
  relatedProject = null,
  relatedTask = null,
}) => {
  try {
    const recipientId = recipient?._id ? recipient._id.toString() : recipient ? recipient.toString() : null;
    if (!recipientId) {
      console.error('[NotificationService Error] Recipient ID is required');
      return null;
    }

    const projectId = relatedProject?._id || relatedProject || null;
    const taskId = relatedTask?._id || relatedTask || null;

    const notification = await Notification.create({
      recipient: recipientId,
      type,
      title,
      message,
      relatedProject: projectId,
      relatedTask: taskId,
    });

    const populated = await Notification.findById(notification._id)
      .populate('relatedProject', 'title category')
      .populate('relatedTask', 'title status priority');

    const payload = populated || notification;

    if (ioInstance) {
      ioInstance.to(`user_${recipientId}`).emit('new_notification', payload);
    }

    return payload;
  } catch (error) {
    console.error('[NotificationService Error]', error.message);
    return null;
  }
};

module.exports = {
  setSocketIO,
  createNotification,
};
