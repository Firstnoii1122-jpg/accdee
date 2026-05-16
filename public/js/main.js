// ================================================
// main.js — ACCDEE Frontend JavaScript
// แก้ไข JS ที่นี่ได้เลย แบ่งเป็นหมวดชัดเจน
// ================================================

// ── 1. CONFIG ──────────────────────────────────
// ใช้ /api เพราะ frontend และ backend อยู่ server เดียวกัน
const API_URL = '/api';

// ── 2. สินค้าทั้งหมด (Product Data) ───────────
// productKey ต้องตรงกับที่ Admin เพิ่มใน Admin Panel
const products = {
  'fb-blank': {
    icon: '📘', platform: 'Facebook', productKey: 'fb-blank',
    title: 'บัญชี Facebook เปล่า', price: '50 ฿',
    desc: 'บัญชี Facebook ใหม่ ไม่มีแฟนเพจ ผ่านการตรวจสอบคุณภาพ พร้อมใช้งานทันที\n\n• ส่งทันทีหลังชำระเงิน\n• รับประกันบัญชีสามารถเข้าใช้งานได้\n• รองรับการสร้างแฟนเพจใหม่'
  },
  'fb-10page': {
    icon: '📘', platform: 'Facebook', productKey: 'fb-10page',
    title: 'บัญชี Facebook พร้อม 10 แฟนเพจ', price: '100 ฿',
    desc: 'บัญชี Facebook ที่มีแฟนเพจครบ 10 เพจ เหมาะสำหรับงานโฆษณา Facebook Ads\n\n• 10 แฟนเพจพร้อมใช้\n• ส่งทันทีหลังชำระเงิน\n• เหมาะสำหรับโฆษณา Facebook'
  },
  'fb-5page': {
    icon: '📘', platform: 'Facebook', productKey: 'fb-5page',
    title: 'บัญชี Facebook พร้อม 5 แฟนเพจ', price: '50 ฿',
    desc: 'บัญชี Facebook ที่มีแฟนเพจ 5 เพจ ราคาสุดคุ้ม เหมาะสำหรับผู้เริ่มต้น\n\n• 5 แฟนเพจพร้อมใช้\n• ส่งทันทีหลังชำระเงิน\n• ราคาประหยัด'
  },
  'tw-1k': {
    icon: '🐦', platform: 'Twitter (X)', productKey: 'tw-1k',
    title: 'Twitter บัญชี 1,000+ ผู้ติดตาม', price: '800 ฿',
    desc: 'บัญชี Twitter ที่มีผู้ติดตามกว่า 1,000 คน เพิ่มความน่าเชื่อถือ\n\n• 1,000+ ผู้ติดตามจริง\n• บัญชีมีประวัติกิจกรรม\n• เหมาะสำหรับการตลาดระดับพรีเมียม'
  }
};

// ── 3. AUTH FUNCTIONS (Login / Register / Logout) ──

// เปิด Auth Modal และเลือก tab ที่ต้องการ
function openAuth(tab = 'login') {
  document.getElementById('authOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  switchAuthTab(tab);
}

// ปิด Auth Modal
function closeAuth() {
  document.getElementById('authOverlay').classList.remove('open');
  document.body.style.overflow = '';
  clearAuthMsg();
}

// ปิดเมื่อคลิกพื้นหลัง
function closeAuthOuter(e) {
  if (e.target === document.getElementById('authOverlay')) closeAuth();
}

// เปลี่ยน tab Login / Register / Forgot / OTP
function switchAuthTab(tab) {
  document.getElementById('formLogin').style.display    = tab === 'login'    ? 'block' : 'none';
  document.getElementById('formRegister').style.display = tab === 'register' ? 'block' : 'none';
  document.getElementById('formForgot').style.display   = tab === 'forgot'   ? 'block' : 'none';
  document.getElementById('formOtp').style.display      = tab === 'otp'      ? 'block' : 'none';
  document.getElementById('tabLogin').classList.toggle('active',    tab === 'login');
  document.getElementById('tabRegister').classList.toggle('active', tab === 'register');
  clearAuthMsg();
}

// ล้างข้อความ error ทั้งหมด
function clearAuthMsg() {
  ['loginMsg', 'registerMsg', 'forgotMsg'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.className = 'auth-msg'; el.textContent = ''; }
  });
}

