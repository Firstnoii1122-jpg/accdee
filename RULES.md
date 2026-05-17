# ACCDEE Project Rules

กฎนี้ใช้กับทุกคนและทุก AI ที่ทำงานในโปรเจกต์ ACCDEE เพื่อให้ระบบ production ไม่พังจากการแก้เร็วเกินไปหรือแก้ซ้ำกันหลายตัว

## Repository Rules

- Work only in `C:\Users\PCCOPA\Documents\MyProjects\accdee` unless the owner explicitly names another path.
- Treat `C:\temp\accdee` as rebuild/staging only.
- Never merge between repos automatically.
- Always check `git status --short` before editing.
- Never revert user or other-agent changes unless explicitly requested.

## Secret Safety

- Never print `.env` values.
- Never commit `.env`.
- Never log passwords, tokens, JWTs, cookies, database URLs, or API keys.
- If a secret is found, report only the file/path and say the value is redacted.
- If git remote contains credentials, redact them in output and require rotation before push.

## Patch Rules

- Small patch only.
- One phase at a time.
- One production system at a time.
- Prefer additive docs/tests before changing risky logic.
- Do not rewrite architecture without an approved migration plan.
- Do not delete legacy systems before a tested replacement exists.

## Protected Systems

These areas are highest risk and require extra care:

- Admin authentication and authorization.
- Wallet balances.
- Topup approval/reject flow.
- Orders and stock depletion.
- Payment slip uploads.
- Production database migrations.

## Database Rules

- No destructive schema edits.
- No production data deletion.
- No blind migrations.
- Backup before schema changes.
- Restore test before trusting backups.

## Deployment Rules

- No production deploy without owner approval.
- No production deploy while validation commands fail.
- No deploy before remote URL is credential-free.
- Use Railway logs after deploy to confirm health.

## Required Validation

Run after every patch:

```powershell
npm test
npm run check
npm run build
npm run check:db
```

If unavailable or failing:

- Stop expanding scope.
- Report exactly which command failed.
- Recommend the smallest fix.

## Handoff Rules

At the end of every session, provide:

- What changed.
- Files changed.
- Commands run.
- Failures or skipped checks.
- Remaining risks.
- Next safest task.
- Files or systems the next agent must not touch.
