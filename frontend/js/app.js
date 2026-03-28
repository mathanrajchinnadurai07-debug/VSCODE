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
function setAuth(userData) { localStorage.setItem('curfee_token', userData.token); localStorage.setItem('curfee_user', JSON.stringify(userData)); updateAuthUI(); }
function logout() { localStorage.removeItem('curfee_token'); localStorage.removeItem('curfee_user'); localStorage.removeItem('curfee_cart'); window.location.href = 'index.html'; }
function isLoggedIn() { return !!getToken(); }
function isAdmin() { const u = getUser(); return u && u.role === 'admin'; }
function requireAuth() { if (!isLoggedIn()) { window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname); return false; } return true; }

function updateAuthUI() {
  const btn = document.getElementById('authBtn'); if (!btn) return;
  const user = getUser();
  if (user) { btn.innerHTML = `<i class="fas fa-user-circle"></i><span>${user.name.split(' ')[0]}</span>`; btn.href = 'dashboard.html'; }
  else { btn.innerHTML = '<i class="fas fa-user"></i><span>Login</span>'; btn.href = 'login.html'; }
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

function productCardHTML(product) {
  const firstW = product.weights?.[0]; const showPrice = firstW ? (firstW.discountPrice || firstW.price) : (product.discountPrice || product.price); const showOriginal = firstW ? firstW.price : product.price;
  const discount = showOriginal > 0 ? Math.round(((showOriginal - showPrice) / showOriginal) * 100) : 0;
  const inW = isInWishlist(product._id || product.slug); const outOfStock = product.stock <= 0;
  const stockLabel = product.stock > 20 ? 'In Stock' : product.stock > 0 ? `Only ${product.stock} left` : 'Out of Stock';
  const stockClass = product.stock > 20 ? 'in-stock' : product.stock > 0 ? 'low-stock' : 'out-of-stock';
  return `<div class="product-card${outOfStock?' out-of-stock-card':''}" data-id="${product._id||product.slug}"><div class="product-badges">${discount>0?`<span class="badge badge-sale">${discount}% OFF</span>`:''}</div><button class="wishlist-btn ${inW?'active':''}" onclick="handleWishlist('${product._id||product.slug}',this)"><i class="${inW?'fas':'far'} fa-heart"></i></button><a href="product-detail.html?slug=${product.slug}" class="product-image">${product.images&&product.images.length?`<img src="${product.images[0]}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover;border-radius:calc(var(--radius) - 2px) calc(var(--radius) - 2px) 0 0;">`:`<div class="placeholder-icon">${getCategoryEmoji(product.category)}</div>`}</a><div class="product-info"><div class="product-category">${product.category}</div><h3 class="product-name"><a href="product-detail.html?slug=${product.slug}">${product.name}</a></h3><div class="product-rating"><span class="stars">${starsHTML(product.rating)}</span><span class="rating-count">(${product.numReviews||0})</span></div><div class="product-price"><span class="price-current">₹${showPrice}</span>${discount>0?`<span class="price-original">₹${showOriginal}</span><span class="price-discount">${discount}% off</span>`:''}</div><div class="weight-options">${(product.weights||[]).slice(0,3).map((w,i)=>`<span class="weight-option ${i===0?'active':''}" data-weight="${w.label}" data-price="${w.discountPrice||w.price}">${w.label}</span>`).join('')}</div><div class="product-stock ${stockClass}"><i class="fas fa-circle" style="font-size:0.5rem"></i> ${stockLabel}</div><button class="add-to-cart-btn" ${outOfStock?'disabled style="opacity:0.5;cursor:not-allowed;"':''}onclick="handleAddToCart(event,'${product.slug}')"><i class="fas fa-${outOfStock?'ban':'cart-plus'}"></i> ${outOfStock?'Out of Stock':'Add to Cart'}</button></div></div>`;
}

function handleWishlist(productId, btn) { const active = toggleWishlist(productId); const icon = btn.querySelector('i'); if (active) { btn.classList.add('active'); icon.className='fas fa-heart'; } else { btn.classList.remove('active'); icon.className='far fa-heart'; } }

let productsCache = {};
async function handleAddToCart(event, slug) {
  event.preventDefault(); event.stopPropagation();
  const card = event.target.closest('.product-card'); let weight = '250g';
  if (card) { const aw = card.querySelector('.weight-option.active'); if (aw) weight = aw.dataset.weight; }
  let product = productsCache[slug];
  if (!product) { try { const d = await api(`/products/slug/${slug}`); product = d; productsCache[slug] = product; } catch { product = { _id:slug, slug, name: card?.querySelector('.product-name a')?.textContent||slug, price:0, discountPrice:0, images:[], stock:100 }; } }
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
    setTimeout(() => { const replies = ["Thanks for reaching out! Our team will assist you shortly.","We appreciate your message. Typical response time is under 5 minutes.","Got it! Let me check that for you.","You can also reach us at support@curfee.com"]; const reply = replies[Math.floor(Math.random()*replies.length)]; messages.innerHTML += `<div style="padding:8px 10px;background:#f0f4f0;border-radius:8px;margin-bottom:8px;font-size:0.85rem;"><strong>Support:</strong> ${reply}</div>`; messages.scrollTop = messages.scrollHeight; }, 1000); }
  sendBtn?.addEventListener('click', sendMessage); input?.addEventListener('keypress', e => { if (e.key==='Enter') sendMessage(); });
}

document.addEventListener('click', e => { if (e.target.classList.contains('weight-option')) { const card = e.target.closest('.product-card'); if (card) { card.querySelectorAll('.weight-option').forEach(w => w.classList.remove('active')); e.target.classList.add('active'); const price = e.target.dataset.price; if (price) { const p = card.querySelector('.price-current'); if (p) p.textContent = '₹' + price; } } } });

document.addEventListener('DOMContentLoaded', () => { updateAuthUI(); updateCartCount(); updateWishlistCount(); initSearch(); initLocation(); initChat(); });
