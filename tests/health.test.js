const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

if (process.env.NODE_ENV === 'production') {
  throw new Error('Health tests must not run in NODE_ENV=production');
}

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-at-least-32-characters';

const root = path.join(__dirname, '..');

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

stubModule('config/setupDb.js', async () => undefined);

const { app } = require('../server');

async function request(method, url) {
  const server = app.listen(0);
  try {
    await new Promise((resolve) => server.once('listening', resolve));
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}${url}`, { method });
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

test('health endpoint returns uptime monitor friendly metadata', async () => {
  const response = await request('GET', '/api/health');

  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.service, 'accdee');
  assert.equal(typeof response.body.version, 'string');
  assert.equal(response.body.environment, 'test');
  assert.equal(typeof response.body.uptimeSeconds, 'number');
  assert.match(response.body.timestamp, /^\d{4}-\d{2}-\d{2}T/);
});
