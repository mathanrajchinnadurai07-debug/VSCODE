/* ==========================================================
   Curfee Organic Market — Firebase Core (Firestore + Auth)
   Firebase Compat SDK v9 via CDN — no npm, no bundler
   ========================================================== */

// ── Initialize Firebase ──
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db   = firebase.firestore();
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// ══════════════════════════════════════════════════════════════
//  AUTH STATE — keep localStorage in sync
// ══════════════════════════════════════════════════════════════
auth.onAuthStateChanged(async (user) => {
  if (user) {
    // Fetch profile from Firestore
    let profile = null;
    try {
      const doc = await db.collection('users').doc(user.uid).get();
      profile = doc.exists ? doc.data() : null;
    } catch (e) {}

    if (!profile) {
      profile = {
        name: user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        phone: user.phoneNumber || '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      try { await db.collection('users').doc(user.uid).set(profile, { merge: true }); } catch (e) {}
    }

    localStorage.setItem('curfee_user', JSON.stringify({ uid: user.uid, ...profile }));
    localStorage.setItem('curfee_token', 'firebase_' + user.uid);
    if (typeof updateAuthUI === 'function') updateAuthUI();
    if (typeof startCartListener === 'function') startCartListener(user.uid);
  }
});

// ══════════════════════════════════════════════════════════════
//  PRODUCTS — Read from Firestore
// ══════════════════════════════════════════════════════════════

/** Get all products (optionally filtered) */
async function fsGetProducts(filters = {}) {
  let ref = db.collection('products');

  if (filters.category)   ref = ref.where('category', '==', filters.category);
  if (filters.isFeatured) ref = ref.where('isFeatured', '==', true);
  if (filters.isBestseller) ref = ref.where('isBestseller', '==', true);
  if (filters.limit)      ref = ref.limit(filters.limit);

  ref = ref.orderBy('name');

  const snap = await ref.get();
  return snap.docs.map(d => ({ id: d.id, _id: d.id, ...d.data() }));
}

/** Get single product by ID */
async function fsGetProduct(productId) {
  const doc = await db.collection('products').doc(productId).get();
  if (!doc.exists) return null;
  return { id: doc.id, _id: doc.id, ...doc.data() };
}

/** Get products by category with limit */
async function fsGetProductsByCategory(category, limit = 4) {
  const snap = await db.collection('products')
    .where('category', '==', category)
    .limit(limit)
    .get();
  return snap.docs.map(d => ({ id: d.id, _id: d.id, ...d.data() }));
}

/** Search products by name (client-side filter — Firestore doesn't do substring) */
async function fsSearchProducts(query) {
  const all = await fsGetProducts({});
  const q = query.toLowerCase();
  return all.filter(p =>
    p.name.toLowerCase().includes(q) ||
    (p.description && p.description.toLowerCase().includes(q)) ||
    (p.category && p.category.toLowerCase().includes(q))
  );
}

// ══════════════════════════════════════════════════════════════
//  CART — Firestore subcollection: users/{uid}/cart/{productId}
// ══════════════════════════════════════════════════════════════

let cartUnsubscribe = null;

/** Start real-time cart listener */
function startCartListener(uid) {
  if (cartUnsubscribe) cartUnsubscribe();
  cartUnsubscribe = db.collection('users').doc(uid).collection('cart')
    .onSnapshot(snap => {
      const count = snap.docs.reduce((sum, d) => sum + (d.data().quantity || 1), 0);
      // Update all cart count badges
      document.querySelectorAll('#cartCount, #cartCountMob, .cart-count-badge, .m-bnav-badge').forEach(el => {
        el.textContent = count;
        el.style.display = count > 0 ? '' : 'none';
      });
      // Also fire custom event for cart page
      window.dispatchEvent(new CustomEvent('cart-updated', { detail: snap.docs.map(d => ({ id: d.id, ...d.data() })) }));
    });
}

/** Add item to Firestore cart */
async function fsAddToCart(product) {
  const user = auth.currentUser;
  if (!user) { window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href); return; }

  const cartRef = db.collection('users').doc(user.uid).collection('cart').doc(product.id || product._id);
  const existing = await cartRef.get();

  if (existing.exists) {
    await cartRef.update({ quantity: firebase.firestore.FieldValue.increment(1) });
  } else {
    await cartRef.set({
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice || product.price,
      imageUrl: product.imageUrl || product.images?.[0] || '',
      unit: product.unit || '500g',
      category: product.category || '',
      quantity: 1
    });
  }

  if (typeof showToast === 'function') showToast(product.name + ' added to cart! 🛒', 'success');
}

/** Update cart item quantity */
async function fsUpdateCartQty(productId, newQty) {
  const user = auth.currentUser;
  if (!user) return;
  if (newQty <= 0) {
    await fsRemoveFromCart(productId);
    return;
  }
  await db.collection('users').doc(user.uid).collection('cart').doc(productId).update({ quantity: newQty });
}

