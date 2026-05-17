# TESTING - ACCDEE

เอกสารนี้อธิบายสถานะการทดสอบและแนวทางเพิ่ม tests ให้ ACCDEE โดยเน้นระบบเสี่ยงสูง เช่น admin, wallet, topup, order และ stock

## Current Test Status

The active repo currently has basic npm validation scripts plus initial auth/admin integration tests. These checks are useful, but they are not enough for full production safety.

Current required commands:

```powershell
npm test
npm run check
npm run build
npm run check:db
```

## What These Checks Prove

- JavaScript syntax is valid.
- Main server files can be parsed.
- Build/check command is available.
- Database connection can respond to `SELECT 1`.
- Login success and wrong-password behavior work with isolated test users.
- Basic admin authorization returns 401 without a token and 403 for non-admin users.
- A valid admin token can reach a protected admin test route.

## What These Checks Do Not Prove

- Wallet balances are safe.
- Topup approval cannot be double-approved.
- Orders cannot oversell stock.
- Uploads are safely validated.
- Production sessions expire correctly.

## Test Safety Rules

- Never run tests against production data.
- Tests must refuse to run in `NODE_ENV=production`.
- Tests must not delete real users, orders, wallet transactions, or products.
- Tests must not print passwords, tokens, JWTs, cookies, or secrets.
- Test users must be clearly marked and isolated.

## Highest Priority Tests

Add tests in this order:

1. Auth login success.
2. Auth login wrong password.
3. Admin route without token returns 401.
4. Admin route with non-admin token returns 403.
5. Admin route with admin token succeeds.
6. Wallet transaction cannot create invalid balance.
7. Topup approval cannot be approved twice.
8. Topup reject cannot happen after approval.
9. Order cannot reduce stock below zero.
10. Stock decreases exactly once per completed order.

## Recommended Test Structure

When integration tests are added, prefer:

- a dedicated `tests/` directory
- isolated test helpers
- safe test database or safe test fixtures
- no production credentials
- clear cleanup that only touches test-owned rows

## Acceptance Criteria For Phase 1

Phase 1 is complete only when:

- Auth tests exist.
- Admin RBAC tests exist.
- Wallet/topup/order safety tests exist.
- Tests refuse production mode.
- All required validation commands pass.
- Failures are understandable to the next AI agent or maintainer.

## Manual Smoke Test Checklist

Use this after code changes and before any deploy:

- Homepage loads.
- User login works.
- Wrong password is rejected.
- Admin page is blocked without token.
- Non-admin user cannot access admin APIs.
- Admin can access allowed admin APIs.
- Product list loads.
- Topup flow still works in a safe test environment.
- Order flow still works in a safe test environment.

Manual smoke tests do not replace automated tests, but they catch obvious production issues.
