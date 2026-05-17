# ACCDEE File Owners

This document turns the project into a small company. Each role is responsible for specific files and must protect its area before changing it.

## Executive Summary

- Active repo only: `C:\Users\PCCOPA\Documents\MyProjects\accdee`
- Production app: Node.js + Express + MySQL + static frontend
- Highest-risk areas: auth, admin, wallet, topup, order, stock, uploads, database, deploy
- Rule: if a change crosses roles, explain the risk and keep the patch small

## Board Level

| Role | Owns | Main Files |
|---|---|---|
| Owner / CEO | Product direction and deploy approval | `TASKS.md`, `CHANGELOG.md` |
| CTO / Architect | System boundaries and migration safety | `AGENTS.md`, `SKILL.md`, `docs/ARCHITECTURE.md`, this file |
| Security Lead | Auth, admin, secrets, uploads, security logs | `docs/SECURITY.md`, `docs/SECURITY_OPERATIONS.md`, `middleware/`, `utils/` |
| Backend Lead | API behavior and business logic | `server.js`, `routes/`, `controllers/`, `models/` |
| Frontend Lead | Customer/admin screens and browser behavior | `public/` |
| QA Lead | Tests and validation | `tests/`, `docs/TESTING.md`, `package.json` scripts |
| DevOps Lead | Railway, deploy, logs, backup, restore | `railway.toml`, `scripts/`, `docs/DEPLOYMENT.md`, `docs/MONITORING.md`, `docs/BACKUP.md`, `docs/RESTORE.md` |
| Data Steward | Database schema and data safety | `config/db.js`, `config/setupDb.js`, `database.sql` |

## Root Files

| File | Owner | Responsibility | Risk |
|---|---|---|---|
| `server.js` | Backend Lead + Security Lead | Express app, middleware, CORS, CSP, rate limits, route mounting | High |
| `package.json` | QA Lead + DevOps Lead | Scripts and dependencies | Medium |
| `package-lock.json` | QA Lead | Locked dependency versions | Medium |
| `railway.toml` | DevOps Lead | Railway build/start/restart settings | High |
| `.env.example` | Security Lead | Safe placeholder variable names only | High |
| `.gitignore` | DevOps Lead + Security Lead | Prevent secrets/backups/local files from commit | High |
| `database.sql` | Data Steward | Baseline schema reference | High |
| `AGENTS.md` | CTO / Architect | Multi-agent handoff rules | Medium |
| `SKILL.md` | CTO / Architect | Main AI operating skill | Medium |
| `RULES.md` | CTO / Architect + Security Lead | Hard safety rules | Medium |
| `TASKS.md` | Owner / CEO + CTO | Current phase board | Medium |
| `CHANGELOG.md` | Owner / CEO + QA Lead | What changed and why | Low |
| `accdee-skill.md` | CTO / Architect | Legacy skill reference; must not contain real secrets | High |
| `CLAUDE.md` | CTO / Architect | Claude-specific local guide | Medium |

## Config Team

| Files | Owner | Notes |
|---|---|---|
| `config/db.js` | Data Steward | Must not print database passwords |
| `config/setupDb.js` | Data Steward + Backend Lead | Schema changes must be additive and tested |
| `config/email.js` | DevOps Lead + Security Lead | Email credentials stay in environment variables |
| `config/telegram.js` | DevOps Lead + Security Lead | Bot tokens stay in environment variables |

## Middleware Team

| Files | Owner | Notes |
|---|---|---|
| `middleware/authMiddleware.js` | Security Lead | JWT verification and user identity |
| `middleware/adminMiddleware.js` | Security Lead | Backend-side admin role enforcement |

Security rule: admin protection must be enforced on the backend, never only by hiding frontend buttons.

## Controller Team

| Files | Owner | Risk |
|---|---|---|
| `controllers/authController.js` | Security Lead + Backend Lead | High |
| `controllers/adminController.js` | Backend Lead + Security Lead | Critical |
| `controllers/walletController.js` | Backend Lead + Data Steward | Critical |
| `controllers/shopController.js` | Backend Lead + Data Steward | Critical |
| `controllers/profileController.js` | Backend Lead | Medium |
| `controllers/telegramController.js` | DevOps Lead + Backend Lead | Medium |

Critical rule: wallet, topup, stock, and order changes require tests.

## Model Team

| Files | Owner | Notes |
|---|---|---|
| `models/userModel.js` | Backend Lead + Data Steward | User lookup/create helpers |
| `models/transactionModel.js` | Backend Lead + Data Steward | Topup status safety and transaction state |

## Route Team

