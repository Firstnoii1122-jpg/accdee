# SECURITY

## Phase 2 Hardening Applied

- Production CORS now uses an allowlist.
- CSP remains compatible with the current legacy frontend while adding safer defaults such as `base-uri`, `form-action`, and `frame-ancestors`.
- CSP currently allows legacy inline event-handler attributes because the storefront still uses `onclick` in HTML. Remove this exception after migrating buttons to delegated JavaScript event listeners.
- Login failures are logged as structured security events without passwords or full sensitive values.
- Suspicious admin access is logged when an admin endpoint is accessed without a token or by a non-admin user.
- Admin pages are served through explicit routes with no-store/noindex headers and restrictive browser permissions.
- JWT signing and verification are locked to HS256.
- Production requires `JWT_SECRET` to exist and be at least 32 characters.
- Railway runtime is treated as production security mode even if `NODE_ENV` is missing.
- JWT expiry is configurable with `JWT_EXPIRES_IN`; the safe fallback is now `15m`.
- Payment slip uploads validate both allowed MIME type and image file signature before Cloudinary upload.
- Admin money actions emit structured audit events for topup approve/reject and credit adjustment.

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
- `admin.topup_approved`
- `admin.topup_rejected`
- `admin.credit_adjusted`

## JWT Session Configuration

- Production must set `JWT_SECRET` in Railway Variables.
- Use a random value of at least 32 characters.
- Do not print or commit the secret.
- Set `JWT_EXPIRES_IN` when a different session length is needed.
- Recommended production values are short, such as `15m`, `30m`, or `1h`.
- Longer sessions increase risk if a token is stolen.

## Still Required

- Admin session versioning or token invalidation.
- Stronger CSP after removing inline scripts and inline event-handler attributes.
- Server-side admin page gating should move to secure cookies or sessions; localStorage tokens cannot be checked during the initial HTML navigation.
- Admin 2FA review and enforcement policy.
- Centralized log retention and alerting.
- Confirm GitHub visibility policy and rotate any secret that was ever committed.

## Source Code Exposure

- Visitors can see frontend files in `public/`; this is normal.
- Visitors should not see backend files, `.env`, Railway variables, or database credentials through the website.
- If GitHub is public, repository code is visible from GitHub even though backend code is not exposed by the browser.
- See `docs/SOURCE_CODE_EXPOSURE.md` before deciding whether the repository should be public or private.
