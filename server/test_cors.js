/**
 * CORS & Socket.IO Security Test Suite
 * =====================================
 * Verifies production CORS configuration, preflight OPTIONS,
 * unapproved origin rejection, localhost dev scoping, and Socket.IO auth/CORS.
 */

const http = require('http');
const jwt = require('jsonwebtoken');
const { io: ioc } = require('socket.io-client');
const { app, server, getAllowedOrigins, isOriginAllowed } = require('./server');

const PROD_ORIGIN = 'https://developer-collaboration-hub.vercel.app';
const UNAPPROVED_ORIGIN = 'https://unauthorized-attacker.com';
const LOCALHOST_ORIGIN = 'http://localhost:5173';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function assert(description, condition, details = '') {
  totalTests++;
  if (condition) {
    console.log(`  ✓ ${description}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${description}${details ? ' — ' + details : ''}`);
    failedTests++;
    failures.push({ description, details });
  }
}

// Helper to make HTTP requests
function sendHttpRequest(port, method, path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(body);
          } catch {
            parsed = body;
          }
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsed,
          });
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

// Generate valid JWT token for socket auth testing
function generateTestToken(userId = '662000000000000000000001') {
  const secret = process.env.JWT_SECRET || '4b03d286f052f5a906862f6d4ddda8f40c2672bce5b995752d85fcb023d91c94b53ad9081094bed5b14ec5e2c1fafd4cfaf6be561173cb96778e1351858be3d7';
  return jwt.sign({ id: userId }, secret, { expiresIn: '1h' });
}

