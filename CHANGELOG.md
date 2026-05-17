# Changelog

## Unreleased

- Added production CORS allowlist.
- Hardened CSP with safer defaults while preserving legacy frontend compatibility.
- Added structured login failure logging.
- Added suspicious admin access logging.
- Added basic check/build/check:db npm scripts for local verification.
- Locked JWT signing and verification to HS256.
- Added production JWT secret length guard.
- Changed default JWT expiry fallback from 7d to 15m with `JWT_EXPIRES_IN` support.
- Added auth/admin integration tests that refuse production mode.
