/* ==========================================================
   Curfee Organic Market — Firebase Core (Firestore + Auth)
   Firebase Compat SDK v9 via CDN — no npm, no bundler
   ========================================================== */

// ── Initialize Firebase ──
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db             = firebase.firestore();
const auth           = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// ══════════════════════════════════════════════════════════════
//  AUTH STATE — keep localStorage in sync
// ══════════════════════════════════════════════════════════════
auth.onAuthStateChanged(async (user) => {
  if (user) {
    let profile = null;
    try {
      const doc = await db.collection('users').doc(user.uid).get();
      profile = doc.exists ? doc.data() : null;
    } catch (e) {}

    if (!profile) {
      profile = {
        name:      user.displayName || user.email?.split('@')[0] || 'User',
        email:     user.email       || '',
        phone:     user.phoneNumber || '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      try { await db.collection('users').doc(user.uid).set(profile, { merge: true }); } catch (e) {}
    }

    localStorage.setItem('curfee_user',  JSON.stringify({ uid: user.uid, ...profile }));
    localStorage.setItem('curfee_token', 'firebase_' + user.uid);
    if (typeof updateAuthUI    === 'function') updateAuthUI();
    if (typeof startCartListener === 'function') startCartListener(user.uid);
  }
});

// ══════════════════════════════════════════════════════════════
//  PRODUCTS — Read from Firestore
//  ⚠️  FIXED: removed orderBy('name') to avoid index errors
//  Products are fetched without ordering — sorted client-side
// ══════════════════════════════════════════════════════════════

/** Get all products (optionally filtered by category / featured / limit) */
async function fsGetProducts(filters = {}) {
  try {
    let ref = db.collection('products');

    // Only apply category filter server-side (no index needed for single where)
    if (filters.category) {
      ref = ref.where('category', '==', filters.category);
    }

    // ⚠️ Do NOT chain orderBy here — it requires a composite Firestore index
    // We sort client-side below instead

    const snap = await ref.get();
    let products = snap.docs.map(d => ({ id: d.id, _id: d.id, ...d.data() }));

    // Client-side filters
    if (filters.isFeatured)   products = products.filter(p => p.isFeatured || p.featured);
    if (filters.isBestseller) products = products.filter(p => p.isBestseller);

    // Client-side sort by name
    products.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    // Apply limit after sort
    if (filters.limit) products = products.slice(0, filters.limit);

    return products;
  } catch (err) {
    console.error('fsGetProducts error:', err);
    throw err;
  }
}

/** Get single product by ID */
async function fsGetProduct(productId) {
  try {
    const doc = await db.collection('products').doc(productId).get();
    if (!doc.exists) return null;
    return { id: doc.id, _id: doc.id, ...doc.data() };
  } catch (err) {
    console.error('fsGetProduct error:', err);
    throw err;
  }
}

/** Get products by category with limit */
async function fsGetProductsByCategory(category, limit = 4) {
  try {
    // No orderBy — avoids index requirement
    const snap = await db.collection('products')
      .where('category', '==', category)
      .get();
    const products = snap.docs.map(d => ({ id: d.id, _id: d.id, ...d.data() }));
    return products.slice(0, limit);
  } catch (err) {
    console.error('fsGetProductsByCategory error:', err);
    throw err;
  }
}

/** Search products by name/description/category (client-side filter) */
async function fsSearchProducts(query) {
  try {
    // Fetch ALL products first (no filter, no orderBy = no index needed)
    const snap = await db.collection('products').get();
    const all  = snap.docs.map(d => ({ id: d.id, _id: d.id, ...d.data() }));

    if (!query || !query.trim()) return all;

    const q = query.toLowerCase().trim();
    return all.filter(p =>
      (p.name        && p.name.toLowerCase().includes(q))        ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.category    && p.category.toLowerCase().includes(q))    ||
      (p.tags        && p.tags.some(t => t.toLowerCase().includes(q)))
    );
  } catch (err) {
    console.error('fsSearchProducts error:', err);
    throw err;
  }
}

// ══════════════════════════════════════════════════════════════
//  CART — Firestore: users/{uid}/cart/{productId}
// ══════════════════════════════════════════════════════════════

let cartUnsubscribe = null;

/** Start real-time cart listener */
function startCartListener(uid) {
  if (cartUnsubscribe) cartUnsubscribe();
  cartUnsubscribe = db.collection('users').doc(uid).collection('cart')
    .onSnapshot(snap => {
      const count = snap.docs.reduce((sum, d) => sum + (d.data().quantity || 1), 0);
      document.querySelectorAll('#cartCount, #cartCountMob, .cart-count-badge, .m-bnav-badge')
        .forEach(el => {
          el.textContent    = count;
          el.style.display  = count > 0 ? '' : 'none';
        });
      window.dispatchEvent(new CustomEvent('cart-updated', {
        detail: snap.docs.map(d => ({ id: d.id, ...d.data() }))
      }));
    });
}

