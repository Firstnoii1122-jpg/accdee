const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const express = require('express');
const bcrypt = require('bcryptjs');
const { signJwt } = require('../utils/jwtConfig');

if (process.env.NODE_ENV === 'production') {
  throw new Error('Integration tests must not run in NODE_ENV=production');
}

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-at-least-32-characters';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';

const root = path.join(__dirname, '..');
const testPassword = 'CorrectPass123';
const hashedPassword = bcrypt.hashSync(testPassword, 10);

const users = {
  'member@example.com': {
    id: 11,
    username: 'member',
    email: 'member@example.com',
    password: hashedPassword,
    balance: 0,
    role: 'user',
  },
  'admin@example.com': {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    password: hashedPassword,
    balance: 0,
    role: 'admin',
  },
};

function stubModule(relativePath, exports) {
  const modulePath = require.resolve(path.join(root, relativePath));
  require.cache[modulePath] = {
    id: modulePath,
    filename: modulePath,
    loaded: true,
    exports,
  };
}

stubModule('config/db.js', {
  execute: async () => [[]],
});

stubModule('config/email.js', {
  sendEmail: async () => undefined,
});

stubModule('config/telegram.js', {
  sendTelegram: async () => undefined,
});

stubModule('models/userModel.js', {
  findUserByEmail: async (email) => users[email],
  findUserByUsername: async () => undefined,
  findUserById: async (id) => Object.values(users).find((user) => user.id === id),
  createUser: async () => 100,
});

const authRoutes = require('../routes/authRoutes');
const { adminOnly } = require('../middleware/adminMiddleware');

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.get('/api/admin/test', adminOnly, (req, res) => {
    res.json({ success: true, userId: req.user.id, role: req.user.role });
  });
  return app;
}

async function request(app, method, url, options = {}) {
  const server = app.listen(0);
  try {
    await new Promise((resolve) => server.once('listening', resolve));
    const { port } = server.address();
    const headers = { ...(options.headers || {}) };
    let body;

    if (options.body !== undefined) {
      headers['content-type'] = 'application/json';
      body = JSON.stringify(options.body);
    }

    const response = await fetch(`http://127.0.0.1:${port}${url}`, {
      method,
      headers,
      body,
    });
    const text = await response.text();
    return {
      status: response.status,
      body: text ? JSON.parse(text) : null,
    };
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test('login success returns a JWT for a valid user', async () => {
  const app = createTestApp();
  const response = await request(app, 'POST', '/api/auth/login', {
    body: { email: 'member@example.com', password: testPassword },
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(typeof response.body.token, 'string');
});

test('login wrong password returns 401', async () => {
  const app = createTestApp();
  const response = await request(app, 'POST', '/api/auth/login', {
    body: { email: 'member@example.com', password: 'WrongPass123' },
  });

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
});

test('admin route without token returns 401', async () => {
  const app = createTestApp();
  const response = await request(app, 'GET', '/api/admin/test');

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
});

test('admin route with normal user token returns 403', async () => {
  const app = createTestApp();
  const token = signJwt({ id: users['member@example.com'].id, role: 'user' });
  const response = await request(app, 'GET', '/api/admin/test', {
    headers: { authorization: `Bearer ${token}` },
  });

  assert.equal(response.status, 403);
  assert.equal(response.body.success, false);
});

test('admin route with admin token succeeds', async () => {
  const app = createTestApp();
  const token = signJwt({ id: users['admin@example.com'].id, role: 'admin' });
  const response = await request(app, 'GET', '/api/admin/test', {
    headers: { authorization: `Bearer ${token}` },
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.role, 'admin');
});