// แสดงข้อความใน auth modal
function showAuthMsg(id, text, type = 'error') {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className   = `auth-msg ${type}`;
}

// Login — เรียก POST /api/auth/login
let _pendingTempToken = null; // เก็บ tempToken ระหว่างรอ OTP

async function doLogin() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    showAuthMsg('loginMsg', 'กรุณากรอกอีเมลและรหัสผ่าน');
    return;
  }

  const btn = document.getElementById('loginBtn');
  btn.disabled     = true;
  btn.textContent  = 'กำลังเข้าสู่ระบบ...';

  try {
    const res  = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (data.success && data.requires2FA) {
      // 2FA enabled → เก็บ tempToken แล้วแสดง OTP form
      _pendingTempToken = data.tempToken;
      switchAuthTab('otp');
      return;
    }

    if (data.success) {
      localStorage.setItem('accdee_token', data.token);
      localStorage.setItem('accdee_user',  JSON.stringify(data.data));
      closeAuth();
      updateNavbar(data.data);
      showToast('เข้าสู่ระบบสำเร็จ! ยินดีต้อนรับ ' + data.data.username);
    } else {
      showAuthMsg('loginMsg', data.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }
  } catch (err) {
    showAuthMsg('loginMsg', 'ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'เข้าสู่ระบบ';
  }
}

// OTP Verification — เรียก POST /api/auth/verify-otp
async function doVerifyOtp() {
  const otp = (document.getElementById('otpCode').value || '').trim();
  if (!otp || otp.length !== 6) {
    showAuthMsg('otpMsg', 'กรุณากรอก OTP 6 หลัก');
    return;
  }
  if (!_pendingTempToken) {
    showAuthMsg('otpMsg', 'Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
    switchAuthTab('login');
    return;
  }

  const btn = document.getElementById('otpBtn');
  btn.disabled    = true;
  btn.textContent = 'กำลังยืนยัน...';

  try {
    const res  = await fetch(`${API_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tempToken: _pendingTempToken, otp })
    });
    const data = await res.json();

    if (data.success) {
      _pendingTempToken = null;
      localStorage.setItem('accdee_token', data.token);
      localStorage.setItem('accdee_user',  JSON.stringify(data.data));
      closeAuth();
      updateNavbar(data.data);
      showToast('เข้าสู่ระบบสำเร็จ! ยินดีต้อนรับ ' + data.data.username);
    } else {
      showAuthMsg('otpMsg', data.message || 'OTP ไม่ถูกต้อง');
    }
  } catch (err) {
    showAuthMsg('otpMsg', 'ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'ยืนยัน OTP';
  }
}

// Register — เรียก POST /api/auth/register
async function doRegister() {
  const username = document.getElementById('regUsername').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;

  // ตรวจสอบเบื้องต้นฝั่ง frontend
  if (!username || !email || !password) {
    showAuthMsg('registerMsg', 'กรุณากรอกข้อมูลให้ครบทุกช่อง');
    return;
  }
  if (password.length < 6) {
    showAuthMsg('registerMsg', 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
    return;
  }

  // ตรวจรูปแบบ email ฝั่ง frontend ก่อนส่ง API
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showAuthMsg('registerMsg', 'รูปแบบอีเมลไม่ถูกต้อง เช่น user@gmail.com');
    return;
  }

  const btn = document.getElementById('registerBtn');
  btn.disabled    = true;
  btn.textContent = 'กำลังสมัครสมาชิก...';

  try {
    const res  = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();

    if (data.success) {
      showAuthMsg('registerMsg', 'สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ', 'success');
      // เปลี่ยนไป tab login หลัง 1.5 วินาที
      setTimeout(() => switchAuthTab('login'), 1500);
    } else {
      showAuthMsg('registerMsg', data.message || 'สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่');
    }
  } catch (err) {
    showAuthMsg('registerMsg', 'ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'สมัครสมาชิก';
  }
}

// ส่งลิงก์รีเซ็ตรหัสผ่าน
async function doForgotPassword() {
  const email = document.getElementById('forgotEmail').value.trim();
  if (!email) {
    showAuthMsg('forgotMsg', 'กรุณากรอกอีเมลของคุณ');
    return;
  }

  const btn = document.getElementById('forgotBtn');
  btn.disabled    = true;
  btn.textContent = 'กำลังส่ง...';

  try {
    const res  = await fetch(`${API_URL}/auth/forgot-password`, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ email })
    });
    const data = await res.json();

    if (data.success) {
      showAuthMsg('forgotMsg', '✅ ส่งลิงก์แล้ว! ตรวจสอบอีเมลของคุณ (รวมถึงกล่อง spam)', 'success');
    } else {
      showAuthMsg('forgotMsg', data.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    }
  } catch (err) {
    showAuthMsg('forgotMsg', 'ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'ส่งลิงก์รีเซ็ต';
  }
}

// Logout — ลบ token ออกจาก localStorage
function doLogout() {
  localStorage.removeItem('accdee_token');
  localStorage.removeItem('accdee_user');
  updateNavbar(null);
  showToast('ออกจากระบบแล้ว');
}

// ── 4. NAVBAR AUTH STATE ────────────────────────

// อัปเดต navbar ตามสถานะ login
// user = null หมายถึงยังไม่ได้ login
function updateNavbar(user) {
  const guestNav = document.getElementById('guestNav');
  const userNav  = document.getElementById('userNav');

  if (user) {
    guestNav.style.display = 'none';
    userNav.style.display  = 'flex';
    document.getElementById('navUsername').textContent = user.username;
    document.getElementById('navBalance').textContent  = parseFloat(user.balance || 0).toFixed(2);
    // อัปเดต drawer ด้วย
    const dg = document.getElementById('drawerGuest');
    const du = document.getElementById('drawerUser');
    if (dg) dg.style.display = 'none';
    if (du) {
      du.style.display = 'block';
      document.getElementById('drawerBalance').textContent  = parseFloat(user.balance || 0).toFixed(2);
      document.getElementById('drawerUsername').textContent = user.username;
    }
  } else {
    guestNav.style.display = 'flex';
    userNav.style.display  = 'none';
    const dg = document.getElementById('drawerGuest');
    const du = document.getElementById('drawerUser');
    if (dg) dg.style.display = 'block';
    if (du) du.style.display = 'none';
  }
}

// ตรวจสอบ token ใน localStorage เมื่อโหลดหน้า
// ถ้า token หมดอายุ → logout อัตโนมัติ
function checkAuth() {
  const token = localStorage.getItem('accdee_token');
  const user  = JSON.parse(localStorage.getItem('accdee_user') || 'null');
  if (!token || !user) return;

  // ถอดรหัส JWT เพื่อดูวันหมดอายุ (ไม่ต้องส่งไป server)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const isExpired = payload.exp * 1000 < Date.now();
    if (isExpired) {
      doLogout(); // token หมดอายุ → logout ทันที
      return;
    }
  } catch {
    doLogout(); // token รูปแบบผิด → logout ทันที
    return;
  }

  updateNavbar(user);
  refreshBalance(); // fetch balance จริงจาก server ทันที
}

// fetch balance ล่าสุดจาก server แล้วอัปเดต UI + localStorage
async function refreshBalance() {
  const token = localStorage.getItem('accdee_token');
  const user  = JSON.parse(localStorage.getItem('accdee_user') || 'null');
  if (!token || !user) return;
  try {
    const res  = await fetch(`${API_URL}/wallet/info`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) return;
    const data = await res.json();
    if (!data.success) return;

    const newBalance = parseFloat(data.data.balance || 0).toFixed(2);
    user.balance = newBalance;
    localStorage.setItem('accdee_user', JSON.stringify(user));

    // อัปเดต UI
    const nb = document.getElementById('navBalance');
    const db = document.getElementById('drawerBalance');
    if (nb) nb.textContent = newBalance;
    if (db) db.textContent = newBalance;
  } catch { /* silent */ }
}

// ── 5. PRODUCT MODAL ────────────────────────────

function openModal(id) {
  const p = products[id];
  if (!p) return;
  document.getElementById('modalContent').innerHTML = `
    <div class="modal-product-icon">${p.icon}</div>
    <div style="font-size:0.72rem;font-weight:700;letter-spacing:2px;color:var(--neon-blue);text-transform:uppercase;margin-bottom:6px">${p.platform}</div>
    <div class="modal-title">${p.title}</div>
    <div class="modal-price">${p.price}</div>
    <div class="modal-desc" style="white-space:pre-line">${p.desc}</div>
    <div class="modal-actions">
      <button class="btn-primary" onclick="handleBuy('${id}')">สั่งซื้อเลย</button>
      <button class="btn-ghost" onclick="closeModal()">ปิด</button>
    </div>
  `;
  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function closeModalOuter(e) {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
}

// ปุ่มสั่งซื้อ — ซื้อจากหน้าแรกได้เลย ไม่ต้องไปหน้าร้าน
async function handleBuy(productId) {
  const token = localStorage.getItem('accdee_token');

  if (!token) {
    closeModal();
    openAuth('login');
    showToast('กรุณาเข้าสู่ระบบก่อนสั่งซื้อ', 'error');
    return;
  }

  const p   = products[productId];
  const btn = document.querySelector('#modalContent .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'กำลังดำเนินการ...'; }

  try {
    const res  = await fetch(`${API_URL}/shop/buy`, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body   : JSON.stringify({ productKey: p.productKey })
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'เกิดข้อผิดพลาด');

    const d = data.data;

    // อัปเดต balance บน navbar
    const balEl = document.getElementById('navBalance');
    if (balEl) balEl.textContent = parseFloat(d.newBalance).toFixed(2);
    const user = JSON.parse(localStorage.getItem('accdee_user') || 'null');
    if (user) { user.balance = d.newBalance; localStorage.setItem('accdee_user', JSON.stringify(user)); }

    // แสดงผลสำเร็จในโมดอลเดิม
    document.getElementById('modalContent').innerHTML = `
      <div style="text-align:center">
        <div style="font-size:3rem;margin-bottom:8px">✅</div>
        <div class="modal-title" style="margin-bottom:8px">สั่งซื้อสำเร็จ!</div>
        <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:4px">สินค้า: <b>${d.productName}</b></p>
        <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:16px">ยอดคงเหลือ: <b style="color:#10b981">${d.newBalance} ฿</b></p>
        <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:8px">📋 ข้อมูลบัญชีของคุณ (แตะเพื่อ copy)</p>
        <div onclick="navigator.clipboard.writeText(this.dataset.text).then(()=>showToast('Copy สำเร็จ!'))"
             data-text="${d.credentials}"
             style="background:#0f172a;border:1px solid #334155;border-radius:8px;padding:12px;font-family:monospace;font-size:13px;color:#10b981;word-break:break-all;cursor:pointer;text-align:left;margin-bottom:16px">
          ${d.credentials}
        </div>
        <button class="btn-primary" onclick="closeModal()">ปิด</button>
      </div>
    `;
  } catch (err) {
    if (btn) { btn.disabled = false; btn.textContent = 'สั่งซื้อเลย'; }

    // ถ้าหมดสต็อก → เปลี่ยน modal เป็นหน้าติดต่อแทน
    if (err.message && err.message.includes('หมดสต็อก')) {
      document.getElementById('modalContent').innerHTML = `
        <div style="text-align:center">
          <div style="font-size:3rem;margin-bottom:8px">😔</div>
          <div class="modal-title" style="margin-bottom:8px">สินค้าหมดชั่วคราว</div>
          <p style="color:#a78bfa;font-weight:600;margin-bottom:4px">${p.title}</p>
          <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:20px">
            ติดต่อแอดมินเพื่อสั่งจองหรือสอบถาม<br>แอดมินจะเติมสต็อกให้โดยเร็ว 🚀
          </p>
          <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px">
            <a href="https://lin.ee/qpUaGmg" target="_blank" rel="noopener"
               style="display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;background:#06c755;color:#fff;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px">
              💬 ติดต่อผ่าน LINE OA
            </a>
            <a href="https://t.me/TheonXbot" target="_blank" rel="noopener"
               style="display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;background:#0ea5e9;color:#fff;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px">
              ✈️ ติดต่อผ่าน Telegram
            </a>
          </div>
          <button class="btn-ghost" onclick="closeModal()">ปิด</button>
        </div>
      `;
    } else {
      showToast(err.message, 'error');
    }
  }
}

// ── 6. CATEGORY FILTER ──────────────────────────

function filterCat(btn, cat) {
  document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.product-card').forEach(card => {
    card.style.display = (cat === 'all' || card.dataset.cat === cat) ? '' : 'none';
  });
}

// ── 6b. COUPON ──────────────────────────────────
async function useCoupon() {
  const code  = (document.getElementById('couponCode').value || '').trim().toUpperCase();
  const msgEl = document.getElementById('couponMsg');
  const token = localStorage.getItem('accdee_token');

  if (!code) { msgEl.style.color = '#ef4444'; msgEl.textContent = 'กรุณากรอกโค้ด'; return; }
  if (!token) { msgEl.style.color = '#ef4444'; msgEl.textContent = 'กรุณาเข้าสู่ระบบก่อน'; return; }

  msgEl.style.color = '#94a3b8'; msgEl.textContent = 'กำลังตรวจสอบ...';

  try {
    const res  = await fetch(`${API_URL}/wallet/coupon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ code })
    });
    const data = await res.json();

    if (data.success) {
      msgEl.style.color = '#10b981';
      msgEl.textContent = `✅ ${data.message}`;
      document.getElementById('couponCode').value = '';
      // อัปเดต balance
      const user = JSON.parse(localStorage.getItem('accdee_user') || 'null');
      if (user && data.data) {
        user.balance = (parseFloat(user.balance) + parseFloat(data.data.bonus)).toFixed(2);
        localStorage.setItem('accdee_user', JSON.stringify(user));
        const balEl = document.getElementById('navBalance');
        if (balEl) balEl.textContent = user.balance;
      }
    } else {
      msgEl.style.color = '#ef4444';
      msgEl.textContent = '❌ ' + data.message;
    }
  } catch {
    msgEl.style.color = '#ef4444';
    msgEl.textContent = 'เกิดข้อผิดพลาด กรุณาลองใหม่';
  }
}

