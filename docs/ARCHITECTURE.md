# ARCHITECTURE - ACCDEE

เอกสารนี้สรุปโครงสร้างระบบปัจจุบันของ ACCDEE เพื่อให้เจ้าของโปรเจกต์, ChatGPT/Codex, Claude Code, และผู้ดูแลระบบเข้าใจตรงกันก่อนแก้ไข production

## Current Architecture

ACCDEE currently runs as a legacy Node.js application:

- Backend: Node.js + Express
- Frontend: static files served from `public/`
- Database: MySQL
- Deployment: Railway with Nixpacks
- Entry point: `server.js`
- Railway config: `railway.toml`

This is not yet the React + Vite rebuild in `C:\temp\accdee`.

## Main Runtime Flow

1. Railway starts the service with `node server.js`.
2. Express loads middleware, routes, and static frontend assets.
3. API routes talk to MySQL through the database configuration.
4. Users interact with pages/assets from `public/`.
5. Admin and auth flows are handled server-side through controllers and middleware.

## Important Directories

- `config/` - database and runtime configuration.
- `controllers/` - request handling logic.
- `middleware/` - auth, admin, security, and request middleware.
- `models/` - database model helpers.
- `routes/` - Express route definitions.
- `public/` - production static frontend.
- `uploads/` - uploaded files or legacy local upload storage.
- `docs/` - operations and production documentation.
- `utils/` - shared helpers.

## Production-Sensitive Systems

Treat these systems as high risk:

- Login and JWT/session handling.
- Admin authorization.
- Wallet balance changes.
- Topup approval/reject flow.
- Order creation.
- Stock depletion.
- Payment slip uploads.

Changes in these areas require tests and careful review.

## Duplicate Architecture Warning

There is another workspace at:

```text
C:\temp\accdee
```

That workspace contains rebuild/staging work and may include React/Vite structure. It is not the confirmed Railway production source of truth. Do not copy or merge from it without an explicit reconciliation task.

## Current Architecture Risk

- The legacy production app and rebuild app can easily diverge.
- Documentation must always name which repo it applies to.
- Auth/wallet/order behavior must be preserved until a tested migration exists.

## Recommended Direction

1. Stabilize the current legacy production app.
2. Add real integration tests around money/admin/order flows.
3. Harden security and logging.
4. Add backup/restore automation.
5. Only then migrate toward React + Vite with a staging rollout.
