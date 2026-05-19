# Security Fixes + ACCDEE Skill v3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** แก้ XSS 2 จุด Critical + getStats parallel + อัปเกรด `/accdee` skill เป็น v3

**Architecture:** แก้ frontend JS ให้ escape HTML ก่อน inject เข้า innerHTML ทุกจุด, แก้ backend getStats ให้รัน queries พร้อมกันด้วย Promise.all(), อัปเดต skill file และ TASKS.md ให้ reflect สถานะจริง

**Tech Stack:** Node.js, Express, Vanilla JS, MySQL, Railway

---

## Files ที่จะแก้

| File | Action | เหตุผล |
|------|--------|--------|
| `public/js/main.js` | Modify | Fix XSS ใน purchase modal + error modal |
| `controllers/adminController.js` | Modify | Fix getStats sequential → Promise.all() |
| `C:/Users/PCCOPA/.claude/commands/accdee.md` | Modify | Upgrade skill v2 → v3 |
| `TASKS.md` | Modify | Update สถานะหลัง audit |

---

## Task 1: Fix XSS — Purchase Modal (main.js:536-550)

**Files:**
- Modify: `public/js/main.js:536-550`

**ปัญหา:** `d.productName` และ `d.credentials` จาก server inject เข้า innerHTML โดยไม่ escape
ถ้า Admin ใส่ `<script>` ใน product name → JS ของลูกค้าถูก execute

- [ ] **Step 1: อ่านโค้ดเดิมบรรทัดที่ 536-550 ใน main.js**

```js
// โค้ดปัจจุบัน (อันตราย)
document.getElementById('modalContent').innerHTML = `
  <p style="...">สินค้า: <b>${d.productName}</b></p>        ← XSS
  <p style="...">ยอดคงเหลือ: <b ...>${d.newBalance} ฿</b></p>
  <div onclick="..." data-text="${d.credentials}" ...>       ← XSS
    ${d.credentials}                                          ← XSS
  </div>
  ...
`;
```

- [ ] **Step 2: แก้ไข — ใช้ escapeHtml() ทุกจุดที่ inject server data**

```js
// โค้ดใหม่ (ปลอดภัย)
document.getElementById('modalContent').innerHTML = `
  <div style="text-align:center">
    <div style="font-size:3rem;margin-bottom:8px">✅</div>
    <div class="modal-title" style="margin-bottom:8px">สั่งซื้อสำเร็จ!</div>
    <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:4px">สินค้า: <b>${escapeHtml(d.productName)}</b></p>
    <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:16px">ยอดคงเหลือ: <b style="color:#10b981">${escapeHtml(String(d.newBalance))} ฿</b></p>
    <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:8px">📋 ข้อมูลบัญชีของคุณ (แตะเพื่อ copy)</p>
    <div onclick="navigator.clipboard.writeText(this.dataset.text).then(()=>showToast('Copy สำเร็จ!'))"
         data-text="${escapeHtml(String(d.credentials))}"
         style="background:#0f172a;border:1px solid #334155;border-radius:8px;padding:12px;font-family:monospace;font-size:13px;color:#10b981;word-break:break-all;cursor:pointer;text-align:left;margin-bottom:16px">
      ${escapeHtml(String(d.credentials))}
    </div>
    <button class="btn-primary" onclick="closeModal()">ปิด</button>
  </div>
`;
```

- [ ] **Step 3: ตรวจ syntax**
```
node --check public/js/main.js
```
Expected: ไม่มี error

---

## Task 2: Fix XSS — Error Modal (main.js:430-442)

**Files:**
- Modify: `public/js/main.js:430-442`

**ปัญหา:** `message` parameter ใน `openTopupRequiredModal()` inject เข้า innerHTML โดยตรง

- [ ] **Step 1: แก้ไข openTopupRequiredModal ให้ escape message**

```js
// โค้ดเดิม (อันตราย)
function openTopupRequiredModal(message) {
  openModalWithContent(`
    ...
    <p style="...">${message}</p>   ← XSS
    ...
  `);
}
```

```js
// โค้ดใหม่ (ปลอดภัย)
function openTopupRequiredModal(message) {
  openModalWithContent(`
    <div style="text-align:center">
      <div style="font-size:3rem;margin-bottom:8px">💰</div>
      <div class="modal-title" style="margin-bottom:8px">ยอดเงินไม่พอ</div>
      <p style="color:var(--text-muted);font-size:0.9rem;line-height:1.7;margin-bottom:18px">${escapeHtml(String(message))}</p>
      <div class="modal-actions">
        <button class="btn-primary" onclick="closeModal();openTopup()">เติมเงินตอนนี้</button>
        <button class="btn-ghost" onclick="closeModal()">ดูสินค้าอื่น</button>
      </div>
    </div>
  `);
}
```

