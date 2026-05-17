# ACCDEE Purchase UX Skill

Use this skill when changing customer shopping behavior on the ACCDEE public storefront.

## Goal

Every customer click must respond clearly.

- Product card click opens a product modal.
- Unknown product click opens a helpful contact modal, not silence.
- Guest purchase attempt opens login/register guidance.
- Out-of-stock purchase attempt stays on site and offers contact paths.
- Insufficient balance purchase attempt offers wallet topup.
- Successful purchase shows credentials and copy behavior.

## Source Of Truth

- Active repo only: `C:\Users\PCCOPA\Documents\MyProjects\accdee`
- Frontend entry: `public/index.html`
- Customer JS: `public/js/main.js`
- Customer CSS: `public/css/style.css`
- Buy API: `POST /api/shop/buy`
- Product keys in frontend must match backend `products.product_key` when direct purchase is allowed.

## Hard Rules

- Do not edit `.env`.
- Do not deploy manually.
- Do not touch wallet/order/backend logic unless specifically required.
- Do not make a silent `return` for customer purchase actions.
- Do not rely on frontend checks for money/security.
- Keep patches small and reversible.

## Product UX Rules

### Direct Purchase Products

Use a buy button only when the product has:

- `productKey`
- numeric price shown to customer
- matching backend inventory/product row

Expected flow:

1. Guest clicks buy -> show login/register modal guidance.
2. Logged-in user clicks buy -> call `/api/shop/buy`.
3. Success -> show credentials and update balance.
4. Out of stock -> show contact/restock modal.
5. Insufficient balance -> show wallet topup modal.
6. API error -> show clear retry/contact message.

### Contact-Only Products

Use contact buttons for products whose price is `ติดต่อ` or whose backend stock is not guaranteed.

Expected flow:

1. Product card opens modal.
2. Modal explains this product needs staff confirmation.
3. Show LINE and Telegram buttons.
4. Keep customer on the page.

## Validation

Run after a patch:

```powershell
npm test
npm run check
npm run build
npm run check:db
```

If local DB fails, report it honestly and also check live `/api/health` when allowed.

## Handoff

Report:

- Product clicks covered.
- Guest behavior.
- Stock-empty behavior.
- Balance-empty behavior.
- Files changed.
- Validation results.
