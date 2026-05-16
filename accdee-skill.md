# ACCDEE Skill Reference

## Stack
Node.js + Express → `server.js` :3000 | MySQL (mysql2/promise) | JWT auth | Vanilla HTML/CSS/JS in `public/`

## Key Files
```
server.js                     ← entry point
config/db.js                  ← MySQL pool
config/setupDb.js             ← auto-create tables + seed defaults
middleware/authMiddleware.js  ← protect (JWT verify)
middleware/adminMiddleware.js ← adminOnly (role=admin check)
controllers/adminController.js
controllers/walletController.js
controllers/shopController.js
controllers/authController.js
routes/adminRoutes.js         ← /api/admin/*
routes/walletRoutes.js        ← /api/wallet/*
routes/shopRoutes.js          ← /api/shop/*
routes/authRoutes.js          ← /api/auth/*
public/index.html             ← landing page
public/shop.html              ← shop
public/wallet.html            ← wallet / topup
public/orders.html            ← order history
public/admin.html             ← admin dashboard
public/css/style.css          ← dark neon theme
public/css/admin-style.css    ← admin theme
public/js/main.js             ← customer frontend
public/js/admin-main.js       ← admin dashboard logic
public/js/admin-api.js        ← API.get/post/put/del helpers
public/js/admin-config.js     ← API_CONFIG (token storage)
```

## DB Tables
| Table | Key Columns |
|---|---|
| users | id, username, email, password(hash), balance, role, telegram_chat_id |
| transactions | id, user_id, amount, type(topup/purchase), status(pending/approved/rejected), slip_image |
| inventory | id, product_key, credentials(TEXT), status(available/sold), order_id |
| orders | id, user_id, product_key, product_name, amount, credentials |
| products | id, product_key(UNIQUE), name, description, price, is_active |
| coupons | id, code(UNIQUE), bonus_amount, max_uses, used_count, expires_at, is_active |
| coupon_uses | coupon_id, user_id (UNIQUE pair — prevents reuse) |
| reviews | id, user_id, order_id(UNIQUE), rating, comment |
| password_resets | id, email, token, expires_at |
| site_settings | setting_key (PK), setting_value, updated_at |

## site_settings Keys
`alert_text`, `alert_active`, `line_url`, `telegram_url`, `facebook_url`, `promptpay`, `bank_name`, `bank_account`, `bank_holder`

## API Routes

### Public (no auth)
```
POST /api/auth/register
POST /api/auth/login           → { token, user }
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/wallet/payment-info  → { promptpay, bankName, bankAccount, bankAccountName }
GET  /api/wallet/site-settings → all site_settings as flat object
```

### User (Bearer token via `protect` middleware)
```
GET  /api/profile
GET  /api/wallet/info          → { balance, username }
POST /api/wallet/topup         multipart: amount, slip(file), note
GET  /api/wallet/history
POST /api/wallet/coupon        { code }
GET  /api/shop/products        → products + stock count
POST /api/shop/buy             { productKey }
GET  /api/shop/orders
POST /api/shop/orders/:id/review { rating, comment }
```

### Admin (Bearer token via `adminOnly` middleware)
```
GET  /api/admin/stats
GET  /api/admin/members        ?search=
POST /api/admin/members/:id/credit         { amount, type(deposit/withdraw), note }
POST /api/admin/members/:id/reset-password { password }
DELETE /api/admin/members/:id
GET  /api/admin/topups         pending only
GET  /api/admin/topups/history all
POST /api/admin/topups/:id/approve
POST /api/admin/topups/:id/reject
GET  /api/admin/products       → products + stock
POST /api/admin/products       { productKey, name, description, price }
PUT  /api/admin/products/:key  { name, description, price, is_active }
DELETE /api/admin/products/:key
GET  /api/admin/inventory
GET  /api/admin/inventory/stock summary by product
POST /api/admin/inventory      { productKey, credentials }
DELETE /api/admin/inventory/:id
GET  /api/admin/orders
GET  /api/admin/coupons
POST /api/admin/coupons        { code, bonus_amount, max_uses, expires_at? }
DELETE /api/admin/coupons/:id
GET  /api/admin/settings       → flat object of all site_settings
PUT  /api/admin/settings       { alert_text?, alert_active?, line_url?, telegram_url?, facebook_url?, promptpay?, bank_name?, bank_account?, bank_holder? }
```

## Design Tokens (CSS variables in style.css)
```css
--bg-dark:    #050d1a
--bg-card:    #0a1628
--bg-card2:   #0d1f38
--border:     rgba(0,212,255,0.12)
--neon-blue:  #00d4ff
--neon-green: #00ff88
--neon-purple:#a78bfa
--text-main:  #e8f4fd
--text-muted: #8899aa
```

## Security Rules (NEVER break)
1. All admin routes MUST use `adminOnly` middleware
2. All DB queries MUST use parameterized — never string-concat SQL
3. Never commit `.env`
4. Validate & sanitize input at controller level

## Image Files (public/images/)
`hero-main.png`, `hero-alt.png`, `banner-facebook.jpg`, `banner-fb-ads.jpg`, `banner-fanpage.jpg`, `banner-bm-premium.jpg`, `banner-bm-personal.jpg`, `banner-twitter.jpg`, `banner-twitter-personal.jpg`, `banner-instagram.jpg`, `banner-ig-personal.jpg`, `banner-tiktok.jpg`, `banner-gmail.jpg`, `banner-netflix.jpg`, `banner-fb-personal.jpg`, `banner-bm-premium2.jpg`

## Common Patterns

### Add a new admin page
1. Add menu item in `admin.html` sidebar: `<a class="menu-item" onclick="showPage('pageid', this)">`
2. Add `<div id="page-pageid" class="page">` in content area
3. Add `pageid: 'ชื่อหน้า'` to `titleMap` in `admin-main.js` `showPage()`
4. Add `if (id === 'pageid') loadPageid();` in `showPage()`
5. Add `loadPageid()` function + `window.loadPageid = loadPageid` export

### Add a new API endpoint
1. Add controller function: try/catch → parameterized query → `res.json({ success, ... })`
2. Wire in appropriate `routes/*.js` with correct middleware
3. Add to `module.exports`

### site_settings upsert (backend)
```js
await db.execute(
  'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)',
  [key, value]
);
```

### Admin API helper (frontend, uses admin-api.js)
```js
API.get('/admin/...')           // GET with Bearer token
API.post('/admin/...', body)    // POST
API.put('/admin/...', body)     // PUT
API.del('/admin/...')           // DELETE
```

### Frontend dynamic settings (index.html → main.js)
- `loadSiteSettings()` called on DOMContentLoaded
- Fetches `GET /api/wallet/site-settings`
- Updates: `#alertBanner` (text + display), `#contactLine` href, `#contactTelegram` href, `#contactFacebook` href
