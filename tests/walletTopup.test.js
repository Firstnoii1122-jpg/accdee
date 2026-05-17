const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { Writable } = require('node:stream');

if (process.env.NODE_ENV === 'production') {
  throw new Error('Integration tests must not run in NODE_ENV=production');
}

process.env.NODE_ENV = 'test';

const root = path.join(__dirname, '..');
const dbPath = require.resolve(path.join(root, 'config/db.js'));
const transactionPath = require.resolve(path.join(root, 'models/transactionModel.js'));
const userPath = require.resolve(path.join(root, 'models/userModel.js'));
const telegramPath = require.resolve(path.join(root, 'config/telegram.js'));
const controllerPath = require.resolve(path.join(root, 'controllers/walletController.js'));

function loadWalletController({ transactionMock, userMock, uploadUrl = 'https://cdn.example/slip.jpg' } = {}) {
  delete require.cache[controllerPath];
  require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: { execute: async () => [[]], getConnection: async () => ({}) },
  };
  require.cache[transactionPath] = {
    id: transactionPath,
    filename: transactionPath,
    loaded: true,
    exports: transactionMock || {},
  };
  require.cache[userPath] = {
    id: userPath,
    filename: userPath,
    loaded: true,
    exports: userMock || {},
  };
  require.cache[telegramPath] = {
    id: telegramPath,
    filename: telegramPath,
    loaded: true,
    exports: { sendTelegram: () => undefined },
  };

  const cloudinary = require('cloudinary').v2;
  cloudinary.uploader = {
    upload_stream: (options, callback) => {
      const stream = new Writable({
        write(chunk, encoding, done) {
          done();
        },
      });
      stream.on('finish', () => callback(null, { secure_url: uploadUrl }));
      return stream;
    },
  };

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

async function runRequestTopup(req, mocks) {
  const { requestTopup } = loadWalletController(mocks);
  const res = createResponse();
  await requestTopup(req, res);
  return res;
}

test('requestTopup rejects missing slip before upload', async () => {
  const res = await runRequestTopup({
    body: { amount: '100' },
    user: { id: 22 },
  });

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
});

test('requestTopup rejects spoofed image mimetype with invalid bytes', async () => {
  const res = await runRequestTopup({
    body: { amount: '100' },
    user: { id: 22 },
    file: {
      mimetype: 'image/png',
      buffer: Buffer.from('not a real image'),
    },
  });

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
});

test('requestTopup uploads a valid image and creates pending transaction', async () => {
  const calls = [];
  const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
  const res = await runRequestTopup({
    body: { amount: '100', note: 'test topup' },
    user: { id: 22 },
    file: {
      mimetype: 'image/png',
      buffer: pngBuffer,
    },
  }, {
    transactionMock: {
      createTopup: async (userId, amount, slipImage, note) => {
        calls.push({ userId, amount, slipImage, note });
        return 77;
      },
    },
    userMock: {
      findUserById: async () => ({ username: 'member' }),
    },
  });

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.success, true);
  assert.deepEqual(calls, [{
    userId: 22,
    amount: 100,
    slipImage: 'https://cdn.example/slip.jpg',
    note: 'test topup',
  }]);
});
