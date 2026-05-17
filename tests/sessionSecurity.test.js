const test   = require('node:test');
const assert = require('node:assert/strict');
const path   = require('node:path');
const express = require('express');
const bcrypt  = require('bcryptjs');
const { signJwt } = require('../utils/jwtConfig');

if (process.env.NODE_ENV === 'production') {
  throw new Error('Integration tests must not run in NODE_ENV=production');
}

process.env.NODE_ENV   = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-at-least-32-characters';

const root         = path.join(__dirname, '..');
const testPassword = 'TestPass123';
const hashedPw     = bcrypt.hashSync(testPassword, 10);

// ──── Configurable DB stub ────────────────────────────────────────────────
// dbBehavior เปลี่ยนได้ต่อ test เพื่อ simulate token_version ต่างกัน
let dbBehavior = { tokenVersion: 0, incrementCalled: false };

function stubModule(rel, exports) {
  const mp = require.resolve(path.join(root, rel));
  require.cache[mp] = { id: mp, filename: mp, loaded: true, exports };
}

stubModule('config/email.js',    { sendEmail: async () => {} });
stubModule('config/telegram.js', { sendTelegram: () => {}, sendNotify: () => {} });

stubModule('config/db.js', {
  execute: async (sql, params) => {
    if (sql.includes('SELECT token_version')) {
      return [[{ token_version: dbBehavior.tokenVersion }]];
    }
    if (sql.includes('token_version = token_version + 1')) {
      dbBehavior.incrementCalled = true;
      return [{ affectedRows: 1 }];
    }
    // SELECT id, username FROM users WHERE id = ? (used by revokeUserSessions)
    if (sql.includes('SELECT id, username') && params) {
      const found = userStore[params[0]];
      return [found ? [{ id: found.id, username: found.username }] : []];
    }
    return [[]];
  },
});

const userStore = {
  1: { id: 1, username: 'user1', email: 'user1@example.com',
       password: hashedPw, balance: 100, role: 'user',
       token_version: 0, two_fa_enabled: 0 },
  99: { id: 99, username: 'admin1', email: 'admin1@example.com',
        password: hashedPw, balance: 0, role: 'admin',
        token_version: 0, two_fa_enabled: 0 },
};

stubModule('models/userModel.js', {
  findUserByEmail    : async (email) => Object.values(userStore).find(u => u.email === email),
  findUserByUsername : async ()      => undefined,
  findUserById       : async (id)    => userStore[id],
  createUser         : async ()      => 200,
  incrementTokenVersion: async (userId) => {
    dbBehavior.incrementCalled = true;
    if (userStore[userId]) userStore[userId].token_version += 1;
  },
});

const authRoutes  = require('../routes/authRoutes');
const adminRoutes = require('../routes/adminRoutes');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth',  authRoutes);
  app.use('/api/admin', adminRoutes);
  return app;
}

async function req(app, method, url, options = {}) {
  const server = app.listen(0);
  try {
    await new Promise(r => server.once('listening', r));
    const { port } = server.address();
    const headers  = { ...(options.headers || {}) };
    let body;
    if (options.body !== undefined) {
      headers['content-type'] = 'application/json';
      body = JSON.stringify(options.body);
    }
    const res  = await fetch(`http://127.0.0.1:${port}${url}`, { method, headers, body });
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : null };
  } finally {
    await new Promise((resolve, reject) => server.close(e => e ? reject(e) : resolve()));
  }
}

// ──── Tests ───────────────────────────────────────────────────────────────

test('logout without token returns 401', async () => {
  const app = createApp();
  const res = await req(app, 'POST', '/api/auth/logout');
  assert.equal(res.status, 401);
});

test('logout with valid token increments token_version and returns success', async () => {
  dbBehavior = { tokenVersion: 0, incrementCalled: false };
  const app   = createApp();
  const token = signJwt({ id: 1, role: 'user', tv: 0 });

  const res = await req(app, 'POST', '/api/auth/logout', {
    headers: { authorization: `Bearer ${token}` },
  });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(dbBehavior.incrementCalled, true, 'incrementTokenVersion should be called');
});

test('token with matching tv passes auth middleware', async () => {
  dbBehavior = { tokenVersion: 5, incrementCalled: false };
  const app   = createApp();
  // tv=5 matches DB token_version=5 → ผ่าน
  const token = signJwt({ id: 99, role: 'admin', tv: 5 });

  const res = await req(app, 'GET', '/api/admin/stats', {
    headers: { authorization: `Bearer ${token}` },
  });
  // ไม่ได้ mock adminController → 500 OK ถือว่า middleware ผ่านแล้ว
  assert.notEqual(res.status, 401, 'valid tv should not be rejected');
});

test('token with stale tv is rejected by auth middleware', async () => {
  dbBehavior = { tokenVersion: 3, incrementCalled: false };
  const app   = createApp();
  // tv=2 แต่ DB เป็น 3 (logout แล้ว) → ต้อง 401
  const token = signJwt({ id: 1, role: 'user', tv: 2 });

  const res = await req(app, 'POST', '/api/auth/logout', {
    headers: { authorization: `Bearer ${token}` },
  });

  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});

test('token without tv field bypasses version check (backward compat)', async () => {
  dbBehavior = { tokenVersion: 99, incrementCalled: false };
  const app   = createApp();
  // token เก่าไม่มี tv → skip version check → ผ่าน middleware
  const token = signJwt({ id: 99, role: 'admin' });

  const res = await req(app, 'GET', '/api/admin/stats', {
    headers: { authorization: `Bearer ${token}` },
  });
  assert.notEqual(res.status, 401, 'old token without tv should still pass middleware');
});

test('admin cannot revoke own session', async () => {
  dbBehavior = { tokenVersion: 0, incrementCalled: false };
  const app   = createApp();
  // admin id=99 tries to revoke own id=99
  const token = signJwt({ id: 99, role: 'admin', tv: 0 });

  const res = await req(app, 'POST', '/api/admin/members/99/revoke-sessions', {
    headers: { authorization: `Bearer ${token}` },
  });

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
});

test('admin can revoke another user session', async () => {
  dbBehavior = { tokenVersion: 0, incrementCalled: false };
  const app   = createApp();
  const token = signJwt({ id: 99, role: 'admin', tv: 0 });

  const res = await req(app, 'POST', '/api/admin/members/1/revoke-sessions', {
    headers: { authorization: `Bearer ${token}` },
  });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
});
