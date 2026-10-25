const { io } = require('../client/node_modules/socket.io-client');

const BASE_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

const request = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(url, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
};

const loginOrRegister = async (name, email, password, skills = ['React', 'Node.js']) => {
  let res = await request('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  if (res.ok && res.data?.data?.token) {
    return res.data.data;
  }
  res = await request('/auth/register', {
    method: 'POST',
    body: {
      name,
      email,
      password,
      skills,
      experienceLevel: 'Intermediate',
    },
  });
  if (!res.ok) {
    throw new Error(`Auth failed for ${email}: ${JSON.stringify(res.data)}`);
  }
  return res.data.data;
};

const runComprehensiveSuite = async () => {
  console.log('================================================================');
  console.log('PROJECT JOIN REQUEST & TEAM COLLABORATION WORKSPACE VERIFICATION');
  console.log('================================================================\n');

  const timestamp = Date.now();

  // 1. Authenticate Users
  console.log('1. Authenticating test users...');
  const userA = await loginOrRegister('Dr. Alan Turing', `owner_ml_${timestamp}@test.com`, 'password123', ['Python', 'Machine Learning']);
  const userB = await loginOrRegister('Ada Lovelace', `member_ml_${timestamp}@test.com`, 'password123', ['Machine Learning', 'Python', 'PyTorch']);
  const userC = await loginOrRegister('Intruder Charles', `unrelated_${timestamp}@test.com`, 'password123', ['Java', 'Spring']);
  console.log(`✓ User A (Owner) authenticated: ${userA.name} (${userA._id})`);
  console.log(`✓ User B (ML Applicant) authenticated: ${userB.name} (${userB._id})`);
  console.log(`✓ User C (Unrelated User) authenticated: ${userC.name} (${userC._id})`);

  // 2. Setup Sockets
  console.log('\n2. Establishing real-time Socket.IO connections...');
  const socketA = io(SOCKET_URL, { auth: { token: userA.token }, transports: ['websocket'] });
  const socketB = io(SOCKET_URL, { auth: { token: userB.token }, transports: ['websocket'] });
  const socketC = io(SOCKET_URL, { auth: { token: userC.token }, transports: ['websocket'] });

  const notifsA = [];
  const notifsB = [];
  const notifsC = [];
  const chatMessagesB = [];
  const chatMessagesA = [];

  socketA.on('new_notification', (n) => notifsA.push(n));
  socketB.on('new_notification', (n) => notifsB.push(n));
  socketC.on('new_notification', (n) => notifsC.push(n));
  socketA.on('receive_message', (m) => chatMessagesA.push(m));
  socketB.on('receive_message', (m) => chatMessagesB.push(m));

  await Promise.all([
    new Promise((resolve) => socketA.on('connect', resolve)),
    new Promise((resolve) => socketB.on('connect', resolve)),
    new Promise((resolve) => socketC.on('connect', resolve)),
  ]);
  console.log('✓ All 3 users connected to Socket.IO');

  // 3. User A creates ML Project
  console.log('\n3. User A creates ML Project with required skills & needed roles...');
  const createProjRes = await request('/projects', {
    method: 'POST',
    token: userA.token,
    body: {
      title: `Healthcare AI Classifier ${timestamp}`,
      description: 'Building deep learning computer vision model for automated medical imaging.',
      category: 'AI/ML',
      technologies: ['Python', 'PyTorch', 'FastAPI', 'Docker'],
      requiredSkills: [
        { skill: 'Machine Learning', weight: 40 },
        { skill: 'Python', weight: 30 },
        { skill: 'PyTorch', weight: 30 },
      ],
      rolesRequired: ['ML Engineer', 'Backend Developer'],
      teamSize: 2, // Capacity for 2 members: Owner + 1 additional
      difficulty: 'Advanced',
    },
  });

  if (!createProjRes.ok) throw new Error(`Project creation failed: ${JSON.stringify(createProjRes.data)}`);
  const project = createProjRes.data.data;
  console.log(`✓ Project created successfully (ID: ${project._id})`);
  console.log(`  - Team size capacity: ${project.teamSize}`);
  console.log(`  - Roles required: [${project.rolesRequired.join(', ')}]`);
  console.log(`  - Required skills: [${project.requiredSkills.map((s) => s.skill).join(', ')}]`);
  console.log(`  - Initial status: ${project.status}`);

  // 4. User B Discovers Project Details
  console.log('\n4. User B discovers project and checks transparent skill compatibility & available positions...');
  const detailsRes = await request(`/projects/${project._id}`, {
    method: 'GET',
    token: userB.token,
  });

  if (!detailsRes.ok) throw new Error(`Failed to fetch project details: ${JSON.stringify(detailsRes.data)}`);
  const details = detailsRes.data.data;
  if (details.availablePositions !== 1) {
    throw new Error(`Expected 1 available position, got ${details.availablePositions}`);
  }
  if (!details.userSkillMatch || details.userSkillMatch.matchPercentage < 50) {
    throw new Error(`Expected high skill match for User B, got ${JSON.stringify(details.userSkillMatch)}`);
  }
  console.log(`✓ Available positions: ${details.availablePositions} spot(s) remaining`);
  console.log(`✓ User B skill match: ${details.userSkillMatch.matchPercentage}% (${details.userSkillMatch.matchedSkills.join(', ')})`);

  // 5. User B Submits Join Request
  console.log('\n5. User B submits join request with role, message, and skills...');
  const applyRes = await request('/applications', {
    method: 'POST',
    token: userB.token,
    body: {
      projectId: project._id,
      requestedRole: 'ML Engineer',
      message: 'I have 3 years of PyTorch experience in non-linear computer vision models.',
      relevantSkills: ['Machine Learning', 'Python', 'PyTorch'],
    },
  });

  if (!applyRes.ok) throw new Error(`Join request failed: ${JSON.stringify(applyRes.data)}`);
  const application = applyRes.data.data;
  console.log(`✓ Join request saved with ID: ${application._id}`);
  console.log(`  - Status: ${application.status}`);
  console.log(`  - Requested role: ${application.requestedRole}`);
  console.log(`  - Applicant message: "${application.message}"`);

  // Wait for Socket notification to User A
  await new Promise((r) => setTimeout(r, 600));
  const appReceivedNotif = notifsA.find((n) => n.type === 'application_received');
  if (!appReceivedNotif) throw new Error('User A did not receive application_received notification!');
  console.log(`✓ User A received real-time notification: "${appReceivedNotif.title}" - ${appReceivedNotif.message}`);

  // 6. Test Duplicate Application Prevention
  console.log('\n6. Testing duplicate application prevention...');
  const dupRes = await request('/applications', {
    method: 'POST',
    token: userB.token,
    body: {
      projectId: project._id,
      requestedRole: 'ML Engineer',
      message: 'Trying to apply a second time...',
    },
  });
  if (dupRes.status === 409) {
    console.log(`✓ Duplicate application blocked: ${dupRes.data.message}`);
  } else {
    throw new Error(`Expected 409 Conflict for duplicate application, got ${dupRes.status}`);
  }

  // 7. Test Self-Application Prevention
  console.log('\n7. Testing self-application prevention (Owner applying to own project)...');
  const selfRes = await request('/applications', {
    method: 'POST',
    token: userA.token,
    body: {
      projectId: project._id,
      message: 'Applying to my own project...',
    },
  });
  if (selfRes.status === 400 && selfRes.data.message.includes('own project')) {
    console.log(`✓ Self-application blocked: ${selfRes.data.message}`);
  } else {
    throw new Error(`Expected 400 for self-application, got ${selfRes.status}`);
  }

  // 8. Test Unauthorized Application Decision Prevention
  console.log('\n8. Testing unauthorized management (User C tries to accept/reject)...');
  const unauthRes = await request(`/applications/${application._id}/status`, {
    method: 'PUT',
    token: userC.token,
    body: { status: 'Accepted' },
  });
  if (unauthRes.status === 403) {
    console.log(`✓ Unauthorized approval blocked: ${unauthRes.data.message}`);
  } else {
    throw new Error(`Expected 403 Forbidden, got ${unauthRes.status}`);
  }

  // 9. Owner Views Applications Queue
  console.log('\n9. Owner views applications queue...');
  const queueRes = await request(`/applications/project/${project._id}`, {
    method: 'GET',
    token: userA.token,
  });
  if (!queueRes.ok || queueRes.data.data.length === 0) {
    throw new Error('Owner failed to retrieve applications list');
  }
  const appInQueue = queueRes.data.data.find((a) => a._id === application._id);
  if (!appInQueue || appInQueue.requestedRole !== 'ML Engineer') {
    throw new Error('Application queue did not preserve requestedRole!');
  }
  console.log(`✓ Application found in owner queue with applicant: ${appInQueue.applicant?.name}, role: ${appInQueue.requestedRole}`);

  // 10. Owner Accepts Join Request
  console.log('\n10. Owner accepts join request...');
  const acceptRes = await request(`/applications/${application._id}/status`, {
    method: 'PUT',
    token: userA.token,
    body: { status: 'Accepted', role: 'ML Engineer' },
  });

  if (!acceptRes.ok) throw new Error(`Failed to accept application: ${JSON.stringify(acceptRes.data)}`);
  console.log(`✓ Application accepted!`);

  // Wait for real-time notification to User B
  await new Promise((r) => setTimeout(r, 600));
  const acceptedNotif = notifsB.find((n) => n.type === 'application_accepted');
  if (!acceptedNotif) throw new Error('User B did not receive application_accepted notification!');
  console.log(`✓ User B received real-time notification: "${acceptedNotif.title}" - ${acceptedNotif.message}`);

  // 11. Verify Updated Project Membership & Team Size
  console.log('\n11. Verifying updated project membership and team capacity in MongoDB...');
  const updatedProjRes = await request(`/projects/${project._id}`, {
    method: 'GET',
    token: userB.token,
  });
  const updatedProject = updatedProjRes.data.data;
  if (updatedProject.members.length !== 2) {
    throw new Error(`Expected 2 team members, got ${updatedProject.members.length}`);
  }
  const memberRecord = updatedProject.members.find((m) => m.user._id === userB._id || m.user === userB._id);
  if (!memberRecord) throw new Error('User B not found in project.members array!');
  if (memberRecord.role !== 'ML Engineer') {
    throw new Error(`Expected role 'ML Engineer', got ${memberRecord.role}`);
  }
  if (updatedProject.status !== 'In Progress') {
    throw new Error(`Expected project status 'In Progress' after reaching capacity, got ${updatedProject.status}`);
  }
  console.log(`✓ User B is verified team member with role: "${memberRecord.role}"`);
  console.log(`✓ Project reached full capacity (${updatedProject.currentTeamSize}/${updatedProject.teamSize}), status auto-advanced to: ${updatedProject.status}`);

  // 12. Team Workspace Collaboration: Real-Time Team Chat
  console.log('\n12. Testing Team Workspace: Real-Time Project Chat & Announcements...');
  // Both join the project chat room
  await new Promise((resolve, reject) => {
    socketA.emit('join_project', { projectId: project._id }, (res) => {
      if (res?.success) resolve();
      else reject(new Error('Socket A failed to join project room'));
    });
  });

  await new Promise((resolve, reject) => {
    socketB.emit('join_project', { projectId: project._id }, (res) => {
      if (res?.success) resolve();
      else reject(new Error('Socket B failed to join project room'));
    });
  });
  console.log('✓ Both User A and User B joined project chat room');

  // User A sends message
  socketA.emit('send_message', {
    projectId: project._id,
    message: 'Welcome to the team Ada! Let us train the PyTorch model.',
  });

  await new Promise((r) => setTimeout(r, 600));
  if (chatMessagesB.length === 0) throw new Error('User B did not receive chat message from User A!');
  console.log(`✓ User B received message from ${chatMessagesB[chatMessagesB.length - 1].sender?.name}: "${chatMessagesB[chatMessagesB.length - 1].message}"`);

  // User B sends an announcement
  socketB.emit('send_message', {
    projectId: project._id,
    message: '[Announcement] Baseline validation accuracy hit 95.8%!',
  });

  await new Promise((r) => setTimeout(r, 600));
  if (chatMessagesA.length === 0) throw new Error('User A did not receive announcement from User B!');
  console.log(`✓ User A received announcement from ${chatMessagesA[chatMessagesA.length - 1].sender?.name}: "${chatMessagesA[chatMessagesA.length - 1].message}"`);

  // 13. Verify Privacy: Unrelated User C Cannot Access Project Chat or Join Room
  console.log('\n13. Testing privacy: Unrelated User C attempts to join project room and fetch messages...');
  await new Promise((resolve) => {
    socketC.emit('join_project', { projectId: project._id }, (res) => {
      if (!res?.success && res?.message?.includes('not a member')) {
        console.log(`✓ Socket room join denied for User C: ${res.message}`);
      } else {
        throw new Error('Security flaw: User C was able to join private project room!');
      }
      resolve();
    });
  });

  const getChatRes = await request(`/chat/${project._id}/messages`, {
    method: 'GET',
    token: userC.token,
  });
  if (getChatRes.status === 403) {
    console.log(`✓ API message history denied for User C: ${getChatRes.data.message}`);
  } else {
    throw new Error(`Security flaw: Expected 403 for unauthorized chat history, got ${getChatRes.status}`);
  }

  // 14. Team Workspace: Task Board & Member Assignment
  console.log('\n14. Testing Task Board: Assigning task to accepted member...');
  const createTaskRes = await request('/tasks', {
    method: 'POST',
    token: userA.token,
    body: {
      project: project._id,
      title: 'Optimize Hyperparameters with Optuna',
      description: 'Tune learning rate and weight decay for CNN backbone.',
      assignedTo: userB._id,
      priority: 'High',
      status: 'TODO',
    },
  });

  if (!createTaskRes.ok) throw new Error(`Task creation failed: ${JSON.stringify(createTaskRes.data)}`);
  const task = createTaskRes.data.data;
  console.log(`✓ Task created and assigned to User B (Task ID: ${task._id})`);

  // Wait for task_assigned notification
  await new Promise((r) => setTimeout(r, 600));
  const taskNotif = notifsB.find((n) => n.type === 'task_assigned');
  if (!taskNotif) throw new Error('User B did not receive task_assigned notification!');
  console.log(`✓ User B received task_assigned notification: "${taskNotif.title}" - ${taskNotif.message}`);

  // 15. Prevent Assigning Tasks to Non-Members
  console.log('\n15. Testing task assignment validation: Attempting to assign task to non-member (User C)...');
  const invalidTaskRes = await request('/tasks', {
    method: 'POST',
    token: userA.token,
    body: {
      project: project._id,
      title: 'Unauthorized Task Assignment',
      assignedTo: userC._id, // Non-member
      priority: 'Medium',
    },
  });

  if (invalidTaskRes.status === 400 && invalidTaskRes.data.message.includes('not a member')) {
    console.log(`✓ Task assignment to non-member blocked: ${invalidTaskRes.data.message}`);
  } else {
    throw new Error(`Expected 400 for non-member task assignment, got ${invalidTaskRes.status}`);
  }

  // 16. Verify Privacy: Unrelated User C Cannot Access Workspace Tasks
  console.log('\n16. Testing privacy: Unrelated User C attempts to view project tasks...');
  const viewTasksRes = await request(`/tasks/project/${project._id}`, {
    method: 'GET',
    token: userC.token,
  });

  if (viewTasksRes.status === 403) {
    console.log(`✓ Workspace tasks access denied for User C: ${viewTasksRes.data.message}`);
  } else {
    throw new Error(`Security flaw: Expected 403 for unauthorized task list, got ${viewTasksRes.status}`);
  }

  // 17. Full-Team Capacity Test: User C Attempts to Apply to Full Project
  console.log('\n17. Testing full-team capacity protection: User C tries to apply to full project...');
  const fullApplyRes = await request('/applications', {
    method: 'POST',
    token: userC.token,
    body: {
      projectId: project._id,
      message: 'I want to join too!',
    },
  });

  if (fullApplyRes.status === 400) {
    console.log(`✓ Application to full team rejected: ${fullApplyRes.data.message}`);
  } else {
    throw new Error(`Expected 400 for full team application, got ${fullApplyRes.status}`);
  }

  // 18. Testing Rejection Flow
  console.log('\n18. Testing rejection workflow...');
  const proj2Res = await request('/projects', {
    method: 'POST',
    token: userA.token,
    body: {
      title: `Secondary Prototype ${timestamp}`,
      description: 'Prototype for testing rejection.',
      category: 'Web Development',
      teamSize: 3,
    },
  });
  const project2 = proj2Res.data.data;

  const apply2Res = await request('/applications', {
    method: 'POST',
    token: userC.token,
    body: {
      projectId: project2._id,
      requestedRole: 'Tester',
      message: 'Can I test this prototype?',
    },
  });
  const app2 = apply2Res.data.data;

  const rejectRes = await request(`/applications/${app2._id}/status`, {
    method: 'PUT',
    token: userA.token,
    body: { status: 'Rejected' },
  });
  if (!rejectRes.ok) throw new Error('Failed to reject application');

  await new Promise((r) => setTimeout(r, 600));
  const rejNotif = notifsC.find((n) => n.type === 'application_rejected');
  if (!rejNotif) throw new Error('User C did not receive application_rejected notification!');
  console.log(`✓ User C received application_rejected notification: "${rejNotif.title}"`);

  // Verify User C is NOT a member of project 2
  const checkProj2 = await request(`/projects/${project2._id}`, { method: 'GET', token: userC.token });
  if (checkProj2.data.data.isMember) {
    throw new Error('Rejected user was incorrectly added as member!');
  }
  console.log('✓ Verified rejected applicant is NOT a member of the project');

  // Disconnect sockets cleanly
  socketA.disconnect();
  socketB.disconnect();
  socketC.disconnect();

  console.log('\n================================================================');
  console.log('🎉 ALL PROJECT JOIN REQUEST & TEAM WORKSPACE SCENARIOS PASSED:');
  console.log('  1. Project discovery with skills, roles, and available positions');
  console.log('  2. Join request submission with role, skills, experience, & message');
  console.log('  3. Real-time application_received notification to project owner');
  console.log('  4. Duplicate application prevention (409 Conflict)');
  console.log('  5. Self-application prevention (400 Bad Request)');
  console.log('  6. Unauthorized decision prevention (403 Forbidden)');
  console.log('  7. Owner approval adds member with role & updates capacity');
  console.log('  8. Real-time application_accepted notification to applicant');
  console.log('  9. Team Workspace real-time Socket.IO chat & announcements');
  console.log('  10. Strict privacy: Unrelated users blocked from chat & room');
  console.log('  11. Task Board: Assign tasks to accepted team members');
  console.log('  12. Task Board: Non-member task assignment blocked (400)');
  console.log('  13. Task Board: Non-member task viewing blocked (403)');
  console.log('  14. Team capacity limit enforced on applications');
  console.log('  15. Application rejection notification and access denial');
  console.log('================================================================');
  process.exit(0);
};

runComprehensiveSuite().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
