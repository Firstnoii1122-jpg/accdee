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
- Added topup approve/reject guards to prevent already-processed transactions from being changed again.
- Added transaction model tests for double approval/reject prevention.
- Added order safety tests for rollback paths and single-item stock depletion.
- Hardened coupon wallet use with row locking, conditional max-use updates, and duplicate-use rollback tests.
- Locked admin credit balance reads and added tests for credit adjustment safety.
- Added payment slip image signature validation and topup upload tests.
- Added structured audit logs for admin topup approvals, topup rejections, and credit adjustments.
- Added database backup and restore-file validation scripts.
