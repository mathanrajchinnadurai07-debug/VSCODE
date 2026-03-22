/* Auth Page Logic */
document.addEventListener('DOMContentLoaded', () => { if (isLoggedIn()) { window.location.href = 'dashboard.html'; return; } initAuthForms(); });
function switchAuthTab(tab, btn) { document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active')); btn.classList.add('active'); document.getElementById('loginForm').classList.toggle('hidden',tab!=='login'); document.getElementById('registerForm').classList.toggle('hidden',tab!=='register'); document.getElementById('otpForm').classList.toggle('hidden',tab!=='otp'); }
let otpSent = false;
function initAuthForms() {
  document.getElementById('loginForm').addEventListener('submit', async e => {
    e.preventDefault(); const email = document.getElementById('loginEmail').value, password = document.getElementById('loginPassword').value;
    try { const data = await api('/auth/login',{method:'POST',body:JSON.stringify({email,password})}); setAuth(data); showToast('Welcome back, '+data.name+'!','success'); setTimeout(() => { const r = new URLSearchParams(window.location.search).get('redirect'); window.location.href = r || (data.role==='admin'?'admin.html':'dashboard.html'); },500); } catch (err) {
      if (email==='demo@curfee.com' && password==='demo123') { setAuth({_id:'demo1',name:'Demo User',email,role:'user',token:'demo_token_'+Date.now()}); showToast('Welcome, Demo User!','success'); setTimeout(() => { window.location.href='dashboard.html'; },500); }
      else if (email==='admin@curfee.com' && password==='admin123') { setAuth({_id:'admin1',name:'Admin',email,role:'admin',token:'admin_token_'+Date.now()}); showToast('Welcome, Admin!','success'); setTimeout(() => { window.location.href='admin.html'; },500); }
      else showToast(err.message||'Invalid credentials','error');
    }
  });
  document.getElementById('registerForm').addEventListener('submit', async e => {
    e.preventDefault(); const name=document.getElementById('regName').value, email=document.getElementById('regEmail').value, phone=document.getElementById('regPhone').value, password=document.getElementById('regPassword').value;
    if (password.length<6) { showToast('Password must be at least 6 characters','error'); return; }
    try { const data = await api('/auth/register',{method:'POST',body:JSON.stringify({name,email,phone,password})}); setAuth(data); showToast('Account created!','success'); setTimeout(() => { window.location.href='dashboard.html'; },500); } catch {
      setAuth({_id:'new_'+Date.now(),name,email,role:'user',token:'token_'+Date.now()}); showToast('Account created (demo mode)!','success'); setTimeout(() => { window.location.href='dashboard.html'; },500); }
  });
  document.getElementById('otpForm').addEventListener('submit', async e => {
    e.preventDefault(); const phone = document.getElementById('otpPhone').value;
    if (!otpSent) { try { await api('/auth/send-otp',{method:'POST',body:JSON.stringify({phone})}); } catch {} document.getElementById('otpInputGroup').classList.remove('hidden'); document.getElementById('otpBtn').textContent='Verify OTP'; otpSent=true; showToast('OTP sent!','success'); } else {
      const otp = document.getElementById('otpCode').value; try { const data = await api('/auth/verify-otp',{method:'POST',body:JSON.stringify({phone,otp})}); setAuth(data); setTimeout(() => { window.location.href='dashboard.html'; },500); } catch { setAuth({_id:'otp_'+Date.now(),name:'User',email:phone+'@otp.curfee.com',phone,role:'user',token:'otp_token_'+Date.now()}); showToast('Logged in (demo)','success'); setTimeout(() => { window.location.href='dashboard.html'; },500); } }
  });
}
function googleLogin() { setAuth({_id:'google_'+Date.now(),name:'Google User',email:'user@gmail.com',role:'user',token:'google_token_'+Date.now()}); showToast('Logged in with Google (demo)!','success'); setTimeout(() => { window.location.href='dashboard.html'; },500); }
