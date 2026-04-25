import re
import os

with open('admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

new_html = """<!-- FIREBASE ADMIN LOGIN GATE -->
<div id="adminGate" style="position:fixed;inset:0;z-index:99999;background:linear-gradient(135deg,#1B4332,#2D6A4F);display:flex;align-items:center;justify-content:center;">
  <div style="background:#fff;border-radius:16px;padding:40px 32px;max-width:380px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
    
    <div style="width:72px;height:72px;border-radius:50%;background:#E8F4EC;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
      <i class="fas fa-shield-alt" style="font-size:2rem;color:#2D6A4F;"></i>
    </div>
    
    <h2 style="font-size:1.4rem;font-weight:700;color:#1B4332;margin-bottom:6px;">Admin Login</h2>
    <p style="font-size:0.85rem;color:#8D99AE;margin-bottom:24px;">Sign in with your admin account</p>

    <!-- Email -->
    <div style="position:relative;margin-bottom:14px;">
      <input type="email" id="adminEmailInput" placeholder="Admin email"
        style="width:100%;padding:14px 16px;border:2px solid #E8E0D8;border-radius:10px;font-size:1rem;outline:none;transition:border-color 0.3s;"
        onfocus="this.style.borderColor='#2D6A4F'" onblur="this.style.borderColor='#E8E0D8'">
    </div>

    <!-- Password -->
    <div id="adminPwdBox" style="position:relative;margin-bottom:16px;">
      <input type="password" id="adminPwdInput" placeholder="Password"
        style="width:100%;padding:14px 44px 14px 16px;border:2px solid #E8E0D8;border-radius:10px;font-size:1rem;outline:none;transition:border-color 0.3s;"
        onfocus="this.style.borderColor='#2D6A4F'" onblur="this.style.borderColor='#E8E0D8'">
      <button onclick="togglePwdVisibility()" type="button"
        style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#8D99AE;font-size:1.1rem;" id="pwdToggleBtn">
        <i class="fas fa-eye"></i>
      </button>
    </div>

    <!-- Error Message -->
    <div id="adminPwdError" style="color:#E63946;font-size:0.82rem;margin-bottom:12px;display:none;">
      <i class="fas fa-exclamation-circle"></i> <span id="adminErrorText">Incorrect email or password.</span>
    </div>

    <!-- Login Button -->
    <button onclick="firebaseAdminLogin()" id="loginBtn"
      style="width:100%;padding:14px;background:#2D6A4F;color:#fff;border:none;border-radius:10px;font-size:1rem;font-weight:700;cursor:pointer;transition:background 0.3s;">
      <i class="fas fa-sign-in-alt"></i> Sign In
    </button>

    <!-- Forgot Password -->
    <p style="margin-top:14px;font-size:0.8rem;">
      <a href="#" onclick="sendResetEmail()" style="color:#2D6A4F;font-weight:600;text-decoration:none;">
        <i class="fas fa-key"></i> Forgot Password?
      </a>
    </p>

    <p style="font-size:0.72rem;color:#C4B5A4;margin-top:12px;">
      <i class="fas fa-shield-alt"></i> Protected area. Authorized personnel only.
    </p>
  </div>
</div>
<script>
  // We use standard firebase v9 compat auth from firebase-init.js
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof auth !== 'undefined') {
      auth.onAuthStateChanged((user) => {
        if (user) {
          document.getElementById('adminGate').style.display = 'none';
          const sName = document.getElementById('sidebarName');
          const sAvatar = document.getElementById('sidebarAvatar');
          if (sName) sName.textContent = user.email;
          if (sAvatar) sAvatar.textContent = user.email.charAt(0).toUpperCase();
        } else {
          document.getElementById('adminGate').style.display = 'flex';
        }
      });
    }
  });

  window.firebaseAdminLogin = async function () {
    const email = document.getElementById('adminEmailInput').value.trim();
    const password = document.getElementById('adminPwdInput').value;
    const errDiv = document.getElementById('adminPwdError');
    const errText = document.getElementById('adminErrorText');
    const btn = document.getElementById('loginBtn');

    if (!email || !password) {
      errText.textContent = 'Please enter email and password.';
      errDiv.style.display = 'block';
      return;
    }

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
    btn.disabled = true;
    errDiv.style.display = 'none';

    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (err) {
      errText.textContent = 'Incorrect email or password.';
      errDiv.style.display = 'block';
      btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
      btn.disabled = false;
    }
  };

  window.editorLogout = async function () {
    if (typeof auth !== 'undefined') {
      await auth.signOut();
      window.location.reload();
    }
  };

  window.sendResetEmail = async function () {
    const email = document.getElementById('adminEmailInput').value.trim();
    if (!email) {
      alert('Enter your email address first.');
      return;
    }
    try {
      await auth.sendPasswordResetEmail(email);
      alert('✅ Password reset email sent! Check your inbox.');
    } catch (err) {
      alert('❌ Error: ' + err.message);
    }
  };

  window.togglePwdVisibility = function () {
    const i = document.getElementById('adminPwdInput');
    const ic = document.getElementById('pwdToggleBtn').querySelector('i');
    if (i.type === 'password') { i.type = 'text'; ic.className = 'fas fa-eye-slash'; }
    else { i.type = 'password'; ic.className = 'fas fa-eye'; }
  };

  document.addEventListener('DOMContentLoaded', () => {
    const pwdInput = document.getElementById('adminPwdInput');
    if (pwdInput) {
      pwdInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') window.firebaseAdminLogin();
      });
    }
  });
</script>"""

# Find and replace using regex
pattern = re.compile(r'<!-- ADMIN PASSWORD GATE -->.*?</script>', re.DOTALL)
new_content = pattern.sub(new_html, content)

with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(new_content)
