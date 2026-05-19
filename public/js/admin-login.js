(function () {
  'use strict';

  if (API_CONFIG.getToken()) {
    location.href = '/admin.html';
    return;
  }

  const params = new URLSearchParams(location.search);
  if (params.get('expired') === '1') {
    showError('เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง', 'warning');
  }

  const form      = document.getElementById('loginForm');
  const submitBtn = document.getElementById('submitBtn');
  const emailEl   = document.getElementById('loginEmail');
  const passwordEl= document.getElementById('loginPassword');
  const toggleBtn = document.getElementById('togglePw');
  const otpStep   = document.getElementById('otpStep');
  const otpInput  = document.getElementById('otpInput');
  const otpBtn    = document.getElementById('otpBtn');

  let _tempToken = null;

  toggleBtn.addEventListener('click', () => {
    const isPw = passwordEl.type === 'password';
    passwordEl.type = isPw ? 'text' : 'password';
    toggleBtn.textContent = isPw ? '🙈' : '👁';
  });

  // Step 1 — Login (email/username + password)
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email    = emailEl.value.trim();
    const password = passwordEl.value;

    if (!email || !password) {
      showError('กรุณากรอก Email/Username และ Password');
      return;
    }

    setLoading(true);
    clearError();

    try {
      const data = await API.post(API_CONFIG.endpoints.login, { email, password }, { skipAuth: true });

      if (!data.success) {
        showError(data.message || 'เข้าสู่ระบบไม่สำเร็จ');
        return;
      }

      // Admin ต้องผ่าน OTP เสมอ
      if (data.requires2FA && data.tempToken) {
        _tempToken = data.tempToken;
        form.style.display = 'none';
        otpStep.style.display = 'block';
        otpInput.focus();
        return;
      }

      // กรณีไม่มี 2FA (ไม่ควรเกิดสำหรับ admin แต่ป้องกันไว้)
      const user = data.data;
      if (!user || user.role !== 'admin') {
        showError('บัญชีนี้ไม่ใช่ Admin');
        return;
      }

      API_CONFIG.setToken(data.token);
      API_CONFIG.setUser(user);
      location.href = '/admin.html';

    } catch (err) {
      let msg = err.message || 'เข้าสู่ระบบไม่สำเร็จ';
      if (err.code === 'NETWORK') msg = '⚠️ ' + msg;
      else if (err.status === 401 || err.status === 400) msg = 'Email หรือ Password ไม่ถูกต้อง';
      showError(msg);
    } finally {
      setLoading(false);
    }
  });

  // Step 2 — ยืนยัน OTP
  otpBtn.addEventListener('click', async () => {
    const otp = otpInput.value.trim();
    if (!otp || otp.length !== 6) {
      showError('กรุณากรอกรหัส OTP 6 หลัก');
      return;
    }

    otpBtn.disabled = true;
    otpBtn.textContent = 'กำลังตรวจสอบ...';
    clearError();

    try {
      const data = await API.post(API_CONFIG.endpoints.verifyOtp, { tempToken: _tempToken, otp }, { skipAuth: true });

      if (!data.success) {
        showError(data.message || 'OTP ไม่ถูกต้อง');
        return;
      }

      const user = data.data;
      if (!user || user.role !== 'admin') {
        showError('บัญชีนี้ไม่ใช่ Admin');
        return;
      }

      API_CONFIG.setToken(data.token);
      API_CONFIG.setUser(user);
      location.href = '/admin.html';

    } catch (err) {
      let msg = err.message || 'เกิดข้อผิดพลาด';
      if (err.status === 401) msg = 'รหัส OTP ไม่ถูกต้องหรือหมดอายุ';
      showError(msg);
    } finally {
      otpBtn.disabled = false;
      otpBtn.textContent = 'ยืนยัน OTP';
    }
  });

  // กด Enter ใน OTP input
  otpInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') otpBtn.click();
  });

  function setLoading(loading) {
    submitBtn.disabled = loading;
    submitBtn.innerHTML = loading
      ? '<span class="spinner"></span> กำลังเข้าสู่ระบบ...'
      : 'เข้าสู่ระบบ';
  }

  function showError(msg, level = 'error') {
    const box = document.getElementById('errorBox');
    box.textContent = msg;
    box.className = 'error-box show ' + level;
  }

  function clearError() {
    const box = document.getElementById('errorBox');
    box.className = 'error-box';
    box.textContent = '';
  }
})();