// ── 7. TOAST NOTIFICATION ───────────────────────

// แสดงข้อความ popup ชั่วคราวที่ด้านล่าง
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className   = `toast ${type} show`;
  // ซ่อนอัตโนมัติหลัง 3 วินาที
  setTimeout(() => { toast.className = 'toast'; }, 3000);
}

// ── 8. SCROLL ANIMATIONS ────────────────────────

// ทำให้ card ค่อยๆ ปรากฏเมื่อ scroll ลงมาถึง
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity   = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.product-card, .feature-card, .contact-card, .stat-item').forEach(el => {
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease, border-color 0.3s, box-shadow 0.3s, background 0.3s';
    observer.observe(el);
  });
}

// ── 9. KEYBOARD SUPPORT ─────────────────────────

function initKeyboardSupport() {
  document.getElementById('loginPassword').addEventListener('keydown', e => {
    if (e.key === 'Enter') doLogin();
  });
  document.getElementById('regPassword').addEventListener('keydown', e => {
    if (e.key === 'Enter') doRegister();
  });
  document.getElementById('otpCode').addEventListener('keydown', e => {
    if (e.key === 'Enter') doVerifyOtp();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeModal(); closeAuth(); closeTopup(); closeDrawer(); closeProfile(); }
  });
}

