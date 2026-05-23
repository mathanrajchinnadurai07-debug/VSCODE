/* Curfee Organic Market — Shared App Utilities */
const API_BASE = '/api';

async function api(endpoint, options = {}) {
  const token = localStorage.getItem('curfee_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  } catch (error) { console.error('API Error:', error.message); throw error; }
}

function getUser() { const u = localStorage.getItem('curfee_user'); return u ? JSON.parse(u) : null; }
function getToken() { return localStorage.getItem('curfee_token'); }
function setAuth(userData) {
  if (userData.token) localStorage.setItem('curfee_token', userData.token);
  localStorage.setItem('curfee_user', JSON.stringify(userData));
  updateAuthUI();
}
function logout() {
  localStorage.removeItem('curfee_token');
  localStorage.removeItem('curfee_user');
  localStorage.removeItem('curfee_cart');
  if (typeof auth !== 'undefined') auth.signOut().catch(() => {});
  window.location.href = 'index.html';
}
function isLoggedIn() { return !!(getUser() || getToken()); }
function isAdmin() { const u = getUser(); return u && u.role === 'admin'; }
function requireAuth() { if (!isLoggedIn()) { window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname); return false; } return true; }

function updateAuthUI() {
  const btn = document.getElementById('authBtn'); if (!btn) return;
  const user = getUser();
  if (user) { 
    btn.innerHTML = `<i class="fas fa-user-circle"></i><span style="font-size:0.8rem">${user.name.split(' ')[0]}</span>`; 
    btn.href = 'dashboard.html'; 
    let logoutBtn = document.getElementById('globalLogoutBtn');
    if(!logoutBtn) {
      logoutBtn = document.createElement('a');
      logoutBtn.id = 'globalLogoutBtn';
      logoutBtn.className = btn.className;
      logoutBtn.style.cursor = 'pointer';
      logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i>';
      logoutBtn.onclick = logout;
      btn.parentNode.insertBefore(logoutBtn, btn.nextSibling);
    }
  } else { 
    btn.innerHTML = '<i class="fas fa-user"></i><span style="font-size:0.8rem">Login</span>'; 
    btn.href = 'login.html'; 
    const logoutBtn = document.getElementById('globalLogoutBtn');
    if(logoutBtn) logoutBtn.remove();
  }
}

function getLocalCart() { return JSON.parse(localStorage.getItem('curfee_cart') || '[]'); }
function saveLocalCart(cart) { localStorage.setItem('curfee_cart', JSON.stringify(cart)); updateCartCount(); }
function addToLocalCart(product, weight = '250g', quantity = 1) {
  const cart = getLocalCart();
  const idx = cart.findIndex(i => i.productId === product._id && i.weight === weight);
  if (idx > -1) { cart[idx].quantity += quantity; } else {
    const wo = product.weights ? product.weights.find(w => w.label === weight) : null;
    cart.push({ productId: product._id || product.slug, name: product.name, image: product.images?.[0] || '', price: wo ? (wo.discountPrice || wo.price) : (product.discountPrice || product.price), originalPrice: wo ? wo.price : product.price, weight, quantity, stock: product.stock || 100, slug: product.slug });
  }
  saveLocalCart(cart); showToast(`${product.name} added to cart!`, 'success');
}
function removeFromLocalCart(productId, weight) { let c = getLocalCart(); c = c.filter(i => !(i.productId === productId && i.weight === weight)); saveLocalCart(c); }
function updateLocalCartQuantity(productId, weight, quantity) { const c = getLocalCart(); const i = c.find(x => x.productId === productId && x.weight === weight); if (i) i.quantity = Math.max(1, quantity); saveLocalCart(c); }
function updateCartCount() { const c = getLocalCart(); const n = c.reduce((s, i) => s + i.quantity, 0); const b = document.getElementById('cartCount'); if (b) { b.textContent = n; b.style.display = n > 0 ? 'flex' : 'none'; } }

