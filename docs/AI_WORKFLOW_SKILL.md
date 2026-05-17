# ACCDEE AI Workflow Skill

Use this skill when ChatGPT, Codex, Claude, or another LLM works on ACCDEE. The goal is to save tokens, avoid duplicate work, and keep production safe.

## Mission

Act like the responsible engineering team for a real shop:

- Customer pages should be easy to use.
- Admin pages should be strict.
- Money systems should be tested before changed.
- Secrets must never be printed.
- The active repo must stay the only source of truth.

## Fast Reading Order

Before changes, read only what the task needs:

1. `AGENTS.md`
2. `SKILL.md`
3. `docs/PROJECT_MAP.md`
4. `docs/FILE_OWNERS.md`
5. `TASKS.md`
6. The exact feature skill, for example `docs/PURCHASE_UX_SKILL.md`
7. The exact target files from `docs/PROJECT_MAP.md`

Do not bulk-read images, `node_modules/`, `uploads/`, backups, or archived repos.

## Tool Strategy

Use cheap, targeted commands first:

```powershell
git status --short --branch
rg --files
rg "search text"
npm run check:structure
npm run check:storefront
```

Read exact files only after the map points to them. This keeps LLM context small and reduces mistakes.

## Before Editing

1. Confirm path is `C:\Users\PCCOPA\Documents\MyProjects\accdee`.
2. Run `git status --short --branch`.
3. Identify the owner in `docs/FILE_OWNERS.md`.
4. Make a small plan.
5. Do not edit `.env`.
6. Do not deploy unless the owner explicitly asks.

## Patch Style

- One system at a time.
- Small patch only.
- Preserve current behavior unless the task is to change it.
- Prefer adding tests/guards over rewriting working logic.
- If a change touches auth/admin/wallet/order/topup, update tests or explain why a test cannot be added safely.

## Frontend Rule

Customer storefront should be friendly. If a guest clicks a product, buy button, topup button, or protected action, the UI should guide them with a popup instead of doing nothing.

Admin/security should be strict. Customer convenience must not weaken admin API protection.

## Backend Rule

Frontend hiding is not security. Admin and money APIs must enforce authorization in backend middleware/controllers.

## Validation

After patches, run:

```powershell
npm test
npm run check
npm run build
npm run check:db
```

If local MySQL is not available, `npm run check:db` may fail. Report that honestly. Do not pretend production was tested.

## Handoff Template

End every AI session with:

```md
## Handoff Summary
- Completed:
- Files changed:
- Verification:
- Remaining risks:
- Next safest task:
- Do not touch next:
```

## Notebook LLM Practice

Keep project memory in committed docs:

- Current state: `TASKS.md`
- What changed: `CHANGELOG.md`
- How to work: `SKILL.md`, this file
- Where to look: `docs/PROJECT_MAP.md`
- Who owns files: `docs/FILE_OWNERS.md`

Do not rely on random chat memory as the only project notebook.

