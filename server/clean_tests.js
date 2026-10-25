require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const User = require('./models/User');
const Project = require('./models/Project');
const Application = require('./models/Application');
const Task = require('./models/Task');
const Message = require('./models/Message');
const Notification = require('./models/Notification');

async function clean() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  const testUsers = await User.find({ email: /@test\.com$/ });
  const ids = testUsers.map(u => u._id);
  if (ids.length > 0) {
    await User.deleteMany({ _id: { $in: ids } });
    await Project.deleteMany({ owner: { $in: ids } });
    await Application.deleteMany({ applicant: { $in: ids } });
    await Task.deleteMany({ assignedTo: { $in: ids } });
    await Message.deleteMany({ sender: { $in: ids } });
    await Notification.deleteMany({ recipient: { $in: ids } });
    console.log(`Removed ${ids.length} test accounts and their related records.`);
  } else {
    console.log('No test records found.');
  }
  await mongoose.disconnect();
}

clean().catch(console.error);