// ── 12. COPY TO CLIPBOARD ──────────────────────

function copyText(elementId) {
  const text = document.getElementById(elementId).textContent.trim();
  navigator.clipboard.writeText(text).then(() => showToast('คัดลอกแล้ว: ' + text));
}

// ── 13. MOBILE DRAWER ──────────────────────────

function toggleDrawer() {
  const drawer = document.getElementById('navDrawer');
  const isOpen = drawer.classList.toggle('open');
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

function closeDrawer() {
  document.getElementById('navDrawer').classList.remove('open');
  document.body.style.overflow = '';
}

// ── 10. INIT (รันเมื่อหน้าโหลดเสร็จ) ────────────

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();             // ตรวจสอบสถานะ login
  initScrollAnimations();  // เปิด scroll animations
  initKeyboardSupport();   // เปิด keyboard shortcuts
  initTopupEvents();       // เปิด event สำหรับ topup modal
  loadSiteSettings();      // โหลดค่าตั้งค่าจาก DB (alert, contact links)

  // refresh balance ทุก 30 วิ — ลูกค้าเห็นยอดล่าสุดหลัง admin อนุมัติ
  setInterval(refreshBalance, 30000);
});

// ── 11. TOPUP MODAL (เติมเงินเข้า Wallet) ────────

