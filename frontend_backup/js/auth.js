/* Curfee Organic Market — Auth Page Logic (Firebase Auth) */

document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, redirect
  if (localStorage.getItem('curfee_user')) {
    const r = new URLSearchParams(window.location.search).get('redirect');
    window.location.href = r || 'index.html';
    return;
  }
  initAuthForms();
});

function switchAuthTab(tab, btn) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('loginForm').classList.toggle('hidden', tab !== 'login');
  document.getElementById('registerForm').classList.toggle('hidden', tab !== 'register');
  const otpForm = document.getElementById('otpForm');
  if (otpForm) otpForm.classList.toggle('hidden', tab !== 'otp');
}

function initAuthForms() {

  // ── Email Login ──
  document.getElementById('loginForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    try {
      const cred = await auth.signInWithEmailAndPassword(email, password);
      showToast('Welcome back! 🌿', 'success');
      setTimeout(() => {
        const r = new URLSearchParams(window.location.search).get('redirect');
        window.location.href = r || 'index.html';
      }, 800);
    } catch (err) {
      const msg = err.code === 'auth/user-not-found' ? 'No account found with this email' :
                  err.code === 'auth/wrong-password' ? 'Incorrect password' :
                  err.code === 'auth/invalid-email' ? 'Invalid email format' :
                  err.message;
      showToast(msg, 'error');
    }
  });

  // ── Email Register ──
  document.getElementById('registerForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const phone = document.getElementById('regPhone')?.value.trim() || '';
    const password = document.getElementById('regPassword').value;
    if (password.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
    try {
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      await cred.user.updateProfile({ displayName: name });
      // Save user profile to Firestore
      await db.collection('users').doc(cred.user.uid).set({
        name, email, phone,
        address: { street: '', city: '', pincode: '', state: '' },
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      localStorage.setItem('curfee_user', JSON.stringify({ uid: cred.user.uid, name, email, phone }));
      localStorage.setItem('curfee_token', 'firebase_' + cred.user.uid);
      showToast('Account created! Welcome to Curfee 🌿', 'success');
      setTimeout(() => { window.location.href = 'index.html'; }, 800);
    } catch (err) {
      const msg = err.code === 'auth/email-already-in-use' ? 'Email already registered. Try logging in.' :
                  err.code === 'auth/weak-password' ? 'Password too weak (min 6 chars)' :
                  err.message;
      showToast(msg, 'error');
    }
  });

  // ── OTP Login (Firebase Phone Auth) ──
  let confirmationResult = null;
  
  function setupRecaptcha() {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
        'size': 'normal',
        'callback': (response) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        },
        'expired-callback': () => {
          // Response expired. Ask user to solve reCAPTCHA again.
          showToast('reCAPTCHA expired. Please solve again.', 'warning');
        }
      });
    }
  }

  document.getElementById('otpForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const phoneInput = document.getElementById('otpPhone');
    let phone = phoneInput?.value.trim();
    
    if (!confirmationResult) {
      // 1. Send OTP
      if (!phone.startsWith('+')) {
        // Assume India if no country code provided
        phone = '+91' + phone;
      }
      
      try {
        setupRecaptcha();
        const appVerifier = window.recaptchaVerifier;
        const btn = document.getElementById('otpBtn');
        btn.textContent = 'Sending...';
        btn.disabled = true;

        confirmationResult = await auth.signInWithPhoneNumber(phone, appVerifier);
        
        showToast('OTP sent successfully! 📱', 'success');
        document.getElementById('otpInputGroup').classList.remove('hidden');
        phoneInput.disabled = true;
        document.getElementById('recaptcha-container').style.display = 'none'; // hide recaptcha once sent
        btn.innerHTML = 'Verify OTP <i class="fas fa-check"></i>';
        btn.disabled = false;
        
      } catch (error) {
        document.getElementById('otpBtn').disabled = false;
        document.getElementById('otpBtn').innerHTML = 'Send OTP <i class="fas fa-mobile-alt"></i>';
        if (window.recaptchaVerifier) window.recaptchaVerifier.render().then(function(widgetId) {
          grecaptcha.reset(widgetId);
        });
        showToast('Error sending OTP: ' + error.message, 'error');
      }
    } else {
      // 2. Verify OTP
      const otp = document.getElementById('otpCode').value.trim();
      if (otp.length !== 6) {
        showToast('Please enter a valid 6-digit OTP', 'warning');
        return;
      }
      
      try {
        const btn = document.getElementById('otpBtn');
        btn.textContent = 'Verifying...';
        btn.disabled = true;
        
        const result = await confirmationResult.confirm(otp);
        const user = result.user;
        
        // Save to Firestore if new or update phone
        await db.collection('users').doc(user.uid).set({
          phone: user.phoneNumber || phone,
          name: user.displayName || 'User',
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        showToast('Welcome! 🌿', 'success');
        setTimeout(() => {
          const r = new URLSearchParams(window.location.search).get('redirect');
          window.location.href = r || 'index.html';
        }, 800);
      } catch (error) {
        document.getElementById('otpBtn').disabled = false;
        document.getElementById('otpBtn').innerHTML = 'Verify OTP <i class="fas fa-check"></i>';
        showToast('Invalid OTP. Please try again.', 'error');
      }
    }
  });
}

// ── Google Sign-In ──
function googleLogin() {
  auth.signInWithPopup(googleProvider).then(async result => {
    const user = result.user;
    // Save to Firestore
    await db.collection('users').doc(user.uid).set({
      name: user.displayName || 'User',
      email: user.email || '',
      phone: user.phoneNumber || '',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    showToast('Welcome, ' + (user.displayName || 'User') + '! 🌿', 'success');
    setTimeout(() => {
      const r = new URLSearchParams(window.location.search).get('redirect');
      window.location.href = r || 'index.html';
    }, 800);
  }).catch(err => {
    if (err.code !== 'auth/popup-closed-by-user') {
      showToast('Google sign-in failed: ' + err.message, 'error');
    }
  });
}