| Files | Owner | Notes |
|---|---|---|
| `routes/authRoutes.js` | Security Lead | Public auth endpoints |
| `routes/adminRoutes.js` | Security Lead + Backend Lead | Must require auth/admin where needed |
| `routes/walletRoutes.js` | Backend Lead + Data Steward | Money endpoints |
| `routes/shopRoutes.js` | Backend Lead + Data Steward | Product/order endpoints |
| `routes/profileRoutes.js` | Backend Lead | User profile endpoints |
| `routes/telegramRoutes.js` | DevOps Lead | Webhook endpoints |

## Utility Team

| Files | Owner | Notes |
|---|---|---|
| `utils/jwtConfig.js` | Security Lead | JWT guard and expiry defaults |
| `utils/securityLogger.js` | Security Lead + DevOps Lead | Structured security/audit events |
| `utils/fileValidation.js` | Security Lead | Upload validation |

## Frontend Team

| Files | Owner | Notes |
|---|---|---|
| `public/index.html` | Frontend Lead | Homepage and customer entry |
| `public/shop.html` | Frontend Lead | Product shopping page |
| `public/wallet.html` | Frontend Lead + Backend Lead | Topup/wallet UI |
| `public/orders.html` | Frontend Lead | Order history UI |
| `public/admin.html` | Frontend Lead + Security Lead | Admin UI; not a security boundary |
| `public/admin-login.html` | Frontend Lead + Security Lead | Admin login UI |
| `public/reset-password.html` | Frontend Lead + Security Lead | Password reset UI |
| `public/faq.html` | Frontend Lead | Customer information |
| `public/css/style.css` | Frontend Lead | Customer theme, carousel, responsive UI |
| `public/css/admin-style.css` | Frontend Lead | Admin dashboard theme |
| `public/css/admin-login.css` | Frontend Lead | Admin login theme |
| `public/js/main.js` | Frontend Lead + Backend Lead | Customer browser logic |
| `public/js/admin-main.js` | Frontend Lead + Security Lead | Admin browser logic |
| `public/js/admin-api.js` | Frontend Lead + Security Lead | Admin API helper |
| `public/js/admin-config.js` | Frontend Lead | Admin frontend config |
| `public/images/` | Frontend Lead | Product and hero assets |

Frontend rule: UI changes must be checked on mobile width and desktop width.

## Test Team

| Files | Owner | Notes |
|---|---|---|
| `tests/authAdmin.test.js` | QA Lead + Security Lead | Login and admin RBAC |
| `tests/adminCredit.test.js` | QA Lead + Data Steward | Admin credit safety |
| `tests/transactionModel.test.js` | QA Lead + Data Steward | Topup status safety |
| `tests/shopController.test.js` | QA Lead + Data Steward | Order and stock safety |
| `tests/walletController.test.js` | QA Lead + Data Steward | Coupon/wallet safety |
| `tests/walletTopup.test.js` | QA Lead + Security Lead | Slip upload and topup request safety |

## Scripts Team

| Files | Owner | Notes |
|---|---|---|
| `scripts/backup-db.js` | DevOps Lead + Data Steward | Creates DB backups without printing passwords |
| `scripts/validate-restore-file.js` | DevOps Lead + Data Steward | Checks SQL dump shape before restore practice |

## Documentation Team

| Files | Owner |
|---|---|
| `docs/ARCHITECTURE.md` | CTO / Architect |
| `docs/SECURITY.md` | Security Lead |
| `docs/TESTING.md` | QA Lead |
| `docs/DEPLOYMENT.md` | DevOps Lead |
| `docs/MONITORING.md` | DevOps Lead |
| `docs/BACKUP.md` | DevOps Lead + Data Steward |
| `docs/RESTORE.md` | DevOps Lead + Data Steward |
| `docs/SECURITY_OPERATIONS.md` | Security Lead + DevOps Lead |
| `docs/PRODUCTION_CHECKLIST.md` | Owner / CEO + DevOps Lead |

## Escalation Rules

Stop and explain before changing:

- Auth or admin behavior.
- Wallet balance updates.
- Topup approve/reject.
- Order creation or stock depletion.
- Database schema.
- Upload validation.
- Railway deploy config.
- Any file containing secrets.

## Normal Work Flow

1. Read `AGENTS.md`, `SKILL.md`, `RULES.md`, `TASKS.md`, and this file.
2. Run `git status --short --branch`.
3. Identify the responsible role for the target file.
4. Make the smallest useful patch.
5. Run validation.
6. Update docs/changelog if production behavior changed.
7. End with a handoff summary.
