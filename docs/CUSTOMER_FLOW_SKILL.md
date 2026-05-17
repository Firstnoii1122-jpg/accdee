# ACCDEE Customer Flow Skill

Use this skill when changing customer-facing clicks, modals, login prompts, contact cards, or storefront navigation.

## Goal

No customer click should fail silently.

If a customer is not logged in, guide them to login/register. If a product needs staff confirmation, show contact options. If a contact URL is missing, show a helpful fallback message.

## Main Files

- `public/index.html`
- `public/js/main.js`
- `public/css/style.css`
- `scripts/check-customer-flow.js`

## Customer Flow Rules

- Login/register buttons must open the auth modal.
- Product cards must open a product modal.
- Buy buttons must guide guests to login before buying.
- Topup buttons must guide guests to login before topup.
- Contact cards must either open a real contact URL or show a fallback message.
- The Facebook contact card must not stay as a dead `#` click.
- `public/js/main.js` must be cache-busted in `public/index.html`.

## Security Rule

Customer-friendly frontend behavior is not security. Admin, wallet, topup, stock, and order protection must remain backend-enforced.

## Validation

Run:

```powershell
npm run check:customer-flow
npm run check
```

This catches missing click handlers, missing modal roots, dead contact fallback, and missing cache busting.