function getWishlist() { return JSON.parse(localStorage.getItem('curfee_wishlist') || '[]'); }
function toggleWishlist(productId) { let w = getWishlist(); const i = w.indexOf(productId); if (i > -1) { w.splice(i, 1); showToast('Removed from wishlist', 'info'); } else { w.push(productId); showToast('Added to wishlist!', 'success'); } localStorage.setItem('curfee_wishlist', JSON.stringify(w)); updateWishlistCount(); return w.includes(productId); }
function isInWishlist(productId) { return getWishlist().includes(productId); }
function updateWishlistCount() { const n = getWishlist().length; const b = document.getElementById('wishlistCount'); if (b) { b.textContent = n; b.style.display = n > 0 ? 'flex' : 'none'; } }

function showToast(message, type = 'info') {
  const c = document.getElementById('toastContainer'); if (!c) return;
  const t = document.createElement('div'); t.className = `toast ${type}`;
  const icons = { success:'fa-check-circle', error:'fa-exclamation-circle', info:'fa-info-circle', warning:'fa-exclamation-triangle' };
  t.innerHTML = `<i class="fas ${icons[type]||icons.info}"></i> ${message}`; c.appendChild(t);
  setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(100px)'; setTimeout(() => t.remove(), 300); }, 3000);
}

function starsHTML(rating) { let h=''; for (let i=1;i<=5;i++) { h += i <= Math.floor(rating) ? '★' : i-0.5<=rating ? '★' : '☆'; } return h; }

function getCategoryEmoji(category) { return {vegetables:'🥬',fruits:'🍎',biscuits:'🍪',snacks:'🥜',mushroom:'🍄',chicken:'🍗',mutton:'🍖',grocery:'🏪',herbal:'🌿',dryfruits:'🥣',flour:'🌾',beverages:'☕',spreads:'🍯',pickles:'🥒',superfoods:'🧬',readytocook:'🍲'}[category] || '🛒'; }

function applyCardOverrides(p) {
  try {
    const dets = JSON.parse(localStorage.getItem('ce_detail_overrides') || '{}')[p._id] || {};
    const stocks = JSON.parse(localStorage.getItem('ce_stock_overrides') || '{}');
    const prices = JSON.parse(localStorage.getItem('ce_price_overrides') || '{}');
    const weightOverrides = JSON.parse(localStorage.getItem('ce_weight_overrides') || '{}');
    if (dets.name) p.name = dets.name;
    if (dets.category) p.category = dets.category;
    if (dets.rating !== undefined) p.rating = dets.rating;
    if (dets.images) p.images = dets.images;
    if (stocks[p._id] !== undefined) p.stock = stocks[p._id];
    if (prices[p._id + '_price'] !== undefined) p.price = prices[p._id + '_price'];
    if (prices[p._id + '_disc'] !== undefined) p.discountPrice = prices[p._id + '_disc'];
    // Apply weight overrides (admin-edited weight/price variants)
    if (weightOverrides[p._id] && weightOverrides[p._id].length > 0) {
      p.weights = weightOverrides[p._id];
    } else if (p.weights && p.weights.length > 0) {
      if (prices[p._id + '_price'] !== undefined) p.weights[0].price = prices[p._id + '_price'];
      if (prices[p._id + '_disc'] !== undefined) p.weights[0].discountPrice = prices[p._id + '_disc'];
    }
  } catch {}
  return p;
}

