# Changelog

## Unreleased — 2026-05-18

- Added PROJECT BOUNDARY warning to CLAUDE.md and accdee-skill.md to prevent AI context bleeding from CANDY365.
- Fixed stale candy365 references in accdee-skill.md (Deploy line, status note), docs/MONITORING.md, and docs/RESTORE.md.
- Promoted DBeaver → Railway MySQL as primary backup method in docs/BACKUP.md with step-by-step instructions.
- Added Backup Channel section to accdee-skill.md (channel, Google Drive storage, restore:check gate).
- Added backup rules to CLAUDE.md iron rules (no .sql commit, DBeaver channel, restore:check gate).
- Updated docs/BACKUP_RESTORE_SKILL.md with backup channel block.
- Marked candy365 doc reconciliation as complete in TASKS.md.

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
- Configured Express to trust the Railway proxy so rate limiting handles `X-Forwarded-For` correctly.
- Expanded `/api/health` with uptime-monitor-friendly metadata and automated coverage.
- Added source-code exposure guidance and production checklist items for frontend/GitHub visibility.
- Added wallet history tests for authenticated-user scoping and generic failure responses.
- Added `npm run check:secrets` and wired it into `npm run check`.
- Added Railway-aware production runtime detection for CORS, CSP, JWT guards, and health metadata.
- Added ACCDEE purchase UX skill and improved storefront product/contact popups so product clicks no longer fail silently.
- Added storefront validation to catch broken product modal wiring before deploy.
- Fixed CSP compatibility for the legacy storefront's inline `onclick` handlers.
- Added legacy click delegation so storefront buttons keep working even when inline event attributes are blocked by CSP.
- Added explicit no-store/noindex admin page headers without changing customer storefront behavior.
- Added ACCDEE project map and AI workflow skill so ChatGPT/Claude can work from the same repo context.
- Added `npm run check:structure` to guard required folders, docs, scripts, and deploy assumptions.
- Added SEO skill, robots.txt, sitemap.xml, homepage JSON-LD, and `npm run check:seo`.
- Added customer flow skill, Facebook contact fallback, and `npm run check:customer-flow`.
- Added customer flow manual testing checklist and optional `npm run check:live` production smoke check.
- Added environment safety skill and redacted `npm run check:env` / `npm run check:env:production` checks.
- Added backup/restore readiness skill and non-destructive `npm run check:backup`.
