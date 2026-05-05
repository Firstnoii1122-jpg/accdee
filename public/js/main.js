// ================================================
// main.js — ACCDEE Frontend JavaScript
// แก้ไข JS ที่นี่ได้เลย แบ่งเป็นหมวดชัดเจน
// ================================================

// ── 1. CONFIG ──────────────────────────────────
// ใช้ /api เพราะ frontend และ backend อยู่ server เดียวกัน
const API_URL = '/api';

// ── 2. สินค้าทั้งหมด (Product Data) ───────────
const products = {
  'fb-blank': {
    icon: '📘', platform: 'Facebook',
    title: 'บัญชี Facebook เปล่า', price: '50 ฿',
    desc: 'บัญชี Facebook ใหม่ ไม่มีแฟนเพจ ผ่านการตรวจสอบคุณภาพ พร้อมใช้งานทันที\n\n• ส่งทันทีหลังชำระเงิน\n• รับประกันบัญชีสามารถเข้าใช้งานได้\n• รองรับการสร้างแฟนเพจใหม่'
  },
  'fb-10page': {
    icon: '📘', platform: 'Facebook',
    title: 'บัญชี Facebook พร้อม 10 แฟนเพจ', price: '100 ฿',
    desc: 'บัญชี Facebook ที่มีแฟนเพจครบ 10 เพจ เหมาะสำหรับงานโฆษณา Facebook Ads\n\n• 10 แฟนเพจพร้อมใช้\n• ส่งทันทีหลังชำระเงิน\n• เหมาะสำหรับโฆษณา Facebook'
  },
  'fb-5page': {
    icon: '📘', platform: 'Facebook',
    title: 'บัญชี Facebook พร้อม 5 แฟนเพจ', price: '50 ฿',
    desc: 'บัญชี Facebook ที่มีแฟนเพจ 5 เพจ ราคาสุดคุ้ม เหมาะสำหรับผู้เริ่มต้น\n\n• 5 แฟนเพจพร้อมใช้\n• ส่งทันทีหลังชำระเงิน\n• ราคาประหยัด'
  },
  'tw-1k': {
    icon: '🐦', platform: 'Twitter (X)',
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

// เปลี่ยน tab Login <-> Register
function switchAuthTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('formLogin').style.display    = isLogin ? 'block' : 'none';
  document.getElementById('formRegister').style.display = isLogin ? 'none'  : 'block';
  document.getElementById('tabLogin').classList.toggle('active', isLogin);
  document.getElementById('tabRegister').classList.toggle('active', !isLogin);
  clearAuthMsg();
}

// ล้างข้อความ error ทั้งหมด
function clearAuthMsg() {
  document.getElementById('loginMsg').className    = 'auth-msg';
  document.getElementById('loginMsg').textContent  = '';
  document.getElementById('registerMsg').className   = 'auth-msg';
  document.getElementById('registerMsg').textContent = '';
}

// แสดงข้อความใน auth modal
function showAuthMsg(id, text, type = 'error') {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className   = `auth-msg ${type}`;
}

// Login — เรียก POST /api/auth/login
async function doLogin() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  // ตรวจสอบเบื้องต้นฝั่ง frontend
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

    if (data.success) {
      // บันทึก token และข้อมูล user ลง localStorage
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

// ปุ่มสั่งซื้อ — ตรวจสอบว่า login แล้วหรือยัง
function handleBuy(productId) {
  const token = localStorage.getItem('accdee_token');

  if (!token) {
    // ยังไม่ login — ปิด product modal แล้วเปิด auth modal
    closeModal();
    openAuth('login');
    showToast('กรุณาเข้าสู่ระบบก่อนสั่งซื้อ', 'error');
    return;
  }

  // login แล้ว → ไปที่หน้าร้านค้าเพื่อซื้อ
  window.location.href = '/shop.html';
}

// ── 6. CATEGORY FILTER ──────────────────────────

function filterCat(btn, cat) {
  document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.product-card').forEach(card => {
    card.style.display = (cat === 'all' || card.dataset.cat === cat) ? '' : 'none';
  });
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
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeModal(); closeAuth(); closeTopup(); closeDrawer(); }
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
