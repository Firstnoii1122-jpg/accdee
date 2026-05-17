# ACCDEE Project Map

This file is the fast map for humans, ChatGPT, Claude, and future LLM agents. Use it to find the right file quickly instead of guessing or scanning the whole repo every time.

## Source Of Truth

- Active repo: `C:\Users\PCCOPA\Documents\MyProjects\accdee`
- Branch: `main`
- Deploy target: Railway, configured by `railway.toml`
- Runtime: Node.js + Express + MySQL
- Frontend: static files in `public/`
- Archived repo: `C:\temp\accdee_ARCHIVE_DO_NOT_USE`

Do not read, copy, merge, or compare the archived repo unless the owner explicitly approves it.

## Main Entry Points

| Area | Files |
|---|---|
| Server startup | `server.js` |
| Railway deploy config | `railway.toml` |
| Database connection | `config/db.js`, `config/setupDb.js` |
| Customer homepage | `public/index.html`, `public/js/main.js`, `public/css/style.css` |
| Admin login | `public/admin-login.html`, `public/js/admin-login.js`, `controllers/authController.js` |
| Admin dashboard | `public/admin.html`, `public/js/admin-main.js`, `public/js/admin-api.js`, `routes/adminRoutes.js`, `controllers/adminController.js` |
| Auth API | `routes/authRoutes.js`, `controllers/authController.js`, `middleware/authMiddleware.js`, `utils/jwtConfig.js` |
| Admin protection | `middleware/adminMiddleware.js`, `server.js`, `docs/SECURITY.md` |
| Wallet/topup | `routes/walletRoutes.js`, `controllers/walletController.js`, `models/transactionModel.js` |
| Shop/order/stock | `routes/shopRoutes.js`, `controllers/shopController.js` |
| Security logs | `utils/securityLogger.js` |
| Upload validation | `utils/fileValidation.js` |
| Backup/restore | `scripts/backup-db.js`, `scripts/validate-restore-file.js` |
| Validation scripts | `package.json`, `scripts/check-secrets.js`, `scripts/check-storefront.js`, `scripts/check-project-structure.js`, `scripts/check-seo.js`, `scripts/check-customer-flow.js`, `scripts/check-live-site.js`, `scripts/check-env.js` |
| SEO/crawler files | `public/robots.txt`, `public/sitemap.xml`, `docs/SEO_SKILL.md` |
| Customer click flow | `public/index.html`, `public/js/main.js`, `docs/CUSTOMER_FLOW_SKILL.md`, `docs/CUSTOMER_FLOW_TESTING.md` |
| Environment safety | `.env.example`, `scripts/check-env.js`, `docs/ENVIRONMENT_SAFETY_SKILL.md` |

## Folder Responsibilities

| Folder | Responsibility | Risk |
|---|---|---|
| `config/` | Environment-driven service configuration | High |
| `controllers/` | API behavior and business logic | High/Critical |
| `middleware/` | Auth, admin, and request protection | Critical |
| `models/` | Database helper logic | Critical |
| `routes/` | API route wiring | High |
| `utils/` | Shared security/runtime helpers | High |
| `public/` | Customer and admin browser UI | Medium/High |
| `tests/` | Automated safety coverage | Medium |
| `scripts/` | Local verification, backup, restore helpers | High |
| `docs/` | Production operations and AI handoff docs | Medium |

## If Something Breaks

| Symptom | Check These First |
|---|---|
| Customer buttons do not click | `public/index.html`, `public/js/main.js`, `server.js` CSP, `scripts/check-storefront.js` |
| Contact card does nothing | `public/index.html`, `public/js/main.js`, `scripts/check-customer-flow.js` |
| Product popup is blank | `public/js/main.js` product data and unknown-product fallback |
| Buy button does nothing | `public/js/main.js` `handleBuy`, product `contactOnly`, auth/topup popup logic |
| Register/login fails | `controllers/authController.js`, `routes/authRoutes.js`, `public/js/main.js`, browser console |
| Admin login fails | `public/admin-login.html`, `public/js/admin-login.js`, `controllers/authController.js`, `utils/jwtConfig.js` |
| Admin page opens but API says forbidden | `middleware/authMiddleware.js`, `middleware/adminMiddleware.js`, token role, admin routes |
| Wallet/topup error | `controllers/walletController.js`, `models/transactionModel.js`, `tests/wallet*.test.js` |
| Order/stock problem | `controllers/shopController.js`, `tests/shopController.test.js` |
| Upload rejected | `utils/fileValidation.js`, `controllers/walletController.js`, `tests/walletTopup.test.js` |
| Railway deploy fails | `railway.toml`, `server.js`, `package.json`, `docs/DEPLOYMENT.md` |
| Railway variables seem wrong | `scripts/check-env.js`, `.env.example`, `docs/ENVIRONMENT_SAFETY_SKILL.md` |
| Live site still shows old files | Railway deploy logs, `scripts/check-live-site.js`, script query version in `public/index.html` |
| Logs show rate limit/proxy issue | `server.js`, Railway proxy settings, `docs/MONITORING.md` |
| Secret exposure concern | `scripts/check-secrets.js`, `.gitignore`, GitHub token rotation outside repo |
| Google/share preview looks wrong | `public/index.html`, `public/robots.txt`, `public/sitemap.xml`, `scripts/check-seo.js`, `docs/SEO_SKILL.md` |

## Keep / Review / Ignore

Keep production-critical:

- `server.js`
- `config/`
- `controllers/`
- `middleware/`
- `models/`
- `routes/`
- `utils/`
- `public/`
- `tests/`
- `scripts/`
- `docs/`
- `package.json`
- `package-lock.json`
- `railway.toml`
- `.env.example`

Keep but review later before deleting:

- `CLAUDE.md`
- `accdee-skill.md`
- `database.sql`
- `test.ps1`

These may be legacy/reference/local helper files. Do not delete them in the same patch as production fixes.

Local-only or generated files that must stay out of Git:

- `.env`
- `.env.local`
- `.claude/`
- `node_modules/`
- `uploads/`
- `backups/`
- `*.sql`
- `*.sql.gz`
- real keys, tokens, cookies, database URLs, or Railway variables

## Safe Change Rule

Do not move or delete folders just to make the repo look cleaner. In this project, folder structure is already usable. Cleanliness should come from docs, ownership, validation scripts, and small patches first. Move files only with a migration plan and tests.
