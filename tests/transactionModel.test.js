const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

if (process.env.NODE_ENV === 'production') {
  throw new Error('Integration tests must not run in NODE_ENV=production');
}

process.env.NODE_ENV = 'test';

const root = path.join(__dirname, '..');
const dbPath = require.resolve(path.join(root, 'config/db.js'));
const modelPath = require.resolve(path.join(root, 'models/transactionModel.js'));

function loadTransactionModel(dbMock) {
  delete require.cache[modelPath];
  require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: dbMock,
  };
  return require('../models/transactionModel');
}

function createConnection(updateAffectedRows) {
  const calls = [];
  return {
    calls,
    beginTransaction: async () => calls.push(['beginTransaction']),
    commit: async () => calls.push(['commit']),
    rollback: async () => calls.push(['rollback']),
    release: () => calls.push(['release']),
    execute: async (sql, params) => {
      calls.push(['execute', sql, params]);
      if (sql.includes('UPDATE transactions')) {
        return [{ affectedRows: updateAffectedRows }];
      }
      return [{ affectedRows: 1 }];
    },
  };
}

test('approveTopup updates pending transaction and credits balance once', async () => {
  const conn = createConnection(1);
  const Transaction = loadTransactionModel({
    getConnection: async () => conn,
  });

  await Transaction.approveTopup(10, 20, 150);

  const updateCalls = conn.calls.filter(([name]) => name === 'execute');
  assert.equal(updateCalls.length, 2);
  assert.match(updateCalls[0][1], /WHERE id = \? AND status = 'pending'/);
  assert.match(updateCalls[1][1], /UPDATE users SET balance = balance \+ \?/);
  assert.deepEqual(conn.calls.map(([name]) => name), [
    'beginTransaction',
    'execute',
    'execute',
    'commit',
    'release',
  ]);
});

test('approveTopup blocks double approval before crediting balance', async () => {
  const conn = createConnection(0);
  const Transaction = loadTransactionModel({
    getConnection: async () => conn,
  });

  await assert.rejects(
    () => Transaction.approveTopup(10, 20, 150),
    { code: 'TOPUP_ALREADY_PROCESSED' }
  );

  const updateCalls = conn.calls.filter(([name]) => name === 'execute');
  assert.equal(updateCalls.length, 1);
  assert.match(updateCalls[0][1], /WHERE id = \? AND status = 'pending'/);
  assert.deepEqual(conn.calls.map(([name]) => name), [
    'beginTransaction',
    'execute',
    'rollback',
    'release',
  ]);
});

test('rejectTopup only rejects pending transactions', async () => {
  const queries = [];
  const Transaction = loadTransactionModel({
    execute: async (sql, params) => {
      queries.push([sql, params]);
      return [{ affectedRows: 1 }];
    },
  });

  await Transaction.rejectTopup(10);

  assert.equal(queries.length, 1);
  assert.match(queries[0][0], /WHERE id = \? AND status = 'pending'/);
});

test('rejectTopup blocks already processed transactions', async () => {
  const Transaction = loadTransactionModel({
    execute: async () => [{ affectedRows: 0 }],
  });

  await assert.rejects(
    () => Transaction.rejectTopup(10),
    { code: 'TOPUP_ALREADY_PROCESSED' }
  );
});
