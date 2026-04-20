/* ==========================================================
   Curfee Organic Market — Firebase Initialization
   Firebase v10 (compat CDN-free ESM via script type=module
   is injected via CDN scripts in HTML — we use compat here
   so it works with plain <script> tags without bundling)
   ========================================================== */

// Firebase is loaded via CDN scripts in HTML (compat version)
// This file runs after those scripts are loaded.

const firebaseConfig = {
  apiKey: "AIzaSyDLvzJXuzRcmk7BKew666VxoNS-9E3t9j0",
  authDomain: "curfee-10551.firebaseapp.com",
  projectId: "curfee-10551",
  storageBucket: "curfee-10551.firebasestorage.app",
  messagingSenderId: "450136720734",
  appId: "1:450136720734:web:552f728a27bc6cd121fbcf",
  measurementId: "G-CEYD4R1H7W"
};

// Initialize Firebase (compat SDK)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const firebaseAuth = firebase.auth();
const firebaseDB  = firebase.firestore();

// ---- Google Auth Provider ----
const googleProvider = new firebase.auth.GoogleAuthProvider();

// ---- Helpers ----

/**
 * Save user profile to Firestore (merge so we don't overwrite existing data)
 */
async function saveUserToFirestore(uid, data) {
  try {
    await firebaseDB.collection('users').doc(uid).set(data, { merge: true });
  } catch (e) {
    console.warn('Firestore write error:', e);
  }
}

/**
 * Read user profile from Firestore
 */
async function getUserFromFirestore(uid) {
  try {
    const doc = await firebaseDB.collection('users').doc(uid).get();
    return doc.exists ? doc.data() : null;
  } catch (e) {
    console.warn('Firestore read error:', e);
    return null;
  }
}

/**
 * Save an order to Firestore under /orders/{orderId}
 */
async function saveOrderToFirestore(order) {
  try {
    const uid = firebaseAuth.currentUser?.uid;
    const orderRef = await firebaseDB.collection('orders').add({
      ...order,
      userId: uid || 'guest',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return orderRef.id;
  } catch (e) {
    console.warn('Order save error:', e);
    return null;
  }
}

/**
 * Get orders for current user from Firestore
 */
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
    console.warn('Orders fetch error:', e);
    return [];
  }
}

/**
 * Save admin product overrides (prices, weights, stock) to Firestore
 * Also keeps localStorage in sync for offline/fast access
 */
async function syncOverridesToFirestore(key, data) {
  try {
    await firebaseDB.collection('admin_overrides').doc(key).set({ data, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
  } catch (e) {
    console.warn('Override sync error:', e);
  }
}

/**
 * Load admin overrides from Firestore and merge into localStorage
 */
async function loadOverridesFromFirestore() {
  const keys = ['stock_overrides', 'price_overrides', 'detail_overrides', 'weight_overrides'];
  for (const key of keys) {
    try {
      const doc = await firebaseDB.collection('admin_overrides').doc(key).get();
      if (doc.exists) {
        const data = doc.data().data;
        localStorage.setItem('ce_' + key, JSON.stringify(data));
      }
    } catch (e) {
      console.warn('Override load error for', key, e);
    }
  }
}

// Auto-load overrides when page loads (so website always shows latest admin changes)
window.addEventListener('DOMContentLoaded', () => {
  loadOverridesFromFirestore().catch(() => {});
});

// Expose globally
window.firebaseAuth = firebaseAuth;
window.firebaseDB   = firebaseDB;
window.googleProvider = googleProvider;
window.saveUserToFirestore = saveUserToFirestore;
window.getUserFromFirestore = getUserFromFirestore;
window.saveOrderToFirestore = saveOrderToFirestore;
window.getOrdersFromFirestore = getOrdersFromFirestore;
window.syncOverridesToFirestore = syncOverridesToFirestore;
window.loadOverridesFromFirestore = loadOverridesFromFirestore;
