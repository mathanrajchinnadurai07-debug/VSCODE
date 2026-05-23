/* ============================================================
   Curfee Store Editor — editor.js  (Firestore version)
   All saves now write to Firestore so the live website
   reflects changes instantly for every user.
   ============================================================ */

// ===== FIRESTORE COLLECTIONS =====
// products         → product catalog (read by website)
// store_config     → single doc "settings" for store settings
// store_config     → single doc "branding" for brand colors/name
// store_config     → single doc "split_config" for payout %
// store_config     → single doc "payment_config" for Razorpay keys
// store_config     → single doc "homepage" for banners/deals
// store_config     → single doc "categories" for nav categories
// sellers          → seller documents
// delivery_partners→ delivery partner documents
// orders           → order documents (written by checkout)
// customers        → customer records

// ===== LOCAL FALLBACK (non-critical UI state only) =====
const DB = {
  get: (k, d = null) => { try { return JSON.parse(localStorage.getItem('ce_' + k)) ?? d; } catch { return d; } },
  set: (k, v) => localStorage.setItem('ce_' + k, JSON.stringify(v)),
};

// ===== FIRESTORE HELPERS =====
function fsDoc(collection, docId) {
  return db.collection(collection).doc(docId);
}

async function fsGet(collection, docId) {
  try {
    const snap = await db.collection(collection).doc(docId).get();
    return snap.exists ? snap.data() : null;
  } catch (e) {
    console.error('fsGet error:', e);
    return null;
  }
}

async function fsSet(collection, docId, data) {
  try {
    await db.collection(collection).doc(docId).set(data, { merge: true });
    return true;
  } catch (e) {
    console.error('fsSet error:', e);
    showToast('Save failed: ' + e.message, 'error');
    return false;
  }
}

// ===== TOAST =====
function showToast(msg, type = 'success') {
  const tc = document.getElementById('toastContainer');
  const t = document.createElement('div');
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${icons[type] || '✅'}</span> ${msg}`;
  tc.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ===== NAVIGATION =====
document.querySelectorAll('.nav-item[data-section]').forEach(btn => {
  btn.addEventListener('click', () => goSection(btn.dataset.section));
});

function goSection(name) {
  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.section === name));
  document.querySelectorAll('.editor-section').forEach(s => s.classList.toggle('active', s.id === 'section-' + name));
  const titles = {
    dashboard: 'Dashboard', payout: 'Payout Splits', products: 'Products & Stock',
    addproduct: 'Add Product', customers: 'Customers', sellers: 'Sellers & Delivery',
    orders: 'Order Management', branding: 'Branding', settings: 'Store Settings', payment: 'Payment Config',
    homepage: 'Homepage Manager', catmanager: 'Categories Manager'
  };
  document.getElementById('pageTitle').textContent = titles[name] || name;
  document.getElementById('pageBreadcrumb').textContent = `Curfee Store Editor → ${titles[name] || name}`;
  if (name === 'products') renderProductTable();
  if (name === 'customers') renderCustomerTable();
  if (name === 'sellers') renderSellerTable();
  if (name === 'orders') renderOrderTable();
  if (name === 'payout') { loadPayoutSection(); }
  if (name === 'branding') loadBrandingForm();
  if (name === 'settings') loadSettings();
  if (name === 'payment') loadPaymentConfig();
  if (name === 'homepage') loadHomepageManager();
  if (name === 'catmanager') loadCategoryManager();
  if (window.innerWidth < 900) document.getElementById('editorSidebar').classList.remove('open');
}

function toggleSidebar() {
  document.getElementById('editorSidebar').classList.toggle('open');
}

// ===== PRODUCTS — read from Firestore =====
let allProdsCache = [];

async function loadAllProductsFromFirestore() {
  try {
    const snap = await db.collection('products').orderBy('name').get();
    allProdsCache = snap.docs.map(d => ({ _id: d.id, firestoreId: d.id, ...d.data() }));
    return allProdsCache;
  } catch (e) {
    console.error('Load products error:', e);
    return [];
  }
}

function getProductStock(p) { return p.stock ?? 0; }
function getProductPrice(p) { return p.price ?? 0; }
function getProductDiscPrice(p) { return p.discountedPrice ?? p.discountPrice ?? p.price ?? 0; }

// ===== SPLIT CONFIG =====
let _splitConfigCache = null;

async function getSplitConfig() {
  if (_splitConfigCache) return _splitConfigCache;
  const data = await fsGet('store_config', 'split_config');
  _splitConfigCache = data || { seller: 70, delivery: 20, platform: 10 };
  return _splitConfigCache;
}

// ===== DASHBOARD =====
async function loadDashboard() {
  // Orders from Firestore
  let orders = [];
  try {
    const snap = await db.collection('orders').orderBy('createdAt', 'desc').limit(50).get();
    orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { console.warn('Orders load:', e); }

  // Customers from Firestore
  let customerCount = 0;
  try {
    const snap = await db.collection('customers').get();
    customerCount = snap.size;
  } catch (e) { console.warn('Customers load:', e); }

  const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  document.getElementById('dashRevenue').textContent = '₹' + revenue.toLocaleString('en-IN');
  document.getElementById('dashOrders').textContent = orders.length;
  document.getElementById('dashCustomers').textContent = customerCount;

  const pending = orders.filter(o => !o.status || o.status === 'placed').length;
  document.getElementById('pendingBadge').textContent = pending;
  document.getElementById('pendingBadge').style.display = pending ? '' : 'none';

  // Products count
  if (!allProdsCache.length) await loadAllProductsFromFirestore();
  document.getElementById('dashProducts').textContent = allProdsCache.length;

  // Recent orders
  const ro = document.getElementById('dashRecentOrders');
  if (!orders.length) {
    ro.innerHTML = '<div style="padding:0 24px;color:#94a3b8;font-size:0.85rem;">No orders yet.</div>';
  } else {
    ro.innerHTML = orders.slice(0, 6).map(o => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 24px;border-bottom:1px solid #f1f5f9;">
        <div>
          <div style="font-weight:600;font-size:0.84rem;">${o.orderNumber || o.id || '—'}</div>
          <div style="font-size:0.74rem;color:#64748b;">${(o.shippingAddress?.fullName || 'Customer')} · ${o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString('en-IN') : '—'}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-weight:700;font-size:0.9rem;">₹${o.total || 0}</div>
          <span class="status-badge ${o.status || 'placed'}">${o.status || 'placed'}</span>
        </div>
      </div>`).join('');
  }

  // Low stock
  const ls = document.getElementById('dashLowStock');
  const allLow = allProdsCache.filter(p => getProductStock(p) < 30);
  allLow.sort((a, b) => getProductStock(a) - getProductStock(b));
  const countEl = document.getElementById('lowStockCount');
  if (countEl) countEl.textContent = allLow.length ? allLow.length + ' items' : '';

  if (!allLow.length) {
    ls.innerHTML = '<div style="padding:20px 24px;color:#10b981;font-size:0.85rem;text-align:center;"><i class="fas fa-check-circle" style="font-size:1.5rem;display:block;margin-bottom:8px;"></i>All products well-stocked!</div>';
  } else {
    ls.innerHTML = allLow.slice(0, 8).map(p => {
      const stk = getProductStock(p);
      const cls = stk === 0 ? 'out' : stk < 10 ? 'low' : 'medium';
      const bgColor = stk === 0 ? '#fef2f2' : stk < 10 ? '#fffbeb' : '#f0fdf4';
      const imgs = p.images || [];
      const img = (Array.isArray(imgs) ? imgs[0] : imgs) || '';
      return `<div style="display:flex;align-items:center;gap:12px;padding:10px 16px;border-bottom:1px solid #f1f5f9;background:${bgColor};">
        <img src="assets/images/products/${img.split('/').pop()}" style="width:32px;height:32px;border-radius:6px;object-fit:cover;border:1px solid #e2e8f0;" onerror="this.src='assets/images/products/tomato.png'">
        <div style="flex:1;min-width:0;">
          <div style="font-weight:600;font-size:0.82rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.name}</div>
          <div style="font-size:0.7rem;color:#94a3b8;">${p.category}</div>
        </div>
        <input class="inline-input" type="number" value="${stk}" onchange="quickUpdateStock('${p._id}',this.value)" style="width:55px;font-size:0.8rem;padding:4px 6px;text-align:center;">
        <span class="stock-badge ${cls}" style="font-size:0.7rem;min-width:70px;text-align:center;">${stk === 0 ? '✗ Out' : stk < 10 ? '⚠ ' + stk + ' left' : stk + ' left'}</span>
      </div>`;
    }).join('');
  }

  // Payout
  const sp = await getSplitConfig();
  renderPayoutDisplay('dashPayoutBar', 'dashPayoutGrid', sp, 0);
}

