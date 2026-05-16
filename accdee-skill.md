# ACCDEE — Project Skill Reference

## Stack
Node.js + Express (`server.js`, port 3000/8080) · MySQL via mysql2/promise · JWT auth · Vanilla HTML/CSS/JS in `public/`
Railway deployment via `railway.toml` · Email: Resend API · Notifications: Telegram Bot · File uploads: Cloudinary

---

## Key Files
```
server.js                     ← entry point, rate limiters, route mounting
config/db.js                  ← MySQL pool (auto-detects Railway MYSQLHOST env)
config/setupDb.js             ← auto-create tables + optional ALTER TABLE migrations
config/email.js               ← Resend email wrapper (skips if RESEND_API_KEY not set)
config/telegram.js            ← Telegram Bot notify helpers
middleware/authMiddleware.js  ← protect() — verifies JWT, attaches req.user
middleware/adminMiddleware.js ← adminOnly() — requires role=admin
controllers/authController.js ← register / login / verifyOtp / forgotPassword / resetPassword
controllers/adminController.js
controllers/walletController.js
controllers/shopController.js
controllers/profileController.js
routes/authRoutes.js          ← /api/auth/*
routes/adminRoutes.js         ← /api/admin/*
routes/walletRoutes.js        ← /api/wallet/*
routes/shopRoutes.js          ← /api/shop/*
public/index.html             ← landing page (auth modal, OTP modal, shop preview)
public/admin.html             ← admin dashboard
public/css/style.css          ← dark neon theme (CSS variables)
public/js/main.js             ← customer frontend logic
public/js/admin-main.js       ← admin dashboard logic
public/js/admin-api.js        ← API.get/post/put/del helpers
public/js/admin-config.js     ← API_CONFIG (token storage)
```

---

## Authentication Architecture

### Standard Login Flow
```
Client → POST /api/auth/login { email, password }
Server: bcrypt.compare(password, hash)
  ├─ match + two_fa_enabled=0 → sign JWT { id, role, exp:7d } → return { token, data }
  └─ match + two_fa_enabled=1 → 2FA flow (see below)
Client: store token in localStorage('accdee_token')
Every API call: Authorization: Bearer <token>
```

### 2FA Email OTP Flow
```
1. Login succeeds but two_fa_enabled=1:
   Server: generate 6-digit OTP → store in users.two_fa_otp + users.two_fa_expires (5 min TTL)
   Server: email OTP to user via Resend → return { requires2FA: true, tempToken }
   tempToken = JWT { id, pending2FA: true, exp: 10min } — NOT a real session token

2. Client shows OTP input form, submits:
   POST /api/auth/verify-otp { tempToken, otp }

3. Server verifyOtp():
   - Verify tempToken signature + check decoded.pending2FA === true
   - Load user, compare otp string, check expiry
   - On success: clear two_fa_otp/two_fa_expires, issue full JWT
   - Return { token, data } — same shape as normal login
```

### JWT Structure
```js
// Full session token (after login or after OTP verify)
{ id: userId, role: 'user'|'admin', iat, exp }

// Temporary 2FA token (never has role — middleware rejects it)
{ id: userId, pending2FA: true, iat, exp }
```

### Password Reset Flow
```
POST /api/auth/forgot-password { email }
  → DELETE old token → INSERT password_resets(email, token, expires_at+1h)
  → Send email with link: SITE_URL/reset-password.html?token=<hex64>
  → Always returns success (prevents user enumeration)

POST /api/auth/reset-password { token, password }
  → SELECT WHERE token=? AND expires_at > NOW()
  → bcrypt.hash(password, 12) → UPDATE users SET password → DELETE token
```

### Admin Role System
- `users.role` ENUM('user','admin')
- `adminOnly` middleware: checks `req.user.role === 'admin'` after JWT verify
- Admin management endpoints:
  - `GET  /api/admin/admins` — list all admins
  - `POST /api/admin/admins` — create new admin account
  - `POST /api/admin/members/:id/set-role` — promote/demote (guards self-change)
  - `POST /api/admin/members/:id/toggle-2fa` — enable/disable 2FA per user

### Rate Limiting (server.js)
```js
authLimiter: 15 requests per 15 min  → applied to /api/auth
apiLimiter:  100 requests per 1 min  → applied to ALL other /api/* routes
```

---

## Database Tables
| Table | Key Columns |
|---|---|
| users | id, username, email, password(bcrypt,cost12), balance, role, telegram_chat_id, two_fa_enabled, two_fa_otp, two_fa_expires |
| transactions | id, user_id, amount, type(topup/purchase), status(pending/approved/rejected), slip_image |
| inventory | id, product_key, credentials(TEXT/JSON), status(available/sold), order_id |
| orders | id, user_id, product_key, product_name, amount, credentials |
| products | id, product_key(UNIQUE), name, description, price, is_active |
| coupons | id, code(UNIQUE), bonus_amount, max_uses, used_count, expires_at, is_active |
| coupon_uses | coupon_id+user_id UNIQUE — prevents reuse |
| reviews | id, user_id, order_id(UNIQUE), rating, comment |
| password_resets | id, email, token(hex64), expires_at |
| site_settings | setting_key(PK), setting_value |

