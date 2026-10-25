/**
 * SECURITY AUDIT: Developer Collaboration Hub
 * ============================================
 * Tests every restricted endpoint and socket event with:
 *   Account A  – Project Owner
 *   Account B  – Accepted Project Member
 *   Account C  – Unrelated / unauthenticated user
 *
 * Run: node test_security_audit.js
 */

const http = require('http');
const { io: ioc } = require('socket.io-client');

const BASE = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';
const TS = Date.now();

let PASS = 0;
let FAIL = 0;
const failures = [];

// ─── Helpers ────────────────────────────────────────────────────────────────
function check(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✓ ${label}`);
    PASS++;
  } else {
    console.log(`  ✗ FAIL: ${label}${detail ? ' — ' + detail : ''}`);
    FAIL++;
    failures.push(`${label}${detail ? ' (' + detail + ')' : ''}`);
  }
}

async function apiReq(method, path, { token, body } = {}) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      method,
      hostname: 'localhost',
      port: 5000,
      path: `/api${path}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const r = http.request(options, (res) => {
      let raw = '';
      res.on('data', (c) => (raw += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    r.on('error', (e) => resolve({ status: 0, body: { error: e.message } }));
    if (data) r.write(data);
    r.end();
  });
}

function connectSocket(token) {
  return new Promise((resolve) => {
    const socket = ioc(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      timeout: 5000,
    });
    socket.on('connect', () => resolve(socket));
    socket.on('connect_error', (err) => resolve({ error: err.message }));
  });
}

function socketEmit(socket, event, payload) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve({ timedOut: true }), 3000);
    socket.emit(event, payload, (cb) => {
      clearTimeout(timer);
      resolve(cb || { noCallback: true });
    });
  });
}

async function registerAndLogin(name, email, skills = []) {
  const regRes = await apiReq('POST', '/auth/register', { body: { name, email, password: 'Test@1234', skills } });
  if (regRes.body?.data?.token) return regRes.body.data.token;
  const res = await apiReq('POST', '/auth/login', { body: { email, password: 'Test@1234' } });
  return res.body?.data?.token || res.body?.token || null;
}

