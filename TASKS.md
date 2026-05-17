# ACCDEE Tasks

ไฟล์นี้ใช้เป็น task board กลางสำหรับ ChatGPT/Codex, Claude Code, และเจ้าของโปรเจกต์ เพื่อดูว่างานไหนเสร็จแล้ว งานไหนยังเสี่ยง และงานไหนควรทำต่อ

## Current Status

- Active repo: `C:\Users\PCCOPA\Documents\MyProjects\accdee`
- Branch: `main`
- Deployment: Railway via `railway.toml`
- Current priority: keep one source of truth and continue production hardening in small patches
- Archived repo: `C:\temp\accdee_ARCHIVE_DO_NOT_USE`
- Dual-repo workflow: disabled

## Phase 0: Audit + Reconciliation

Status: Complete enough to proceed with Phase 2

Completed:

- Active repo identified.
- Archived rebuild repo identified at `C:\temp\accdee_ARCHIVE_DO_NOT_USE`.
- Active repo established as the only source of truth.
- Monitoring, backup, restore, security operations, production checklist docs exist.
- Source code exposure guide exists.
- Basic npm validation scripts exist.
- Git remote sanitized to a credential-free URL.
- Governance docs committed.
- Security baseline committed.
- Main operating skill added in `SKILL.md`.
- File ownership map added in `docs/FILE_OWNERS.md`.
- Secret/source exposure scan added to `npm run check`.
- Purchase UX skill added in `docs/PURCHASE_UX_SKILL.md`.
- Project map added in `docs/PROJECT_MAP.md`.
- AI workflow skill added in `docs/AI_WORKFLOW_SKILL.md`.
- Project structure guard added via `npm run check:structure`.

Remaining:

- Rotate the exposed GitHub token outside the repo.
- Confirm whether GitHub should remain private and rotate any secret that was ever committed.
- Keep `.claude/` local-only and ignored.
- Reconcile docs that still mention old service names such as candy365.
- Continue checking legacy docs for accidental secrets or old service names.
- Keep rotating any secret that was ever committed in old history.

Next smallest task:

- Continue SEO metadata/content planning or admin session invalidation planning, depending on owner priority.

## Phase 1: Automated Testing

Status: Not complete

Needed:

- Wallet transaction tests.

Important:

- Tests must not run against production data.
- Tests must refuse dangerous production mode.
- Tests must not log passwords, tokens, or secrets.

## Phase 2: Security Hardening

Status: Partially started

Detected partial work:

- Restrictive CORS.
- Conservative CSP.
- Login failure logging.
- Suspicious admin access logging.
- Basic validation scripts.

Still needed:

- Admin session/token invalidation plan.
- 2FA/TOTP review or implementation plan.

Completed in Phase 2 continuation:

- JWT algorithm lock to HS256.
- Production `JWT_SECRET` guard.
- Configurable `JWT_EXPIRES_IN` with safer fallback.
- Admin login hardening tests for login and admin authorization basics.
- Topup approve/reject tests at the transaction model layer.
- Double approval prevention at the database update boundary.
- Order safety tests for insufficient balance, out-of-stock rollback, and successful stock depletion.
- Coupon wallet safety tests for duplicate-use rollback and max-use guards.
- Admin credit adjustment tests for row locking and negative-balance rollback.
- Payment slip upload validation and tests for spoofed image files.
- Structured admin money-action audit events for topup approve/reject and credit adjustments.
- Wallet history tests confirm history is scoped to the authenticated user and errors stay generic.

Do not continue Phase 2 until Phase 0 is clean.

## Phase 3: Monitoring

Status: Documentation exists, implementation incomplete

Needed:

- Structured production logging.
- Error tracking strategy.
- Uptime monitor setup.
- Admin/security alert plan.

Completed:

- Health endpoint now returns uptime-monitor-friendly metadata and has automated coverage.

## Phase 4: Backup + Restore

Status: Documentation exists, basic local automation started

Needed:

- Environment backup checklist validation.
- Railway rollback practice.
- Restore test record.

Completed:

- Database backup script via `npm run backup:db`.
- Restore file validation via `npm run restore:check -- <backup.sql>`.

## Phase 5: Production Migration

Status: Not started

Needed:

- Clear migration plan from legacy app to rebuild.
- Staging deployment.
- Full validation.
- Production rollout checklist.

## Do Not Touch Without Approval

- `.env`
- Production Railway settings
- Wallet/order/topup money logic
- Existing production database schema
- Git history rewrite
- `C:\temp\accdee_ARCHIVE_DO_NOT_USE` archived rebuild repo
