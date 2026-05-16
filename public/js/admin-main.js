// ===== HELPERS =====
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmt(num) {
  if (num == null) return '0.00';
  return parseFloat(num).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function toast(msg, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    document.body.appendChild(container);
  }
  const el = document.createElement('div');
  const bg = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6366f1';
  el.style.cssText = `background:${bg};color:#fff;padding:10px 18px;border-radius:8px;font-size:14px;font-family:'Sarabun',sans-serif;box-shadow:0 4px 12px rgba(0,0,0,.15)`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ===== PAGE NAVIGATION =====
function showPage(id, menuEl) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
  const el = document.getElementById('page-' + id);
  if (el) el.classList.add('active');
  const titleMap = {
    dashboard: 'แดชบอร์ด',
    topups:    'คำขอเติมเงิน',
    history:   'ประวัติทั้งหมด',
    members:   'สมาชิก',
    products:  'จัดการสินค้า',
    inventory: 'สต็อก',
    orders:    'คำสั่งซื้อ',
    coupons:   'คูปอง',
    admins:    'จัดการแอดมิน',
    settings:  'ตั้งค่าเว็บไซต์'
  };
  document.getElementById('pageTitle').textContent = titleMap[id] || id;
  if (menuEl) menuEl.classList.add('active');
  if (id === 'topups')    loadPending();
  if (id === 'history')   loadHistory();
  if (id === 'members')   loadMembers();
  if (id === 'products')  loadProducts();
  if (id === 'inventory') loadInventory();
  if (id === 'orders')    loadOrders();
  if (id === 'coupons')   loadCoupons();
  if (id === 'admins')    loadAdmins();
  if (id === 'settings')  loadSettings();
  if (id === 'dashboard') loadDashboardStats();
}

// ===== CLOCK =====
function updateClock() {
  const el = document.getElementById('clockDisplay');
  if (el) el.textContent = new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'medium' });
}
setInterval(updateClock, 1000);
updateClock();

// ===== DASHBOARD STATS =====
async function loadDashboardStats() {
  try {
    const res = await API.get('/admin/stats');
    const d = res?.data || {};

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('statTotalMembers', (d.totalMembers || 0).toLocaleString('th-TH'));
    set('statNewToday',     (d.newToday     || 0).toLocaleString('th-TH'));
    set('statPending',      (d.pendingCount || 0).toLocaleString('th-TH'));
    set('statTopupToday',   '฿' + fmt(d.topupToday || 0));

    const badge = document.getElementById('pendingBadge');
    if (badge) badge.textContent = d.pendingCount || 0;

    const tbody = document.getElementById('recentTx');
    if (!tbody) return;
    if (!d.recentTransactions?.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#9ca3af;padding:16px">ยังไม่มีรายการ</td></tr>';
      return;
    }
    tbody.innerHTML = d.recentTransactions.map(tx => {
      const isPending = tx.status === 'pending';
      const isApproved = tx.status === 'approved';
      const statusBadge = isPending
        ? '<span class="badge badge-warning">รออนุมัติ</span>'
        : isApproved
          ? '<span class="badge badge-success">อนุมัติแล้ว</span>'
          : '<span class="badge badge-danger">ปฏิเสธ</span>';
      return `<tr>
        <td>${new Date(tx.created_at).toLocaleString('th-TH')}</td>
        <td>${escapeHtml(tx.username)}</td>
        <td>${escapeHtml(tx.email)}</td>
        <td class="text-success fw-bold">฿${fmt(tx.amount)}</td>
        <td>${statusBadge}</td>
      </tr>`;
    }).join('');
  } catch (err) {
    console.error('loadDashboardStats error:', err);
  }
}