async function quickUpdateStock(id, val) {
  const stock = Math.max(0, parseInt(val) || 0);
  try {
    await db.collection('products').doc(id).update({ stock });
    // update cache
    const p = allProdsCache.find(x => x._id === id);
    if (p) p.stock = stock;
    showToast('Stock updated!', 'success');
  } catch (e) {
    showToast('Stock update failed: ' + e.message, 'error');
  }
}

function showAllLowStock() {
  const allLow = allProdsCache.filter(p => getProductStock(p) < 30);
  allLow.sort((a, b) => getProductStock(a) - getProductStock(b));
  const outCount = allLow.filter(p => getProductStock(p) === 0).length;
  const critCount = allLow.filter(p => getProductStock(p) > 0 && getProductStock(p) < 10).length;
  const warnCount = allLow.filter(p => getProductStock(p) >= 10).length;

  const html = `<div style="padding:24px;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
      <h2 style="margin:0;font-size:1.1rem;"><i class="fas fa-exclamation-triangle" style="color:#f59e0b;"></i> All Low Stock Items (${allLow.length})</h2>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <span style="padding:4px 12px;border-radius:16px;font-size:0.72rem;font-weight:600;background:#fef2f2;color:#dc2626;">${outCount} Out of Stock</span>
        <span style="padding:4px 12px;border-radius:16px;font-size:0.72rem;font-weight:600;background:#fffbeb;color:#d97706;">${critCount} Critical</span>
        <span style="padding:4px 12px;border-radius:16px;font-size:0.72rem;font-weight:600;background:#f0fdf4;color:#16a34a;">${warnCount} Warning</span>
      </div>
    </div>
    <div style="max-height:60vh;overflow-y:auto;border:1px solid var(--border);border-radius:var(--radius);">
      <table class="editor-table" style="width:100%;">
        <thead><tr>
          <th>Product</th><th>Category</th><th>Stock</th><th>Update</th><th>Status</th>
        </tr></thead>
        <tbody>${allLow.map(p => {
          const stk = getProductStock(p);
          const cls = stk === 0 ? 'out' : stk < 10 ? 'low' : 'medium';
          return `<tr>
            <td><strong>${p.name}</strong></td>
            <td>${p.category}</td>
            <td style="font-weight:700;color:${stk===0?'#dc2626':stk<10?'#d97706':'#16a34a'}">${stk}</td>
            <td><input class="inline-input" type="number" value="${stk}" onchange="quickUpdateStock('${p._id}',this.value)" style="width:65px;text-align:center;"></td>
            <td><span class="stock-badge ${cls}">${stk===0?'Out':stk<10?'Critical':'Low'}</span></td>
          </tr>`;
        }).join('')}</tbody>
      </table>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;">
      <button class="btn btn-outline" onclick="closeModal('lowStockModal')">Close</button>
      <button class="btn btn-primary" onclick="closeModal('lowStockModal');goSection('products')">Go to Products</button>
    </div>
  </div>`;

  let modal = document.getElementById('lowStockModal');
  if (!modal) { modal = document.createElement('div'); modal.id = 'lowStockModal'; modal.className = 'modal-overlay'; document.body.appendChild(modal); }
  modal.innerHTML = `<div class="modal-box" style="max-width:800px;width:95%;">${html}</div>`;
  modal.classList.add('active');
}

function renderPayoutDisplay(barId, gridId, sp, sampleAmount) {
  const bar = document.getElementById(barId);
  const grid = document.getElementById(gridId);
  if (bar) bar.innerHTML = `
    <div class="payout-bar-seg" style="width:${sp.seller}%;background:#4caf50;"></div>
    <div class="payout-bar-seg" style="width:${sp.delivery}%;background:#2196f3;"></div>
    <div class="payout-bar-seg" style="width:${sp.platform}%;background:#f44336;"></div>`;
  if (grid) grid.innerHTML = `
    <div class="payout-item seller">
      <div class="payout-pct">${sp.seller}%</div>
      <div class="payout-desc">🧑‍🌾 Seller</div>
      ${sampleAmount ? `<div class="payout-amount">₹${Math.round(sampleAmount * sp.seller / 100)}</div>` : ''}
    </div>
    <div class="payout-item delivery">
      <div class="payout-pct">${sp.delivery}%</div>
      <div class="payout-desc">🚴 Delivery</div>
      ${sampleAmount ? `<div class="payout-amount">₹${Math.round(sampleAmount * sp.delivery / 100)}</div>` : ''}
    </div>
    <div class="payout-item platform">
      <div class="payout-pct">${sp.platform}%</div>
      <div class="payout-desc">🏪 Platform</div>
      ${sampleAmount ? `<div class="payout-amount">₹${Math.round(sampleAmount * sp.platform / 100)}</div>` : ''}
    </div>`;
}

// ===== PAYOUT SECTION =====
async function loadPayoutSection() {
  const sp = await getSplitConfig();
  document.getElementById('splitSeller').value = sp.seller;
  document.getElementById('splitDelivery').value = sp.delivery;
  document.getElementById('splitPlatform').value = sp.platform;
  updateSplitPreview();
  simulatePayout();
  // Load account IDs
  const accts = await fsGet('store_config', 'payment_config') || {};
  if (document.getElementById('sellerAccountId')) document.getElementById('sellerAccountId').value = accts.sellerAccountId || '';
  if (document.getElementById('deliveryAccountId')) document.getElementById('deliveryAccountId').value = accts.deliveryAccountId || '';
}

function updateSplitPreview() {
  const s = parseInt(document.getElementById('splitSeller').value) || 0;
  const d = parseInt(document.getElementById('splitDelivery').value) || 0;
  const p = parseInt(document.getElementById('splitPlatform').value) || 0;
  const total = s + d + p;
  const bar = document.getElementById('splitPayoutBar');
  const tbar = document.getElementById('splitTotalBar');
  if (bar) bar.innerHTML = `
    <div class="payout-bar-seg" style="width:${s}%;background:#4caf50;"></div>
    <div class="payout-bar-seg" style="width:${d}%;background:#2196f3;"></div>
    <div class="payout-bar-seg" style="width:${p}%;background:#f44336;"></div>`;
  if (tbar) tbar.innerHTML = `
    <span class="split-pill seller">Seller: ${s}%</span>
    <span class="split-pill delivery">Delivery: ${d}%</span>
    <span class="split-pill platform">Platform: ${p}%</span>
    <span style="margin-left:8px;" class="${total === 100 ? 'split-ok' : 'split-error'}">
      ${total === 100 ? '✅ Total: 100%' : `⚠️ Total: ${total}% (must be 100)`}
    </span>`;
}

async function saveSplitConfig() {
  const s = parseInt(document.getElementById('splitSeller').value) || 0;
  const d = parseInt(document.getElementById('splitDelivery').value) || 0;
  const p = parseInt(document.getElementById('splitPlatform').value) || 0;
  if (s + d + p !== 100) { showToast('Splits must add up to 100%!', 'error'); return; }
  const ok = await fsSet('store_config', 'split_config', { seller: s, delivery: d, platform: p });
  if (ok) {
    _splitConfigCache = { seller: s, delivery: d, platform: p };
    showToast(`Split saved to Firestore: Seller ${s}% | Delivery ${d}% | Platform ${p}%`, 'success');
    renderPayoutDisplay('dashPayoutBar', 'dashPayoutGrid', _splitConfigCache, 0);
  }
}

async function simulatePayout() {
  const amt = parseFloat(document.getElementById('simAmount')?.value) || 500;
  const sp = await getSplitConfig();
  renderPayoutDisplay('splitPayoutBar', 'simResult', sp, amt);
}

async function saveAccountIds() {
  const ok = await fsSet('store_config', 'payment_config', {
    sellerAccountId: document.getElementById('sellerAccountId').value.trim(),
    deliveryAccountId: document.getElementById('deliveryAccountId').value.trim(),
  });
  if (ok) showToast('Account IDs saved to Firestore! Also add to .env for production.', 'success');
}

