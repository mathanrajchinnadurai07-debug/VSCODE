/* Curfee Organic Market — Auth (Firebase) */

document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, redirect
  firebaseAuth.onAuthStateChanged(user => {
    if (user) {
      const r = new URLSearchParams(window.location.search).get('redirect');
      window.location.href = r || 'dashboard.html';
    }
  });
  initAuthForms();
});

function switchAuthTab(tab, btn) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('loginForm').classList.toggle('hidden', tab !== 'login');
  document.getElementById('registerForm').classList.toggle('hidden', tab !== 'register');
  document.getElementById('otpForm').classList.toggle('hidden', tab !== 'otp');
}

// ---- Google Login ----
async function googleLogin() {
  try {
    const result = await firebaseAuth.signInWithPopup(googleProvider);
    const user = result.user;
    const userData = {
      uid: user.uid,
      name: user.displayName || 'User',
      email: user.email || '',
      phone: user.phoneNumber || '',
      photo: user.photoURL || '',
      role: 'customer',
    };
    await saveUserToFirestore(user.uid, userData);
    localStorage.setItem('curfee_user', JSON.stringify(userData));
    showToast('Welcome, ' + userData.name + '! 🌿', 'success');
    setTimeout(() => {
      const r = new URLSearchParams(window.location.search).get('redirect');
      window.location.href = r || 'dashboard.html';
    }, 600);
  } catch (err) {
    showToast(err.message || 'Google login failed', 'error');
  }
}

function initAuthForms() {

  // ---- Email Login ----
  document.getElementById('loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const email    = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    try {
      const cred = await firebaseAuth.signInWithEmailAndPassword(email, password);
      const user = cred.user;
      // Fetch profile from Firestore
      let profile = await getUserFromFirestore(user.uid);
      if (!profile) {
        profile = { uid: user.uid, name: user.displayName || email.split('@')[0], email, role: 'customer' };
        await saveUserToFirestore(user.uid, profile);
      }
      localStorage.setItem('curfee_user', JSON.stringify(profile));
      showToast('Welcome back, ' + profile.name + '! 🌿', 'success');
      setTimeout(() => {
        const r = new URLSearchParams(window.location.search).get('redirect');
        window.location.href = r || (profile.role === 'admin' ? 'admin.html' : 'dashboard.html');
      }, 500);
    } catch (err) {
      const msg = err.code === 'auth/wrong-password' ? 'Incorrect password'
                : err.code === 'auth/user-not-found'  ? 'No account found with this email'
                : err.code === 'auth/invalid-email'   ? 'Invalid email address'
                : err.message || 'Login failed';
      showToast(msg, 'error');
    }
  });

  // ---- Email Register ----
  document.getElementById('registerForm').addEventListener('submit', async e => {
    e.preventDefault();
    const name     = document.getElementById('regName').value.trim();
    const email    = document.getElementById('regEmail').value.trim();
    const phone    = document.getElementById('regPhone').value.trim();
    const password = document.getElementById('regPassword').value;
    if (password.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
    try {
      const cred = await firebaseAuth.createUserWithEmailAndPassword(email, password);
      const user = cred.user;
      await user.updateProfile({ displayName: name });
      const profile = { uid: user.uid, name, email, phone, role: 'customer', createdAt: new Date().toISOString() };
      await saveUserToFirestore(user.uid, profile);
      localStorage.setItem('curfee_user', JSON.stringify(profile));
      showToast('Account created! Welcome to Curfee 🌿', 'success');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 600);
    } catch (err) {
      const msg = err.code === 'auth/email-already-in-use' ? 'Email already registered. Please login.'
                : err.code === 'auth/invalid-email'        ? 'Invalid email address'
                : err.code === 'auth/weak-password'        ? 'Password too weak'
                : err.message || 'Registration failed';
      showToast(msg, 'error');
    }
  });

  // ---- OTP Login (Phone) ----
  let confirmationResult = null;
  // RecaptchaVerifier must be set up before sending OTP
  let recaptchaVerifier = null;

  document.getElementById('otpForm').addEventListener('submit', async e => {
    e.preventDefault();
    const phone = document.getElementById('otpPhone').value.trim();
    const otpCode = document.getElementById('otpCode')?.value.trim();
    const otpInputGroup = document.getElementById('otpInputGroup');
    const otpBtn = document.getElementById('otpBtn');

    if (!confirmationResult) {
      // Step 1: Send OTP
      if (!phone || phone.length < 10) { showToast('Enter a valid 10-digit mobile number', 'error'); return; }
      const fullPhone = phone.startsWith('+') ? phone : '+91' + phone;
      try {
        if (!recaptchaVerifier) {
          recaptchaVerifier = new firebase.auth.RecaptchaVerifier('otpBtn', { size: 'invisible' });
        }
        confirmationResult = await firebaseAuth.signInWithPhoneNumber(fullPhone, recaptchaVerifier);
        otpInputGroup.classList.remove('hidden');
        otpBtn.textContent = 'Verify OTP';
        showToast('OTP sent to ' + fullPhone + ' 📱', 'success');
      } catch (err) {
        showToast(err.message || 'Failed to send OTP', 'error');
        confirmationResult = null;
      }
    } else {
      // Step 2: Verify OTP
      if (!otpCode || otpCode.length < 6) { showToast('Enter the 6-digit OTP', 'error'); return; }
      try {
        const result = await confirmationResult.confirm(otpCode);
        const user = result.user;
        let profile = await getUserFromFirestore(user.uid);
        if (!profile) {
          profile = { uid: user.uid, name: 'User', phone: user.phoneNumber, role: 'customer' };
          await saveUserToFirestore(user.uid, profile);
        }
        localStorage.setItem('curfee_user', JSON.stringify(profile));
        showToast('Welcome! 🌿', 'success');
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 600);
      } catch (err) {
        showToast('Invalid OTP. Please try again.', 'error');
      }
    }
  });
}
