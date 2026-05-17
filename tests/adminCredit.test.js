const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

if (process.env.NODE_ENV === 'production') {
  throw new Error('Integration tests must not run in NODE_ENV=production');
}

process.env.NODE_ENV = 'test';

const root = path.join(__dirname, '..');
const dbPath = require.resolve(path.join(root, 'config/db.js'));
const emailPath = require.resolve(path.join(root, 'config/email.js'));
const telegramPath = require.resolve(path.join(root, 'config/telegram.js'));
const transactionPath = require.resolve(path.join(root, 'models/transactionModel.js'));
const controllerPath = require.resolve(path.join(root, 'controllers/adminController.js'));

function loadAdminController(dbMock) {
  delete require.cache[controllerPath];
  require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: dbMock,
  };
  require.cache[emailPath] = {
    id: emailPath,
    filename: emailPath,
    loaded: true,
    exports: { sendEmail: async () => undefined },
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
  require.cache[transactionPath] = {
    id: transactionPath,
    filename: transactionPath,
    loaded: true,
    exports: {},
  };
  return require('../controllers/adminController');
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

async function runAdjustCredit(conn, body) {
  const { adjustCredit } = loadAdminController({
    getConnection: async () => conn,
    execute: async () => [[]],
  });
  const req = {
    params: { id: '22' },
    body,
  };
  const res = createResponse();
  await adjustCredit(req, res);
  return res;
}

test('adjustCredit locks user row and commits deposit transaction', async () => {
  const conn = createConnection([
    [[{ id: 22, balance: '100.00' }]],
    [{ affectedRows: 1 }],
    [{ insertId: 77 }],
  ]);

  const res = await runAdjustCredit(conn, {
    amount: '50',
    type: 'deposit',
    note: 'manual deposit',
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  const executeCalls = conn.calls.filter(([name]) => name === 'execute');
  assert.equal(executeCalls.length, 3);
  assert.match(executeCalls[0][1], /FOR UPDATE/);
  assert.deepEqual(executeCalls[1][2], [150, 22]);
  assert.match(executeCalls[2][1], /INSERT INTO transactions/);
  assert.deepEqual(conn.calls.map(([name]) => name), [
    'beginTransaction',
    'execute',
    'execute',
    'execute',
    'commit',
    'release',
  ]);
});

test('adjustCredit rolls back withdrawal that would make balance negative', async () => {
  const conn = createConnection([
    [[{ id: 22, balance: '30.00' }]],
  ]);

  const res = await runAdjustCredit(conn, {
    amount: '50',
    type: 'withdraw',
  });

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  const executeCalls = conn.calls.filter(([name]) => name === 'execute');
  assert.equal(executeCalls.length, 1);
  assert.match(executeCalls[0][1], /FOR UPDATE/);
  assert.deepEqual(conn.calls.map(([name]) => name), [
    'beginTransaction',
    'execute',
    'rollback',
    'release',
  ]);
});

test('adjustCredit rejects invalid amount before opening a transaction', async () => {
  const conn = createConnection([]);

  const res = await runAdjustCredit(conn, {
    amount: '-1',
    type: 'deposit',
  });

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.deepEqual(conn.calls, []);
});
