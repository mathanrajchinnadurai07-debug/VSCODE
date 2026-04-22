/* ==========================================================
   Curfee Organic Market — Firebase Initialization (Fixed)
   Uses Firebase Compat SDK v9 (loaded via CDN in HTML)
   ========================================================== */

// Guard: only initialize once
if (!firebase.apps.length) {
  firebase.initializeApp({
    apiKey: "AIzaSyDLvzJXuzRcmk7BKew666VxoNS-9E3t9j0",
    authDomain: "curfee-10551.firebaseapp.com",
    projectId: "curfee-10551",
    storageBucket: "curfee-10551.firebasestorage.app",
    messagingSenderId: "450136720734",
    appId: "1:450136720734:web:552f728a27bc6cd121fbcf",
    measurementId: "G-CEYD4R1H7W"
  });
}

const firebaseAuth = firebase.auth();
const firebaseDB   = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// ── Keep localStorage user in sync with Firebase Auth state ──
firebaseAuth.onAuthStateChanged(function(fbUser) {
  if (fbUser) {
    // User is signed in — make sure curfee_user is set
    const stored = localStorage.getItem('curfee_user');
    if (!stored) {
      const profile = {
        uid: fbUser.uid,
        name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
        email: fbUser.email || '',
        phone: fbUser.phoneNumber || '',
        photo: fbUser.photoURL || '',
        role: 'customer'
      };
      localStorage.setItem('curfee_user', JSON.stringify(profile));
    }
    if (typeof updateAuthUI === 'function') updateAuthUI();
  }
  // Note: we do NOT remove curfee_user on signOut here
  // because logout() already does that explicitly
});

// ── User / Firestore Helpers ──

async function saveUserToFirestore(uid, data) {
  try {
    await firebaseDB.collection('users').doc(uid).set(data, { merge: true });
    return true;
  } catch (e) {
    console.warn('[Curfee] Firestore user save error:', e.message);
    return false;
  }
}

async function getUserFromFirestore(uid) {
  try {
    const doc = await firebaseDB.collection('users').doc(uid).get();
    return doc.exists ? doc.data() : null;
  } catch (e) {
    console.warn('[Curfee] Firestore user read error:', e.message);
    return null;
  }
}

// ── Orders ──

async function saveOrderToFirestore(order) {
  try {
    const uid = firebaseAuth.currentUser?.uid || 'guest';
    const ref = await firebaseDB.collection('orders').add({
      ...order,
      userId: uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log('[Curfee] Order saved to Firestore:', ref.id);
    return ref.id;
  } catch (e) {
    console.warn('[Curfee] Order save error:', e.message);
    return null;
  }
}

async function getOrdersFromFirestore() {
  try {
    const uid = firebaseAuth.currentUser?.uid;
    if (!uid) return [];
    const snap = await firebaseDB.collection('orders')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();
    return snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
  } catch (e) {
    console.warn('[Curfee] Orders fetch error:', e.message);
    return [];
  }
}

// ── Admin Overrides Sync ──

async function syncOverridesToFirestore(key, data) {
  try {
    await firebaseDB.collection('admin_overrides').doc(key).set({
      data,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log('[Curfee] Synced', key, 'to Firestore');
  } catch (e) {
    console.warn('[Curfee] Override sync error for', key, ':', e.message);
  }
}

async function loadOverridesFromFirestore() {
  const keys = ['stock_overrides', 'price_overrides', 'detail_overrides', 'weight_overrides'];
  for (const key of keys) {
    try {
      const doc = await firebaseDB.collection('admin_overrides').doc(key).get();
      if (doc.exists && doc.data().data) {
        localStorage.setItem('ce_' + key, JSON.stringify(doc.data().data));
      }
    } catch (e) {
      // Silently fail — localStorage version will be used as fallback
    }
  }
}

// Load overrides after DOM is ready (non-blocking)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => loadOverridesFromFirestore().catch(() => {}), 500);
  });
} else {
  setTimeout(() => loadOverridesFromFirestore().catch(() => {}), 500);
}

// Expose to global scope
window.firebaseAuth              = firebaseAuth;
window.firebaseDB                = firebaseDB;
window.googleProvider            = googleProvider;
window.saveUserToFirestore       = saveUserToFirestore;
window.getUserFromFirestore      = getUserFromFirestore;
window.saveOrderToFirestore      = saveOrderToFirestore;
window.getOrdersFromFirestore    = getOrdersFromFirestore;
window.syncOverridesToFirestore  = syncOverridesToFirestore;
window.loadOverridesFromFirestore = loadOverridesFromFirestore;