// เปิด Topup Modal — ตรวจสอบ login ก่อนเสมอ
function openTopup() {
  const token = localStorage.getItem('accdee_token');
  if (!token) {
    openAuth('login');
    showToast('กรุณาเข้าสู่ระบบก่อนเติมเงิน', 'error');
    return;
  }

  // รีเซ็ต modal กลับสู่ Step 1 ทุกครั้งที่เปิด
  document.getElementById('topupStep1').style.display = 'block';
  document.getElementById('topupStep2').style.display = 'none';
  document.getElementById('topupAmount').value        = '';
  document.getElementById('topupNote').value          = '';
  document.getElementById('topupSlip').value          = '';
  document.getElementById('slipPreview').style.display = 'none';
  document.getElementById('topupMsg').textContent     = '';
  document.getElementById('topupMsg').className       = 'auth-msg';

  document.getElementById('topupOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';

  // โหลดข้อมูลช่องทางชำระเงินจาก API
  loadPaymentInfo();
}

// ปิด Topup Modal
function closeTopup() {
  document.getElementById('topupOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ปิดเมื่อคลิกพื้นหลัง (นอก modal)
function closeTopupOuter(e) {
  if (e.target === document.getElementById('topupOverlay')) closeTopup();
}

// โหลดข้อมูลธนาคาร / พร้อมเพย์จาก server
async function loadPaymentInfo() {
  try {
    const res  = await fetch(`${API_URL}/wallet/payment-info`);
    const data = await res.json();
    if (data.success) {
      document.getElementById('payPromptpay').textContent    = data.data.promptpay        || '-';
      document.getElementById('payBank').textContent         = data.data.bankName          || '-';
      document.getElementById('payAccountNum').textContent   = data.data.bankAccount       || '-';
      document.getElementById('payAccountName').textContent  = data.data.bankAccountName   || '-';
    }
  } catch (err) {
    console.error('โหลดข้อมูลชำระเงินไม่สำเร็จ:', err);
  }
}

// ส่งคำขอเติมเงิน — POST /api/wallet/topup
async function submitTopup() {
  const token  = localStorage.getItem('accdee_token');
  const amount = document.getElementById('topupAmount').value;
  const slip   = document.getElementById('topupSlip').files[0];
  const note   = document.getElementById('topupNote').value.trim();
  const msgEl  = document.getElementById('topupMsg');

  // ล้าง error เก่า
  msgEl.textContent = '';
  msgEl.className   = 'auth-msg';

  // ตรวจสอบฝั่ง frontend ก่อนส่ง
  if (!amount || parseFloat(amount) < 10) {
    msgEl.textContent = 'กรุณากรอกจำนวนเงินขั้นต่ำ 10 บาท';
    msgEl.className   = 'auth-msg error';
    return;
  }
  if (!slip) {
    msgEl.textContent = 'กรุณาแนบสลิปการโอนเงิน';
    msgEl.className   = 'auth-msg error';
    return;
  }

  const btn = document.getElementById('topupBtn');
  btn.disabled    = true;
  btn.textContent = 'กำลังส่งคำขอ...';

  try {
    // ใช้ FormData เพราะต้องส่งทั้งข้อความ + ไฟล์รูป
    const formData = new FormData();
    formData.append('amount', amount);
    formData.append('slip',   slip);
    formData.append('note',   note);

    const res  = await fetch(`${API_URL}/wallet/topup`, {
      method : 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      // ไม่ใส่ Content-Type เพราะ browser จะตั้ง boundary ให้อัตโนมัติ
      body   : formData
    });
    const data = await res.json();

    if (data.success) {
      // ส่งสำเร็จ → ไป Step 2
      document.getElementById('topupStep1').style.display = 'none';
      document.getElementById('topupStep2').style.display = 'block';
    } else {
      msgEl.textContent = data.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่';
      msgEl.className   = 'auth-msg error';
    }
  } catch (err) {
    msgEl.textContent = 'ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่';
    msgEl.className   = 'auth-msg error';
  } finally {
    btn.disabled    = false;
    btn.textContent = 'ส่งคำขอเติมเงิน';
  }
}

// ── 14. SITE SETTINGS (dynamic content from DB) ──

async function loadSiteSettings() {
  try {
    const res  = await fetch(`${API_URL}/wallet/site-settings`);
    const data = await res.json();
    if (!data.success) return;
    const s = data.data;

    // Alert banner
    const banner = document.getElementById('alertBanner');
    if (banner) {
      if (s.alert_active === '0') {
        banner.style.display = 'none';
      } else {
        if (s.alert_text) banner.textContent = s.alert_text;
        banner.style.display = '';
      }
    }

    // Contact links
    if (s.line_url) {
      const el = document.getElementById('contactLine');
      if (el) el.href = s.line_url;
    }
    if (s.telegram_url) {
      const el = document.getElementById('contactTelegram');
      if (el) el.href = s.telegram_url;
    }
    if (s.facebook_url) {
      const el = document.getElementById('contactFacebook');
      if (el && s.facebook_url !== '') el.href = s.facebook_url;
    }
  } catch (err) {
    // ถ้าโหลดไม่ได้ ใช้ค่า default ในหน้า HTML ต่อไป
    console.warn('loadSiteSettings failed, using defaults:', err.message);
  }
}

// ตั้งค่า event listeners สำหรับ topup
function initTopupEvents() {
  // แสดง preview รูปสลิปทันทีที่เลือกไฟล์
  document.getElementById('topupSlip').addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      document.getElementById('slipImg').src             = e.target.result;
      document.getElementById('slipPreview').style.display = 'block';
    };
    reader.readAsDataURL(file);
  });

  // กด Escape ปิด topup modal ด้วย
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeTopup();
  });
}

