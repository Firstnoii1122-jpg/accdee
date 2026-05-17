# ACCDEE Tasks

ไฟล์นี้ใช้เป็น task board กลางสำหรับ ChatGPT/Codex, Claude Code, และเจ้าของโปรเจกต์ เพื่อดูว่างานไหนเสร็จแล้ว งานไหนยังเสี่ยง และงานไหนควรทำต่อ

## Current Status

- Active repo: `C:\Users\PCCOPA\Documents\MyProjects\accdee`
- Branch: `main`
- Deployment: Railway via `railway.toml`
- Current priority: Phase 0 reconciliation before more security changes

## Phase 0: Audit + Reconciliation

Status: In progress

Completed:

- Active repo identified.
- Duplicate rebuild repo identified at `C:\temp\accdee`.
- Monitoring, backup, restore, security operations, production checklist docs exist.
- Basic npm validation scripts exist.

Remaining:

- Sanitize git remote so no token is embedded.
- Rotate the exposed GitHub token outside the repo.
- Complete missing governance docs.
- Decide whether `.claude/` should stay local-only.
- Reconcile docs that still mention old service names such as candy365.
- Confirm Phase 2 working tree changes before committing or expanding them.

Next smallest task:

- Finish governance/handoff files in the active repo.

## Phase 1: Automated Testing

Status: Not complete

Needed:

- Auth integration tests.
- Admin RBAC tests.
- Wallet transaction tests.
- Topup approve/reject tests.
- Double approval prevention tests.
- Stock depletion and order safety tests.

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

- JWT algorithm lock to HS256.
- Production `JWT_SECRET` guard.
- Configurable `JWT_EXPIRES_IN`.
- Admin session/token invalidation plan.
- Admin login hardening tests.
- 2FA/TOTP review or implementation plan.

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
- `C:\temp\accdee` rebuild repo
