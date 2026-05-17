const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

if (process.env.NODE_ENV === 'production') {
  throw new Error('Integration tests must not run in NODE_ENV=production');
}

process.env.NODE_ENV = 'test';

const root = path.join(__dirname, '..');
const dbPath = require.resolve(path.join(root, 'config/db.js'));
const transactionPath = require.resolve(path.join(root, 'models/transactionModel.js'));
const controllerPath = require.resolve(path.join(root, 'controllers/walletController.js'));

function loadWalletController(dbMock, transactionMock) {
  delete require.cache[controllerPath];
  require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: dbMock,
  };
  if (transactionMock) {
    require.cache[transactionPath] = {
      id: transactionPath,
      filename: transactionPath,
      loaded: true,
      exports: transactionMock,
    };
  } else {
    delete require.cache[transactionPath];
  }
  return require('../controllers/walletController');
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
      const next = results.shift();
      if (next instanceof Error) throw next;
      return next;
    },
  };
}

async function runUseCoupon(conn, code = 'bonus100') {
  const { useCoupon } = loadWalletController({
    getConnection: async () => conn,
    execute: async () => [[]],
  });
  const req = {
    body: { code },
    user: { id: 22 },
  };
  const res = createResponse();
  await useCoupon(req, res);
  return res;
}

test('useCoupon locks coupon and applies bonus once', async () => {
  const conn = createConnection([
    [[{ id: 5, code: 'BONUS100', bonus_amount: '100.00', max_uses: 10, used_count: 0 }]],
    [[]],
    [{ insertId: 1 }],
    [{ affectedRows: 1 }],
    [{ affectedRows: 1 }],
    [{ insertId: 99 }],
  ]);

  const res = await runUseCoupon(conn);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  const executeCalls = conn.calls.filter(([name]) => name === 'execute');
  assert.match(executeCalls[0][1], /FOR UPDATE/);
  assert.match(executeCalls[2][1], /INSERT INTO coupon_uses/);
  assert.match(executeCalls[3][1], /used_count < max_uses/);
  assert.match(executeCalls[4][1], /UPDATE users SET balance = balance \+ \?/);
  assert.match(executeCalls[5][1], /INSERT INTO transactions/);
  assert.deepEqual(conn.calls.map(([name]) => name), [
    'beginTransaction',
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

test('useCoupon rolls back duplicate coupon usage before crediting balance', async () => {
  const duplicateError = new Error('duplicate coupon use');
  duplicateError.code = 'ER_DUP_ENTRY';
  const conn = createConnection([
    [[{ id: 5, code: 'BONUS100', bonus_amount: '100.00', max_uses: 10, used_count: 0 }]],
    [[]],
    duplicateError,
  ]);

  const res = await runUseCoupon(conn);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  const executeCalls = conn.calls.filter(([name]) => name === 'execute');
  assert.equal(executeCalls.length, 3);
  assert.match(executeCalls[2][1], /INSERT INTO coupon_uses/);
  assert.deepEqual(conn.calls.map(([name]) => name), [
    'beginTransaction',
    'execute',
    'execute',
    'execute',
    'rollback',
    'release',
  ]);
});

test('useCoupon rolls back when max uses is reached during update', async () => {
  const conn = createConnection([
    [[{ id: 5, code: 'BONUS100', bonus_amount: '100.00', max_uses: 10, used_count: 9 }]],
    [[]],
    [{ insertId: 1 }],
    [{ affectedRows: 0 }],
  ]);

  const res = await runUseCoupon(conn);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  const executeCalls = conn.calls.filter(([name]) => name === 'execute');
  assert.equal(executeCalls.length, 4);
  assert.match(executeCalls[3][1], /used_count < max_uses/);
  assert.deepEqual(conn.calls.map(([name]) => name), [
    'beginTransaction',
    'execute',
    'execute',
    'execute',
    'execute',
    'rollback',
    'release',
  ]);
});

test('getHistory returns transactions for the authenticated user only', async () => {
  const calls = [];
  const rows = [
    { id: 7, user_id: 22, amount: '100.00', type: 'topup', status: 'approved' },
  ];
  const { getHistory } = loadWalletController({
    execute: async () => [[]],
    getConnection: async () => ({}),
  }, {
    getByUserId: async (userId) => {
      calls.push(userId);
      return rows;
    },
  });

  const res = createResponse();
  await getHistory({ user: { id: 22 }, query: { userId: 999 } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.deepEqual(res.body.data, rows);
  assert.deepEqual(calls, [22]);
});

test('getHistory returns generic 500 when transaction lookup fails', async () => {
  const originalError = console.error;
  console.error = () => undefined;
  const { getHistory } = loadWalletController({
    execute: async () => [[]],
    getConnection: async () => ({}),
  }, {
    getByUserId: async () => {
      throw new Error('database unavailable with internal detail');
    },
  });

  const res = createResponse();
  try {
    await getHistory({ user: { id: 22 } }, res);
  } finally {
    console.error = originalError;
  }

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { success: false, message: 'Server error' });
});
