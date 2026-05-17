# SOURCE CODE EXPOSURE - ACCDEE

This guide explains what visitors can and cannot see when they open `https://www.accdee.shop`.

## Short Answer

People who open the website can see frontend files that are sent to their browser.

They should not be able to see backend source code, `.env`, database credentials, Railway variables, server files, or MySQL data directly from the website.

If the GitHub repository is public, people can see the repository code from GitHub. That is separate from what the browser exposes.

## What Visitors Can See

These are normal and expected:

- HTML files served from `public/`
- CSS files in `public/css/`
- Browser JavaScript in `public/js/`
- Images in `public/images/`
- Public API responses such as public products, reviews, payment info, and site settings
- Network requests shown in browser DevTools
- HTTP response headers

Frontend code is never secret. Anything inside `public/` must be safe for visitors to read.

## What Visitors Must Not See

These must never be exposed by the website:

- `.env`
- Railway variables
- JWT secret
- Database host/user/password/name
- Cloudinary API secret
- Gmail app password
- Resend API key
- Telegram bot tokens
- Admin password
- `server.js`
- `controllers/`
- `routes/`
- `models/`
- `config/`
- raw database dumps or backups

## GitHub Visibility

Website visitors do not automatically see backend source code through `accdee.shop`.

However, if the GitHub repository is public, anyone with the repository URL can see committed source files. For a real business, the recommended setting is:

- Keep the repo private.
- Never commit `.env`.
- Never commit backups.
- Never commit real secrets in Markdown.
- Rotate secrets if they were ever committed.

## Current Frontend Secret Rule

The frontend must not contain:

- JWT signing secrets
- Admin passwords
- API keys with write/admin privileges
- Database credentials
- Telegram bot tokens
- Email credentials
- Cloudinary API secret

Safe frontend values are usually:

- public URLs
- image filenames
- public product labels
- client-side UI text
- non-secret feature flags

## API Exposure Rule

API responses must only return data the current user is allowed to see.

Examples:

- Public product list: ok.
- Public reviews with masked usernames: ok.
- User wallet balance: only after login.
- User order credentials: only for that user.
- Admin member list: admin only.
- Admin topup approval: admin only.

Do not trust hidden buttons in the frontend. Backend middleware must enforce permissions.

## Browser DevTools Check

Use this simple check after frontend changes:

1. Open `https://www.accdee.shop`.
2. Press F12.
3. Open the Network tab.
4. Reload the page.
5. Click JS files, API calls, and page responses.
6. Confirm no secrets appear.

Search for these words:

```text
JWT_SECRET
ADMIN_PASSWORD
DB_PASSWORD
MYSQLPASSWORD
CLOUDINARY_API_SECRET
GMAIL_APP_PASSWORD
RESEND_API_KEY
TELEGRAM_BOT_TOKEN
```

Finding placeholder names in documentation is fine. Finding real values is not fine.

## Repository Secret Check

Before pushing:

```powershell
npm run check:secrets
git status --short
git diff --cached --name-only
```

Do not paste secret values into chat or documentation.

`npm run check` also runs `npm run check:secrets`, so normal validation now includes a basic source-exposure guard.

## If A Secret Was Exposed

Do this immediately:

1. Do not print the secret again.
2. Redact it from the current file.
3. Rotate the secret in the real service dashboard.
4. Update Railway Variables with the new value.
5. Redeploy or restart if the variable changed.
6. Record the incident without the secret value.

Redacting a file is not enough if the secret was already committed. Rotation is required.

## Current ACCDEE Recommendation

For ACCDEE, the safest owner-level policy is:

- Keep GitHub private.
- Rotate any secret that was ever committed.
- Keep only placeholders in docs.
- Treat `public/` as fully visible to customers.
- Treat backend files as private, but never depend on privacy alone for security.
