# ACCDEE Environment Safety Skill

Use this skill when checking Railway variables, local `.env` readiness, deployment safety, or secret rotation.

## Goal

Confirm required configuration exists without exposing secrets.

The checker must report only status such as `OK`, `WARN`, or `FAIL`. It must never print passwords, JWT secrets, API keys, database URLs, tokens, bank account numbers, or Railway variable values.

## Main Files

- `.env.example`
- `config/db.js`
- `utils/jwtConfig.js`
- `utils/runtimeEnv.js`
- `scripts/check-env.js`
- `docs/DEPLOYMENT.md`
- `docs/SECURITY.md`

## Safe Rules

- Do not edit `.env`.
- Do not commit `.env`.
- Do not paste Railway variables into chat.
- Do not print secret values in logs.
- If a secret is missing or weak, report the variable name only.
- Rotate secrets in dashboards, not in committed docs.

## Required Production Variables

Core:

- `NODE_ENV=production`
- `JWT_SECRET` with at least 32 characters
- `JWT_EXPIRES_IN` such as `15m`, `30m`, or `1h`
- `SITE_URL=https://www.accdee.shop`
- `FRONTEND_URL=https://www.accdee.shop`

Database, either Railway names or app names:

- `MYSQLHOST` or `DB_HOST`
- `MYSQLPORT` or `DB_PORT`
- `MYSQLUSER` or `DB_USER`
- `MYSQLPASSWORD`, `DB_PASSWORD`, or `DB_PASS`
- `MYSQLDATABASE` or `DB_NAME`

Operations:

- `ADMIN_PASSWORD`
- `ADMIN_EMAIL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Business/payment:

- `PROMPTPAY_NUMBER`
- `BANK_NAME`
- `BANK_ACCOUNT_NUMBER`
- `BANK_ACCOUNT_NAME`

Optional but recommended:

- `RESEND_API_KEY` or `GMAIL_USER` + `GMAIL_APP_PASSWORD`
- `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`
- `TELEGRAM_WEBHOOK_SECRET`

## Commands

Local check:

```powershell
npm run check:env
```

Production strict check:

```powershell
npm run check:env:production
```

Use production strict mode before relying on Railway settings. If running locally without production secrets, use `npm run check:env` only.

## Handoff

Report:

- Which groups are OK.
- Which variable names are missing or weak.
- Whether any values were exposed. The answer should always be no.
- Next dashboard action for the owner.