// ===== PENDING TOPUPS =====
async function loadPending() {
  const tbody = document.getElementById('pendingTable');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#9ca3af;padding:20px">กำลังโหลด...</td></tr>';
  try {
    const res  = await API.get('/admin/topups');
    const list = res?.data || [];

    const badge = document.getElementById('pendingBadge');
    if (badge) badge.textContent = list.length;

    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#9ca3af;padding:20px">ไม่มีรายการรออนุมัติ ✅</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(tx => `
      <tr id="pendingRow_${tx.id}">
        <td>${tx.id}</td>
        <td>${new Date(tx.created_at).toLocaleString('th-TH')}</td>
        <td><b>${escapeHtml(tx.username)}</b><br><span class="fs-sm" style="color:#6b7280">${escapeHtml(tx.email)}</span></td>
        <td class="text-success fw-bold">฿${fmt(tx.amount)}</td>
        <td>${tx.note ? escapeHtml(tx.note) : '<span style="color:#9ca3af">-</span>'}</td>
        <td>
          ${tx.slip_image
            ? `<img src="${escapeHtml(tx.slip_image)}" onclick="openSlip('${escapeHtml(tx.slip_image)}')" style="width:48px;height:48px;object-fit:cover;border-radius:6px;cursor:pointer;border:1px solid #e5e7eb" onerror="this.style.display='none'">`
            : '<span style="color:#9ca3af">-</span>'}
        </td>
        <td>
          <div style="display:flex;gap:6px">
            <button class="btn btn-success btn-sm" onclick="approveTx(${tx.id})">✓ Approve</button>
            <button class="btn btn-danger btn-sm"  onclick="rejectTx(${tx.id})">✕ Reject</button>
          </div>
        </td>
      </tr>`
    ).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#ef4444;padding:20px">โหลดข้อมูลไม่สำเร็จ</td></tr>';
    console.error('loadPending error:', err);
  }
}

async function approveTx(id) {
  if (!confirm(`อนุมัติคำขอ #${id} เติมเงินให้ผู้ใช้?`)) return;
  try {
    const res = await API.post(`/admin/topups/${id}/approve`, {});
    toast('✅ ' + res.message, 'success');
    document.getElementById(`pendingRow_${id}`)?.remove();
    loadDashboardStats();
    if (!document.querySelector('#pendingTable tr[id^="pendingRow_"]')) loadPending();
  } catch (err) {
    toast('❌ ' + err.message, 'error');
  }
}

async function rejectTx(id) {
  if (!confirm(`ปฏิเสธคำขอ #${id}?`)) return;
  try {
    const res = await API.post(`/admin/topups/${id}/reject`, {});
    toast('❌ ' + res.message, 'info');
    document.getElementById(`pendingRow_${id}`)?.remove();
    loadDashboardStats();
    if (!document.querySelector('#pendingTable tr[id^="pendingRow_"]')) loadPending();
  } catch (err) {
    toast('❌ ' + err.message, 'error');
  }
}

// ===== HISTORY =====
async function loadHistory() {
  const tbody = document.getElementById('historyTable');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#9ca3af;padding:20px">กำลังโหลด...</td></tr>';
  try {
    const res  = await API.get('/admin/topups/history');
    const list = res?.data || [];
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#9ca3af;padding:20px">ยังไม่มีประวัติ</td></tr>';
      return;
    }
    tbody.innerHTML = list.map((tx, i) => {
      const isPending = tx.status === 'pending';
      const isApproved = tx.status === 'approved';
      const statusBadge = isPending
        ? '<span class="badge badge-warning">รออนุมัติ</span>'
        : isApproved
          ? '<span class="badge badge-success">อนุมัติแล้ว</span>'
          : '<span class="badge badge-danger">ปฏิเสธ</span>';
      return `<tr>
        <td>${i + 1}</td>
        <td>${new Date(tx.created_at).toLocaleString('th-TH')}</td>
        <td><b>${escapeHtml(tx.username)}</b></td>
        <td class="text-success fw-bold">฿${fmt(tx.amount)}</td>
        <td>${statusBadge}</td>
        <td>${tx.note ? escapeHtml(tx.note) : '-'}</td>
        <td>
          ${tx.slip_image
            ? `<img src="${escapeHtml(tx.slip_image)}" onclick="openSlip('${escapeHtml(tx.slip_image)}')" style="width:36px;height:36px;object-fit:cover;border-radius:4px;cursor:pointer" onerror="this.style.display='none'">`
            : '-'}
        </td>
      </tr>`;
    }).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#ef4444;padding:20px">โหลดข้อมูลไม่สำเร็จ</td></tr>';
  }
}

