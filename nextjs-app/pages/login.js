import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { auth, googleProvider, db } from '../firebase/config';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import Toast from '../components/Toast';

export default function Login() {
  const router = useRouter();
  const [tab, setTab] = useState('login');
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // OTP State
  const [otpPhone, setOtpPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  useEffect(() => {
    // If already logged in, redirect
    if (typeof window !== 'undefined' && localStorage.getItem('curfee_user')) {
      const r = new URLSearchParams(window.location.search).get('redirect');
      router.push(r || '/');
    }
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      if (window.showToast) window.showToast('Welcome back! 🌿', 'success');
      setTimeout(() => {
        const r = new URLSearchParams(window.location.search).get('redirect');
        router.push(r || '/');
      }, 800);
    } catch (err) {
      const msg = err.code === 'auth/user-not-found' ? 'No account found with this email' :
                  err.code === 'auth/wrong-password' ? 'Incorrect password' :
                  err.code === 'auth/invalid-email' ? 'Invalid email format' :
                  err.message;
      if (window.showToast) window.showToast(msg, 'error');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (regPassword.length < 6) { 
      if (window.showToast) window.showToast('Password must be at least 6 characters', 'error'); 
      return; 
    }
    try {
      const cred = await createUserWithEmailAndPassword(auth, regEmail, regPassword);
      await updateProfile(cred.user, { displayName: regName });
      await setDoc(doc(db, 'users', cred.user.uid), {
        name: regName, 
        email: regEmail, 
        phone: regPhone,
        address: { street: '', city: '', pincode: '', state: '' },
        createdAt: serverTimestamp()
      });
      localStorage.setItem('curfee_user', JSON.stringify({ uid: cred.user.uid, name: regName, email: regEmail, phone: regPhone }));
      localStorage.setItem('curfee_token', 'firebase_' + cred.user.uid);
      if (window.showToast) window.showToast('Account created! Welcome to Curfee 🌿', 'success');
      setTimeout(() => { router.push('/'); }, 800);
    } catch (err) {
      const msg = err.code === 'auth/email-already-in-use' ? 'Email already registered. Try logging in.' :
                  err.code === 'auth/weak-password' ? 'Password too weak (min 6 chars)' :
                  err.message;
      if (window.showToast) window.showToast(msg, 'error');
    }
  };

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'normal',
        'callback': (response) => {
          // reCAPTCHA solved
        },
        'expired-callback': () => {
          if (window.showToast) window.showToast('reCAPTCHA expired. Please solve again.', 'warning');
        }
      });
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!confirmationResult) {
      let p = otpPhone.trim();
      if (!p.startsWith('+')) {
        p = '+91' + p;
      }
      try {
        setupRecaptcha();
        const appVerifier = window.recaptchaVerifier;
        setOtpLoading(true);

        const result = await signInWithPhoneNumber(auth, p, appVerifier);
        setConfirmationResult(result);
        
        if (window.showToast) window.showToast('OTP sent successfully! 📱', 'success');
        setOtpSent(true);
        setOtpLoading(false);
      } catch (error) {
        setOtpLoading(false);
        if (window.recaptchaVerifier && window.grecaptcha) {
          window.recaptchaVerifier.render().then(function(widgetId) {
            window.grecaptcha.reset(widgetId);
          });
        }
        if (window.showToast) window.showToast('Error sending OTP: ' + error.message, 'error');
      }
    } else {
      if (otpCode.trim().length !== 6) {
        if (window.showToast) window.showToast('Please enter a valid 6-digit OTP', 'warning');
        return;
      }
      try {
        setOtpLoading(true);
        const result = await confirmationResult.confirm(otpCode.trim());
        const user = result.user;
        
        await setDoc(doc(db, 'users', user.uid), {
          phone: user.phoneNumber || otpPhone,
          name: user.displayName || 'User',
          createdAt: serverTimestamp()
        }, { merge: true });
        
        if (window.showToast) window.showToast('Welcome! 🌿', 'success');
        setTimeout(() => {
          const r = new URLSearchParams(window.location.search).get('redirect');
          router.push(r || '/');
        }, 800);
      } catch (error) {
        setOtpLoading(false);
        if (window.showToast) window.showToast('Invalid OTP. Please try again.', 'error');
      }
    }
  };

  const googleLogin = () => {
    signInWithPopup(auth, googleProvider).then(async result => {
      const user = result.user;
      await setDoc(doc(db, 'users', user.uid), {
        name: user.displayName || 'User',
        email: user.email || '',
        phone: user.phoneNumber || '',
        createdAt: serverTimestamp()
      }, { merge: true });
      if (window.showToast) window.showToast('Welcome, ' + (user.displayName || 'User') + '! 🌿', 'success');
      setTimeout(() => {
        const r = new URLSearchParams(window.location.search).get('redirect');
        router.push(r || '/');
      }, 800);
    }).catch(err => {
      if (err.code !== 'auth/popup-closed-by-user') {
        if (window.showToast) window.showToast('Google sign-in failed: ' + err.message, 'error');
      }
    });
  };

  return (
    <>
      <Head>
        <title>Login — Curfee Organic Market</title>
      </Head>
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">
            <Link href="/" className="logo" style={{ justifyContent: 'center' }}>
              <div className="logo-icon"><span>🌿</span></div> 
              <span>Curfee</span><span>Organic</span>
            </Link>
          </div>
          <h2>Welcome Back</h2>
          <p className="auth-subtitle">Login to access your organic marketplace</p>
          
          <div className="auth-tabs">
            <button 
              className={`auth-tab ${tab === 'login' ? 'active' : ''}`} 
              onClick={() => setTab('login')}
            >
              Login
            </button>
            <button 
              className={`auth-tab ${tab === 'register' ? 'active' : ''}`} 
              onClick={() => setTab('register')}
            >
              Register
            </button>
            <button 
              className={`auth-tab ${tab === 'otp' ? 'active' : ''}`} 
              onClick={() => setTab('otp')}
            >
              OTP Login
            </button>
          </div>
          
          <div className="social-login">
            <button className="social-btn" onClick={googleLogin}>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" alt="G" /> Continue with Google
            </button>
          </div>
          
          <div className="auth-divider">or</div>
          
          {tab === 'login' && (
            <form id="loginForm" onSubmit={handleLogin}>
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  required 
                  placeholder="you@example.com" 
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input 
                  type="password" 
                  required 
                  placeholder="Enter password" 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block">
                Login <i className="fas fa-arrow-right"></i>
              </button>
            </form>
          )}

          {tab === 'register' && (
            <form id="registerForm" onSubmit={handleRegister}>
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="John Doe"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  required 
                  placeholder="you@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input 
                  type="tel" 
                  placeholder="9876543210"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input 
                  type="password" 
                  required 
                  placeholder="Min 6 characters"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block">
                Create Account <i className="fas fa-user-plus"></i>
              </button>
            </form>
          )}

          {tab === 'otp' && (
            <form id="otpForm" onSubmit={handleOtpSubmit}>
              <div className="form-group">
                <label>Mobile Number</label>
                <input 
                  type="tel" 
                  required 
                  placeholder="+919876543210 (include country code)"
                  value={otpPhone}
                  onChange={(e) => setOtpPhone(e.target.value)}
                  disabled={otpSent}
                />
              </div>
              
              <div id="recaptcha-container" style={{ marginBottom: '15px', display: otpSent ? 'none' : 'block' }}></div>
              
              {otpSent && (
                <div className="form-group" id="otpInputGroup">
                  <label>OTP</label>
                  <input 
                    type="text" 
                    placeholder="Enter 6-digit OTP" 
                    maxLength="6"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                  />
                </div>
              )}
              
              <button type="submit" className="btn btn-primary btn-block" disabled={otpLoading}>
                {otpLoading ? (otpSent ? 'Verifying...' : 'Sending...') : (
                  otpSent ? (
                    <>Verify OTP <i className="fas fa-check"></i></>
                  ) : (
                    <>Send OTP <i className="fas fa-mobile-alt"></i></>
                  )
                )}
              </button>
            </form>
          )}
          
          <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-light)' }}>
            &nbsp;
          </p>
        </div>
      </div>
      <Toast />
    </>
  );
}