- [ ] **Step 2: ตรวจ syntax**
```
node --check public/js/main.js
```

- [ ] **Step 3: Commit Task 1 + 2 รวมกัน**
```
git add public/js/main.js
git commit -m "security: escape HTML in purchase modal and error modal (XSS fix)"
```

---

## Task 3: Fix getStats — Sequential → Promise.all()

**Files:**
- Modify: `controllers/adminController.js:101-145`

**ปัญหา:** getStats รัน 8 db.execute() ต่อกัน (sequential) ทั้งที่ไม่ได้ depend กัน = ช้าเกินไป

- [ ] **Step 1: แก้ getStats ให้รัน queries พร้อมกัน**

```js
const getStats = async (req, res) => {
  try {
    const [
      [[{ totalMembers }]],
      [[{ newToday }]],
      [[{ pendingCount }]],
      [[{ topupToday }]],
      [[{ ordersToday }]],
      [[{ totalRevenue }]],
      [[{ totalOrders }]],
      [recentTransactions],
    ] = await Promise.all([
      db.execute("SELECT COUNT(*) as totalMembers FROM users WHERE role = 'user'"),
      db.execute("SELECT COUNT(*) as newToday FROM users WHERE role = 'user' AND DATE(created_at) = CURDATE()"),
      db.execute("SELECT COUNT(*) as pendingCount FROM transactions WHERE status = 'pending'"),
      db.execute("SELECT COALESCE(SUM(amount),0) as topupToday FROM transactions WHERE type='topup' AND status='approved' AND DATE(created_at)=CURDATE()"),
      db.execute("SELECT COUNT(*) as ordersToday FROM orders WHERE DATE(created_at) = CURDATE()"),
      db.execute("SELECT COALESCE(SUM(amount),0) as totalRevenue FROM transactions WHERE type='topup' AND status='approved'"),
      db.execute("SELECT COUNT(*) as totalOrders FROM orders"),
      db.execute(`
        SELECT t.id, t.amount, t.type, t.status, t.created_at, u.username
        FROM transactions t
        JOIN users u ON t.user_id = u.id
        ORDER BY t.created_at DESC
        LIMIT 10
      `),
    ]);

    res.json({
      success: true,
      data: {
        totalMembers, newToday, pendingCount,
        topupToday, ordersToday, totalRevenue,
        totalOrders, recentTransactions,
      },
    });
  } catch (err) {
    console.error('getStats error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
```

- [ ] **Step 2: ตรวจ syntax**
```
node --check controllers/adminController.js
```

- [ ] **Step 3: รัน tests ทั้งหมด**
```
npm test
```
Expected: 35/35 pass, ไม่มี `getStats error` warning

- [ ] **Step 4: Commit**
```
git add controllers/adminController.js
git commit -m "perf: run admin getStats queries in parallel with Promise.all"
```

---

## Task 4: Upgrade /accdee Skill → v3

**Files:**
- Modify: `C:/Users/PCCOPA/.claude/commands/accdee.md`

- [ ] **Step 1: เขียน skill v3 ใหม่** — อัปเดต:
  - version v2 → v3
  - CURRENT STATE (commit ล่าสุด + features ครบ)
  - SECURITY RULES (เพิ่ม XSS rule)
  - TODO list (อัปเดตหลัง audit)
  - KNOWN ISSUES section ใหม่

- [ ] **Step 2: ตรวจสอบว่า skill โหลดได้**
  พิมพ์ `/accdee` ใน session ถัดไปเพื่อ verify

---

## Task 5: Update TASKS.md

**Files:**
- Modify: `TASKS.md`

- [ ] **Step 1: อัปเดต TASKS.md** — สะท้อนสถานะหลัง audit:
  - XSS fixed ✅
  - getStats parallel ✅
  - Skill v3 ✅
  - Remaining: domain, UptimeRobot, DB backup, pagination

- [ ] **Step 2: Commit**
```
git add TASKS.md docs/superpowers/plans/
git commit -m "docs: update TASKS.md post-audit + add implementation plan"
```

---

## Task 6: Final Push + Verify

- [ ] **Step 1: Push ทั้งหมด**
```
git push origin main
```

- [ ] **Step 2: ตรวจสอบ Railway deploy**
```
railway logs --service accdee
```

- [ ] **Step 3: Run full check**
```
npm run check
```
Expected: ผ่านทุกอย่าง