function productCardHTML(product) {
  product = applyCardOverrides(product);
  const pid = product._id || product.id || product.slug;
  const imgSrc = product.imageUrl || (product.images && product.images[0]) || '';
  const firstW = product.weights?.[0];
  const showPrice = firstW ? (firstW.discountPrice || firstW.price) : (product.discountPrice || product.price);
  const showOriginal = firstW ? firstW.price : (product.originalPrice || product.price);
  const discount = showOriginal > showPrice ? Math.round(((showOriginal - showPrice) / showOriginal) * 100) : 0;
  const detailUrl = product.id ? 'product-detail.html?id=' + product.id : 'product-detail.html?slug=' + product.slug;
  const inW = isInWishlist(pid);
  const stockVal = product.stock != null ? product.stock : 100;
  const outOfStock = stockVal <= 0;
  const stockLabel = stockVal > 20 ? 'In Stock' : stockVal > 0 ? 'Only ' + stockVal + ' left' : 'Out of Stock';
  const stockClass = stockVal > 20 ? 'in-stock' : stockVal > 0 ? 'low-stock' : 'out-of-stock';
  const catEmoji = getCategoryEmoji(product.category);
  const imgHTML = imgSrc ? '<img src="' + imgSrc + '" alt="' + product.name + '" style="width:100%;height:100%;object-fit:cover;border-radius:calc(var(--radius) - 2px) calc(var(--radius) - 2px) 0 0;">' : '<div class="placeholder-icon">' + catEmoji + '</div>';
  const unitHTML = product.unit ? '<div style="font-size:0.75rem;color:#64748b;margin-top:2px;">' + product.unit + '</div>' : '';
  return '<div class="product-card' + (outOfStock ? ' out-of-stock-card' : '') + '" data-id="' + pid + '"><div class="product-badges">' + (discount > 0 ? '<span class="badge badge-sale">' + discount + '% OFF</span>' : '') + '</div><button class="wishlist-btn ' + (inW ? 'active' : '') + '" onclick="handleWishlist(\'' + pid + '\',this)"><i class="' + (inW ? 'fas' : 'far') + ' fa-heart"></i></button><a href="' + detailUrl + '" class="product-image">' + imgHTML + '</a><div class="product-info"><div class="product-category">' + (product.category || '') + '</div><h3 class="product-name"><a href="' + detailUrl + '">' + product.name + '</a></h3><div class="product-price"><span class="price-current">₹' + showPrice + '</span>' + (discount > 0 ? '<span class="price-original">₹' + showOriginal + '</span><span class="price-discount">' + discount + '% off</span>' : '') + '</div>' + unitHTML + '<div class="product-stock ' + stockClass + '"><i class="fas fa-circle" style="font-size:0.5rem"></i> ' + stockLabel + '</div><button class="add-to-cart-btn" ' + (outOfStock ? 'disabled style="opacity:0.5;cursor:not-allowed;" ' : '') + 'onclick="handleAddToCart(event,\'' + pid + '\')"><i class="fas fa-' + (outOfStock ? 'ban' : 'cart-plus') + '"></i> ' + (outOfStock ? 'Out of Stock' : 'Add to Cart') + '</button></div></div>';
}

function handleWishlist(productId, btn) { const active = toggleWishlist(productId); const icon = btn.querySelector('i'); if (active) { btn.classList.add('active'); icon.className='fas fa-heart'; } else { btn.classList.remove('active'); icon.className='far fa-heart'; } }

let productsCache = {};
async function handleAddToCart(event, productId) {
  event.preventDefault(); event.stopPropagation();

  // Try Firestore first
  if (typeof fsAddToCart === 'function') {
    let product = productsCache[productId];
    if (!product) {
      // Try fetching from Firestore
      try { product = await fsGetProduct(productId); productsCache[productId] = product; } catch {}
    }
    if (!product) {
      // Fallback: build from card HTML
      const card = event.target.closest('.product-card');
      product = { id: productId, _id: productId, name: card?.querySelector('.product-name a')?.textContent || 'Product', price: parseInt(card?.querySelector('.price-current')?.textContent?.replace('₹','') || '0'), imageUrl: card?.querySelector('img')?.src || '' };
    }
    await fsAddToCart(product);
    return;
  }

  // Fallback to local cart
  const card = event.target.closest('.product-card'); let weight = '250g';
  if (card) { const aw = card.querySelector('.weight-option.active'); if (aw) weight = aw.dataset.weight; }
  let product = productsCache[productId];
  if (!product) {
    product = { _id: productId, slug: productId, name: card?.querySelector('.product-name a')?.textContent || productId, price: 0, images: [], stock: 100 };
  }
  addToLocalCart(product, weight);
}

function initSearch() {
  const btn = document.getElementById('searchBtn'), input = document.getElementById('searchInput'), cat = document.getElementById('searchCategory');
  if (btn) btn.addEventListener('click', doSearch);
  if (input) input.addEventListener('keypress', e => { if (e.key==='Enter') doSearch(); });
  function doSearch() { const q = input?.value.trim(); const c = cat?.value; let url = 'products.html?'; if (q) url += `search=${encodeURIComponent(q)}&`; if (c) url += `category=${c}&`; window.location.href = url; }
}

function initLocation() { const btn = document.getElementById('locationBtn'); if (btn) btn.addEventListener('click', e => { e.preventDefault(); if (navigator.geolocation) { document.getElementById('userLocation').textContent='Detecting...'; navigator.geolocation.getCurrentPosition(() => { document.getElementById('userLocation').textContent='Location Set ✓'; }, () => { document.getElementById('userLocation').textContent='Mumbai, MH'; }); } }); }

