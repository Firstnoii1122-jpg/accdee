const jwt = require('jsonwebtoken');

const JWT_ALGORITHM = 'HS256';
const DEFAULT_JWT_EXPIRES_IN = '15m';
const TEMP_TOKEN_EXPIRES_IN = '10m';
const MIN_PRODUCTION_SECRET_LENGTH = 32;

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret.length < MIN_PRODUCTION_SECRET_LENGTH) {
      throw new Error('JWT_SECRET is required in production and must be at least 32 characters');
    }
  }

  if (!secret) {
    return 'development-only-jwt-secret-change-before-production';
  }

  return secret;
}

function getJwtExpiresIn() {
  return process.env.JWT_EXPIRES_IN || DEFAULT_JWT_EXPIRES_IN;
}

function signJwt(payload, options = {}) {
  return jwt.sign(payload, getJwtSecret(), {
    algorithm: JWT_ALGORITHM,
    expiresIn: getJwtExpiresIn(),
    ...options,
  });
}

function verifyJwt(token) {
  return jwt.verify(token, getJwtSecret(), {
    algorithms: [JWT_ALGORITHM],
  });
}

function assertJwtConfig() {
  getJwtSecret();
}

module.exports = {
  JWT_ALGORITHM,
  DEFAULT_JWT_EXPIRES_IN,
  TEMP_TOKEN_EXPIRES_IN,
  assertJwtConfig,
  getJwtExpiresIn,
  signJwt,
  verifyJwt,
};
