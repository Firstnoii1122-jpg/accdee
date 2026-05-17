# SECURITY

## Phase 2 Hardening Applied

- Production CORS now uses an allowlist.
- CSP remains compatible with the current legacy frontend while adding safer defaults such as `base-uri`, `form-action`, and `frame-ancestors`.
- Login failures are logged as structured security events without passwords or full sensitive values.
- Suspicious admin access is logged when an admin endpoint is accessed without a token or by a non-admin user.

## Current Allowed Production Origins

- `FRONTEND_URL`
- `SITE_URL`
- `https://www.accdee.shop`
- `https://accdee.shop`

## Security Log Events

- `auth.login_failed`
- `auth.otp_invalid_token`
- `auth.otp_failed`
- `auth.otp_expired`
- `admin.access_missing_token`
- `admin.access_forbidden`

## Still Required

- Admin session versioning or token invalidation.
- Stronger CSP after removing inline scripts.
- Admin 2FA review and enforcement policy.
- Centralized log retention and alerting.

