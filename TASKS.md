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
- SEO skill, robots, sitemap, JSON-LD, and SEO guard added via `npm run check:seo`.
- Customer flow skill and click guard added via `npm run check:customer-flow`.
- Customer flow manual checklist and optional production smoke check added via `npm run check:live`.
- Environment safety skill and redacted env checker added via `npm run check:env`.
- Backup/restore readiness skill and non-destructive guard added via `npm run check:backup`.

Remaining:

- Rotate the exposed GitHub token outside the repo.
- Confirm whether GitHub should remain private and rotate any secret that was ever committed.
- Keep `.claude/` local-only and ignored (already in .gitignore).
- ~~Reconcile docs that still mention old service names such as candy365.~~ Done 2026-05-18.
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

Status: Complete ✅ (2026-05-18)

Detected partial work:

- Restrictive CORS.
- Conservative CSP.
- Login failure logging.
- Suspicious admin access logging.
- Basic validation scripts.

Still needed:

- ~~Admin session/token invalidation plan.~~ Done 2026-05-18 (token_version + logout API + revoke sessions).
- 2FA/TOTP: already implemented (OTP via email). TOTP (Google Authenticator) optional future upgrade.

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

Status: Webhook ready, UptimeRobot setup pending (needs deploy first)

Needed:

- ~~Uptime monitor webhook endpoint.~~ Done 2026-05-18 (/api/telegram/uptime-alert).
- UptimeRobot account setup — owner does after deploy (5 min, free).
- Structured production logging — Railway logs + Morgan (already active).
- Error tracking strategy — optional (Railway logs sufficient for small shop).

Completed:

- Health endpoint now returns uptime-monitor-friendly metadata and has automated coverage.

## Phase 4: Backup + Restore

Status: Scripts complete, first real dump pending (needs deploy first)

Needed:

- First real DB dump via DBeaver after deploy — owner does this.
- Restore drill after first dump: `npm run restore:drill -- <backup.sql>`.
- Backup schedule: owner runs DBeaver dump daily, stores on Google Drive.

Completed:

- Database backup script via `npm run backup:db`.
- Restore file validation via `npm run restore:check -- <backup.sql>`.
- Restore drill script via `npm run restore:drill -- <backup.sql>` (2026-05-18).
- DBeaver backup channel documented as primary method.

## Phase 5: Production Deploy

Status: Ready to deploy — waiting for owner to run railway login

Steps remaining (owner does):
1. `railway logout` → `railway login` (Firstnoii_1122@icloud.com)
2. `railway link --project 95b47776-e7cd-41a4-82f6-667d506f43e7`
3. `railway up`
4. Set Railway Variables (from .env)
5. Test end-to-end on accdee.shop
6. Set up UptimeRobot (uptimerobot.com, 5 min, free)
7. First DBeaver backup → Google Drive

## Do Not Touch Without Approval

- `.env`
- Production Railway settings
- Wallet/order/topup money logic
- Existing production database schema
- Git history rewrite
- `C:\temp\accdee_ARCHIVE_DO_NOT_USE` archived rebuild repo
