# ACCDEE Customer Flow Testing

Use this checklist after frontend changes, Railway deploys, or any report that customers cannot click, register, login, topup, or buy.

## What This Protects

This checklist protects the money path:

1. Customer lands on the homepage.
2. Customer opens a product.
3. Guest customer is guided to register/login.
4. Logged-in customer can topup.
5. Customer sees helpful messages when stock, balance, or contact data is missing.

It does not replace backend tests. Backend auth, wallet, topup, stock, and order safety still need automated tests.

## Before Testing

Run locally:

```powershell
npm test
npm run check
npm run build
```

Optional production smoke check after deploy:

```powershell
npm run check:live
```

If local MySQL is available:

```powershell
npm run check:db
```

## Guest Customer Checklist

- Open `https://www.accdee.shop/`.
- Confirm the homepage loads without a blank screen.
- Confirm the hero carousel appears.
- Click `เข้าสู่ระบบ`; the login modal must open.
- Click `สมัครฟรี`; the register modal must open.
- Click a product card; the product modal must open.
- Click `สั่งซื้อเลย` while logged out; the login guidance must appear.
- Click `เติมเงิน` while logged out; the login guidance must appear.
- Click LINE contact; it should open a real LINE URL.
- Click Telegram contact; it should open a real Telegram URL.
- Click Facebook contact; if no real URL is configured, it must show a helpful fallback message.

## Logged-In Customer Checklist

Use a safe test account only. Do not test with a real customer account.

- Login succeeds.
- Navbar switches from guest buttons to user balance/profile.
- Profile modal opens.
- Topup modal opens.
- Invalid topup input shows a readable message.
- Product buy with insufficient balance shows a topup suggestion.
- Product buy when stock is empty shows a restock/contact message.
- Order success shows credentials and copy behavior.

## Mobile Checklist

Test around 390px width:

- Hamburger menu opens and closes.
- Drawer login/register buttons open auth modal.
- Product modal fits the screen.
- Topup modal fits the screen.
- Text does not overlap buttons.

## Admin Boundary Reminder

The customer UI should be friendly, but admin security must stay strict:

- Admin page must not be indexed.
- Admin APIs must require backend token checks.
- Frontend hiding is not security.

## If Something Fails

| Symptom | First Files To Check |
|---|---|
| Buttons do nothing | `public/index.html`, `public/js/main.js`, `scripts/check-customer-flow.js` |
| Product popup blank | `public/js/main.js`, `scripts/check-storefront.js` |
| Register/login fails | `controllers/authController.js`, `routes/authRoutes.js`, browser console |
| Topup UI fails | `public/js/main.js`, `controllers/walletController.js` |
| Contact link dead | `public/index.html`, `public/js/main.js`, site settings API |
| Live site still old | Railway deploy logs, script query version in `public/index.html` |

