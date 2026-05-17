# DEPLOYMENT - ACCDEE

เอกสารนี้อธิบายวิธีดูแลการ deploy ของ ACCDEE บน Railway แบบปลอดภัย โดยไม่เปิดเผย secret และไม่ deploy แบบเสี่ยง

## Current Deployment Model

- Platform: Railway
- Build system: Nixpacks
- Config file: `railway.toml`
- Start command: `node server.js`
- Healthcheck path: `/`
- Restart policy: on failure

## Before Any Deploy

ต้องเช็กก่อนทุกครั้ง:

```powershell
git status --short
npm test
npm run check
npm run build
npm run check:db
```

Do not deploy if any validation command fails.

## Git Remote Safety

The repository remote has previously been observed with an embedded GitHub token. Before pushing or deploying:

1. Rotate the exposed token in GitHub.
2. Replace the remote URL with a credential-free URL.
3. Confirm the remote output is safe.

Safe command:

```powershell
git remote set-url origin https://github.com/Firstnoii1122-jpg/accdee.git
```

Never paste tokens into documentation, chat, commits, or logs.

## Railway Variables

Railway environment variables should be managed in the Railway dashboard only.

Do not commit:

- `.env`
- database passwords
- JWT secrets
- admin secrets
- payment credentials
- third-party API keys

Use `.env.example` only for placeholder names and safe examples.

## Safe Deployment Flow

1. Make a small patch.
2. Run all validation commands.
3. Review `git diff`.
4. Commit only intended files.
5. Push only after remote URL is safe.
6. Let Railway deploy from GitHub.
7. Watch Railway logs.
8. Check the website and health endpoint.

## Rollback Flow

If a deploy breaks production:

1. Stop making new changes.
2. Check Railway deployment logs.
3. Identify the last known good deployment.
4. Roll back in Railway or revert the bad commit.
5. Confirm the website loads.
6. Confirm login/admin/API flows.
7. Record the incident in `CHANGELOG.md` or an operations note.

## Production Deploy Blockers

Do not deploy if:

- Git remote still contains credentials.
- `.env` is staged.
- Validation commands fail.
- Database backup status is unknown.
- Auth, wallet, topup, order, or stock code changed without tests.
- The owner has not approved deployment.

## Railway Log Checks After Deploy

Look for:

- startup errors
- database connection errors
- repeated 500 responses
- JWT/auth errors
- admin access failures
- memory or restart loops

If the service restarts repeatedly, roll back first and debug after production is stable.