// ===== MEMBERS =====
async function loadMembers(search = '') {
  const tbody = document.getElementById('memberTableBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#9ca3af;padding:20px">กำลังโหลด...</td></tr>';
  try {
    let url = '/admin/members';
    if (search) url += '?search=' + encodeURIComponent(search);
    const res  = await API.get(url);
    const list = res?.data || [];
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#9ca3af;padding:20px">ไม่มีสมาชิก</td></tr>';
      return;
    }
    tbody.innerHTML = list.map((m, i) => `
      <tr data-member-id="${m.id}">
        <td>${i + 1}</td>
        <td><b>${escapeHtml(m.username)}</b></td>
        <td>${escapeHtml(m.email)}</td>
        <td class="fw-bold text-success">฿${fmt(m.balance)}</td>
        <td>${new Date(m.created_at).toLocaleDateString('th-TH')}</td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="adjustCredit(${m.id})">💰 ปรับยอด</button>
          <button class="btn btn-warning btn-sm" onclick="openResetPassword(${m.id},'${escapeHtml(m.username)}')">🔑 รีเซ็ตรหัส</button>
          <button class="btn btn-outline btn-sm" style="border-color:#a78bfa;color:#a78bfa" onclick="promoteToAdmin(${m.id},'${escapeHtml(m.username)}')">👑 Promote</button>
          <button class="btn btn-danger btn-sm" onclick="deleteMember(${m.id},'${escapeHtml(m.username)}')">🗑️ ลบ</button>
        </td>
      </tr>`
    ).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#ef4444;padding:20px">โหลดข้อมูลไม่สำเร็จ</td></tr>';
  }
}

function searchMembers() {
  const search = document.getElementById('memberSearchInput')?.value || '';
  loadMembers(search);
}

