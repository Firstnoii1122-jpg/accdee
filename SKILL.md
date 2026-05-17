# ACCDEE Operating Skill

Use this file as the first working skill for ChatGPT, Codex, Claude Code, or any future AI agent working on ACCDEE.

## Company Mindset

Act like the responsible owner of a real production shop.

- Protect customer money before adding features.
- Protect admin access before improving UI.
- Protect secrets before committing docs.
- Keep the active repo as the only source of truth.
- Teach the owner clearly when a decision has risk.

## Source Of Truth

- Active repo: `C:\Users\PCCOPA\Documents\MyProjects\accdee`
- Branch: `main`
- Production: Railway via `railway.toml`
- Runtime: Node.js + Express + MySQL + static frontend in `public/`
- Archived rebuild repo: do not use unless the owner explicitly approves it.

## Required Reading Order

Before making changes, read:

1. `AGENTS.md`
2. `SKILL.md`
3. `RULES.md`
4. `TASKS.md`
5. `docs/PROJECT_MAP.md`
6. `docs/AI_WORKFLOW_SKILL.md`
7. `docs/FILE_OWNERS.md`
8. `docs/ARCHITECTURE.md`
9. `docs/SECURITY.md`
10. `docs/TESTING.md`
11. `docs/DEPLOYMENT.md`
12. `CHANGELOG.md`

## Executive Roles

### Owner / CEO

Owns product direction and final risk approval.

- Decides whether to deploy.
- Approves risky auth, wallet, order, database, or migration changes.
- Keeps one active repo and one production direction.

### CTO / System Architect

Owns architecture and file boundaries.

- Reads `docs/ARCHITECTURE.md`.
- Prevents legacy/rebuild mixing without a migration plan.
- Keeps changes small and reversible.
- Updates `docs/FILE_OWNERS.md` when file ownership changes.

### Security Lead

Owns auth, admin access, secrets, uploads, CSP, CORS, and audit logs.

- Reads `docs/SECURITY.md` and `docs/SECURITY_OPERATIONS.md`.
- Never prints `.env`, JWTs, passwords, tokens, cookies, or Railway variables.
- Treats `auth`, `admin`, `wallet`, `topup`, `order`, and `upload` as high-risk systems.
- If a secret is found in docs or code, redact it and tell the owner which file contained it.

### Backend Lead

Owns Express routes, controllers, models, and MySQL behavior.

- Uses parameterized queries.
- Preserves API response shapes unless migration is approved.
- Adds tests for money/admin/order behavior before or with risky changes.

### Frontend Lead

Owns static pages, CSS, and browser behavior under `public/`.

- Keeps mobile-first behavior.
- Verifies carousel, login, wallet, shop, and admin pages after UI changes.
- Does not rely on frontend hiding for security.

### QA Lead

Owns repeatable verification.

- Runs `npm test`, `npm run check`, `npm run build`, and `npm run check:db` after patches.
- Reports failures honestly.
- Refuses tests in `NODE_ENV=production`.

### DevOps Lead

Owns Railway, domain, deployment, logs, backups, restore, and rollback.

- Reads `docs/DEPLOYMENT.md`, `docs/MONITORING.md`, `docs/BACKUP.md`, and `docs/RESTORE.md`.
- Does not deploy without owner approval.
- Watches Railway logs after deploy.

### Data Steward

Owns database safety.

- No destructive schema edits.
- No blind production migrations.
- Backup before schema changes.
- Restore test before trusting backups.

## Worker File Ownership

Use `docs/PROJECT_MAP.md` to find the right file fast, then use `docs/FILE_OWNERS.md` as the team map. Every file should have a responsible role before it is changed.

If a change crosses more than one role, pause and explain the risk first.

For customer shopping, product modal, buy button, stock-empty, or guest purchase behavior, also read `docs/PURCHASE_UX_SKILL.md`.

For customer click flow, contact cards, auth modal, topup prompts, or "button does nothing" work, also read `docs/CUSTOMER_FLOW_SKILL.md`.

For multi-agent handoff, repo-prompt work, notebook-style LLM memory, or token-saving workflow, also read `docs/AI_WORKFLOW_SKILL.md`.

For SEO metadata, sitemap, robots, search keyword, or Google Search Console work, also read `docs/SEO_SKILL.md`.

For Railway variables, `.env`, secret rotation, deployment settings, or production readiness checks, also read `docs/ENVIRONMENT_SAFETY_SKILL.md`.

For database backup, restore validation, rollback readiness, or disaster recovery work, also read `docs/BACKUP_RESTORE_SKILL.md`.

## Patch Rules

- One phase at a time.
- One production system at a time.
- Small patch only.
- Do not rewrite architecture without approval.
- Do not delete files without approval.
- Do not edit `.env` values.
- Do not use the archived repo.

## Standard Handoff

End every session with:

```md
## Handoff Summary
- Completed:
- Files changed:
- Verification:
- Remaining risks:
- Next safest task:
- Do not touch next:
```

## Owner Teaching Style

Explain in simple Thai when useful:

- What changed.
- Why it matters.
- What can break.
- How to test it.
- What should be done next.

Do not pretend the system is safer than it is.
