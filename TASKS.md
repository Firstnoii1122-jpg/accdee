# ACCDEE Tasks

ไฟล์นี้ใช้เป็น task board กลางสำหรับ ChatGPT/Codex, Claude Code, และเจ้าของโปรเจกต์ เพื่อดูว่างานไหนเสร็จแล้ว งานไหนยังเสี่ยง และงานไหนควรทำต่อ

## Current Status

- Active repo: `C:\Users\PCCOPA\Documents\MyProjects\accdee`
- Branch: `main`
- Deployment: Railway via `railway.toml`
- Current priority: continue Phase 2 security hardening after JWT/admin auth baseline
- Archived repo: `C:\temp\accdee_ARCHIVE_DO_NOT_USE`
- Dual-repo workflow: disabled

## Phase 0: Audit + Reconciliation

Status: Complete enough to proceed with Phase 2

Completed:

- Active repo identified.
- Archived rebuild repo identified at `C:\temp\accdee_ARCHIVE_DO_NOT_USE`.
- Active repo established as the only source of truth.
- Monitoring, backup, restore, security operations, production checklist docs exist.
- Basic npm validation scripts exist.
- Git remote sanitized to a credential-free URL.
- Governance docs committed.
- Security baseline committed.

Remaining:

- Rotate the exposed GitHub token outside the repo.
- Keep `.claude/` local-only and ignored.
- Reconcile docs that still mention old service names such as candy365.
- Rotate the exposed GitHub token outside the repo.

Next smallest task:

- Add admin session invalidation planning and broader money-flow tests.

## Phase 1: Automated Testing

Status: Not complete

Needed:

- Wallet history endpoint tests.
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

Do not continue Phase 2 until Phase 0 is clean.

## Phase 3: Monitoring

Status: Documentation exists, implementation incomplete

Needed:

- Structured production logging.
- Error tracking strategy.
- Health endpoint verification.
- Uptime monitor setup.
- Admin/security alert plan.

## Phase 4: Backup + Restore

Status: Documentation exists, automation incomplete

Needed:

- Database backup script.
- Restore validation script.
- Environment backup checklist validation.
- Railway rollback practice.
- Restore test record.

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