/** Remove item from cart */
async function fsRemoveFromCart(productId) {
  const user = auth.currentUser;
  if (!user) return;
  await db.collection('users').doc(user.uid).collection('cart').doc(productId).delete();
}

/** Get cart items (one-time read) */
async function fsGetCart() {
  const user = auth.currentUser;
  if (!user) return [];
  const snap = await db.collection('users').doc(user.uid).collection('cart').get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Clear entire cart */
async function fsClearCart() {
  const user = auth.currentUser;
  if (!user) return;
  const snap = await db.collection('users').doc(user.uid).collection('cart').get();
  const batch = db.batch();
  snap.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();
}

// ══════════════════════════════════════════════════════════════
//  ORDERS — Firestore subcollection: users/{uid}/orders
// ══════════════════════════════════════════════════════════════

/** Save order after payment */
async function fsSaveOrder(orderData) {
  const user = auth.currentUser;
  if (!user) return null;
  const ref = await db.collection('users').doc(user.uid).collection('orders').add({
    ...orderData,
    status: 'placed',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  return ref.id;
}

/** Get user's orders */
async function fsGetOrders() {
  const user = auth.currentUser;
  if (!user) return [];
  const snap = await db.collection('users').doc(user.uid).collection('orders')
    .orderBy('createdAt', 'desc')
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Get single order */
async function fsGetOrder(orderId) {
  const user = auth.currentUser;
  if (!user) return null;
  const doc = await db.collection('users').doc(user.uid).collection('orders').doc(orderId).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

// ══════════════════════════════════════════════════════════════
//  ADMIN — check if user is admin
// ══════════════════════════════════════════════════════════════

async function fsIsAdmin() {
  const user = auth.currentUser;
  if (!user) return false;
  try {
    const doc = await db.collection('admins').doc('config').get();
    if (!doc.exists) return false;
    const emails = doc.data().emails || [];
    return emails.includes(user.email);
  } catch (e) {
    return false;
  }
}

/** Admin: Get ALL orders from ALL users */
async function fsAdminGetAllOrders() {
  // Use collectionGroup to query across all users' orders subcollections
  const snap = await db.collectionGroup('orders')
    .orderBy('createdAt', 'desc')
    .limit(100)
    .get();
  return snap.docs.map(d => ({
    id: d.id,
    userId: d.ref.parent.parent.id,
    ...d.data()
  }));
}

/** Admin: Update order status */
async function fsAdminUpdateOrderStatus(userId, orderId, newStatus) {
  await db.collection('users').doc(userId).collection('orders').doc(orderId).update({ status: newStatus });
}

/** Admin: Add product */
async function fsAdminAddProduct(productData) {
  const ref = await db.collection('products').add(productData);
  return ref.id;
}

/** Admin: Update product */
async function fsAdminUpdateProduct(productId, data) {
  await db.collection('products').doc(productId).update(data);
}

/** Admin: Delete product */
async function fsAdminDeleteProduct(productId) {
  await db.collection('products').doc(productId).delete();
}

// ══════════════════════════════════════════════════════════════
//  USER PROFILE
// ══════════════════════════════════════════════════════════════

async function fsSaveUserAddress(address) {
  const user = auth.currentUser;
  if (!user) return;
  await db.collection('users').doc(user.uid).update({ address });
}

async function fsGetUserProfile() {
  const user = auth.currentUser;
  if (!user) return null;
  const doc = await db.collection('users').doc(user.uid).get();
  return doc.exists ? { uid: user.uid, ...doc.data() } : null;
}

// ══════════════════════════════════════════════════════════════
//  EXPOSE ALL TO GLOBAL SCOPE
// ══════════════════════════════════════════════════════════════
window.db = db;
window.auth = auth;
window.googleProvider = googleProvider;
window.firebaseAuth = auth;
window.firebaseDB = db;
// Products
window.fsGetProducts = fsGetProducts;
window.fsGetProduct = fsGetProduct;
window.fsGetProductsByCategory = fsGetProductsByCategory;
window.fsSearchProducts = fsSearchProducts;
// Cart
window.fsAddToCart = fsAddToCart;
window.fsUpdateCartQty = fsUpdateCartQty;
window.fsRemoveFromCart = fsRemoveFromCart;
window.fsGetCart = fsGetCart;
window.fsClearCart = fsClearCart;
window.startCartListener = startCartListener;
// Orders
window.fsSaveOrder = fsSaveOrder;
window.fsGetOrders = fsGetOrders;
window.fsGetOrder = fsGetOrder;
// Admin
window.fsIsAdmin = fsIsAdmin;
window.fsAdminGetAllOrders = fsAdminGetAllOrders;
window.fsAdminUpdateOrderStatus = fsAdminUpdateOrderStatus;
window.fsAdminAddProduct = fsAdminAddProduct;
window.fsAdminUpdateProduct = fsAdminUpdateProduct;
window.fsAdminDeleteProduct = fsAdminDeleteProduct;
// User
window.fsSaveUserAddress = fsSaveUserAddress;
window.fsGetUserProfile = fsGetUserProfile;