/** Add item to Firestore cart */
async function fsAddToCart(product) {
  const user = auth.currentUser;
  if (!user) {
    window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
    return;
  }

  try {
    const cartRef  = db.collection('users').doc(user.uid).collection('cart')
                       .doc(product.id || product._id);
    const existing = await cartRef.get();

    if (existing.exists) {
      await cartRef.update({ quantity: firebase.firestore.FieldValue.increment(1) });
    } else {
      await cartRef.set({
        name:          product.name          || '',
        price:         product.price         || 0,
        originalPrice: product.originalPrice || product.price || 0,
        imageUrl:      product.imageUrl      || product.images?.[0] || '',
        unit:          product.unit          || '',
        category:      product.category      || '',
        quantity:      1
      });
    }

    if (typeof showToast === 'function') {
      showToast((product.name || 'Item') + ' added to cart! 🛒', 'success');
    }
  } catch (err) {
    console.error('fsAddToCart error:', err);
    if (typeof showToast === 'function') {
      showToast('Failed to add to cart. Please try again.', 'error');
    }
    throw err;
  }
}

/** Update cart item quantity */
async function fsUpdateCartQty(productId, newQty) {
  const user = auth.currentUser;
  if (!user) return;
  if (newQty <= 0) { await fsRemoveFromCart(productId); return; }
  await db.collection('users').doc(user.uid).collection('cart')
    .doc(productId).update({ quantity: newQty });
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
  const snap  = await db.collection('users').doc(user.uid).collection('cart').get();
  const batch = db.batch();
  snap.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();
}

// ══════════════════════════════════════════════════════════════
//  ORDERS
// ══════════════════════════════════════════════════════════════

async function fsSaveOrder(orderData) {
  const user = auth.currentUser;
  if (!user) return null;
  const ref = await db.collection('users').doc(user.uid).collection('orders').add({
    ...orderData,
    status:    'placed',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  return ref.id;
}

async function fsGetOrders() {
  const user = auth.currentUser;
  if (!user) return [];
  // No orderBy to avoid index issues — sort client-side
  const snap = await db.collection('users').doc(user.uid).collection('orders').get();
  const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return orders.sort((a, b) => {
    const ta = a.createdAt?.toMillis?.() || 0;
    const tb = b.createdAt?.toMillis?.() || 0;
    return tb - ta;
  });
}

async function fsGetOrder(orderId) {
  const user = auth.currentUser;
  if (!user) return null;
  const doc = await db.collection('users').doc(user.uid).collection('orders').doc(orderId).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

// ══════════════════════════════════════════════════════════════
//  ADMIN
// ══════════════════════════════════════════════════════════════

async function fsIsAdmin() {
  const user = auth.currentUser;
  if (!user) return false;
  try {
    const doc = await db.collection('admins').doc('config').get();
    if (!doc.exists) return false;
    return (doc.data().emails || []).includes(user.email);
  } catch (e) { return false; }
}

async function fsAdminGetAllOrders() {
  const snap = await db.collectionGroup('orders')
    .orderBy('createdAt', 'desc')
    .limit(100)
    .get();
  return snap.docs.map(d => ({
    id:     d.id,
    userId: d.ref.parent.parent.id,
    ...d.data()
  }));
}

async function fsAdminUpdateOrderStatus(userId, orderId, newStatus) {
  await db.collection('users').doc(userId).collection('orders').doc(orderId)
    .update({ status: newStatus });
}

async function fsAdminAddProduct(productData) {
  const ref = await db.collection('products').add(productData);
  return ref.id;
}

async function fsAdminUpdateProduct(productId, data) {
  await db.collection('products').doc(productId).update(data);
}

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
//  EXPOSE TO GLOBAL SCOPE
// ══════════════════════════════════════════════════════════════
window.db             = db;
window.auth           = auth;
window.googleProvider = googleProvider;
window.firebaseAuth   = auth;
window.firebaseDB     = db;
// Products
window.fsGetProducts           = fsGetProducts;
window.fsGetProduct            = fsGetProduct;
window.fsGetProductsByCategory = fsGetProductsByCategory;
window.fsSearchProducts        = fsSearchProducts;
// Cart
window.fsAddToCart       = fsAddToCart;
window.fsUpdateCartQty   = fsUpdateCartQty;
window.fsRemoveFromCart  = fsRemoveFromCart;
window.fsGetCart         = fsGetCart;
window.fsClearCart       = fsClearCart;
window.startCartListener = startCartListener;
// Orders
window.fsSaveOrder  = fsSaveOrder;
window.fsGetOrders  = fsGetOrders;
window.fsGetOrder   = fsGetOrder;
// Admin
window.fsIsAdmin                  = fsIsAdmin;
window.fsAdminGetAllOrders        = fsAdminGetAllOrders;
window.fsAdminUpdateOrderStatus   = fsAdminUpdateOrderStatus;
window.fsAdminAddProduct          = fsAdminAddProduct;
window.fsAdminUpdateProduct       = fsAdminUpdateProduct;
window.fsAdminDeleteProduct       = fsAdminDeleteProduct;
// User
window.fsSaveUserAddress = fsSaveUserAddress;
window.fsGetUserProfile  = fsGetUserProfile;