const test = require('node:test');
const assert = require('node:assert/strict');

if (process.env.NODE_ENV === 'production') {
  throw new Error('Runtime environment tests must not run in NODE_ENV=production');
}

const runtimeEnvPath = require.resolve('../utils/runtimeEnv');
const keys = [
  'NODE_ENV',
  'FORCE_PRODUCTION_SECURITY',
  'RAILWAY_ENVIRONMENT',
  'RAILWAY_ENVIRONMENT_NAME',
  'RAILWAY_PROJECT_ID',
  'RAILWAY_SERVICE_ID',
  'RAILWAY_DEPLOYMENT_ID',
];

function withEnv(env, run) {
  const previous = {};
  for (const key of keys) {
    previous[key] = process.env[key];
    delete process.env[key];
  }
  Object.assign(process.env, env);
  delete require.cache[runtimeEnvPath];

  try {
    return run(require('../utils/runtimeEnv'));
  } finally {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
    delete require.cache[runtimeEnvPath];
  }
}

test('runtime environment defaults to development when no production signal exists', () => {
  withEnv({}, ({ getRuntimeEnvironment, isProductionRuntime }) => {
    assert.equal(getRuntimeEnvironment(), 'development');
    assert.equal(isProductionRuntime(), false);
  });
});

test('runtime environment uses production when NODE_ENV is production', () => {
  withEnv({ NODE_ENV: 'production' }, ({ getRuntimeEnvironment, isProductionRuntime }) => {
    assert.equal(getRuntimeEnvironment(), 'production');
    assert.equal(isProductionRuntime(), true);
  });
});

test('runtime environment uses production when Railway variables are present', () => {
  withEnv({ RAILWAY_PROJECT_ID: 'railway-project' }, ({ getRuntimeEnvironment, isProductionRuntime }) => {
    assert.equal(getRuntimeEnvironment(), 'production');
    assert.equal(isProductionRuntime(), true);
  });
});

test('runtime environment can be forced into production security mode', () => {
  withEnv({ FORCE_PRODUCTION_SECURITY: 'true' }, ({ getRuntimeEnvironment, isProductionRuntime }) => {
    assert.equal(getRuntimeEnvironment(), 'production');
    assert.equal(isProductionRuntime(), true);
  });
});