function exportMembers() {
  const rows = document.querySelectorAll('#memberTableBody tr');
  if (!rows.length || rows[0].querySelector('td[colspan]')) { toast('ไม่มีข้อมูลให้ส่งออก', 'error'); return; }
  const headers = ['#', 'ยูสเซอร์', 'อีเมล', 'ยอดเงิน (฿)', 'วันที่สมัคร'];
  const csv = [
    headers.join(','),
    ...Array.from(rows).map(row => {
      const cells = row.querySelectorAll('td');
      return [cells[0], cells[1], cells[2], cells[3], cells[4]]
        .map(c => `"${(c?.textContent || '').trim()}"`)
        .join(',');
    })
  ].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `members_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  toast('✅ ส่งออกสำเร็จ', 'success');
}

// ===== ADJUST CREDIT MODAL =====
function adjustCredit(memberId) {
  const row = document.querySelector(`tr[data-member-id="${memberId}"]`);
  if (!row) return;
  const cells = row.querySelectorAll('td');
  document.getElementById('creditMemberId').value        = memberId;
  document.getElementById('creditMemberUsername').textContent = cells[1]?.textContent?.trim() || '';
  document.getElementById('creditCurrentBalance').textContent = cells[3]?.textContent?.trim() || '0';
  document.getElementById('creditAmount').value          = '';
  document.getElementById('creditType').value            = 'deposit';
  document.getElementById('creditNote').value            = '';
  document.getElementById('adjustCreditModal').classList.add('show');
}

async function saveCredit() {
  const memberId = document.getElementById('creditMemberId').value;
  const amount   = document.getElementById('creditAmount').value?.trim();
  const type     = document.getElementById('creditType').value;
  const note     = document.getElementById('creditNote').value?.trim();

  if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
    alert('กรุณากรอกจำนวนเงินที่ถูกต้อง'); return;
  }

  try {
    const res = await API.post(`/admin/members/${memberId}/credit`, { amount: parseFloat(amount), type, note });
    toast('✅ ' + res.message, 'success');
    document.getElementById('adjustCreditModal').classList.remove('show');
    loadMembers(document.getElementById('memberSearchInput')?.value || '');
  } catch (err) {
    toast('❌ ' + err.message, 'error');
  }
}

// ===== SLIP LIGHTBOX =====
function openSlip(src) {
  document.getElementById('lightboxImg').src = src;
  document.getElementById('slipLightbox').classList.add('open');
}
function closeSlip() {
  document.getElementById('slipLightbox').classList.remove('open');
}

// ===== PRODUCTS =====
async function loadProducts() {
  const tbody = document.getElementById('productsTable');
  if (!tbody) return;
  try {
    const res  = await API.get('/admin/products');
    const list = res?.data || [];
    tbody.innerHTML = list.length
      ? list.map(p => `<tr>
          <td><code>${escapeHtml(p.product_key)}</code></td>
          <td><b>${escapeHtml(p.name)}</b></td>
          <td style="color:#9ca3af">${p.description ? escapeHtml(p.description) : '-'}</td>
          <td class="text-success fw-bold">฿${fmt(p.price)}</td>
          <td>${parseInt(p.stock) > 0 ? `<span class="badge badge-success">${p.stock} ชิ้น</span>` : '<span class="badge badge-danger">หมด</span>'}</td>
          <td>
            <button class="btn btn-outline btn-sm" onclick="openEditProduct('${escapeHtml(p.product_key)}','${escapeHtml(p.name).replace(/'/g,"\\'")}','${escapeHtml(p.description||'').replace(/'/g,"\\'")}',${parseFloat(p.price)},${p.is_active})">✏️ แก้ไข</button>
            <button class="btn btn-danger btn-sm" onclick="deleteProduct('${escapeHtml(p.product_key)}')">ลบ</button>
          </td>
        </tr>`).join('')
      : '<tr><td colspan="6" style="text-align:center;color:#9ca3af;padding:16px">ยังไม่มีสินค้า กด "+ เพิ่มสินค้า" ได้เลย</td></tr>';
  } catch (err) {
    console.error('loadProducts error:', err);
  }
}

async function saveProduct() {
  const productKey  = document.getElementById('prdKey')?.value.trim().toLowerCase();
  const name        = document.getElementById('prdName')?.value.trim();
  const description = document.getElementById('prdDesc')?.value.trim();
  const price       = document.getElementById('prdPrice')?.value;

  if (!productKey || !name || !price) { toast('กรุณากรอกข้อมูลให้ครบ', 'error'); return; }
  if (/\s/.test(productKey))           { toast('Product key ห้ามมีช่องว่าง', 'error'); return; }

  try {
    const res = await API.post('/admin/products', { productKey, name, description, price: parseFloat(price) });
    toast('✅ ' + res.message, 'success');
    document.getElementById('addProductModal').classList.remove('show');
    ['prdKey','prdName','prdDesc','prdPrice'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
    loadProducts();
  } catch (err) {
    toast('❌ ' + err.message, 'error');
  }
}

async function deleteProduct(key) {
  if (!confirm(`ลบสินค้า "${key}"?\n(สต็อกที่มีอยู่จะยังคงอยู่ แต่จะซื้อไม่ได้)`)) return;
  try {
    const res = await API.del(`/admin/products/${key}`);
    toast('✅ ' + res.message, 'success');
    loadProducts();
  } catch (err) {
    toast('❌ ' + err.message, 'error');
  }
}

// ===== INVENTORY =====
async function loadInventory() {
  try {
    const [stockRes, invRes] = await Promise.all([
      API.get('/admin/inventory/stock'),
      API.get('/admin/inventory')
    ]);

    // สรุปสต็อก
    const stock = stockRes?.data || [];
    const stockEl = document.getElementById('stockSummary');
    if (stockEl) {
      stockEl.innerHTML = stock.length
        ? stock.map(s => `<tr>
            <td><b>${escapeHtml(s.product_key)}</b></td>
            <td>${s.total}</td>
            <td class="text-success fw-bold">${s.available}</td>
            <td style="color:#9ca3af">${s.sold}</td>
          </tr>`).join('')
        : '<tr><td colspan="4" style="text-align:center;color:#9ca3af;padding:16px">ยังไม่มีสต็อก</td></tr>';
    }

    // รายการทั้งหมด
    const inv = invRes?.data || [];
    const invEl = document.getElementById('inventoryTable');
    if (invEl) {
      invEl.innerHTML = inv.length
        ? inv.map((item, i) => `<tr>
            <td>${i + 1}</td>
            <td><b>${escapeHtml(item.product_key)}</b></td>
            <td style="font-family:monospace;font-size:12px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${item.status === 'sold' ? '—' : escapeHtml(item.credentials)}</td>
            <td>${item.status === 'available' ? '<span class="badge badge-success">ว่าง</span>' : '<span class="badge badge-danger">ขายแล้ว</span>'}</td>
            <td>${new Date(item.added_at).toLocaleDateString('th-TH')}</td>
            <td>${item.status === 'available' ? `<button class="btn btn-danger btn-sm" onclick="deleteInv(${item.id})">ลบ</button>` : ''}</td>
          </tr>`).join('')
        : '<tr><td colspan="6" style="text-align:center;color:#9ca3af;padding:16px">ยังไม่มีสต็อก</td></tr>';
    }
  } catch (err) {
    console.error('loadInventory error:', err);
  }
}

async function saveInventory() {
  const productKey  = document.getElementById('invProductKey')?.value.trim().toLowerCase();
  const credentials = document.getElementById('invCredentials')?.value.trim();
  if (!productKey || !credentials) { toast('กรุณากรอกข้อมูลให้ครบ', 'error'); return; }
  if (/\s/.test(productKey)) { toast('product key ห้ามมีช่องว่าง', 'error'); return; }
  try {
    const res = await API.post('/admin/inventory', { productKey, credentials });
    toast('✅ ' + res.message, 'success');
    document.getElementById('addInventoryModal').classList.remove('show');
    document.getElementById('invProductKey').value  = '';
    document.getElementById('invCredentials').value = '';
    loadInventory();
  } catch (err) {
    toast('❌ ' + err.message, 'error');
  }
}

async function deleteInv(id) {
  if (!confirm('ลบสต็อกรายการนี้?')) return;
  try {
    const res = await API.del(`/admin/inventory/${id}`);
    toast('✅ ' + res.message, 'success');
    loadInventory();
  } catch (err) {
    toast('❌ ' + err.message, 'error');
  }
}

// ===== ORDERS =====
async function loadOrders() {
  const tbody = document.getElementById('ordersTable');
  if (!tbody) return;
  try {
    const res  = await API.get('/admin/orders');
    const list = res?.data || [];
    tbody.innerHTML = list.length
      ? list.map((o, i) => `<tr>
          <td>${i + 1}</td>
          <td>${new Date(o.created_at).toLocaleString('th-TH')}</td>
          <td><b>${escapeHtml(o.username)}</b><br><span style="font-size:11px;color:#9ca3af">${escapeHtml(o.email)}</span></td>
          <td>${escapeHtml(o.product_name)}</td>
          <td class="text-success fw-bold">฿${fmt(o.amount)}</td>
        </tr>`).join('')
      : '<tr><td colspan="5" style="text-align:center;color:#9ca3af;padding:16px">ยังไม่มีคำสั่งซื้อ</td></tr>';
  } catch (err) {
    console.error('loadOrders error:', err);
  }
}

// ===== EDIT PRODUCT =====
function openEditProduct(key, name, desc, price, isActive) {
  document.getElementById('editPrdKey').value        = key;
  document.getElementById('editPrdKeyDisplay').value = key;
  document.getElementById('editPrdName').value       = name;
  document.getElementById('editPrdDesc').value       = desc;
  document.getElementById('editPrdPrice').value      = price;
  document.getElementById('editPrdActive').value     = isActive ? '1' : '0';
  document.getElementById('editProductModal').classList.add('show');
}

async function saveEditProduct() {
  const key      = document.getElementById('editPrdKey').value;
  const name     = document.getElementById('editPrdName').value.trim();
  const desc     = document.getElementById('editPrdDesc').value.trim();
  const price    = document.getElementById('editPrdPrice').value;
  const isActive = document.getElementById('editPrdActive').value;

  if (!name || !price) { toast('กรุณากรอกชื่อและราคา', 'error'); return; }
  try {
    const res = await API.put(`/admin/products/${key}`, { name, description: desc, price: parseFloat(price), is_active: parseInt(isActive) });
    toast('✅ ' + res.message, 'success');
    document.getElementById('editProductModal').classList.remove('show');
    loadProducts();
  } catch (err) {
    toast('❌ ' + err.message, 'error');
  }
}

// ===== COUPONS =====
async function loadCoupons() {
  const tbody = document.getElementById('couponsTable');
  if (!tbody) return;
  try {
    const res  = await API.get('/admin/coupons');
    const list = res?.data || [];
    tbody.innerHTML = list.length
      ? list.map(c => `<tr>
          <td><code>${escapeHtml(c.code)}</code></td>
          <td class="text-success fw-bold">฿${fmt(c.bonus_amount)}</td>
          <td>${c.used_count} / ${c.max_uses}</td>
          <td>${c.expires_at ? new Date(c.expires_at).toLocaleString('th-TH') : '<span style="color:#9ca3af">ไม่หมดอายุ</span>'}</td>
          <td>${c.is_active ? '<span class="badge badge-success">เปิด</span>' : '<span class="badge badge-danger">ปิด</span>'}</td>
          <td><button class="btn btn-danger btn-sm" onclick="deleteCoupon(${c.id},'${escapeHtml(c.code)}')">ลบ</button></td>
        </tr>`).join('')
      : '<tr><td colspan="6" style="text-align:center;color:#9ca3af;padding:16px">ยังไม่มีคูปอง</td></tr>';
  } catch (err) {
    console.error('loadCoupons error:', err);
  }
}

async function saveCoupon() {
  const code     = document.getElementById('cpnCode').value.trim().toUpperCase();
  const bonus    = document.getElementById('cpnBonus').value;
  const maxUses  = document.getElementById('cpnMaxUses').value || '1';
  const expires  = document.getElementById('cpnExpires').value;

  if (!code || !bonus) { toast('กรุณากรอกโค้ดและโบนัส', 'error'); return; }
  try {
    const body = { code, bonus_amount: parseFloat(bonus), max_uses: parseInt(maxUses) };
    if (expires) body.expires_at = expires;
    const res = await API.post('/admin/coupons', body);
    toast('✅ ' + res.message, 'success');
    document.getElementById('addCouponModal').classList.remove('show');
    ['cpnCode','cpnBonus','cpnMaxUses','cpnExpires'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
    loadCoupons();
  } catch (err) {
    toast('❌ ' + err.message, 'error');
  }
}

async function deleteCoupon(id, code) {
  if (!confirm(`ลบคูปอง "${code}"?`)) return;
  try {
    const res = await API.del(`/admin/coupons/${id}`);
    toast('✅ ' + res.message, 'success');
    loadCoupons();
  } catch (err) {
    toast('❌ ' + err.message, 'error');
  }
}

// ===== SITE SETTINGS =====
async function loadSettings() {
  try {
    const res = await API.get('/admin/settings');
    const s = res?.data || {};
    const set = (id, val) => { const el = document.getElementById(id); if (el && val != null) el.value = val; };
    set('cfg_alert_text',    s.alert_text);
    set('cfg_alert_active',  s.alert_active);
    set('cfg_line_url',      s.line_url);
    set('cfg_telegram_url',  s.telegram_url);
    set('cfg_facebook_url',  s.facebook_url);
    set('cfg_promptpay',     s.promptpay);
    set('cfg_bank_name',     s.bank_name);
    set('cfg_bank_account',  s.bank_account);
    set('cfg_bank_holder',   s.bank_holder);
  } catch (err) {
    toast('❌ โหลดตั้งค่าไม่สำเร็จ', 'error');
  }
}

async function saveSettings() {
  const get = id => document.getElementById(id)?.value ?? '';
  const body = {
    alert_text:   get('cfg_alert_text'),
    alert_active: get('cfg_alert_active'),
    line_url:     get('cfg_line_url'),
    telegram_url: get('cfg_telegram_url'),
    facebook_url: get('cfg_facebook_url'),
    promptpay:    get('cfg_promptpay'),
    bank_name:    get('cfg_bank_name'),
    bank_account: get('cfg_bank_account'),
    bank_holder:  get('cfg_bank_holder')
  };
  try {
    const res = await API.put('/admin/settings', body);
    toast('✅ ' + res.message, 'success');
  } catch (err) {
    toast('❌ ' + err.message, 'error');
  }
}

// ===== RESET MEMBER PASSWORD =====
function openResetPassword(memberId, username) {
  document.getElementById('resetPasswordMemberId').value = memberId;
  document.getElementById('resetPasswordUsername').textContent = username;
  document.getElementById('resetPasswordInput').value = '';
  document.getElementById('resetPasswordModal').classList.add('show');
}

async function saveResetPassword() {
  const memberId = document.getElementById('resetPasswordMemberId').value;
  const password = document.getElementById('resetPasswordInput').value.trim();
  const username = document.getElementById('resetPasswordUsername').textContent;

  if (password.length < 6) { toast('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', 'error'); return; }

  try {
    const res = await API.post(`/admin/members/${memberId}/reset-password`, { password });
    toast('✅ ' + res.message, 'success');
    document.getElementById('resetPasswordModal').classList.remove('show');
  } catch (err) {
    toast('❌ ' + err.message, 'error');
  }
}

// ===== DELETE MEMBER =====
async function deleteMember(id, username) {
  if (!confirm(`ลบสมาชิก "${username}" ออกจากระบบ?\nข้อมูลทั้งหมดจะหายถาวร`)) return;
  try {
    const res = await API.del(`/admin/members/${id}`);
    toast('✅ ' + res.message, 'success');
    loadMembers();
  } catch (err) {
    toast('❌ ' + err.message, 'error');
  }
}

// ===== ADMIN MANAGEMENT =====
async function loadAdmins() {
  const tbody = document.getElementById('adminsTable');
  if (!tbody) return;
  try {
    const res  = await API.get('/admin/admins');
    const list = res?.data || [];
    const selfId = API_CONFIG.getUser()?.id;
    tbody.innerHTML = list.length
      ? list.map((a, i) => `<tr>
          <td>${i + 1}</td>
          <td><b>${escapeHtml(a.username)}</b></td>
          <td>${escapeHtml(a.email)}</td>
          <td>${new Date(a.created_at).toLocaleDateString('th-TH')}</td>
          <td>${a.id == selfId
            ? '<span style="color:#9ca3af;font-size:12px">(คุณ)</span>'
            : `<button class="btn btn-danger btn-sm" onclick="demoteAdmin(${a.id},'${escapeHtml(a.username)}')">ลด Role</button>`
          }</td>
        </tr>`).join('')
      : '<tr><td colspan="5" style="text-align:center;color:#9ca3af;padding:16px">ไม่มีข้อมูล</td></tr>';
  } catch (err) { console.error('loadAdmins error:', err); }
}

async function saveAdmin() {
  const username = document.getElementById('newAdminUsername').value.trim();
  const email    = document.getElementById('newAdminEmail').value.trim();
  const password = document.getElementById('newAdminPassword').value;
  if (!username || !email || !password) { toast('กรุณากรอกข้อมูลให้ครบ', 'error'); return; }
  try {
    const res = await API.post('/admin/admins', { username, email, password });
    toast('✅ ' + res.message, 'success');
    document.getElementById('addAdminModal').classList.remove('show');
    ['newAdminUsername','newAdminEmail','newAdminPassword'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
    loadAdmins();
  } catch (err) { toast('❌ ' + err.message, 'error'); }
}

async function promoteToAdmin(id, username) {
  if (!confirm(`เลื่อน "${username}" เป็น Admin?\nเขาจะเข้าถึง Admin Panel ได้ทันที`)) return;
  try {
    const res = await API.post(`/admin/members/${id}/set-role`, { role: 'admin' });
    toast('✅ ' + res.message, 'success');
    loadMembers();
  } catch (err) { toast('❌ ' + err.message, 'error'); }
}

async function demoteAdmin(id, username) {
  if (!confirm(`ลด "${username}" กลับเป็น User?\nเขาจะเข้า Admin Panel ไม่ได้อีก`)) return;
  try {
    const res = await API.post(`/admin/members/${id}/set-role`, { role: 'user' });
    toast('✅ ' + res.message, 'success');
    loadAdmins();
  } catch (err) { toast('❌ ' + err.message, 'error'); }
}

// ===== LOGOUT =====
async function logout() {
  if (!confirm('ต้องการออกจากระบบหรือไม่?')) return;
  API_CONFIG.clearToken();
  location.replace('/admin-login.html');
}

// ===== MODAL CLOSE ON OVERLAY CLICK =====
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('show');
    });
  });
});

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  const token = API_CONFIG.getToken();
  const user  = API_CONFIG.getUser();
  if (!token || !user || user.role !== 'admin') {
    location.replace('/admin-login.html');
    return;
  }
  const nameEl   = document.getElementById('adminName');
  const avatarEl = document.getElementById('adminAvatar');
  if (nameEl) nameEl.textContent = user.username;
  if (avatarEl) avatarEl.textContent = (user.username || 'A')[0].toUpperCase();
  loadDashboardStats();
});

window.showPage      = showPage;
window.loadPending   = loadPending;
window.loadHistory   = loadHistory;
window.loadMembers   = loadMembers;
window.searchMembers = searchMembers;
window.exportMembers = exportMembers;
window.adjustCredit  = adjustCredit;
window.saveCredit    = saveCredit;
window.approveTx     = approveTx;
window.rejectTx      = rejectTx;
window.openSlip      = openSlip;
window.closeSlip     = closeSlip;
window.logout        = logout;
window.loadDashboardStats = loadDashboardStats;
window.loadInventory = loadInventory;
window.saveInventory = saveInventory;
window.deleteInv     = deleteInv;
window.loadOrders    = loadOrders;
window.deleteMember        = deleteMember;
window.openResetPassword   = openResetPassword;
window.saveResetPassword   = saveResetPassword;
window.loadProducts     = loadProducts;
window.saveProduct      = saveProduct;
window.deleteProduct    = deleteProduct;
window.openEditProduct  = openEditProduct;
window.saveEditProduct  = saveEditProduct;
window.loadCoupons      = loadCoupons;
window.saveCoupon       = saveCoupon;
window.deleteCoupon     = deleteCoupon;
window.loadSettings     = loadSettings;
window.saveSettings     = saveSettings;
window.loadAdmins       = loadAdmins;
window.saveAdmin        = saveAdmin;
window.promoteToAdmin   = promoteToAdmin;
window.demoteAdmin      = demoteAdmin;
