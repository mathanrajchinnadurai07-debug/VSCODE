/* Curfee Organic Market — Auth Page Logic */
document.addEventListener('DOMContentLoaded', () => { if (isLoggedIn()) { window.location.href = 'dashboard.html'; return; } initAuthForms(); });
function switchAuthTab(tab, btn) { document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active')); btn.classList.add('active'); document.getElementById('loginForm').classList.toggle('hidden',tab!=='login'); document.getElementById('registerForm').classList.toggle('hidden',tab!=='register'); document.getElementById('otpForm').classList.toggle('hidden',tab!=='otp'); }
let otpSent = false;
function initAuthForms() {
  document.getElementById('loginForm').addEventListener('submit', async e => {
    e.preventDefault(); const email = document.getElementById('loginEmail').value, password = document.getElementById('loginPassword').value;
    try {
      const data = await api('/auth/login',{method:'POST',body:JSON.stringify({email,password})});
      setAuth(data); showToast('Welcome back, '+data.name+'!','success');
      setTimeout(() => { const r = new URLSearchParams(window.location.search).get('redirect'); window.location.href = r || (data.role==='admin'?'admin.html':'dashboard.html'); },500);
    } catch (err) {
      showToast(err.message||'Invalid credentials','error');
    }
  });
  document.getElementById('registerForm').addEventListener('submit', async e => {
    e.preventDefault(); const name=document.getElementById('regName').value, email=document.getElementById('regEmail').value, phone=document.getElementById('regPhone').value, password=document.getElementById('regPassword').value;
    if (password.length<6) { showToast('Password must be at least 6 characters','error'); return; }
    try {
      const data = await api('/auth/register',{method:'POST',body:JSON.stringify({name,email,phone,password})});
      setAuth(data); showToast('Account created!','success');
      setTimeout(() => { window.location.href='dashboard.html'; },500);
    } catch (err) {
      showToast(err.message||'Registration failed. Please try again.','error');
    }
  });
  document.getElementById('otpForm').addEventListener('submit', async e => {
    e.preventDefault(); const phone = document.getElementById('otpPhone').value;
    if (!otpSent) {
      try { await api('/auth/send-otp',{method:'POST',body:JSON.stringify({phone})}); } catch (err) { showToast(err.message||'Failed to send OTP','error'); return; }
      document.getElementById('otpInputGroup').classList.remove('hidden');
      document.getElementById('otpBtn').textContent='Verify OTP'; otpSent=true; showToast('OTP sent!','success');
    } else {
      const otp = document.getElementById('otpCode').value;
      try {
        const data = await api('/auth/verify-otp',{method:'POST',body:JSON.stringify({phone,otp})});
        setAuth(data); showToast('Welcome!','success');
        setTimeout(() => { window.location.href='dashboard.html'; },500);
      } catch (err) { showToast(err.message||'Invalid OTP','error'); }
    }
  });
}
function googleLogin() { showToast('Google login requires backend setup. Please use email/password.','info'); }