// ===== PRODUCTS TABLE — reads from Firestore =====
async function renderProductTable() {
  const body = document.getElementById('productTableBody');
  body.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:#94a3b8;"><i class="fas fa-spinner fa-spin"></i> Loading from Firestore...</td></tr>';

  await loadAllProductsFromFirestore();
  renderFilteredProducts(allProdsCache);
  document.getElementById('productTableFooter').textContent = `${allProdsCache.length} products across 16 categories`;
}

function renderFilteredProducts(prods) {
  const body = document.getElementById('productTableBody');
  if (!prods.length) {
    body.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#94a3b8;padding:40px;">No products found</td></tr>';
    return;
  }
  const catColors = {
    vegetables:'#15803d',fruits:'#b45309',biscuits:'#7c3aed',snacks:'#0891b2',
    mushroom:'#92400e',chicken:'#c2410c',mutton:'#be185d',grocery:'#1d4ed8',
    herbal:'#065f46',dryfruits:'#a16207',flour:'#6b7280',beverages:'#0369a1',
    spreads:'#7c2d12',pickles:'#4d7c0f',superfoods:'#0f766e',readytocook:'#7e22ce'
  };
  body.innerHTML = prods.map(p => {
    const stk = getProductStock(p);
    const stkcls = stk === 0 ? 'out' : stk < 10 ? 'low' : stk < 30 ? 'medium' : 'high';
    const cc = catColors[p.category] || '#475569';
    const imgs = p.images || [];
    const img = (Array.isArray(imgs) ? imgs[0] : imgs) || 'tomato.png';
    return `<tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px;">
          <img src="assets/images/products/${img.split('/').pop()}" style="width:36px;height:36px;border-radius:8px;object-fit:cover;border:1px solid #e2e8f0;" onerror="this.src='assets/images/products/tomato.png'">
          <div>
            <div style="font-weight:600;font-size:0.85rem;">${p.name}</div>
            <div style="font-size:0.72rem;color:#94a3b8;">${p.slug || p._id}</div>
          </div>
        </div>
      </td>
      <td><span style="background:${cc}22;color:${cc};padding:3px 10px;border-radius:12px;font-size:0.72rem;font-weight:600;">${p.category}</span></td>
      <td><input class="inline-input" type="number" value="${getProductPrice(p)}" onchange="quickUpdateField('${p._id}','price',this.value)" style="width:80px;"></td>
      <td><input class="inline-input" type="number" value="${getProductDiscPrice(p)}" onchange="quickUpdateField('${p._id}','discountedPrice',this.value)" style="width:80px;"></td>
      <td>
        <div style="display:flex;align-items:center;gap:6px;">
          <input class="inline-input" type="number" value="${stk}" onchange="quickUpdateStock('${p._id}',this.value)" style="width:70px;">
          <span class="stock-badge ${stkcls}">${stk === 0 ? '✗' : stk < 10 ? '⚠' : '✓'}</span>
        </div>
      </td>
      <td><span class="status-badge ${stk > 0 ? 'active' : 'inactive'}">${stk > 0 ? 'In Stock' : 'Out of Stock'}</span></td>
      <td>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-outline btn-sm btn-icon" onclick="openEditProduct('${p._id}')" title="Edit"><i class="fas fa-edit"></i></button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="deleteProduct('${p._id}')" title="Delete"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

async function quickUpdateField(id, field, val) {
  const update = {};
  update[field] = parseFloat(val) || 0;
  try {
    await db.collection('products').doc(id).update(update);
    const p = allProdsCache.find(x => x._id === id);
    if (p) p[field] = update[field];
    showToast('Updated!', 'success');
  } catch (e) {
    showToast('Update failed: ' + e.message, 'error');
  }
}

function filterProductTable() {
  const q = (document.getElementById('productSearch')?.value || '').toLowerCase();
  const cat = document.getElementById('catFilterProd')?.value || '';
  const filtered = allProdsCache.filter(p =>
    (!q || (p.name||'').toLowerCase().includes(q) || (p.slug||'').includes(q)) &&
    (!cat || p.category === cat)
  );
  renderFilteredProducts(filtered);
  document.getElementById('productTableFooter').textContent = `Showing ${filtered.length} of ${allProdsCache.length} products`;
}

// ===== EDIT PRODUCT MODAL =====
function openEditProduct(id) {
  const p = allProdsCache.find(x => x._id === id);
  if (!p) return;
  document.getElementById('editProdId').value = id;
  document.getElementById('editProdName').value = p.name || '';
  document.getElementById('editProdCat').value = p.category || '';
  document.getElementById('editProdPrice').value = getProductPrice(p);
  document.getElementById('editProdDiscPrice').value = getProductDiscPrice(p);
  document.getElementById('editProdStock').value = getProductStock(p);
  document.getElementById('editProdRating').value = p.rating || 4.3;
  document.getElementById('editProdDesc').value = p.description || '';
  const imgs = p.images || [];
  document.getElementById('editProdImage').value = (Array.isArray(imgs) ? imgs : [imgs]).map(i => i.split('/').pop()).join(', ');
  document.getElementById('editProdVideo').value = p.videoUrl || '';

  // Nutrition
  const ni = p.nutritionalInfo || {};
  ['Calories','Protein','Carbs','Fat','Fiber'].forEach(k => {
    const el = document.getElementById('editNut' + k);
    if (el) el.value = ni[k.toLowerCase()] || '';
  });

  // Farm
  const fs = p.farmSource || {};
  if (document.getElementById('editFarmName')) document.getElementById('editFarmName').value = fs.farmName || '';
  if (document.getElementById('editFarmLocation')) document.getElementById('editFarmLocation').value = fs.location || '';
  if (document.getElementById('editFarmDesc')) document.getElementById('editFarmDesc').value = fs.description || '';

  // Delivery
  if (document.getElementById('editDeliveryInfo')) document.getElementById('editDeliveryInfo').value = p.deliveryInfo || '';
  if (document.getElementById('editReturnPolicy')) document.getElementById('editReturnPolicy').value = p.returnPolicy || '';

  // Weight variants
  const container = document.getElementById('weightRowsContainer');
  container.innerHTML = '';
  const weights = p.weights || [{ label:'250g', price:'', discountPrice:'' }];
  weights.forEach((w, i) => renderWeightRow(w, i));

  document.getElementById('editProductModal').classList.add('active');
}

async function saveEditProduct(e) {
  e.preventDefault();
  const id = document.getElementById('editProdId').value;
  const imgsStr = document.getElementById('editProdImage').value;
  const imgs = imgsStr ? imgsStr.split(',').map(s => s.trim()).filter(Boolean).map(s => s.startsWith('http') ? s : 'assets/images/products/' + s) : [];

  const wRows = document.querySelectorAll('#weightRowsContainer .weight-row');
  const weights = [];
  wRows.forEach(row => {
    const lbl = row.querySelector('.w-label').value.trim();
    const pr = parseFloat(row.querySelector('.w-price').value) || 0;
    const dp = parseFloat(row.querySelector('.w-disc').value) || pr;
    if (lbl) weights.push({ label: lbl, price: pr, discountPrice: dp });
  });

  const updateData = {
    name: document.getElementById('editProdName').value.trim(),
    category: document.getElementById('editProdCat').value,
    price: parseFloat(document.getElementById('editProdPrice').value) || 0,
    discountedPrice: parseFloat(document.getElementById('editProdDiscPrice').value) || 0,
    stock: parseInt(document.getElementById('editProdStock').value) || 0,
    rating: parseFloat(document.getElementById('editProdRating').value) || 4.3,
    description: document.getElementById('editProdDesc').value.trim(),
    videoUrl: document.getElementById('editProdVideo').value.trim(),
    images: imgs.length > 0 ? imgs : undefined,
    weights: weights,
    nutritionalInfo: {
      calories: document.getElementById('editNutCalories')?.value.trim() || '',
      protein: document.getElementById('editNutProtein')?.value.trim() || '',
      carbs: document.getElementById('editNutCarbs')?.value.trim() || '',
      fat: document.getElementById('editNutFat')?.value.trim() || '',
      fiber: document.getElementById('editNutFiber')?.value.trim() || '',
    },
    farmSource: {
      farmName: document.getElementById('editFarmName')?.value.trim() || '',
      location: document.getElementById('editFarmLocation')?.value.trim() || '',
      description: document.getElementById('editFarmDesc')?.value.trim() || '',
    },
    deliveryInfo: document.getElementById('editDeliveryInfo')?.value.trim() || '',
    returnPolicy: document.getElementById('editReturnPolicy')?.value.trim() || '',
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  };

  // Remove undefined fields
  Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);

  try {
    await db.collection('products').doc(id).update(updateData);
    // Update local cache
    const idx = allProdsCache.findIndex(x => x._id === id);
    if (idx > -1) allProdsCache[idx] = { ...allProdsCache[idx], ...updateData };
    closeModal('editProductModal');
    showToast('Product saved to Firestore! Live website updated 🌿', 'success');
    renderFilteredProducts(allProdsCache);
  } catch (e) {
    showToast('Save failed: ' + e.message, 'error');
  }
}

function renderWeightRow(w, i) {
  const container = document.getElementById('weightRowsContainer');
  const row = document.createElement('div');
  row.className = 'weight-row';
  row.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:8px;align-items:center;background:#f8fafc;padding:10px;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:6px;';
  row.innerHTML = `
    <div><label style="font-size:0.72rem;color:#64748b;font-weight:600;display:block;margin-bottom:3px;">Label</label>
      <input type="text" class="w-label form-input" value="${w.label||''}" placeholder="e.g. 100g" style="padding:6px 8px;font-size:0.85rem;"></div>
    <div><label style="font-size:0.72rem;color:#64748b;font-weight:600;display:block;margin-bottom:3px;">MRP (₹)</label>
      <input type="number" class="w-price form-input" value="${w.price||''}" placeholder="0" style="padding:6px 8px;font-size:0.85rem;"></div>
    <div><label style="font-size:0.72rem;color:#64748b;font-weight:600;display:block;margin-bottom:3px;">Sale Price (₹)</label>
      <input type="number" class="w-disc form-input" value="${w.discountPrice||''}" placeholder="0" style="padding:6px 8px;font-size:0.85rem;"></div>
    <button type="button" onclick="this.parentElement.remove()" style="padding:6px 10px;background:#fef2f2;color:#dc2626;border:1px solid #fecaca;border-radius:6px;cursor:pointer;margin-top:16px;"><i class="fas fa-trash"></i></button>`;
  container.appendChild(row);
}

function addWeightRow() {
  renderWeightRow({ label:'', price:'', discountPrice:'' }, document.querySelectorAll('#weightRowsContainer .weight-row').length);
}

async function deleteProduct(id) {
  if (!confirm('Delete this product from Firestore? This cannot be undone.')) return;
  try {
    await db.collection('products').doc(id).delete();
    allProdsCache = allProdsCache.filter(p => p._id !== id);
    showToast('Product deleted from Firestore.', 'warning');
    renderFilteredProducts(allProdsCache);
  } catch (e) {
    showToast('Delete failed: ' + e.message, 'error');
  }
}

// ===== ADD PRODUCT — saves to Firestore =====
async function saveNewProduct(e) {
  e.preventDefault();
  const imgsInput = document.getElementById('pImage').value;
  const imgs = imgsInput ? imgsInput.split(',').map(s=>s.trim()).filter(Boolean).map(s => s.startsWith('http') ? s : 'assets/images/products/' + s) : ['assets/images/products/tomato.png'];
  const slug = document.getElementById('pName').value.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
  const price = parseFloat(document.getElementById('pPrice').value);
  const discPrice = parseFloat(document.getElementById('pDiscPrice').value || document.getElementById('pPrice').value);

  const product = {
    slug,
    name: document.getElementById('pName').value.trim(),
    category: document.getElementById('pCategory').value,
    description: document.getElementById('pDesc').value.trim(),
    price,
    discountedPrice: discPrice,
    discountPrice: discPrice,
    stock: parseInt(document.getElementById('pStock').value) || 100,
    rating: parseFloat(document.getElementById('pRating').value) || 4.3,
    numReviews: 0,
    featured: document.getElementById('pFeatured').checked,
    images: imgs,
    videoUrl: document.getElementById('pVideoUrl').value.trim(),
    weights: [{ label:'250g', price, discountPrice: discPrice }],
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  };

  try {
    const ref = await db.collection('products').add(product);
    allProdsCache.push({ _id: ref.id, firestoreId: ref.id, ...product });
    showToast(`"${product.name}" added to Firestore catalog! 🌿`, 'success');
    e.target.reset();
    goSection('products');
  } catch (err) {
    showToast('Add product failed: ' + err.message, 'error');
  }
}

// ===== CUSTOMERS — read from Firestore =====
async function renderCustomerTable() {
  const body = document.getElementById('customerTableBody');
  const footer = document.getElementById('customerTableFooter');
  body.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';

  try {
    const snap = await db.collection('customers').orderBy('createdAt', 'desc').get();
    const customers = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (!customers.length) {
      body.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:40px;">No customers yet.</td></tr>';
      footer.textContent = '0 customers';
      return;
    }

    const colors = ['#ef4444','#f97316','#3b82f6','#8b5cf6','#ec4899','#10b981'];
    body.innerHTML = customers.map((c, i) => `
      <tr>
        <td><div style="display:flex;align-items:center;gap:10px;">
          <div class="avatar" style="background:${colors[i%colors.length]};">${(c.name||'?')[0].toUpperCase()}</div>
          <div style="font-weight:600;font-size:0.85rem;">${c.name || 'Unknown'}</div>
        </div></td>
        <td><div style="font-size:0.82rem;">${c.email||'—'}</div><div style="font-size:0.72rem;color:#64748b;">${c.phone||'—'}</div></td>
        <td><strong>${c.orderCount || 0}</strong></td>
        <td><strong>₹${(c.totalSpent || 0).toLocaleString('en-IN')}</strong></td>
        <td style="font-size:0.78rem;color:#64748b;">${c.lastOrderDate?.toDate ? c.lastOrderDate.toDate().toLocaleDateString('en-IN') : '—'}</td>
        <td><span class="status-badge active">Active</span></td>
      </tr>`).join('');
    footer.textContent = `${customers.length} registered customers`;
  } catch (e) {
    body.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#ef4444;padding:30px;">Error loading customers: ${e.message}</td></tr>`;
  }
}

function filterCustomers() { renderCustomerTable(); }

// ===== SELLERS — Firestore =====
async function getSellers() {
  try {
    const snap = await db.collection('sellers').get();
    if (snap.size > 0) return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { console.warn('getSellers:', e); }
  // Default seed data
  return [
    { name:'Green Valley Farm', contact:'Ravi Kumar', phone:'+91 98765 43210', email:'ravi@gvfarm.in', location:'Nashik, Maharashtra', categories:'vegetables, fruits', rzpId:'', status:'active', products:28 },
    { name:'Ancient Grains Bakery', contact:'Priya Sharma', phone:'+91 87654 32109', email:'priya@ancientgrains.com', location:'Bengaluru, Karnataka', categories:'biscuits, snacks', rzpId:'', status:'active', products:15 },
  ];
}

async function getDeliveryPartners() {
  try {
    const snap = await db.collection('delivery_partners').get();
    if (snap.size > 0) return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { console.warn('getDeliveryPartners:', e); }
  return [
    { name:'Arun Delivery', phone:'+91 95432 10987', zone:'North Chennai', deliveries:124, rzpId:'', status:'active' },
  ];
}

async function renderSellerTable() {
  const sellers = await getSellers();
  const partners = await getDeliveryPartners();
  const sb = document.getElementById('sellerTableBody');
  const dpb = document.getElementById('deliveryTableBody');
  const colors = ['#2d6a4f','#1d4ed8','#7c3aed','#c2410c'];

  sb.innerHTML = sellers.map((s, i) => `
    <tr>
      <td><div style="display:flex;align-items:center;gap:10px;">
        <div class="avatar" style="background:${colors[i%colors.length]};">${s.name[0]}</div>
        <div><div style="font-weight:600;font-size:0.84rem;">${s.name}</div><div style="font-size:0.72rem;color:#64748b;">${s.location||''}</div></div>
      </div></td>
      <td style="font-size:0.78rem;color:#64748b;">${s.categories||''}</td>
      <td><strong>${s.products||0}</strong></td>
      <td style="font-size:0.72rem;font-family:monospace;">${s.rzpId||'<span style="color:#94a3b8;">Not set</span>'}</td>
      <td><span class="status-badge ${s.status||'active'}">${s.status||'active'}</span></td>
      <td><button onclick="openEditSellerModal('${s.id||i}')" style="background:none;border:none;color:var(--text);cursor:pointer;"><i class="fas fa-edit"></i></button></td>
    </tr>`).join('');

  dpb.innerHTML = partners.map((p, i) => `
    <tr>
      <td><div style="display:flex;align-items:center;gap:10px;">
        <div class="avatar" style="background:#0369a1;">${p.name[0]}</div>
        <span style="font-weight:600;font-size:0.84rem;">${p.name}</span>
      </div></td>
      <td style="font-size:0.82rem;">${p.phone||''}</td>
      <td style="font-size:0.82rem;">${p.zone||''}</td>
      <td><strong>${p.deliveries||0}</strong></td>
      <td><span class="status-badge ${p.status||'active'}">${p.status||'active'}</span></td>
      <td><button onclick="openEditDeliveryModal('${p.id||i}')" style="background:none;border:none;color:var(--text);cursor:pointer;"><i class="fas fa-edit"></i></button></td>
    </tr>`).join('');
}

let _sellersList = [];
let _partnersList = [];

function openAddSellerModal() { document.getElementById('addSellerModal').classList.add('active'); }
function openAddDeliveryModal() { document.getElementById('addDeliveryModal').classList.add('active'); }

async function openEditSellerModal(idOrIdx) {
  _sellersList = await getSellers();
  const s = _sellersList.find(x => x.id === idOrIdx) || _sellersList[parseInt(idOrIdx)];
  if (!s) return;
  document.getElementById('editSellerIndex').value = s.id || idOrIdx;
  document.getElementById('editSellerName').value = s.name||'';
  document.getElementById('editSellerContact').value = s.contact||'';
  document.getElementById('editSellerPhone').value = s.phone||'';
  document.getElementById('editSellerEmail').value = s.email||'';
  document.getElementById('editSellerLoc').value = s.location||'';
  document.getElementById('editSellerCat').value = s.categories||'';
  document.getElementById('editSellerRzp').value = s.rzpId||'';
  document.getElementById('editSellerModal').classList.add('active');
}

async function saveEditSeller(e) {
  e.preventDefault();
  const idOrIdx = document.getElementById('editSellerIndex').value;
  const data = {
    name: document.getElementById('editSellerName').value,
    contact: document.getElementById('editSellerContact').value,
    phone: document.getElementById('editSellerPhone').value,
    email: document.getElementById('editSellerEmail').value,
    location: document.getElementById('editSellerLoc').value,
    categories: document.getElementById('editSellerCat').value,
    rzpId: document.getElementById('editSellerRzp').value,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  };
  try {
    if (idOrIdx && isNaN(idOrIdx)) {
      await db.collection('sellers').doc(idOrIdx).update(data);
    } else {
      await db.collection('sellers').add({ ...data, status:'active', products:0, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    }
    closeModal('editSellerModal');
    showToast('Seller saved to Firestore!', 'success');
    renderSellerTable();
  } catch (err) { showToast('Save failed: ' + err.message, 'error'); }
}

async function openEditDeliveryModal(idOrIdx) {
  _partnersList = await getDeliveryPartners();
  const p = _partnersList.find(x => x.id === idOrIdx) || _partnersList[parseInt(idOrIdx)];
  if (!p) return;
  document.getElementById('editDpIndex').value = p.id || idOrIdx;
  document.getElementById('editDpName').value = p.name||'';
  document.getElementById('editDpPhone').value = p.phone||'';
  document.getElementById('editDpZone').value = p.zone||'';
  document.getElementById('editDpRzpId').value = p.rzpId||'';
  document.getElementById('editDeliveryModal').classList.add('active');
}

async function saveEditDeliveryPartner(e) {
  e.preventDefault();
  const idOrIdx = document.getElementById('editDpIndex').value;
  const data = {
    name: document.getElementById('editDpName').value,
    phone: document.getElementById('editDpPhone').value,
    zone: document.getElementById('editDpZone').value,
    rzpId: document.getElementById('editDpRzpId').value,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  };
  try {
    if (idOrIdx && isNaN(idOrIdx)) {
      await db.collection('delivery_partners').doc(idOrIdx).update(data);
    } else {
      await db.collection('delivery_partners').add({ ...data, status:'active', deliveries:0, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    }
    closeModal('editDeliveryModal');
    showToast('Delivery partner saved to Firestore!', 'success');
    renderSellerTable();
  } catch (err) { showToast('Save failed: ' + err.message, 'error'); }
}

async function addSeller(e) {
  e.preventDefault();
  try {
    await db.collection('sellers').add({
      name: document.getElementById('newSellerName').value,
      contact: document.getElementById('newSellerContact').value,
      phone: document.getElementById('newSellerPhone').value,
      email: document.getElementById('newSellerEmail').value,
      location: document.getElementById('newSellerLocation').value,
      rzpId: document.getElementById('newSellerRzpId').value,
      categories: document.getElementById('newSellerCats').value,
      status:'active', products:0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    closeModal('addSellerModal');
    showToast('Seller added to Firestore!', 'success');
    renderSellerTable();
  } catch (err) { showToast('Add seller failed: ' + err.message, 'error'); }
}

async function addDeliveryPartner(e) {
  e.preventDefault();
  try {
    await db.collection('delivery_partners').add({
      name: document.getElementById('newDpName').value,
      phone: document.getElementById('newDpPhone').value,
      zone: document.getElementById('newDpZone').value,
      rzpId: document.getElementById('newDpRzpId').value,
      deliveries:0, status:'active',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    closeModal('addDeliveryModal');
    showToast('Delivery partner added to Firestore!', 'success');
    renderSellerTable();
  } catch (err) { showToast('Add failed: ' + err.message, 'error'); }
}

// ===== ORDERS — Firestore =====
async function renderOrderTable() {
  const body = document.getElementById('orderTableBody');
  const footer = document.getElementById('orderTableFooter');
  body.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;"><i class="fas fa-spinner fa-spin"></i> Loading orders...</td></tr>';

  try {
    const filter = document.getElementById('orderStatusFilter')?.value || '';
    let query = db.collection('orders').orderBy('createdAt', 'desc').limit(100);
    if (filter) query = db.collection('orders').where('status','==',filter).orderBy('createdAt','desc');
    const snap = await query.get();
    const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const sp = await getSplitConfig();

    if (!orders.length) {
      body.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#94a3b8;padding:40px;">No orders found.</td></tr>';
      footer.textContent = '0 orders';
      return;
    }

    body.innerHTML = orders.map(o => {
      const total = o.total || 0;
      const sellerAmt = Math.round(total * sp.seller / 100);
      const deliveryAmt = Math.round(total * sp.delivery / 100);
      const platformAmt = total - sellerAmt - deliveryAmt;
      const date = o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString('en-IN') : '—';
      return `<tr>
        <td style="font-weight:700;font-size:0.83rem;font-family:monospace;">${o.orderNumber || o.id}</td>
        <td style="font-size:0.83rem;">${o.shippingAddress?.fullName || 'Customer'}</td>
        <td style="font-size:0.78rem;color:#64748b;">${(o.items||[]).length} item(s)</td>
        <td style="font-weight:700;">₹${total}</td>
        <td style="font-size:0.75rem;">
          <span style="color:#2e7d32;font-weight:600;">₹${sellerAmt}</span> /
          <span style="color:#1565c0;font-weight:600;">₹${deliveryAmt}</span> /
          <span style="color:#c62828;font-weight:600;">₹${platformAmt}</span>
        </td>
        <td style="font-size:0.78rem;">${o.paymentMethod || 'COD'}</td>
        <td style="font-size:0.75rem;color:#64748b;">${date}</td>
        <td>
          <select class="form-select" style="padding:4px 8px;font-size:0.75rem;width:120px;" onchange="updateOrderStatus('${o.id}',this.value)">
            <option value="placed" ${(o.status||'placed')==='placed'?'selected':''}>Placed</option>
            <option value="processing" ${o.status==='processing'?'selected':''}>Processing</option>
            <option value="delivered" ${o.status==='delivered'?'selected':''}>Delivered</option>
            <option value="cancelled" ${o.status==='cancelled'?'selected':''}>Cancelled</option>
          </select>
        </td>
      </tr>`;
    }).join('');
    footer.textContent = `${orders.length} order(s) · Revenue: ₹${orders.reduce((s,o)=>s+(o.total||0),0).toLocaleString('en-IN')}`;
  } catch (err) {
    body.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#ef4444;padding:30px;">Error: ${err.message}</td></tr>`;
  }
}

function filterOrders() { renderOrderTable(); }

async function updateOrderStatus(orderId, status) {
  try {
    await db.collection('orders').doc(orderId).update({ status, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
    showToast(`Order → ${status}`, 'success');
  } catch (e) { showToast('Update failed: ' + e.message, 'error'); }
}

// ===== SETTINGS — Firestore =====
async function loadSettings() {
  const s = await fsGet('store_config', 'settings') || {};
  document.getElementById('helplineNumber').value = s.helpline || '+91 78457 44038';
  document.getElementById('supportEmail').value = s.email || 'curfee01@gmail.com';
  document.getElementById('whatsappNumber').value = s.whatsapp || '+91 78457 44038';
  document.getElementById('storeName').value = s.storeName || 'Curfee Organic Market';
  document.getElementById('storeTagline').value = s.tagline || 'Fresh Organic. Delivered Fast.';
  document.getElementById('storeAddress').value = s.address || '';
  document.getElementById('fssaiNumber').value = s.fssai || '';
  document.getElementById('freeDeliveryMin').value = s.freeDeliveryMin || 500;
  document.getElementById('deliveryCharge').value = s.deliveryCharge || 40;
  document.getElementById('deliveryTime').value = s.deliveryTime || '2-4 Business Days';
  document.getElementById('minOrderAmount').value = s.minOrder || 99;
}

async function saveContactSettings() {
  const s = await fsGet('store_config', 'settings') || {};
  s.helpline = document.getElementById('helplineNumber').value.trim();
  s.email = document.getElementById('supportEmail').value.trim();
  s.whatsapp = document.getElementById('whatsappNumber').value.trim();
  const ok = await fsSet('store_config', 'settings', s);
  if (ok) showToast('Contact info saved to Firestore! Live across all pages.', 'success');
}

async function saveStoreDetails() {
  const s = await fsGet('store_config', 'settings') || {};
  s.storeName = document.getElementById('storeName').value.trim();
  s.tagline = document.getElementById('storeTagline').value.trim();
  s.address = document.getElementById('storeAddress').value.trim();
  s.fssai = document.getElementById('fssaiNumber').value.trim();
  const ok = await fsSet('store_config', 'settings', s);
  if (ok) showToast('Store details saved to Firestore!', 'success');
}

async function saveDeliverySettings() {
  const s = await fsGet('store_config', 'settings') || {};
  s.freeDeliveryMin = parseInt(document.getElementById('freeDeliveryMin').value) || 500;
  s.deliveryCharge = parseInt(document.getElementById('deliveryCharge').value) || 40;
  s.deliveryTime = document.getElementById('deliveryTime').value.trim();
  s.minOrder = parseInt(document.getElementById('minOrderAmount').value) || 99;
  const ok = await fsSet('store_config', 'settings', s);
  if (ok) showToast('Delivery settings saved to Firestore!', 'success');
}

// ===== PAYMENT CONFIG — Firestore =====
async function loadPaymentConfig() {
  const config = await fsGet('store_config', 'payment_config') || {};
  document.getElementById('rzpKeyId').value = config.rzpKeyId || '';
  document.getElementById('rzpKeySecret').value = config.rzpKeySecret || '';
  document.getElementById('rzpLiveMode').checked = config.rzpLiveMode || false;
  document.getElementById('merchantUpiId').value = config.upiId || '';
  document.getElementById('upiDisplayName').value = config.upiName || 'Curfee Organic Market';
  document.getElementById('codEnabled').checked = config.codEnabled !== false;
  document.getElementById('upiEnabled').checked = config.upiEnabled !== false;
  if (document.getElementById('sellerAccountId')) document.getElementById('sellerAccountId').value = config.sellerAccountId || '';
  if (document.getElementById('deliveryAccountId')) document.getElementById('deliveryAccountId').value = config.deliveryAccountId || '';
}

async function saveRazorpayKeys() {
  const ok = await fsSet('store_config', 'payment_config', {
    rzpKeyId: document.getElementById('rzpKeyId').value.trim(),
    rzpKeySecret: document.getElementById('rzpKeySecret').value.trim(),
    rzpLiveMode: document.getElementById('rzpLiveMode').checked,
  });
  if (ok) showToast('Razorpay keys saved to Firestore!', 'success');
}

async function saveUpiSettings() {
  const ok = await fsSet('store_config', 'payment_config', {
    upiId: document.getElementById('merchantUpiId').value.trim(),
    upiName: document.getElementById('upiDisplayName').value.trim(),
    codEnabled: document.getElementById('codEnabled').checked,
    upiEnabled: document.getElementById('upiEnabled').checked,
  });
  if (ok) showToast('UPI & COD settings saved to Firestore!', 'success');
}

// ===== MODALS =====
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
}
document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) m.classList.remove('active'); });
});

// ===== AUTH =====
function editorLogout() {
  if (confirm('Log out of Store Editor?')) {
    if (typeof auth !== 'undefined') auth.signOut();
    window.location.href = 'login.html';
  }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const u = JSON.parse(localStorage.getItem('curfee_user') || '{}');
    const name = u.name || 'Admin';
    document.getElementById('sidebarName').textContent = name;
    document.getElementById('sidebarAvatar').textContent = name[0].toUpperCase();
  } catch {}

  await loadAllProductsFromFirestore();
  await loadDashboard();
  updateSplitPreview();
});

// ===== BRANDING — Firestore =====
async function loadBrandingForm() {
  const b = await fsGet('store_config', 'branding') || {
    companyName:'Curfee', companyFull:'Curfee Organic Market', tagline:'Explore Organic',
    logoEmoji:'🌿', primaryColor:'#2d6a4f', primaryLight:'#52b788', primaryPale:'#d8f3dc',
    accentColor:'#f77f00', footerText:'© 2024 Curfee Organic Market. Made with 🌿 in India'
  };
  document.getElementById('brandName').value = b.companyName || '';
  document.getElementById('brandFullName').value = b.companyFull || '';
  document.getElementById('brandTagline').value = b.tagline || '';
  document.getElementById('brandLogoEmoji').value = b.logoEmoji || '';
  document.getElementById('brandFooterText').value = b.footerText || '';
  document.getElementById('brandPrimaryColor').value = b.primaryColor || '#2d6a4f';
  document.getElementById('brandPrimaryColorText').value = b.primaryColor || '#2d6a4f';
  document.getElementById('brandPrimaryLight').value = b.primaryLight || '#52b788';
  document.getElementById('brandPrimaryLightText').value = b.primaryLight || '#52b788';
  document.getElementById('brandPrimaryPale').value = b.primaryPale || '#d8f3dc';
  document.getElementById('brandPrimaryPaleText').value = b.primaryPale || '#d8f3dc';
  document.getElementById('brandAccentColor').value = b.accentColor || '#f77f00';
  document.getElementById('brandAccentColorText').value = b.accentColor || '#f77f00';
  updateBrandPreview();
}

function updateBrandPreview() {
  const primary = document.getElementById('brandPrimaryColor')?.value || '#2d6a4f';
  const accent  = document.getElementById('brandAccentColor')?.value || '#f77f00';
  const name    = document.getElementById('brandName')?.value || 'Curfee';
  const tagline = document.getElementById('brandTagline')?.value || 'Explore Organic';
  const emoji   = document.getElementById('brandLogoEmoji')?.value || '🌿';
  const footer  = document.getElementById('brandFooterText')?.value || '© 2024 Curfee Organic Market';
  const pe = document.getElementById('previewEmoji'); if(pe) pe.textContent = emoji;
  const pn = document.getElementById('previewName'); if(pn) pn.textContent = name;
  const pt = document.getElementById('previewTagline'); if(pt) pt.textContent = tagline;
  const pb1 = document.getElementById('previewBtn1'); if(pb1) pb1.style.background = primary;
  const pb2 = document.getElementById('previewBtn2'); if(pb2) { pb2.style.borderColor = primary; pb2.style.color = primary; }
  const pb3 = document.getElementById('previewBtn3'); if(pb3) pb3.style.background = accent;
  const pbg = document.getElementById('previewBadge'); if(pbg) pbg.style.background = primary;
  const pf = document.getElementById('previewFooter'); if(pf) { pf.style.background = primary; pf.textContent = footer; }
}

async function saveBranding() {
  const data = {
    companyName:  document.getElementById('brandName').value.trim(),
    companyFull:  document.getElementById('brandFullName').value.trim(),
    tagline:      document.getElementById('brandTagline').value.trim(),
    logoEmoji:    document.getElementById('brandLogoEmoji').value.trim(),
    footerText:   document.getElementById('brandFooterText').value.trim(),
    primaryColor: document.getElementById('brandPrimaryColor').value,
    primaryLight: document.getElementById('brandPrimaryLight').value,
    primaryPale:  document.getElementById('brandPrimaryPale').value,
    accentColor:  document.getElementById('brandAccentColor').value,
    updatedAt:    firebase.firestore.FieldValue.serverTimestamp(),
  };
  const ok = await fsSet('store_config', 'branding', data);
  if (ok) {
    updateBrandPreview();
    showToast('Branding saved to Firestore! All pages updated instantly.', 'success');
  }
}

async function resetBranding() {
  if (!confirm('Reset branding to defaults?')) return;
  await db.collection('store_config').doc('branding').delete().catch(() => {});
  loadBrandingForm();
  showToast('Branding reset to defaults.', 'info');
}

// ===== HOMEPAGE MANAGER — Firestore =====
const DEFAULT_BANNERS = [
  { tag:'🍪 ORGANIC BISCUITS', title:'Fresh Baked Cookies', desc:'Millet, ragi, jaggery cookies', cta:'Shop Now →', link:'products.html?category=biscuits', gradient:'linear-gradient(135deg,#b5651d,#d4a574)', emoji:'🍪' },
  { tag:'🥬 FARM FRESH', title:'Organic Vegetables', desc:'Pesticide free, farm direct', cta:'Shop Fresh →', link:'products.html?category=vegetables', gradient:'linear-gradient(135deg,#43a047,#66bb6a)', emoji:'🥬' },
  { tag:'🍎 SEASONAL FRUITS', title:'Organic Fruits', desc:'Naturally grown', cta:'Order Now →', link:'products.html?category=fruits', gradient:'linear-gradient(135deg,#ff6f00,#ffa726)', emoji:'🍎' },
];

const DEFAULT_DEALS = [
  { title:'Biscuits & Cookies', offer:'15 varieties', emojis:'🍪🥜🧁', link:'products.html?category=biscuits', gradient:'linear-gradient(135deg,#fff3e0,#ffe0b2)' },
  { title:'Mushroom Products', offer:'Up to 35% OFF', emojis:'🍄🧪🍵', link:'products.html?category=mushroom', gradient:'linear-gradient(135deg,#efebe9,#d7ccc8)' },
  { title:'Dry Fruits & Nuts', offer:'15 premium items', emojis:'🥜🌰🍇', link:'products.html?category=dryfruits', gradient:'linear-gradient(135deg,#fff8e1,#ffecb3)' },
  { title:'Superfoods', offer:'Chia, moringa', emojis:'🧬🌱✨', link:'products.html?category=superfoods', gradient:'linear-gradient(135deg,#e8f5e9,#c8e6c9)' },
];

async function getBanners() {
  const data = await fsGet('store_config', 'homepage');
  return data?.banners || DEFAULT_BANNERS;
}
async function getDeals() {
  const data = await fsGet('store_config', 'homepage');
  return data?.deals || DEFAULT_DEALS;
}
async function getSponsored() {
  const data = await fsGet('store_config', 'homepage');
  return data?.sponsored || { title:'Organic Biscuits & Cookies', sub:'Kraft paper packaging', btn:'Shop Now', link:'products.html?category=biscuits' };
}

async function loadHomepageManager() {
  renderBannerList();
  renderDealList();
  const sp = await getSponsored();
  document.getElementById('sponsoredTitle').value = sp.title || '';
  document.getElementById('sponsoredSub').value = sp.sub || '';
  document.getElementById('sponsoredBtn').value = sp.btn || 'Shop Now';
  document.getElementById('sponsoredLink').value = sp.link || '';
}

async function renderBannerList() {
  const banners = await getBanners();
  const list = document.getElementById('bannerList');
  list.innerHTML = banners.map((b, i) => `
    <div style="display:flex;gap:12px;align-items:center;padding:14px;border:1px solid var(--border);border-radius:var(--radius);background:#fff;">
      <div style="width:80px;height:60px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:2rem;background:${b.gradient};">${b.emoji}</div>
      <div style="flex:1;"><div style="font-weight:700;font-size:0.9rem;">${b.title}</div><div style="font-size:0.75rem;color:var(--text-light);">${b.desc}</div></div>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-outline btn-sm" onclick="editBanner(${i})"><i class="fas fa-edit"></i></button>
        <button class="btn btn-sm" style="background:var(--danger);color:#fff;border:none;" onclick="deleteBanner(${i})"><i class="fas fa-trash"></i></button>
      </div>
    </div>`).join('');
}

async function addBanner() {
  const banners = await getBanners();
  banners.push({ tag:'🆕 NEW', title:'New Banner', desc:'Description here', cta:'Shop Now →', link:'products.html', gradient:'linear-gradient(135deg,#2D6A4F,#52B788)', emoji:'🌿' });
  await fsSet('store_config', 'homepage', { banners });
  renderBannerList();
  editBanner(banners.length - 1);
}

async function editBanner(idx) {
  const banners = await getBanners();
  const b = banners[idx];
  const html = `<div style="padding:20px;">
    <h3 style="margin-bottom:16px;">Edit Banner #${idx+1}</h3>
    <div class="form-grid">
      <div class="form-group"><label>Tag</label><input type="text" id="eb_tag" class="form-input" value="${b.tag}"></div>
      <div class="form-group"><label>Title</label><input type="text" id="eb_title" class="form-input" value="${b.title}"></div>
      <div class="form-group"><label>Description</label><input type="text" id="eb_desc" class="form-input" value="${b.desc}"></div>
      <div class="form-group"><label>CTA Text</label><input type="text" id="eb_cta" class="form-input" value="${b.cta}"></div>
      <div class="form-group"><label>Link</label><input type="text" id="eb_link" class="form-input" value="${b.link}"></div>
      <div class="form-group"><label>Emoji</label><input type="text" id="eb_emoji" class="form-input" value="${b.emoji}"></div>
      <div class="form-group" style="grid-column:1/-1;"><label>Gradient CSS</label><input type="text" id="eb_gradient" class="form-input" value="${b.gradient}"></div>
    </div>
    <div style="display:flex;gap:8px;margin-top:16px;">
      <button class="btn btn-primary" onclick="saveBannerEdit(${idx})"><i class="fas fa-save"></i> Save</button>
      <button class="btn btn-outline" onclick="closeModal('bannerEditModal')">Cancel</button>
    </div>
  </div>`;
  let modal = document.getElementById('bannerEditModal');
  if (!modal) { modal = document.createElement('div'); modal.id = 'bannerEditModal'; modal.className = 'modal-overlay'; document.body.appendChild(modal); }
  modal.innerHTML = `<div class="modal-box">${html}</div>`;
  modal.classList.add('active');
}

async function saveBannerEdit(idx) {
  const banners = await getBanners();
  banners[idx] = {
    tag: document.getElementById('eb_tag').value,
    title: document.getElementById('eb_title').value,
    desc: document.getElementById('eb_desc').value,
    cta: document.getElementById('eb_cta').value,
    link: document.getElementById('eb_link').value,
    emoji: document.getElementById('eb_emoji').value,
    gradient: document.getElementById('eb_gradient').value,
  };
  await fsSet('store_config', 'homepage', { banners });
  closeModal('bannerEditModal');
  renderBannerList();
  showToast('Banner saved to Firestore!', 'success');
}

async function deleteBanner(idx) {
  if (!confirm('Delete this banner?')) return;
  const banners = await getBanners();
  banners.splice(idx, 1);
  await fsSet('store_config', 'homepage', { banners });
  renderBannerList();
  showToast('Banner deleted.', 'info');
}

async function saveSponsored() {
  const ok = await fsSet('store_config', 'homepage', {
    sponsored: {
      title: document.getElementById('sponsoredTitle').value,
      sub: document.getElementById('sponsoredSub').value,
      btn: document.getElementById('sponsoredBtn').value,
      link: document.getElementById('sponsoredLink').value,
    }
  });
  if (ok) showToast('Sponsored banner saved to Firestore!', 'success');
}

async function renderDealList() {
  const deals = await getDeals();
  const list = document.getElementById('dealList');
  list.innerHTML = deals.map((d, i) => `
    <div style="padding:14px;border-radius:var(--radius);border:1px solid var(--border);background:#fff;">
      <div style="font-size:1.5rem;margin-bottom:6px;">${d.emojis}</div>
      <div style="font-weight:700;font-size:0.88rem;">${d.title}</div>
      <div style="font-size:0.75rem;color:var(--text-light);margin-bottom:8px;">${d.offer}</div>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-outline btn-sm" onclick="editDeal(${i})"><i class="fas fa-edit"></i></button>
        <button class="btn btn-sm" style="background:var(--danger);color:#fff;border:none;" onclick="deleteDeal(${i})"><i class="fas fa-trash"></i></button>
      </div>
    </div>`).join('');
}

async function addDealCard() {
  const deals = await getDeals();
  deals.push({ title:'New Deal', offer:'Special Offer', emojis:'🆕✨🎉', link:'products.html', gradient:'linear-gradient(135deg,#e8f5e9,#c8e6c9)' });
  await fsSet('store_config', 'homepage', { deals });
  renderDealList();
}

async function editDeal(idx) {
  const deals = await getDeals();
  const d = deals[idx];
  const html = `<div style="padding:20px;">
    <h3 style="margin-bottom:16px;">Edit Deal #${idx+1}</h3>
    <div class="form-grid">
      <div class="form-group"><label>Title</label><input type="text" id="ed_title" class="form-input" value="${d.title}"></div>
      <div class="form-group"><label>Offer</label><input type="text" id="ed_offer" class="form-input" value="${d.offer}"></div>
      <div class="form-group"><label>Emojis</label><input type="text" id="ed_emojis" class="form-input" value="${d.emojis}"></div>
      <div class="form-group"><label>Link</label><input type="text" id="ed_link" class="form-input" value="${d.link}"></div>
      <div class="form-group" style="grid-column:1/-1;"><label>Gradient</label><input type="text" id="ed_gradient" class="form-input" value="${d.gradient}"></div>
    </div>
    <div style="display:flex;gap:8px;margin-top:16px;">
      <button class="btn btn-primary" onclick="saveDealEdit(${idx})"><i class="fas fa-save"></i> Save</button>
      <button class="btn btn-outline" onclick="closeModal('dealEditModal')">Cancel</button>
    </div>
  </div>`;
  let modal = document.getElementById('dealEditModal');
  if (!modal) { modal = document.createElement('div'); modal.id = 'dealEditModal'; modal.className = 'modal-overlay'; document.body.appendChild(modal); }
  modal.innerHTML = `<div class="modal-box">${html}</div>`;
  modal.classList.add('active');
}

async function saveDealEdit(idx) {
  const deals = await getDeals();
  deals[idx] = {
    title: document.getElementById('ed_title').value,
    offer: document.getElementById('ed_offer').value,
    emojis: document.getElementById('ed_emojis').value,
    link: document.getElementById('ed_link').value,
    gradient: document.getElementById('ed_gradient').value,
  };
  await fsSet('store_config', 'homepage', { deals });
  closeModal('dealEditModal');
  renderDealList();
  showToast('Deal saved to Firestore!', 'success');
}

async function deleteDeal(idx) {
  if (!confirm('Delete this deal?')) return;
  const deals = await getDeals();
  deals.splice(idx, 1);
  await fsSet('store_config', 'homepage', { deals });
  renderDealList();
  showToast('Deal deleted.', 'info');
}

// ===== CATEGORIES — Firestore =====
const DEFAULT_CATEGORIES = [
  { emoji:'🏠', name:'For You', link:'products.html' },
  { emoji:'🍪', name:'Biscuits', link:'products.html?category=biscuits' },
  { emoji:'🥬', name:'Vegetables', link:'products.html?category=vegetables' },
  { emoji:'🍎', name:'Fruits', link:'products.html?category=fruits' },
  { emoji:'🥜', name:'Snacks', link:'products.html?category=snacks' },
  { emoji:'🍄', name:'Mushroom', link:'products.html?category=mushroom' },
  { emoji:'🍗', name:'Chicken', link:'products.html?category=chicken' },
  { emoji:'🍖', name:'Mutton', link:'products.html?category=mutton' },
  { emoji:'🏪', name:'Grocery', link:'products.html?category=grocery' },
  { emoji:'🥣', name:'Dry Fruits', link:'products.html?category=dryfruits' },
  { emoji:'🌾', name:'Flour', link:'products.html?category=flour' },
  { emoji:'☕', name:'Beverages', link:'products.html?category=beverages' },
  { emoji:'🍯', name:'Spreads', link:'products.html?category=spreads' },
  { emoji:'🥒', name:'Pickles', link:'products.html?category=pickles' },
  { emoji:'🧬', name:'Superfoods', link:'products.html?category=superfoods' },
  { emoji:'🍲', name:'Ready Cook', link:'products.html?category=readytocook' },
];

async function getCategories() {
  const data = await fsGet('store_config', 'categories');
  return data?.list || DEFAULT_CATEGORIES;
}

async function loadCategoryManager() { renderCategoryList(); }

async function renderCategoryList() {
  const cats = await getCategories();
  const list = document.getElementById('categoryList');
  list.innerHTML = cats.map((c, i) => `
    <div style="display:flex;gap:12px;align-items:center;padding:12px 14px;border:1px solid var(--border);border-radius:var(--radius);background:#fff;">
      <span style="font-size:1.5rem;">${c.emoji}</span>
      <input type="text" class="form-input cat-emoji" value="${c.emoji}" style="width:50px;text-align:center;font-size:1.2rem;" data-idx="${i}">
      <input type="text" class="form-input cat-name" value="${c.name}" style="flex:1;" data-idx="${i}">
      <input type="text" class="form-input cat-link" value="${c.link}" style="flex:2;font-size:0.8rem;" data-idx="${i}">
      <div style="display:flex;gap:4px;flex-shrink:0;">
        ${i > 0 ? `<button class="btn btn-outline btn-sm" onclick="moveCat(${i},-1)"><i class="fas fa-arrow-up"></i></button>` : ''}
        ${i < cats.length-1 ? `<button class="btn btn-outline btn-sm" onclick="moveCat(${i},1)"><i class="fas fa-arrow-down"></i></button>` : ''}
        <button class="btn btn-sm" style="background:var(--danger);color:#fff;border:none;" onclick="deleteCat(${i})"><i class="fas fa-trash"></i></button>
      </div>
    </div>`).join('');
}

async function addCategory() {
  const cats = await getCategories();
  cats.push({ emoji:'🆕', name:'New Category', link:'products.html?category=new' });
  await fsSet('store_config', 'categories', { list: cats });
  renderCategoryList();
}

async function saveCategories() {
  const emojis = document.querySelectorAll('.cat-emoji');
  const names = document.querySelectorAll('.cat-name');
  const links = document.querySelectorAll('.cat-link');
  const cats = [];
  emojis.forEach((el, i) => { cats.push({ emoji: el.value, name: names[i].value, link: links[i].value }); });
  const ok = await fsSet('store_config', 'categories', { list: cats });
  if (ok) showToast('Categories saved to Firestore! Homepage updated.', 'success');
}

async function deleteCat(idx) {
  if (!confirm('Delete this category?')) return;
  const cats = await getCategories();
  cats.splice(idx, 1);
  await fsSet('store_config', 'categories', { list: cats });
  renderCategoryList();
}

async function moveCat(idx, dir) {
  const cats = await getCategories();
  const target = idx + dir;
  if (target < 0 || target >= cats.length) return;
  [cats[idx], cats[target]] = [cats[target], cats[idx]];
  await fsSet('store_config', 'categories', { list: cats });
  renderCategoryList();
}

async function resetCategories() {
  if (!confirm('Reset categories to defaults?')) return;
  await db.collection('store_config').doc('categories').delete().catch(() => {});
  renderCategoryList();
  showToast('Categories reset to defaults.', 'info');
}