### DB Migration Pattern (setupDb.js)
```js
// Safe optional column additions — idempotent on restart
const optionalColumns = [ `ALTER TABLE users ADD COLUMN ...`, ... ];
for (const sql of optionalColumns) {
  try { await db.execute(sql); } catch (e) { if (e.code !== 'ER_DUP_FIELDNAME') throw e; }
}
```

---

## API Routes

### Public (no auth)
```
POST /api/auth/register
POST /api/auth/login           → { token, data } or { requires2FA: true, tempToken }
POST /api/auth/verify-otp      → { token, data }
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/wallet/payment-info
GET  /api/wallet/site-settings
```

### User (Bearer JWT via protect middleware)
```
GET  /api/profile
GET  /api/wallet/info          → { balance, username }
POST /api/wallet/topup         multipart: amount, slip(file), note(max 500 chars)
GET  /api/wallet/history
POST /api/wallet/coupon        { code }
GET  /api/shop/products
POST /api/shop/buy             { productKey }
GET  /api/shop/orders
POST /api/shop/orders/:id/review { rating, comment }
```

### Admin (Bearer JWT + role=admin)
```
GET    /api/admin/stats
GET    /api/admin/members                    ?search=
POST   /api/admin/members/:id/credit         { amount, type, note }
POST   /api/admin/members/:id/reset-password { password }
POST   /api/admin/members/:id/set-role       { role: 'user'|'admin' }
POST   /api/admin/members/:id/toggle-2fa
DELETE /api/admin/members/:id
GET    /api/admin/topups           pending
GET    /api/admin/topups/history
POST   /api/admin/topups/:id/approve
POST   /api/admin/topups/:id/reject
GET    /api/admin/products
POST   /api/admin/products         { productKey, name, description, price }
PUT    /api/admin/products/:key    { name, description, price, is_active }
DELETE /api/admin/products/:key
GET    /api/admin/inventory
GET    /api/admin/inventory/stock
POST   /api/admin/inventory        { productKey, credentials }
DELETE /api/admin/inventory/:id
GET    /api/admin/orders
GET    /api/admin/coupons
POST   /api/admin/coupons          { code, bonus_amount, max_uses, expires_at? }
DELETE /api/admin/coupons/:id
GET    /api/admin/settings
PUT    /api/admin/settings         { alert_text?, alert_active?, line_url?, ... }
GET    /api/admin/admins
POST   /api/admin/admins           { username, email, password }
```

---

## Security Rules (NEVER break)
1. **All admin routes** must use `adminOnly` middleware
2. **All DB queries** must use parameterized — never string-concat SQL
3. **Never commit `.env`** — contains DB password + JWT secret
4. **bcrypt cost = 12** throughout (register, createAdmin, resetPassword)
5. **Fail-secure**: if critical env var missing (e.g. TELEGRAM_WEBHOOK_SECRET), reject request
6. **Input validation** at controller level before any DB operation

---

## Common Patterns

### Add a new admin page
1. Add sidebar link in `admin.html`: `<a class="menu-item" onclick="showPage('pageid', this)">`
2. Add `<div id="page-pageid" class="page">` in content area
3. Add `pageid: 'Page Title'` to `titleMap` in `admin-main.js` `showPage()`
4. Add `if (id === 'pageid') loadPageid();` in `showPage()`
5. Add `loadPageid()` function + `window.loadPageid = loadPageid`

### Add a new API endpoint
1. Controller: `async (req, res) => { try { ... parameterized query ... res.json({ success, ... }) } catch(e) { res.status(500) } }`
2. Wire in `routes/*.js` with correct middleware (`protect` or `adminOnly`)
3. Add to `module.exports`

### site_settings upsert (backend)
```js
await db.execute(
  'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)',
  [key, value]
);
```

### Admin API helper (frontend)
```js
API.get('/admin/...')           // GET + Bearer token
API.post('/admin/...', body)    // POST
API.put('/admin/...', body)     // PUT
API.del('/admin/...')           // DELETE
```

---

## Design Tokens (CSS variables)
```css
--bg-dark:    #050d1a
--bg-card:    #0a1628
--bg-card2:   #0d1f38
--border:     rgba(0,212,255,0.12)
--neon-blue:  #00d4ff
--neon-green: #00ff88
--neon-purple:#a78bfa
--text-main:  #e8f4fd
--muted:      #8899aa
```

## Image Files (public/images/)
`hero-main.png`, `hero-alt.png`, `banner-facebook.jpg`, `banner-fb-ads.jpg`, `banner-fanpage.jpg`, `banner-bm-premium.jpg`, `banner-bm-personal.jpg`, `banner-twitter.jpg`, `banner-twitter-personal.jpg`, `banner-instagram.jpg`, `banner-ig-personal.jpg`, `banner-tiktok.jpg`, `banner-gmail.jpg`, `banner-netflix.jpg`, `banner-fb-personal.jpg`, `banner-bm-premium2.jpg`

## ENV Variables Required
```
JWT_SECRET           (32+ chars)
JWT_EXPIRES_IN       (e.g. 7d)
DB_HOST / MYSQLHOST  (auto-detected for Railway)
RESEND_API_KEY       (for all emails — forgot password, OTP, welcome)
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
TELEGRAM_WEBHOOK_SECRET
SITE_URL             (e.g. https://www.accdee.shop)
CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET
```