async function runAllTests() {
  console.log('====================================================');
  console.log('RUNNING CORS & SECURITY VERIFICATION SUITE');
  console.log('====================================================\n');

  const originalEnv = { ...process.env };

  try {
    // -----------------------------------------------------------------
    // Section 1: Environment Variable Parsing & Origin Normalization
    // -----------------------------------------------------------------
    console.log('Section 1: CLIENT_URL parsing & origin normalization');

    // Test single origin
    process.env.NODE_ENV = 'production';
    process.env.CLIENT_URL = 'https://developer-collaboration-hub.vercel.app';
    let origins = getAllowedOrigins();
    assert(
      'Parses single production origin from CLIENT_URL',
      origins.length === 1 && origins[0] === PROD_ORIGIN
    );

    // Test trailing slash normalization
    process.env.CLIENT_URL = 'https://developer-collaboration-hub.vercel.app/';
    origins = getAllowedOrigins();
    assert(
      'Strips trailing slashes from CLIENT_URL',
      origins.length === 1 && origins[0] === PROD_ORIGIN
    );

    // Test quoted string normalization
    process.env.CLIENT_URL = '"https://developer-collaboration-hub.vercel.app"';
    origins = getAllowedOrigins();
    assert(
      'Strips quotes from CLIENT_URL',
      origins.length === 1 && origins[0] === PROD_ORIGIN
    );

    // Test comma-separated origins with whitespace and trailing slashes
    process.env.CLIENT_URL =
      'https://developer-collaboration-hub.vercel.app/,  https://staging-collaboration-hub.vercel.app/ , "http://localhost:5173"';
    origins = getAllowedOrigins();
    assert(
      'Parses comma-separated origins with whitespace and quotes',
      origins.includes(PROD_ORIGIN) &&
        origins.includes('https://staging-collaboration-hub.vercel.app') &&
        origins.includes('http://localhost:5173') &&
        origins.length === 3
    );

    // -----------------------------------------------------------------
    // Section 2: Production Scoping & Localhost Rejection
    // -----------------------------------------------------------------
    console.log('\nSection 2: Production vs Non-Production origin validation');

    // In production with CLIENT_URL=PROD_ORIGIN:
    process.env.NODE_ENV = 'production';
    process.env.CLIENT_URL = PROD_ORIGIN;
    assert(
      'Production mode allows configured production frontend origin',
      isOriginAllowed(PROD_ORIGIN) === true
    );
    assert(
      'Production mode rejects unapproved origin',
      isOriginAllowed(UNAPPROVED_ORIGIN) === false
    );
    assert(
      'Production mode rejects localhost when not configured in CLIENT_URL',
      isOriginAllowed(LOCALHOST_ORIGIN) === false
    );
    assert(
      'Production mode allows requests without Origin header (health checks/curl)',
      isOriginAllowed(undefined) === true && isOriginAllowed(null) === true
    );

    // In development mode:
    process.env.NODE_ENV = 'development';
    process.env.CLIENT_URL = PROD_ORIGIN;
    assert(
      'Development mode allows configured frontend origin',
      isOriginAllowed(PROD_ORIGIN) === true
    );
    assert(
      'Development mode allows localhost:5173',
      isOriginAllowed('http://localhost:5173') === true
    );
    assert(
      'Development mode allows localhost:3000',
      isOriginAllowed('http://localhost:3000') === true
    );
    assert(
      'Development mode allows 127.0.0.1:5173',
      isOriginAllowed('http://127.0.0.1:5173') === true
    );
    assert(
      'Development mode rejects unapproved external origin',
      isOriginAllowed(UNAPPROVED_ORIGIN) === false
    );

    // -----------------------------------------------------------------
    // Section 3: Live HTTP CORS & Preflight OPTIONS Verification
    // -----------------------------------------------------------------
    console.log('\nSection 3: Live Express HTTP & Preflight OPTIONS verification');

    // Restore environment to test production mode with production origin
    process.env.NODE_ENV = 'production';
    process.env.CLIENT_URL = `${PROD_ORIGIN}, http://localhost:5173`;

    // Start server on an ephemeral port
    const testServer = await new Promise((resolve) => {
      const s = server.listen(0, () => resolve(s));
    });
    const port = testServer.address().port;

    // Wait for MongoDB connection if still connecting
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => {
        if (mongoose.connection.readyState === 1) return resolve();
        mongoose.connection.once('connected', resolve);
        // Fallback timeout in case of local offline testing
        setTimeout(resolve, 3000);
      });
    }

    // 3.1: Health check without Origin header
    const healthRes = await sendHttpRequest(port, 'GET', '/health');
    assert(
      'GET /health without Origin header succeeds with HTTP 200/503 (valid JSON)',
      (healthRes.statusCode === 200 || healthRes.statusCode === 503) && healthRes.body.service === 'Developer Collaboration Hub API',
      `Status: ${healthRes.statusCode}`
    );

    const apiHealthRes = await sendHttpRequest(port, 'GET', '/api/health');
    assert(
      'GET /api/health without Origin header succeeds with HTTP 200/503 (valid JSON)',
      (apiHealthRes.statusCode === 200 || apiHealthRes.statusCode === 503) && apiHealthRes.body.service === 'Developer Collaboration Hub API',
      `Status: ${apiHealthRes.statusCode}`
    );

    // 3.2: Production origin GET request receives CORS headers
    const prodGetRes = await sendHttpRequest(port, 'GET', '/api/projects', {
      Origin: PROD_ORIGIN,
    });
    assert(
      'Production frontend origin receives Access-Control-Allow-Origin header',
      prodGetRes.headers['access-control-allow-origin'] === PROD_ORIGIN,
      `Header: ${prodGetRes.headers['access-control-allow-origin']}`
    );
    assert(
      'Production frontend origin receives Access-Control-Allow-Credentials: true',
      prodGetRes.headers['access-control-allow-credentials'] === 'true'
    );

    // 3.3: Preflight OPTIONS request from production origin
    const prodOptionsRes = await sendHttpRequest(port, 'OPTIONS', '/api/projects', {
      Origin: PROD_ORIGIN,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type, Authorization',
    });
    assert(
      'Preflight OPTIONS from production origin returns 200/204',
      prodOptionsRes.statusCode === 204 || prodOptionsRes.statusCode === 200,
      `Status: ${prodOptionsRes.statusCode}`
    );
    assert(
      'Preflight OPTIONS returns matching Access-Control-Allow-Origin',
      prodOptionsRes.headers['access-control-allow-origin'] === PROD_ORIGIN
    );
    assert(
      'Preflight OPTIONS returns Access-Control-Allow-Methods with POST, GET, OPTIONS',
      prodOptionsRes.headers['access-control-allow-methods'] &&
        prodOptionsRes.headers['access-control-allow-methods'].includes('POST')
    );
    assert(
      'Preflight OPTIONS returns Access-Control-Allow-Headers with Content-Type, Authorization',
      prodOptionsRes.headers['access-control-allow-headers'] &&
        prodOptionsRes.headers['access-control-allow-headers'].includes('Authorization')
    );

    // 3.4: Unapproved origin GET request is rejected (403 and no CORS header)
    const unapprovedGetRes = await sendHttpRequest(port, 'GET', '/api/projects', {
      Origin: UNAPPROVED_ORIGIN,
    });
    assert(
      'Unapproved origin GET request is rejected with 403 / blocked',
      unapprovedGetRes.statusCode === 403 || unapprovedGetRes.statusCode === 500,
      `Status: ${unapprovedGetRes.statusCode}`
    );
    assert(
      'Unapproved origin does NOT receive Access-Control-Allow-Origin',
      !unapprovedGetRes.headers['access-control-allow-origin'],
      `Header: ${unapprovedGetRes.headers['access-control-allow-origin']}`
    );

    // 3.5: Unapproved origin preflight OPTIONS request is rejected
    const unapprovedOptionsRes = await sendHttpRequest(port, 'OPTIONS', '/api/projects', {
      Origin: UNAPPROVED_ORIGIN,
      'Access-Control-Request-Method': 'POST',
    });
    assert(
      'Unapproved origin preflight OPTIONS does NOT receive Access-Control-Allow-Origin',
      !unapprovedOptionsRes.headers['access-control-allow-origin'],
      `Header: ${unapprovedOptionsRes.headers['access-control-allow-origin']}`
    );

    // -----------------------------------------------------------------
    // Section 4: Socket.IO CORS & JWT Authentication Verification
    // -----------------------------------------------------------------
    console.log('\nSection 4: Socket.IO CORS & Authentication verification');

    const socketUrl = `http://127.0.0.1:${port}`;

    // 4.1: Socket.IO connection with unapproved origin is rejected
    const unapprovedSocketPromise = new Promise((resolve) => {
      const s = ioc(socketUrl, {
        extraHeaders: { origin: UNAPPROVED_ORIGIN },
        transports: ['polling'],
        reconnection: false,
        timeout: 3000,
      });
      s.on('connect', () => {
        s.disconnect();
        resolve({ connected: true });
      });
      s.on('connect_error', (err) => {
        s.disconnect();
        resolve({ connected: false, error: err.message });
      });
    });

    const unapprovedSocketResult = await unapprovedSocketPromise;
    assert(
      'Socket.IO connection from unapproved origin is rejected by CORS',
      unapprovedSocketResult.connected === false,
      `Result: ${JSON.stringify(unapprovedSocketResult)}`
    );

    // 4.2: Socket.IO connection from approved origin with missing token is rejected by auth
    const noTokenSocketPromise = new Promise((resolve) => {
      const s = ioc(socketUrl, {
        extraHeaders: { origin: PROD_ORIGIN },
        transports: ['polling'],
        reconnection: false,
        timeout: 3000,
      });
      s.on('connect', () => {
        s.disconnect();
        resolve({ connected: true });
      });
      s.on('connect_error', (err) => {
        s.disconnect();
        resolve({ connected: false, error: err.message });
      });
    });

    const noTokenSocketResult = await noTokenSocketPromise;
    assert(
      'Socket.IO from approved origin without JWT token is rejected by auth middleware',
      noTokenSocketResult.connected === false &&
        noTokenSocketResult.error &&
        noTokenSocketResult.error.includes('Authentication error'),
      `Error: ${noTokenSocketResult.error}`
    );

    // 4.3: Socket.IO connection from approved origin with invalid token is rejected
    const invalidTokenSocketPromise = new Promise((resolve) => {
      const s = ioc(socketUrl, {
        auth: { token: 'invalid.jwt.token' },
        extraHeaders: { origin: PROD_ORIGIN },
        transports: ['polling'],
        reconnection: false,
        timeout: 3000,
      });
      s.on('connect', () => {
        s.disconnect();
        resolve({ connected: true });
      });
      s.on('connect_error', (err) => {
        s.disconnect();
        resolve({ connected: false, error: err.message });
      });
    });

    const invalidTokenResult = await invalidTokenSocketPromise;
    assert(
      'Socket.IO from approved origin with invalid JWT token is rejected by auth middleware',
      invalidTokenResult.connected === false &&
        invalidTokenResult.error &&
        invalidTokenResult.error.includes('Authentication error'),
      `Error: ${invalidTokenResult.error}`
    );

    // 4.4: WebSocket transport connection from unapproved origin is rejected
    const wsBlockedPromise = new Promise((resolve) => {
      const s = ioc(socketUrl, {
        extraHeaders: { origin: UNAPPROVED_ORIGIN },
        transports: ['websocket'],
        reconnection: false,
        timeout: 3000,
      });
      s.on('connect', () => {
        s.disconnect();
        resolve({ connected: true });
      });
      s.on('connect_error', (err) => {
        s.disconnect();
        resolve({ connected: false, error: err.message });
      });
    });

    const wsBlockedResult = await wsBlockedPromise;
    assert(
      'Socket.IO WebSocket transport from unapproved origin is rejected by CORS',
      wsBlockedResult.connected === false,
      `Result: ${JSON.stringify(wsBlockedResult)}`
    );

    // 4.5: Socket.IO connection from approved production origin with valid JWT token connects successfully
    const User = require('./models/User');
    const existingUser = await User.findOne({});
    if (existingUser) {
      const validToken = generateTestToken(existingUser._id.toString());
      const validSocketPromise = new Promise((resolve) => {
        const s = ioc(socketUrl, {
          auth: { token: validToken },
          extraHeaders: { origin: PROD_ORIGIN },
          transports: ['websocket', 'polling'],
          reconnection: false,
          timeout: 4000,
        });
        s.on('connect', () => {
          s.disconnect();
          resolve({ connected: true });
        });
        s.on('connect_error', (err) => {
          s.disconnect();
          resolve({ connected: false, error: err.message });
        });
      });

      const validSocketResult = await validSocketPromise;
      assert(
        'Socket.IO from approved origin with valid JWT token connects successfully',
        validSocketResult.connected === true,
        `Result: ${JSON.stringify(validSocketResult)}`
      );
    }

    // Close test server & db
    await new Promise((resolve) => testServer.close(resolve));
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // Summary
    console.log('\n====================================================');
    console.log(`TEST SUMMARY: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`);
    console.log('====================================================');

    if (failedTests > 0) {
      console.error('\nFailures:');
      failures.forEach((f) => console.error(` - ${f.description}: ${f.details}`));
      process.exit(1);
    } else {
      console.log('\nAll CORS & Socket.IO tests PASSED successfully!');
      process.exit(0);
    }
  } catch (err) {
    console.error('\n❌ Unexpected error running test suite:', err);
    process.exit(1);
  } finally {
    process.env = originalEnv;
  }
}

runAllTests();