function initChat() {
  const toggle = document.getElementById('chatToggle'), chatBox = document.getElementById('chatBox'), input = document.getElementById('chatInput'), sendBtn = document.getElementById('chatSend'), messages = document.getElementById('chatMessages');
  if (toggle) toggle.addEventListener('click', () => chatBox?.classList.toggle('open'));
  function sendMessage() { if (!input || !input.value.trim()) return; const msg = input.value.trim(); messages.innerHTML += `<div style="padding:8px 10px;background:#2d6a4f;color:#fff;border-radius:8px;margin-bottom:8px;font-size:0.85rem;text-align:right;">${msg}</div>`; input.value = '';
    setTimeout(() => { const replies = ["Thanks for reaching out! Our team will assist you shortly.","We appreciate your message. Typical response time is under 5 minutes.","Got it! Let me check that for you.", "You can also reach us at curfee01@gmail.com", "Want faster help? <a href='https://wa.me/917845744038?text=Hi%20Curfee!' target='_blank' style='color:inherit;text-decoration:underline;font-weight:bold;'>Chat on WhatsApp</a>"]; const reply = replies[Math.floor(Math.random()*replies.length)]; messages.innerHTML += `<div style="padding:8px 10px;background:#f0f4f0;border-radius:8px;margin-bottom:8px;font-size:0.85rem;"><strong>Support:</strong> ${reply}</div>`; messages.scrollTop = messages.scrollHeight; }, 1000); }
  sendBtn?.addEventListener('click', sendMessage); input?.addEventListener('keypress', e => { if (e.key==='Enter') sendMessage(); });
}

document.addEventListener('click', e => { if (e.target.classList.contains('weight-option')) { const card = e.target.closest('.product-card'); if (card) { card.querySelectorAll('.weight-option').forEach(w => w.classList.remove('active')); e.target.classList.add('active'); const price = e.target.dataset.price; if (price) { const p = card.querySelector('.price-current'); if (p) p.textContent = '₹' + price; } } } });

function loadStoreConfig() {
  try {
    const s = JSON.parse(localStorage.getItem('ce_store_settings') || '{}');
    const helpline = s.helpline || '+91 78457 44038';
    const storeName = s.storeName || 'Curfee Organic Market';
    document.querySelectorAll('.app-dynamic-helpline').forEach(el => {
      if (el.tagName === 'A') el.href = `tel:${helpline.replace(/\s+/g, '')}`;
      el.textContent = helpline;
    });
    document.querySelectorAll('.app-dynamic-storename').forEach(el => el.textContent = storeName);
  } catch (err) { console.error('Error loading store config', err); }
}

document.addEventListener('DOMContentLoaded', () => { updateAuthUI(); updateCartCount(); updateWishlistCount(); initSearch(); initLocation(); initChat(); loadStoreConfig(); });

// Added backward compatibility for addToCart as requested
window.addToCart = async function(productId, name, price, originalPrice, image) {
  // We check if auth and db are available globally
  if (typeof auth === 'undefined' || typeof db === 'undefined') {
    if (typeof fsAddToCart !== 'undefined') {
      return fsAddToCart(productId, name, price, image, '');
    }
    console.error('Firebase not initialized.');
    return;
  }
  
  const user = auth.currentUser;
  if (!user) {
    if (typeof showToast !== 'undefined') showToast('Please login to add items to cart', 'warning');
    setTimeout(() => {
      window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
    }, 1500);
    return;
  }
  try {
    const ref = db.collection('users').doc(user.uid).collection('cart').doc(productId);
    const doc = await ref.get();
    if (doc.exists) {
      await ref.update({ quantity: firebase.firestore.FieldValue.increment(1) });
    } else {
      await ref.set({
        productId, name, price, originalPrice: originalPrice || price,
        image: image || '', quantity: 1,
        addedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    if (typeof showToast !== 'undefined') showToast(`✅ ${name} added to cart!`, 'success');
    if (typeof updateCartCount !== 'undefined') updateCartCount();
  } catch (err) {
    console.error('Cart error:', err);
    if (typeof showToast !== 'undefined') showToast('Failed to add to cart. Try again.', 'error');
  }
};