// ── 14. PROFILE MODAL ──────────────────────────

function openProfile() {
  const user = JSON.parse(localStorage.getItem('accdee_user') || 'null');
  if (!user) { openAuth('login'); return; }

  document.getElementById('profileEmail').textContent   = user.email    || '—';
  document.getElementById('profileBalance').textContent = '฿' + parseFloat(user.balance || 0).toFixed(2);
  document.getElementById('profileUsername').value      = user.username || '';
  document.getElementById('profileCurrentPw').value     = '';
  document.getElementById('profileNewPw').value         = '';
  document.getElementById('profileUsernameMsg').textContent = '';
  document.getElementById('profilePasswordMsg').textContent = '';

  document.getElementById('profileOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeProfile() {
  document.getElementById('profileOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function closeProfileOuter(e) {
  if (e.target === document.getElementById('profileOverlay')) closeProfile();
}

async function saveUsername() {
  const username = document.getElementById('profileUsername').value.trim();
  const msgEl    = document.getElementById('profileUsernameMsg');
  const btn      = document.getElementById('profileUsernameBtn');
  const token    = localStorage.getItem('accdee_token');

  msgEl.textContent = '';
  msgEl.className   = 'auth-msg';

  if (!username) { msgEl.textContent = 'กรุณากรอกชื่อผู้ใช้'; msgEl.className = 'auth-msg error'; return; }

  btn.disabled = true; btn.textContent = 'กำลังบันทึก...';
  try {
    const res  = await fetch(`${API_URL}/profile/username`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ username })
    });
    const data = await res.json();
    if (data.success) {
      msgEl.textContent = data.message;
      msgEl.className   = 'auth-msg success';
      // อัปเดต localStorage + navbar
      const user = JSON.parse(localStorage.getItem('accdee_user') || '{}');
      user.username = data.username;
      localStorage.setItem('accdee_user', JSON.stringify(user));
      document.getElementById('navUsername').textContent    = data.username;
      document.getElementById('drawerUsername').textContent = data.username;
    } else {
      msgEl.textContent = data.message;
      msgEl.className   = 'auth-msg error';
    }
  } catch { msgEl.textContent = 'เชื่อมต่อไม่ได้'; msgEl.className = 'auth-msg error'; }
  finally { btn.disabled = false; btn.textContent = 'บันทึกชื่อผู้ใช้'; }
}

