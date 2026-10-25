const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/devcollab').then(async () => {
  // Register all models first to avoid "Schema hasn't been registered" errors
  require('./models/User');
  require('./models/Project');
  require('./models/Task');
  require('./models/Notification');

  const Project = mongoose.model('Project');
  const p = await Project.findOne().populate('members.user', 'name');
  if (!p) { console.log('No project found'); process.exit(0); }
  console.log('Project:', p.title);
  console.log('Owner:', p.owner.toString());
  console.log('Members:', p.members.map(m => m.user?.toString() || m.user));

  const { createNotification } = require('./services/notificationService');

  // Test with owner as recipient
  const recipientId = p.owner.toString();
  console.log('\nTesting createNotification for recipient:', recipientId);

  try {
    const result = await createNotification({
      recipient: recipientId,
      type: 'chat_message',
      title: 'Test Chat Notification',
      message: 'Test: Hello from test',
      relatedProject: p._id,
    });
    if (result) {
      console.log('SUCCESS - Notification ID:', result._id);
    } else {
      console.log('FAILED - createNotification returned null');
    }
  } catch (e) {
    console.error('ERROR in createNotification:', e.message);
  }

  process.exit(0);
}).catch(e => { console.error('Connection Error:', e.message); process.exit(1); });
