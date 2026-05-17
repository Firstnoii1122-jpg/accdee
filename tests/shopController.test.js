const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

if (process.env.NODE_ENV === 'production') {
  throw new Error('Integration tests must not run in NODE_ENV=production');
}

process.env.NODE_ENV = 'test';

const root = path.join(__dirname, '..');
const dbPath = require.resolve(path.join(root, 'config/db.js'));
const telegramPath = require.resolve(path.join(root, 'config/telegram.js'));
const controllerPath = require.resolve(path.join(root, 'controllers/shopController.js'));

function loadShopController(dbMock) {
  delete require.cache[controllerPath];
  require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: dbMock,
  };
  require.cache[telegramPath] = {
    id: telegramPath,
    filename: telegramPath,
    loaded: true,
    exports: {
      sendTelegram: () => undefined,
      sendNotify: () => undefined,
    },
  };
  return require('../controllers/shopController');
}

function createResponse() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

function createConnection(results) {
  const calls = [];
  return {
    calls,
    beginTransaction: async () => calls.push(['beginTransaction']),
    commit: async () => calls.push(['commit']),
    rollback: async () => calls.push(['rollback']),
    release: () => calls.push(['release']),
    execute: async (sql, params) => {
      calls.push(['execute', sql, params]);
      if (results.length === 0) {
        throw new Error(`Unexpected query: ${sql}`);
      }
      return results.shift();
    },
  };
}

async function runBuyProduct(conn, productKey = 'acc-test') {
  const { buyProduct } = loadShopController({
    getConnection: async () => conn,
  });
  const req = {
    body: { productKey },
    user: { id: 22 },
  };
  const res = createResponse();
  await buyProduct(req, res);
  return res;
}

test('buyProduct rolls back when user balance is insufficient', async () => {
  const conn = createConnection([
    [[{ product_key: 'acc-test', name: 'ACC Test', price: '100.00' }]],
    [[{ id: 22, username: 'member', balance: '20.00' }]],
  ]);

  const res = await runBuyProduct(conn);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.deepEqual(conn.calls.map(([name]) => name), [
    'beginTransaction',
    'execute',
    'execute',
    'rollback',
    'release',
  ]);
  assert.match(conn.calls[2][1], /FOR UPDATE/);
});

test('buyProduct rolls back when stock is unavailable', async () => {
  const conn = createConnection([
    [[{ product_key: 'acc-test', name: 'ACC Test', price: '100.00' }]],
    [[{ id: 22, username: 'member', balance: '150.00' }]],
    [[]],
  ]);

  const res = await runBuyProduct(conn);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.deepEqual(conn.calls.map(([name]) => name), [
    'beginTransaction',
    'execute',
    'execute',
    'execute',
    'rollback',
    'release',
  ]);
  assert.match(conn.calls[3][1], /FOR UPDATE/);
});

test('buyProduct commits one order and marks exactly one inventory item sold', async () => {
  const conn = createConnection([
    [[{ product_key: 'acc-test', name: 'ACC Test', price: '100.00' }]],
    [[{ id: 22, username: 'member', balance: '150.00' }]],
    [[{ id: 33, credentials: 'test-login' }]],
    [{ affectedRows: 1 }],
    [{ insertId: 44 }],
    [{ affectedRows: 1 }],
    [{ insertId: 55 }],
  ]);

  const res = await runBuyProduct(conn);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.orderId, 44);
  assert.equal(res.body.data.newBalance, '50.00');

  const executeCalls = conn.calls.filter(([name]) => name === 'execute');
  assert.equal(executeCalls.length, 7);
  assert.match(executeCalls[1][1], /SELECT id, username, balance FROM users WHERE id = \? FOR UPDATE/);
  assert.match(executeCalls[2][1], /status = 'available' LIMIT 1 FOR UPDATE/);
  assert.match(executeCalls[3][1], /UPDATE users SET balance = \?/);
  assert.match(executeCalls[4][1], /INSERT INTO orders/);
  assert.match(executeCalls[5][1], /UPDATE inventory SET status = 'sold'/);
  assert.match(executeCalls[6][1], /INSERT INTO transactions/);
  assert.deepEqual(conn.calls.map(([name]) => name), [
    'beginTransaction',
    'execute',
    'execute',
    'execute',
    'execute',
    'execute',
    'execute',
    'execute',
    'commit',
    'release',
  ]);
});
