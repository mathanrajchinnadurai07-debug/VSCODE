/* Curfee Organic Market — Auth Page Logic (MySQL + JWT) */

document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, redirect
  if (isLoggedIn()) {
    const r = new URLSearchParams(window.location.search).get('redirect');
    const user = getUser();
    window.location.href = r || (user && user.role === 'admin' ? 'admin.html' : 'dashboard.html');
    return;
  }
  initAuthForms();
});

function switchAuthTab(tab, btn) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('loginForm').classList.toggle('hidden', tab !== 'login');
  document.getElementById('registerForm').classList.toggle('hidden', tab !== 'register');
  document.getElementById('otpForm').classList.toggle('hidden', tab !== 'otp');
}

function initAuthForms() {

  // ── Email Login ──
  document.getElementById('loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    try {
      const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      setAuth(data);
      showToast('Welcome back, ' + data.name + '! 🌿', 'success');
      setTimeout(() => {
        const r = new URLSearchParams(window.location.search).get('redirect');
        window.location.href = r || (data.role === 'admin' ? 'admin.html' : 'dashboard.html');
      }, 500);
    } catch (err) {
      showToast(err.message || 'Invalid credentials', 'error');
    }
  });

  // ── Email Register ──
  document.getElementById('registerForm').addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const password = document.getElementById('regPassword').value;
    if (password.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
    try {
      const data = await api('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, phone, password }) });
      setAuth(data);
      showToast('Account created! Welcome to Curfee 🌿', 'success');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 600);
    } catch (err) {
      showToast(err.message || 'Registration failed', 'error');
    }
  });

  // ── OTP Login ──
  let otpSent = false;
  document.getElementById('otpForm').addEventListener('submit', async e => {
    e.preventDefault();
    const phone = document.getElementById('otpPhone').value.trim();
    if (!otpSent) {
      try {
        const data = await api('/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone }) });
        document.getElementById('otpInputGroup').classList.remove('hidden');
        document.getElementById('otpBtn').textContent = 'Verify OTP';
        otpSent = true;
        showToast('OTP sent! (Demo OTP: ' + (data.demo_otp || '123456') + ')', 'success');
      } catch (err) { showToast(err.message || 'Failed to send OTP', 'error'); }
    } else {
      const otp = document.getElementById('otpCode').value.trim();
      try {
        const data = await api('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ phone, otp }) });
        setAuth(data);
        showToast('Welcome! 🌿', 'success');
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 600);
      } catch (err) { showToast(err.message || 'Invalid OTP', 'error'); }
    }
  });
}

// Google Login — requires backend OAuth setup
function googleLogin() {
  showToast('Google login requires OAuth setup. Use email/password for now.', 'info');
}