async function savePassword() {
  const currentPw = document.getElementById('profileCurrentPw').value;
  const newPw     = document.getElementById('profileNewPw').value;
  const msgEl     = document.getElementById('profilePasswordMsg');
  const btn       = document.getElementById('profilePasswordBtn');
  const token     = localStorage.getItem('accdee_token');

  msgEl.textContent = '';
  msgEl.className   = 'auth-msg';

  if (!currentPw || !newPw) { msgEl.textContent = 'กรุณากรอกข้อมูลให้ครบ'; msgEl.className = 'auth-msg error'; return; }
  if (newPw.length < 8)     { msgEl.textContent = 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร'; msgEl.className = 'auth-msg error'; return; }

  btn.disabled = true; btn.textContent = 'กำลังเปลี่ยน...';
  try {
    const res  = await fetch(`${API_URL}/profile/change-password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw })
    });
    const data = await res.json();
    if (data.success) {
      msgEl.textContent = data.message;
      msgEl.className   = 'auth-msg success';
      document.getElementById('profileCurrentPw').value = '';
      document.getElementById('profileNewPw').value     = '';
    } else {
      msgEl.textContent = data.message;
      msgEl.className   = 'auth-msg error';
    }
  } catch { msgEl.textContent = 'เชื่อมต่อไม่ได้'; msgEl.className = 'auth-msg error'; }
  finally { btn.disabled = false; btn.textContent = 'เปลี่ยนรหัสผ่าน'; }
}