// ─── Main ────────────────────────────────────────────────────────────────────
(async () => {
  console.log('\n════════════════════════════════════════════════════════');
  console.log('     BACKEND SECURITY AUDIT — Developer Collaboration Hub');
  console.log('════════════════════════════════════════════════════════\n');

  // ── Setup ──────────────────────────────────────────────────────────────────
  console.log('[ SETUP ] Registering and authenticating test accounts...');
  const tokenA = await registerAndLogin(`Owner_A_${TS}`, `owner_sec_${TS}@test.com`, ['React', 'Node.js']);
  const tokenB = await registerAndLogin(`Member_B_${TS}`, `member_sec_${TS}@test.com`, ['Python', 'ML']);
  const tokenC = await registerAndLogin(`Attacker_C_${TS}`, `attacker_sec_${TS}@test.com`, ['Java']);

  check('Account A authenticated', !!tokenA);
  check('Account B authenticated', !!tokenB);
  check('Account C authenticated', !!tokenC);

  if (!tokenA || !tokenB || !tokenC) {
    console.error('\nFATAL: Cannot authenticate test users. Aborting.\n');
    process.exit(1);
  }

  const meC = (await apiReq('GET', '/auth/me', { token: tokenC })).body?.data;

  // Account A creates project
  console.log('\n[ SETUP ] Account A creates project...');
  const projRes = await apiReq('POST', '/projects', {
    token: tokenA,
    body: {
      title: `Security Audit Project ${TS}`,
      description: 'Audit test project',
      category: 'Web Development',
      teamSize: 3,
      requiredSkills: [{ skill: 'React', weight: 5 }],
      rolesRequired: ['Frontend Developer'],
    },
  });
  const projectId = projRes.body?.data?._id;
  check('Project created by Account A', projRes.status === 201 && !!projectId);

  // Account B applies and gets accepted
  console.log('\n[ SETUP ] Account B applies and gets accepted...');
  const appRes = await apiReq('POST', '/applications', {
    token: tokenB,
    body: { projectId, message: 'I want to join', requestedRole: 'Frontend Developer' },
  });
  const appId = appRes.body?.data?._id;
  check('Account B application submitted', appRes.status === 201 && !!appId);

  const acceptRes = await apiReq('PUT', `/applications/${appId}/status`, {
    token: tokenA,
    body: { status: 'Accepted', role: 'Frontend Developer' },
  });
  check('Account A accepts Account B', acceptRes.status === 200);

  // Account A creates a task
  const taskRes = await apiReq('POST', '/tasks', {
    token: tokenA,
    body: { project: projectId, title: 'Audit Task', priority: 'High' },
  });
  const taskId = taskRes.body?.data?._id;
  check('Task created by Account A', taskRes.status === 201 && !!taskId);

  // ── Section 1: Unauthenticated access ─────────────────────────────────────
  console.log('\n[ 1 ] Unauthenticated access to protected endpoints');

  let r;
  r = await apiReq('GET', `/tasks/project/${projectId}`);
  check('GET /tasks/project — no token → 401', r.status === 401);

  r = await apiReq('GET', `/chat/${projectId}/messages`);
  check('GET /chat/messages — no token → 401', r.status === 401);

  r = await apiReq('GET', `/applications/project/${projectId}`);
  check('GET /applications/project — no token → 401', r.status === 401);

  r = await apiReq('GET', '/applications/my-applications');
  check('GET /applications/my-applications — no token → 401', r.status === 401);

  r = await apiReq('GET', '/notifications');
  check('GET /notifications — no token → 401', r.status === 401);

  r = await apiReq('POST', '/tasks', { body: { project: projectId, title: 'Hack' } });
  check('POST /tasks — no token → 401', r.status === 401);

  r = await apiReq('DELETE', `/tasks/${taskId}`);
  check('DELETE /tasks/:id — no token → 401', r.status === 401);

  r = await apiReq('POST', `/tasks/${taskId}/comments`, { body: { text: 'anon comment' } });
  check('POST /tasks/:id/comments — no token → 401', r.status === 401);

  // ── Section 2: Account C vs private project resources ────────────────────
  console.log('\n[ 2 ] Account C (non-member) accessing private resources');

  r = await apiReq('GET', `/tasks/project/${projectId}`, { token: tokenC });
  check('GET tasks — Account C → 403', r.status === 403, `got ${r.status}`);

  r = await apiReq('GET', `/chat/${projectId}/messages`, { token: tokenC });
  check('GET chat messages — Account C → 403', r.status === 403, `got ${r.status}`);

  r = await apiReq('GET', `/applications/project/${projectId}`, { token: tokenC });
  check('GET project applications — Account C → 403', r.status === 403, `got ${r.status}`);

  r = await apiReq('POST', '/tasks', {
    token: tokenC,
    body: { project: projectId, title: 'C attack task', priority: 'High' },
  });
  check('POST task on project — Account C → 403', r.status === 403, `got ${r.status}`);

  r = await apiReq('PUT', `/tasks/${taskId}`, { token: tokenC, body: { title: 'Modified by C' } });
  check('PUT task — Account C → 403', r.status === 403, `got ${r.status}`);

  r = await apiReq('PATCH', `/tasks/${taskId}/status`, { token: tokenC, body: { status: 'DONE' } });
  check('PATCH task status — Account C → 403', r.status === 403, `got ${r.status}`);

  r = await apiReq('POST', `/tasks/${taskId}/comments`, { token: tokenC, body: { text: 'Injected comment' } });
  check('POST task comment — Account C → 403 (patched vuln)', r.status === 403, `got ${r.status}`);

  r = await apiReq('DELETE', `/tasks/${taskId}`, { token: tokenC });
  check('DELETE task — Account C → 403 (patched vuln)', r.status === 403, `got ${r.status}`);

  // ── Section 3: Owner-only actions ─────────────────────────────────────────
  console.log('\n[ 3 ] Owner-only actions enforced against Account B and Account C');

  // Account C applies so we have an application to test with
  const appCRes = await apiReq('POST', '/applications', {
    token: tokenC,
    body: { projectId, message: 'Let me in', requestedRole: 'Backend Developer' },
  });
  const appCId = appCRes.body?.data?._id;
  check('Account C submitted application (setup)', appCRes.status === 201 && !!appCId);

  r = await apiReq('PUT', `/applications/${appCId}/status`, { token: tokenB, body: { status: 'Accepted', role: 'Backend Developer' } });
  check('Accept application by Account B (member) → 403', r.status === 403, `got ${r.status}: ${r.body?.message}`);

  r = await apiReq('PUT', `/applications/${appCId}/status`, { token: tokenC, body: { status: 'Accepted', role: 'Backend Developer' } });
  check('Accept own application by Account C → 403', r.status === 403, `got ${r.status}`);

  r = await apiReq('PUT', `/projects/${projectId}`, { token: tokenC, body: { title: 'Hacked' } });
  check('PUT project — Account C → 403', r.status === 403, `got ${r.status}`);

  r = await apiReq('PUT', `/projects/${projectId}`, { token: tokenB, body: { title: 'Member Edit' } });
  check('PUT project — Account B (member) → 403', r.status === 403, `got ${r.status}`);

  r = await apiReq('DELETE', `/projects/${projectId}`, { token: tokenC });
  check('DELETE project — Account C → 403', r.status === 403, `got ${r.status}`);

  r = await apiReq('DELETE', `/projects/${projectId}`, { token: tokenB });
  check('DELETE project — Account B (member) → 403', r.status === 403, `got ${r.status}`);

  r = await apiReq('POST', `/projects/${projectId}/showcase`, { token: tokenC, body: { summary: 'Hacked showcase' } });
  check('POST showcase — Account C → 403', r.status === 403, `got ${r.status}`);

  r = await apiReq('POST', `/projects/${projectId}/showcase`, { token: tokenB, body: { summary: 'Member showcase' } });
  check('POST showcase — Account B (member) → 403', r.status === 403, `got ${r.status}`);

  // ── Section 4: ID-substitution attacks ────────────────────────────────────
  console.log('\n[ 4 ] ID-substitution / ID-guessing attacks');

  const fakeId = '000000000000000000000000';

  r = await apiReq('GET', `/tasks/project/${fakeId}`, { token: tokenC });
  check('GET tasks with non-existent project ID → 404', r.status === 404, `got ${r.status}`);

  r = await apiReq('DELETE', `/tasks/${fakeId}`, { token: tokenC });
  check('DELETE with non-existent task ID → 404', r.status === 404, `got ${r.status}`);

  r = await apiReq('PUT', `/applications/${appId}/withdraw`, { token: tokenC });
  check('Withdraw another user\'s application → 403', r.status === 403, `got ${r.status}`);

  r = await apiReq('GET', '/notifications', { token: tokenC });
  check('Notifications scoped to caller only (data array)', r.status === 200 && Array.isArray(r.body?.data));

  r = await apiReq('GET', `/chat/${fakeId}/messages`, { token: tokenA });
  check('GET chat for non-existent project → 404', r.status === 404, `got ${r.status}`);

  // ── Section 5: Regression — authorised access ────────────────────────────
  console.log('\n[ 5 ] Regression: authorised access still works');

  r = await apiReq('GET', `/tasks/project/${projectId}`, { token: tokenA });
  check('GET tasks — Account A (owner) → 200', r.status === 200);

  r = await apiReq('GET', `/tasks/project/${projectId}`, { token: tokenB });
  check('GET tasks — Account B (member) → 200', r.status === 200);

  r = await apiReq('GET', `/chat/${projectId}/messages`, { token: tokenA });
  check('GET chat — Account A (owner) → 200', r.status === 200);

  r = await apiReq('GET', `/chat/${projectId}/messages`, { token: tokenB });
  check('GET chat — Account B (member) → 200', r.status === 200);

  r = await apiReq('GET', `/applications/project/${projectId}`, { token: tokenA });
  check('GET applications — Account A (owner) → 200', r.status === 200);

  r = await apiReq('POST', `/tasks/${taskId}/comments`, { token: tokenB, body: { text: 'Legitimate member comment' } });
  check('POST task comment — Account B (member) → 201', r.status === 201);

  r = await apiReq('PUT', `/applications/${appCId}/status`, { token: tokenA, body: { status: 'Rejected' } });
  check('Reject application — Account A (owner) → 200', r.status === 200);

  // ── Section 6: Socket.IO Security ─────────────────────────────────────────
  console.log('\n[ 6 ] Socket.IO authentication and membership enforcement');

  const unauth_socket = await connectSocket('invalid_token_xyz');
  check('Unauthenticated socket connection rejected', !!unauth_socket.error, `error: ${unauth_socket.error}`);

  const socketA = await connectSocket(tokenA);
  const socketB = await connectSocket(tokenB);
  const socketC = await connectSocket(tokenC);

  check('Socket A (owner) connected', socketA.connected === true);
  check('Socket B (member) connected', socketB.connected === true);
  check('Socket C (non-member) connected — token valid but no room access', socketC.connected === true);

  const joinA = await socketEmit(socketA, 'join_project', { projectId });
  check('Socket A joins project room → success', joinA.success === true, JSON.stringify(joinA));

  const joinB = await socketEmit(socketB, 'join_project', { projectId });
  check('Socket B joins project room → success', joinB.success === true, JSON.stringify(joinB));

  const joinC = await socketEmit(socketC, 'join_project', { projectId });
  check('Socket C join project room → denied', joinC.success === false, JSON.stringify(joinC));

  const sendC = await socketEmit(socketC, 'send_message', { projectId, message: 'Injected message from C' });
  check('Socket C send_message → denied', sendC.success === false, JSON.stringify(sendC));

  const sendA = await socketEmit(socketA, 'send_message', { projectId, message: '[Announcement] Audit complete' });
  check('Socket A send_message → success', sendA.success === true, JSON.stringify(sendA));

  // Typing indicator from Account C must NOT be broadcast to project members
  let typingFromC = false;
  socketA.on('user_typing', (data) => {
    if (data?.userId?.toString() === meC?._id?.toString()) typingFromC = true;
  });
  socketC.emit('typing_start', { projectId });
  await new Promise((resolve) => setTimeout(resolve, 600));
  check('typing_start from Account C NOT broadcast to room (patched)', !typingFromC);

  if (socketA.connected) socketA.disconnect();
  if (socketB.connected) socketB.disconnect();
  if (socketC.connected) socketC.disconnect();

  // ── Cleanup ─────────────────────────────────────────────────────────────
  console.log('\n[ CLEANUP ] Removing test data...');
  await apiReq('DELETE', `/projects/${projectId}`, { token: tokenA });

  // ── Final Report ─────────────────────────────────────────────────────────
  console.log('\n════════════════════════════════════════════════════════');
  console.log(`  AUDIT RESULTS:  ${PASS} PASSED   ${FAIL} FAILED`);
  if (failures.length > 0) {
    console.log('\n  Failed checks:');
    failures.forEach((f) => console.log(`   ✗ ${f}`));
  } else {
    console.log('\n  All security checks passed. Backend is properly hardened.');
  }
  console.log('════════════════════════════════════════════════════════\n');

  process.exit(FAIL > 0 ? 1 : 0);
})();
