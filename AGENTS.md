# ACCDEE Agent Handoff Guide

เอกสารนี้คือกติกากลางสำหรับ AI ทุกตัวที่เข้ามาทำงานในโปรเจกต์นี้ รวมถึง ChatGPT/Codex และ Claude Code เป้าหมายคือทำให้ทุกตัวอ่านบริบทเดียวกัน ไม่ทำงานซ้ำ ไม่ทับ production และไม่เปิดเผย secret

## Source of Truth

- Active repository: `C:\Users\PCCOPA\Documents\MyProjects\accdee`
- Active branch: `main`
- Production deployment: Railway, configured by `railway.toml`
- Runtime: Node.js + Express + MySQL + static frontend in `public/`
- Start command: `node server.js`

## Duplicate Repository Warning

- `C:\temp\accdee` is a rebuild/staging workspace.
- Do not treat `C:\temp\accdee` as production unless the owner explicitly says so.
- Do not merge files from `C:\temp\accdee` automatically.
- If code or docs differ between the two repos, report the difference first and ask for approval before moving anything.

## Safety Rules

- Do not edit `.env` values.
- Do not print secrets, tokens, passwords, cookies, JWTs, database URLs, or Railway variables.
- Do not deploy to production from an AI session unless the owner explicitly requests deployment.
- Do not delete files or folders without explicit approval.
- Do not rewrite auth, wallet, order, topup, or admin systems without a written migration plan.
- Do not run destructive database commands.
- Keep patches small and focused on one production system at a time.
- Preserve existing work from other agents. If the working tree is dirty, inspect and work around it.

## Current High-Risk Note

The git remote has been observed with an embedded GitHub token in the URL. Do not print the token. Before any push:

1. Rotate the exposed token in GitHub.
2. Replace the remote URL with a token-free URL.
3. Confirm `git remote -v` no longer contains credentials.

Safe target URL format:

```powershell
git remote set-url origin https://github.com/Firstnoii1122-jpg/accdee.git
```

## Required First Checks

Before modifying code or documentation, run:

```powershell
git status --short
git branch --show-current
git log -1 --oneline
git remote -v
git diff --cached --name-only
```

When reporting `git remote -v`, redact credentials if any are present.

## Validation Commands

After every patch, run:

```powershell
npm test
npm run check
npm run build
npm run check:db
```

If a command is missing or fails, report it clearly and do not hide the failure.

## Multi-Agent Handoff Format

Every AI session must end with:

```md
## Handoff Summary
- Completed:
- Files changed:
- Verification:
- Remaining risks:
- Next safest task:
- Do not touch next:
```

## Current Phase Order

1. Phase 0: Audit + reconciliation
2. Phase 1: Automated testing
3. Phase 2: Security hardening
4. Phase 3: Monitoring
5. Phase 4: Backup + restore
6. Phase 5: Production migration

Do not skip Phase 0 when repo state, remote safety, or documentation is unclear.
