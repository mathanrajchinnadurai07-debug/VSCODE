/* ============================================================
   Curfee Store Editor — editor.js
   Full logic: products, stock, customers, sellers, delivery,
   payout splits, settings, payment config
   ============================================================ */

// ===== DATA HELPERS =====
const DB = {
  get: (k, d = null) => { try { return JSON.parse(localStorage.getItem('ce_' + k)) ?? d; } catch { return d; } },
  set: (k, v) => localStorage.setItem('ce_' + k, JSON.stringify(v)),
};

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
  if (name === 'payout') { updateSplitPreview(); simulatePayout(); }
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

// ===== LOAD ALL PRODUCTS =====
function getAllProducts() {
  const base = (typeof ALL_PRODUCTS !== 'undefined' ? ALL_PRODUCTS : [])
    .concat(typeof ALL_PRODUCTS_PART2 !== 'undefined' ? ALL_PRODUCTS_PART2 : []);
  const custom = DB.get('custom_products', []);
  return [...base, ...custom];
}

function getStockOverrides() { return DB.get('stock_overrides', {}); }
function getPriceOverrides() { return DB.get('price_overrides', {}); }
function getDetailOverrides() { return DB.get('detail_overrides', {}); }
function getWeightOverrides() { return DB.get('weight_overrides', {}); }

function getProductStock(p) {
  const overrides = getStockOverrides();
  return overrides[p._id] !== undefined ? overrides[p._id] : (p.stock || 0);
}
function getProductPrice(p) {
  const overrides = getPriceOverrides();
  return overrides[p._id + '_price'] !== undefined ? overrides[p._id + '_price'] : p.price;
}
function getProductDiscPrice(p) {
  const overrides = getPriceOverrides();
  return overrides[p._id + '_disc'] !== undefined ? overrides[p._id + '_disc'] : (p.discountPrice || p.price);
}

// ===== SPLIT CONFIG =====
function getSplitConfig() {
  return DB.get('split_config', { seller: 70, delivery: 20, platform: 10 });
}

// ===== DASHBOARD =====
function loadDashboard() {
  const orders = DB.get('curfee_orders', []);
  const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const customers = DB.get('customers', []);
  const all = getAllProducts();

  document.getElementById('dashRevenue').textContent = '₹' + revenue.toLocaleString('en-IN');
  document.getElementById('dashOrders').textContent = orders.length;
  document.getElementById('dashCustomers').textContent = customers.length;
  document.getElementById('dashProducts').textContent = all.length;

  // Pending orders badge
  const pending = orders.filter(o => !o.status || o.status === 'placed').length;
  document.getElementById('pendingBadge').textContent = pending;
  document.getElementById('pendingBadge').style.display = pending ? '' : 'none';

  // Recent orders
  const ro = document.getElementById('dashRecentOrders');
  if (!orders.length) {
    ro.innerHTML = '<div style="padding:0 24px;color:#94a3b8;font-size:0.85rem;">No orders yet.</div>';
  } else {
    ro.innerHTML = orders.slice(0, 6).map(o => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 24px;border-bottom:1px solid #f1f5f9;">
        <div>
          <div style="font-weight:600;font-size:0.84rem;">${o.orderNumber || '—'}</div>
          <div style="font-size:0.74rem;color:#64748b;">${(o.shippingAddress?.fullName || 'Customer')} · ${new Date(o.createdAt || Date.now()).toLocaleDateString('en-IN')}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-weight:700;font-size:0.9rem;">₹${o.total || 0}</div>
          <span class="status-badge ${o.status || 'placed'}">${o.status || 'placed'}</span>
        </div>
      </div>`).join('');
  }

  // Low stock
  const ls = document.getElementById('dashLowStock');
  const allLow = getAllProducts().filter(p => getProductStock(p) < 30);
  allLow.sort((a, b) => getProductStock(a) - getProductStock(b));
  const countEl = document.getElementById('lowStockCount');
  if (countEl) countEl.textContent = allLow.length ? allLow.length + ' items' : '';
  if (!allLow.length) {
    ls.innerHTML = '<div style="padding:20px 24px;color:#10b981;font-size:0.85rem;text-align:center;"><i class="fas fa-check-circle" style="font-size:1.5rem;display:block;margin-bottom:8px;"></i>All products well-stocked!</div>';
  } else {
    const lowItems = allLow.slice(0, 8);
    ls.innerHTML = lowItems.map(p => {
      const stk = getProductStock(p);
      const dets = getDetailOverrides()[p._id] || {};
      const displayName = dets.name || p.name;
      const cls = stk === 0 ? 'out' : stk < 10 ? 'low' : 'medium';
      const bgColor = stk === 0 ? '#fef2f2' : stk < 10 ? '#fffbeb' : '#f0fdf4';
      const img = (dets.images?.[0] || p.images?.[0] || '').split('/').pop() || 'tomato.png';
      return `<div style="display:flex;align-items:center;gap:12px;padding:10px 16px;border-bottom:1px solid #f1f5f9;background:${bgColor};">
        <img src="assets/images/products/${img}" style="width:32px;height:32px;border-radius:6px;object-fit:cover;border:1px solid #e2e8f0;" onerror="this.src='assets/images/products/tomato.png'">
        <div style="flex:1;min-width:0;">
          <div style="font-weight:600;font-size:0.82rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${displayName}</div>
          <div style="font-size:0.7rem;color:#94a3b8;">${p.category}</div>
        </div>
        <input class="inline-input" type="number" value="${stk}" onchange="updateStock('${p._id}',this.value);initDashboard();" style="width:55px;font-size:0.8rem;padding:4px 6px;text-align:center;">
        <span class="stock-badge ${cls}" style="font-size:0.7rem;min-width:70px;text-align:center;">${stk === 0 ? '✗ Out' : stk < 10 ? '⚠ ' + stk + ' left' : stk + ' left'}</span>
      </div>`;
    }).join('') + (allLow.length > 8 ? `<div style="padding:10px 16px;text-align:center;font-size:0.8rem;color:#64748b;">+ ${allLow.length - 8} more items — <a href="#" onclick="showAllLowStock();return false;" style="color:var(--primary);font-weight:600;">View All</a></div>` : '');
  }

  // Payout mini
  renderPayoutDisplay('dashPayoutBar', 'dashPayoutGrid', 0);
}

function showAllLowStock() {
  const allLow = getAllProducts().filter(p => getProductStock(p) < 30);
  allLow.sort((a, b) => getProductStock(a) - getProductStock(b));
  const outCount = allLow.filter(p => getProductStock(p) === 0).length;
  const critCount = allLow.filter(p => getProductStock(p) > 0 && getProductStock(p) < 10).length;
  const warnCount = allLow.filter(p => getProductStock(p) >= 10).length;

  const html = `<div style="padding:24px;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
      <h2 style="margin:0;font-size:1.1rem;"><i class="fas fa-exclamation-triangle" style="color:#f59e0b;"></i> All Low Stock Items (${allLow.length})</h2>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <span style="padding:4px 12px;border-radius:16px;font-size:0.72rem;font-weight:600;background:#fef2f2;color:#dc2626;">${outCount} Out of Stock</span>
        <span style="padding:4px 12px;border-radius:16px;font-size:0.72rem;font-weight:600;background:#fffbeb;color:#d97706;">${critCount} Critical (&lt;10)</span>
        <span style="padding:4px 12px;border-radius:16px;font-size:0.72rem;font-weight:600;background:#f0fdf4;color:#16a34a;">${warnCount} Warning (&lt;30)</span>
      </div>
    </div>
    <div style="margin-bottom:16px;">
      <input type="text" id="lowStockSearch" class="form-input" placeholder="🔍 Search products..." oninput="filterLowStockModal()" style="max-width:300px;">
    </div>
    <div style="max-height:60vh;overflow-y:auto;border:1px solid var(--border);border-radius:var(--radius);">
      <table class="data-table" style="width:100%;font-size:0.82rem;">
        <thead><tr>
          <th style="position:sticky;top:0;background:#f8fafc;z-index:1;">Product</th>
          <th style="position:sticky;top:0;background:#f8fafc;z-index:1;">Category</th>
          <th style="position:sticky;top:0;background:#f8fafc;z-index:1;">Current Stock</th>
          <th style="position:sticky;top:0;background:#f8fafc;z-index:1;">Update</th>
          <th style="position:sticky;top:0;background:#f8fafc;z-index:1;">Status</th>
        </tr></thead>
        <tbody id="lowStockModalBody">${allLow.map(p => {
          const stk = getProductStock(p);
          const dets = getDetailOverrides()[p._id] || {};
          const displayName = dets.name || p.name;
          const img = (dets.images?.[0] || p.images?.[0] || '').split('/').pop() || 'tomato.png';
          const bgColor = stk === 0 ? '#fef2f2' : stk < 10 ? '#fffbeb' : '#fff';
          const cls = stk === 0 ? 'out' : stk < 10 ? 'low' : 'medium';
          const statusText = stk === 0 ? '✗ Out of Stock' : stk < 10 ? '⚠ Critical' : '● Low';
          return `<tr data-name="${displayName.toLowerCase()}" style="background:${bgColor};">
            <td><div style="display:flex;align-items:center;gap:8px;">
              <img src="assets/images/products/${img}" style="width:28px;height:28px;border-radius:6px;object-fit:cover;" onerror="this.src='assets/images/products/tomato.png'">
              <span style="font-weight:600;">${displayName}</span>
            </div></td>
            <td>${p.category}</td>
            <td style="font-weight:700;color:${stk === 0 ? '#dc2626' : stk < 10 ? '#d97706' : '#16a34a'};font-size:0.95rem;">${stk}</td>
            <td><input class="inline-input" type="number" value="${stk}" onchange="updateStock('${p._id}', this.value);showAllLowStock();" style="width:65px;text-align:center;"></td>
            <td><span class="stock-badge ${cls}" style="font-size:0.72rem;">${statusText}</span></td>
          </tr>`;
        }).join('')}</tbody>
      </table>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;">
      <button class="btn btn-outline" onclick="closeModal('lowStockModal')">Close</button>
      <button class="btn btn-primary" onclick="closeModal('lowStockModal');goSection('products')"><i class="fas fa-box"></i> Go to Products</button>
    </div>
  </div>`;

  let modal = document.getElementById('lowStockModal');
  if (!modal) { modal = document.createElement('div'); modal.id = 'lowStockModal'; modal.className = 'modal-overlay'; document.body.appendChild(modal); }
  modal.innerHTML = `<div class="modal-box" style="max-width:800px;width:95%;">${html}</div>`;
  modal.classList.add('active');
}

function filterLowStockModal() {
  const q = (document.getElementById('lowStockSearch')?.value || '').toLowerCase();
  document.querySelectorAll('#lowStockModalBody tr').forEach(row => {
    row.style.display = row.dataset.name.includes(q) ? '' : 'none';
  });
}

function renderPayoutDisplay(barId, gridId, sampleAmount) {
  const sp = getSplitConfig();
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
  simulatePayout();
}

function saveSplitConfig() {
  const s = parseInt(document.getElementById('splitSeller').value) || 0;
  const d = parseInt(document.getElementById('splitDelivery').value) || 0;
  const p = parseInt(document.getElementById('splitPlatform').value) || 0;
  if (s + d + p !== 100) { showToast('Splits must add up to 100%!', 'error'); return; }
  DB.set('split_config', { seller: s, delivery: d, platform: p });
  showToast(`Split saved: Seller ${s}% | Delivery ${d}% | Platform ${p}%`, 'success');
  renderPayoutDisplay('dashPayoutBar', 'dashPayoutGrid', 0);
}

function simulatePayout() {
  const amt = parseFloat(document.getElementById('simAmount')?.value) || 500;
  renderPayoutDisplay('splitPayoutBar', 'simResult', amt);
}

function saveAccountIds() {
  DB.set('seller_account_id', document.getElementById('sellerAccountId').value.trim());
  DB.set('delivery_account_id', document.getElementById('deliveryAccountId').value.trim());
  showToast('Account IDs saved! Add these to your .env file for production.', 'success');
}

// ===== PRODUCTS TABLE =====
let allProdsCache = [];

function renderProductTable() {
  allProdsCache = getAllProducts();
  renderFilteredProducts(allProdsCache);
  document.getElementById('productTableFooter').textContent = `${allProdsCache.length} products across 16 categories`;
}

function renderFilteredProducts(prods) {
  const overrides = getStockOverrides();
  const body = document.getElementById('productTableBody');
  if (!prods.length) {
    body.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#94a3b8;padding:40px;">No products found</td></tr>';
    return;
  }
  body.innerHTML = prods.map(p => {
    const stk = getProductStock(p);
    const stkcls = stk === 0 ? 'out' : stk < 10 ? 'low' : stk < 30 ? 'medium' : 'high';
    const stklbl = stk === 0 ? 'Out of Stock' : stk < 10 ? `${stk} (Critical)` : stk < 30 ? `${stk} (Low)` : stk;
    const catColors = {
      vegetables:'#15803d',fruits:'#b45309',biscuits:'#7c3aed',snacks:'#0891b2',
      mushroom:'#92400e',chicken:'#c2410c',mutton:'#be185d',grocery:'#1d4ed8',
      herbal:'#065f46',dryfruits:'#a16207',flour:'#6b7280',beverages:'#0369a1',
      spreads:'#7c2d12',pickles:'#4d7c0f',superfoods:'#0f766e',readytocook:'#7e22ce'
    };
    const dets = getDetailOverrides()[p._id] || {};
    const displayName = dets.name || p.name;
    const displayCat = dets.category || p.category;
    const cc = catColors[displayCat] || '#475569';
    return `<tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px;">
          <img src="assets/images/products/${(dets.images?.[0] || p.images?.[0] || 'tomato.png').split('/').pop()}" style="width:36px;height:36px;border-radius:8px;object-fit:cover;border:1px solid #e2e8f0;" onerror="this.src='assets/images/products/tomato.png'">
          <div>
            <div style="font-weight:600;font-size:0.85rem;">${displayName}</div>
            <div style="font-size:0.72rem;color:#94a3b8;">${p.slug || p._id}</div>
          </div>
        </div>
      </td>
      <td><span style="background:${cc}22;color:${cc};padding:3px 10px;border-radius:12px;font-size:0.72rem;font-weight:600;">${displayCat}</span></td>
      <td><input class="inline-input" type="number" value="${getProductPrice(p)}" onchange="updatePrice('${p._id}','price',this.value)" style="width:80px;"></td>
      <td><input class="inline-input" type="number" value="${getProductDiscPrice(p)}" onchange="updatePrice('${p._id}','disc',this.value)" style="width:80px;"></td>
      <td>
        <div style="display:flex;align-items:center;gap:6px;">
          <input class="inline-input" type="number" value="${stk}" onchange="updateStock('${p._id}',this.value)" style="width:70px;">
          <span class="stock-badge ${stkcls}">${stk === 0 ? '✗ Out' : stk < 10 ? '⚠' : '✓'}</span>
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

function filterProductTable() {
  const q = (document.getElementById('productSearch')?.value || '').toLowerCase();
  const cat = document.getElementById('catFilterProd')?.value || '';
  const filtered = allProdsCache.filter(p =>
    (!q || p.name.toLowerCase().includes(q) || p.slug?.includes(q)) &&
    (!cat || p.category === cat)
  );
  renderFilteredProducts(filtered);
  document.getElementById('productTableFooter').textContent = `Showing ${filtered.length} of ${allProdsCache.length} products`;
}

function updateStock(id, val) {
  const overrides = getStockOverrides();
  overrides[id] = Math.max(0, parseInt(val) || 0);
  DB.set('stock_overrides', overrides);
  if (typeof syncOverridesToFirestore === 'function') syncOverridesToFirestore('stock_overrides', overrides);
  showToast('Stock updated!', 'success');
}

function updatePrice(id, type, val) {
  const overrides = getPriceOverrides();
  overrides[id + '_' + type] = parseFloat(val) || 0;
  DB.set('price_overrides', overrides);
  if (typeof syncOverridesToFirestore === 'function') syncOverridesToFirestore('price_overrides', overrides);
  showToast('Price updated!', 'success');
}

function openEditProduct(id) {
  const p = getAllProducts().find(x => x._id === id);
  if (!p) return;
  const dets = getDetailOverrides()[id] || {};
  document.getElementById('editProdId').value = id;
  document.getElementById('editProdName').value = dets.name || p.name;
  document.getElementById('editProdCat').value = dets.category || p.category;
  document.getElementById('editProdPrice').value = getProductPrice(p);
  document.getElementById('editProdDiscPrice').value = getProductDiscPrice(p);
  document.getElementById('editProdStock').value = getProductStock(p);
  document.getElementById('editProdRating').value = dets.rating !== undefined ? dets.rating : (p.rating || 4.3);
  document.getElementById('editProdDesc').value = dets.description !== undefined ? dets.description : (p.description || '');
  document.getElementById('editProdImage').value = dets.images ? dets.images.map(i => i.split('/').pop()).join(', ') : (p.images ? p.images.map(i => i.split('/').pop()).join(', ') : '');
  document.getElementById('editProdVideo').value = dets.videoUrl !== undefined ? dets.videoUrl : (p.videoUrl || '');

  // Nutrition fields
  const ni = dets.nutritionalInfo || p.nutritionalInfo || {};
  const nutF = (fld) => document.getElementById(fld);
  if (nutF('editNutCalories')) nutF('editNutCalories').value = ni.calories || '';
  if (nutF('editNutProtein')) nutF('editNutProtein').value = ni.protein || '';
  if (nutF('editNutCarbs')) nutF('editNutCarbs').value = ni.carbs || '';
  if (nutF('editNutFat')) nutF('editNutFat').value = ni.fat || '';
  if (nutF('editNutFiber')) nutF('editNutFiber').value = ni.fiber || '';

  // Farm source fields
  const fs = dets.farmSource || p.farmSource || {};
  if (nutF('editFarmName')) nutF('editFarmName').value = fs.farmName || '';
  if (nutF('editFarmLocation')) nutF('editFarmLocation').value = fs.location || '';
  if (nutF('editFarmDesc')) nutF('editFarmDesc').value = fs.description || '';

  // Delivery & returns fields
  if (nutF('editDeliveryInfo')) nutF('editDeliveryInfo').value = dets.deliveryInfo !== undefined ? dets.deliveryInfo : (p.deliveryInfo || '');
  if (nutF('editReturnPolicy')) nutF('editReturnPolicy').value = dets.returnPolicy !== undefined ? dets.returnPolicy : (p.returnPolicy || '');

  // Weight/price variants
  const weightOverrides = getWeightOverrides();
  const weights = weightOverrides[id] || p.weights || [];
  const container = document.getElementById('weightRowsContainer');
  container.innerHTML = '';
  if (weights.length > 0) {
    weights.forEach((w, i) => renderWeightRow(w, i));
  } else {
    // Default starter rows
    [{ label: '100g', price: '', discountPrice: '' }, { label: '250g', price: '', discountPrice: '' }].forEach((w, i) => renderWeightRow(w, i));
  }

  document.getElementById('editProductModal').classList.add('active');
}

function saveEditProduct(e) {
  e.preventDefault();
  const id = document.getElementById('editProdId').value;
  updateStock(id, document.getElementById('editProdStock').value);
  updatePrice(id, 'price', document.getElementById('editProdPrice').value);
  updatePrice(id, 'disc', document.getElementById('editProdDiscPrice').value);
  
  // Save weight variants
  const wRows = document.querySelectorAll('#weightRowsContainer .weight-row');
  const newWeights = [];
  wRows.forEach(row => {
    const lbl = row.querySelector('.w-label').value.trim();
    const pr = parseFloat(row.querySelector('.w-price').value) || 0;
    const dp = parseFloat(row.querySelector('.w-disc').value) || pr;
    if (lbl) newWeights.push({ label: lbl, price: pr, discountPrice: dp });
  });
  const weightOverrides = getWeightOverrides();
  weightOverrides[id] = newWeights;
  DB.set('weight_overrides', weightOverrides);

  const overrides = getDetailOverrides();
  const imgsStr = document.getElementById('editProdImage').value;
  const imgs = imgsStr ? imgsStr.split(',').map(s=>s.trim()).filter(Boolean).map(s => s.startsWith('http') ? s : 'assets/images/products/' + s) : [];
  
  overrides[id] = {
    name: document.getElementById('editProdName').value.trim(),
    category: document.getElementById('editProdCat').value,
    rating: parseFloat(document.getElementById('editProdRating').value) || 4.3,
    description: document.getElementById('editProdDesc').value.trim(),
    videoUrl: document.getElementById('editProdVideo').value.trim(),
    images: imgs.length > 0 ? imgs : undefined,
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
  };
  DB.set('detail_overrides', overrides);

  // Sync all overrides to Firestore so the live website updates for all users
  if (typeof syncOverridesToFirestore === 'function') {
    syncOverridesToFirestore('detail_overrides', overrides);
    syncOverridesToFirestore('weight_overrides', getWeightOverrides());
  }

  closeModal('editProductModal');
  showToast('Product updated successfully! Changes synced to website 🌿', 'success');
  renderProductTable();
}

function renderWeightRow(w, i) {
  const container = document.getElementById('weightRowsContainer');
  const row = document.createElement('div');
  row.className = 'weight-row';
  row.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:8px;align-items:center;background:#f8fafc;padding:10px;border-radius:8px;border:1px solid #e2e8f0;';
  row.innerHTML = `
    <div><label style="font-size:0.72rem;color:#64748b;font-weight:600;display:block;margin-bottom:3px;">Label</label>
      <input type="text" class="w-label form-input" value="${w.label||''}" placeholder="e.g. 100g" style="padding:6px 8px;font-size:0.85rem;"></div>
    <div><label style="font-size:0.72rem;color:#64748b;font-weight:600;display:block;margin-bottom:3px;">MRP (₹)</label>
      <input type="number" class="w-price form-input" value="${w.price||''}" placeholder="0" style="padding:6px 8px;font-size:0.85rem;"></div>
    <div><label style="font-size:0.72rem;color:#64748b;font-weight:600;display:block;margin-bottom:3px;">Sale Price (₹)</label>
      <input type="number" class="w-disc form-input" value="${w.discountPrice||''}" placeholder="0" style="padding:6px 8px;font-size:0.85rem;"></div>
    <button type="button" onclick="this.parentElement.remove()" style="padding:6px 10px;background:#fef2f2;color:#dc2626;border:1px solid #fecaca;border-radius:6px;cursor:pointer;margin-top:16px;" title="Remove"><i class="fas fa-trash"></i></button>
  `;
  container.appendChild(row);
}

function addWeightRow() {
  renderWeightRow({ label: '', price: '', discountPrice: '' }, document.querySelectorAll('#weightRowsContainer .weight-row').length);
}

function deleteProduct(id) {
  if (!confirm('Delete this product? This action cannot be undone.')) return;
  const custom = DB.get('custom_products', []);
  const updated = custom.filter(p => p._id !== id);
  DB.set('custom_products', updated);
  showToast('Product removed.', 'warning');
  renderProductTable();
}

// ===== ADD PRODUCT =====
function saveNewProduct(e) {
  e.preventDefault();
  const imgsInput = document.getElementById('pImage').value;
  const imgs = imgsInput ? imgsInput.split(',').map(s=>s.trim()).filter(Boolean).map(s => s.startsWith('http') ? s : 'assets/images/products/' + s) : ['assets/images/products/tomato.png'];
  const slug = document.getElementById('pName').value.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
  const product = {
    _id: 'custom_' + Date.now(),
    slug: slug,
    name: document.getElementById('pName').value.trim(),
    category: document.getElementById('pCategory').value,
    description: document.getElementById('pDesc').value.trim(),
    price: parseFloat(document.getElementById('pPrice').value),
    discountPrice: parseFloat(document.getElementById('pDiscPrice').value || document.getElementById('pPrice').value),
    stock: parseInt(document.getElementById('pStock').value) || 100,
    rating: parseFloat(document.getElementById('pRating').value) || 4.3,
    numReviews: 0,
    isFeatured: document.getElementById('pFeatured').checked,
    images: imgs,
    videoUrl: document.getElementById('pVideoUrl').value.trim(),
    weights: [{ label: '250g', price: parseFloat(document.getElementById('pPrice').value), discountPrice: parseFloat(document.getElementById('pDiscPrice').value || document.getElementById('pPrice').value) }]
  };
  const custom = DB.get('custom_products', []);
  custom.push(product);
  DB.set('custom_products', custom);
  showToast(`"${product.name}" added to catalog!`, 'success');
  e.target.reset();
  goSection('products');
}

// ===== CUSTOMERS =====
function getCustomers() {
  const orders = DB.get('curfee_orders', []);
  const map = {};
  orders.forEach(o => {
    const name = o.shippingAddress?.fullName || 'Unknown';
    const phone = o.shippingAddress?.phone || '';
    const key = phone || name;
    if (!map[key]) map[key] = { name, phone, email: o.shippingAddress?.email || '', orders: 0, spent: 0, lastOrder: o.createdAt || '' };
    map[key].orders++;
    map[key].spent += o.total || 0;
    if (!map[key].lastOrder || o.createdAt > map[key].lastOrder) map[key].lastOrder = o.createdAt;
  });
  const saved = DB.get('customers', []);
  const merged = [...saved];
  Object.values(map).forEach(c => { if (!merged.find(x => x.phone === c.phone)) merged.push(c); });
  return merged;
}

function renderCustomerTable() {
  const customers = getCustomers();
  const body = document.getElementById('customerTableBody');
  const footer = document.getElementById('customerTableFooter');
  if (!customers.length) {
    body.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:40px;">No customers yet. They will appear after their first order.</td></tr>';
    footer.textContent = '0 customers';
    return;
  }
  const colors = ['#ef4444','#f97316','#3b82f6','#8b5cf6','#ec4899','#10b981'];
  body.innerHTML = customers.map((c, i) => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="avatar" style="background:${colors[i%colors.length]};">${(c.name||'?')[0].toUpperCase()}</div>
          <div style="font-weight:600;font-size:0.85rem;">${c.name || 'Unknown'}</div>
        </div>
      </td>
      <td>
        <div style="font-size:0.82rem;">${c.email || '—'}</div>
        <div style="font-size:0.72rem;color:#64748b;">${c.phone || '—'}</div>
      </td>
      <td><strong>${c.orders || 0}</strong></td>
      <td><strong>₹${(c.spent || 0).toLocaleString('en-IN')}</strong></td>
      <td style="font-size:0.78rem;color:#64748b;">${c.lastOrder ? new Date(c.lastOrder).toLocaleDateString('en-IN') : '—'}</td>
      <td><span class="status-badge active">Active</span></td>
    </tr>`).join('');
  footer.textContent = `${customers.length} registered customers`;
}

function filterCustomers() {
  const q = (document.getElementById('customerSearch')?.value || '').toLowerCase();
  const customers = getCustomers().filter(c => !q || c.name?.toLowerCase().includes(q) || c.phone?.includes(q) || c.email?.toLowerCase().includes(q));
  const body = document.getElementById('customerTableBody');
  if (!customers.length) { body.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:30px;">No customers match search</td></tr>'; return; }
  renderCustomerTable();
}

// ===== SELLERS =====
function getSellers() { return DB.get('sellers', [
  { name: 'Green Valley Farm', contact: 'Ravi Kumar', phone: '+91 98765 43210', email: 'ravi@gvfarm.in', location: 'Nashik, Maharashtra', categories: 'vegetables, fruits', rzpId: '', status: 'active', products: 28 },
  { name: 'Ancient Grains Bakery', contact: 'Priya Sharma', phone: '+91 87654 32109', email: 'priya@ancientgrains.com', location: 'Bengaluru, Karnataka', categories: 'biscuits, snacks', rzpId: '', status: 'active', products: 15 },
  { name: 'Ayur Herbals', contact: 'Dr. Menon', phone: '+91 76543 21098', email: 'ayur@herbals.in', location: 'Thrissur, Kerala', categories: 'herbal, superfoods', rzpId: '', status: 'active', products: 22 },
]); }

function getDeliveryPartners() { return DB.get('delivery_partners', [
  { name: 'Arun Delivery', phone: '+91 95432 10987', zone: 'North Chennai', deliveries: 124, rzpId: '', status: 'active' },
  { name: 'Speed Wings', phone: '+91 84321 09876', zone: 'South Chennai', deliveries: 98, rzpId: '', status: 'active' },
]); }

function renderSellerTable() {
  const sellers = getSellers();
  const partners = getDeliveryPartners();
  const sb = document.getElementById('sellerTableBody');
  const db = document.getElementById('deliveryTableBody');

  const colors = ['#2d6a4f','#1d4ed8','#7c3aed','#c2410c'];
  sb.innerHTML = sellers.map((s, i) => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="avatar" style="background:${colors[i%colors.length]};">${s.name[0]}</div>
          <div>
            <div style="font-weight:600;font-size:0.84rem;">${s.name}</div>
            <div style="font-size:0.72rem;color:#64748b;">${s.location}</div>
          </div>
        </div>
      </td>
      <td style="font-size:0.78rem;color:#64748b;">${s.categories}</td>
      <td><strong>${s.products}</strong></td>
      <td style="font-size:0.72rem;font-family:monospace;">${s.rzpId || '<span style="color:#94a3b8;">Not set</span>'}</td>
      <td><span class="status-badge ${s.status}">${s.status}</span></td>
      <td class="action-cell">
        <button onclick="openEditSellerModal(${i})" title="Edit" style="background:none;border:none;color:var(--text);cursor:pointer;"><i class="fas fa-edit"></i></button>
      </td>
    </tr>`).join('');

  db.innerHTML = partners.map((p, i) => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="avatar" style="background:#0369a1;">${p.name[0]}</div>
          <span style="font-weight:600;font-size:0.84rem;">${p.name}</span>
        </div>
      </td>
      <td style="font-size:0.82rem;">${p.phone}</td>
      <td style="font-size:0.82rem;">${p.zone}</td>
      <td><strong>${p.deliveries}</strong></td>
      <td><span class="status-badge ${p.status}">${p.status}</span></td>
      <td class="action-cell">
        <button onclick="openEditDeliveryModal(${i})" title="Edit" style="background:none;border:none;color:var(--text);cursor:pointer;"><i class="fas fa-edit"></i></button>
      </td>
    </tr>`).join('');
}

function openAddSellerModal() { document.getElementById('addSellerModal').classList.add('active'); }
function openAddDeliveryModal() { document.getElementById('addDeliveryModal').classList.add('active'); }

function openEditSellerModal(i) {
  const s = getSellers()[i];
  document.getElementById('editSellerIndex').value = i;
  document.getElementById('editSellerName').value = s.name || '';
  document.getElementById('editSellerContact').value = s.contact || '';
  document.getElementById('editSellerPhone').value = s.phone || '';
  document.getElementById('editSellerEmail').value = s.email || '';
  document.getElementById('editSellerLoc').value = s.location || '';
  document.getElementById('editSellerCat').value = s.categories || '';
  document.getElementById('editSellerRzp').value = s.rzpId || '';
  document.getElementById('editSellerModal').classList.add('active');
}

function saveEditSeller(e) {
  e.preventDefault();
  const sellers = getSellers();
  const i = document.getElementById('editSellerIndex').value;
  sellers[i] = Object.assign({}, sellers[i], {
    name: document.getElementById('editSellerName').value,
    contact: document.getElementById('editSellerContact').value,
    phone: document.getElementById('editSellerPhone').value,
    email: document.getElementById('editSellerEmail').value,
    location: document.getElementById('editSellerLoc').value,
    categories: document.getElementById('editSellerCat').value,
    rzpId: document.getElementById('editSellerRzp').value
  });
  DB.set('sellers', sellers);
  closeModal('editSellerModal');
  showToast('Seller modified successfully', 'success');
  renderSellerTable();
}

function openEditDeliveryModal(i) {
  const p = getDeliveryPartners()[i];
  document.getElementById('editDpIndex').value = i;
  document.getElementById('editDpName').value = p.name || '';
  document.getElementById('editDpPhone').value = p.phone || '';
  document.getElementById('editDpZone').value = p.zone || '';
  document.getElementById('editDpRzpId').value = p.rzpId || '';
  document.getElementById('editDeliveryModal').classList.add('active');
}

function saveEditDeliveryPartner(e) {
  e.preventDefault();
  const partners = getDeliveryPartners();
  const i = document.getElementById('editDpIndex').value;
  partners[i] = Object.assign({}, partners[i], {
    name: document.getElementById('editDpName').value,
    phone: document.getElementById('editDpPhone').value,
    zone: document.getElementById('editDpZone').value,
    rzpId: document.getElementById('editDpRzpId').value
  });
  DB.set('delivery_partners', partners);
  closeModal('editDeliveryModal');
  showToast('Delivery partner modified successfully', 'success');
  renderSellerTable();
}

function addSeller(e) {
  e.preventDefault();
  const sellers = getSellers();
  sellers.push({
    name: document.getElementById('newSellerName').value,
    contact: document.getElementById('newSellerContact').value,
    phone: document.getElementById('newSellerPhone').value,
    email: document.getElementById('newSellerEmail').value,
    location: document.getElementById('newSellerLocation').value,
    rzpId: document.getElementById('newSellerRzpId').value,
    categories: document.getElementById('newSellerCats').value,
    status: 'active', products: 0
  });
  DB.set('sellers', sellers);
  closeModal('addSellerModal');
  showToast('Seller added successfully!', 'success');
  renderSellerTable();
}

function addDeliveryPartner(e) {
  e.preventDefault();
  const partners = getDeliveryPartners();
  partners.push({
    name: document.getElementById('newDpName').value,
    phone: document.getElementById('newDpPhone').value,
    zone: document.getElementById('newDpZone').value,
    rzpId: document.getElementById('newDpRzpId').value,
    deliveries: 0, status: 'active'
  });
  DB.set('delivery_partners', partners);
  closeModal('addDeliveryModal');
  showToast('Delivery partner added!', 'success');
  renderSellerTable();
}

// ===== ORDERS =====
function renderOrderTable() {
  const orders = DB.get('curfee_orders', []);
  const filter = document.getElementById('orderStatusFilter')?.value || '';
  const filtered = filter ? orders.filter(o => o.status === filter) : orders;
  const body = document.getElementById('orderTableBody');
  const footer = document.getElementById('orderTableFooter');
  const sp = getSplitConfig();

  if (!filtered.length) {
    body.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#94a3b8;padding:40px;">No orders found</td></tr>';
    footer.textContent = '0 orders';
    return;
  }

  body.innerHTML = filtered.map(o => {
    const total = o.total || 0;
    const sellerAmt = Math.round(total * sp.seller / 100);
    const deliveryAmt = Math.round(total * sp.delivery / 100);
    const platformAmt = total - sellerAmt - deliveryAmt;
    const statusClass = { placed: 'pending', processing: 'processing', delivered: 'active', cancelled: 'inactive' }[o.status] || 'pending';
    return `<tr>
      <td style="font-weight:700;font-size:0.83rem;font-family:monospace;">${o.orderNumber || '—'}</td>
      <td style="font-size:0.83rem;">${o.shippingAddress?.fullName || 'Customer'}</td>
      <td style="font-size:0.78rem;color:#64748b;">${(o.items||[]).length} item(s)</td>
      <td style="font-weight:700;">₹${total}</td>
      <td style="font-size:0.75rem;">
        <span style="color:#2e7d32;font-weight:600;">₹${sellerAmt}</span> /
        <span style="color:#1565c0;font-weight:600;">₹${deliveryAmt}</span> /
        <span style="color:#c62828;font-weight:600;">₹${platformAmt}</span>
      </td>
      <td style="font-size:0.78rem;">${o.paymentMethod || 'COD'}</td>
      <td style="font-size:0.75rem;color:#64748b;">${o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN') : '—'}</td>
      <td>
        <select class="form-select" style="padding:4px 8px;font-size:0.75rem;width:120px;" onchange="updateOrderStatus('${o.orderNumber}',this.value)">
          <option value="placed" ${(o.status||'placed')==='placed'?'selected':''}>Placed</option>
          <option value="processing" ${o.status==='processing'?'selected':''}>Processing</option>
          <option value="delivered" ${o.status==='delivered'?'selected':''}>Delivered</option>
          <option value="cancelled" ${o.status==='cancelled'?'selected':''}>Cancelled</option>
        </select>
      </td>
    </tr>`;
  }).join('');
  footer.textContent = `${filtered.length} order(s) · Total Revenue: ₹${filtered.reduce((s,o) => s+(o.total||0),0).toLocaleString('en-IN')}`;
}

function filterOrders() { renderOrderTable(); }

function updateOrderStatus(orderNum, status) {
  const orders = DB.get('curfee_orders', []);
  const idx = orders.findIndex(o => o.orderNumber === orderNum);
  if (idx > -1) { orders[idx].status = status; DB.set('curfee_orders', orders); showToast(`Order ${orderNum} → ${status}`, 'success'); }
}

// ===== SETTINGS =====
function loadSettings() {
  const s = DB.get('store_settings', {});
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

function saveContactSettings() {
  const s = DB.get('store_settings', {});
  s.helpline = document.getElementById('helplineNumber').value.trim();
  s.email = document.getElementById('supportEmail').value.trim();
  s.whatsapp = document.getElementById('whatsappNumber').value.trim();
  DB.set('store_settings', s);
  showToast('Contact info saved! Helpline updated across the store.', 'success');
}

function saveStoreDetails() {
  const s = DB.get('store_settings', {});
  s.storeName = document.getElementById('storeName').value.trim();
  s.tagline = document.getElementById('storeTagline').value.trim();
  s.address = document.getElementById('storeAddress').value.trim();
  s.fssai = document.getElementById('fssaiNumber').value.trim();
  DB.set('store_settings', s);
  showToast('Store details saved!', 'success');
}

function saveDeliverySettings() {
  const s = DB.get('store_settings', {});
  s.freeDeliveryMin = parseInt(document.getElementById('freeDeliveryMin').value) || 500;
  s.deliveryCharge = parseInt(document.getElementById('deliveryCharge').value) || 40;
  s.deliveryTime = document.getElementById('deliveryTime').value.trim();
  s.minOrder = parseInt(document.getElementById('minOrderAmount').value) || 99;
  DB.set('store_settings', s);
  showToast('Delivery settings saved!', 'success');
}

// ===== PAYMENT CONFIG =====
function loadPaymentConfig() {
  const config = DB.get('payment_config', {});
  document.getElementById('rzpKeyId').value = config.rzpKeyId || '';
  document.getElementById('rzpKeySecret').value = config.rzpKeySecret || '';
  document.getElementById('rzpLiveMode').checked = config.rzpLiveMode || false;
  document.getElementById('merchantUpiId').value = config.upiId || '';
  document.getElementById('upiDisplayName').value = config.upiName || 'Curfee Organic Market';
  document.getElementById('codEnabled').checked = config.codEnabled !== false;
  document.getElementById('upiEnabled').checked = config.upiEnabled !== false;
  // Load payout split config
  const sp = getSplitConfig();
  document.getElementById('splitSeller').value = sp.seller;
  document.getElementById('splitDelivery').value = sp.delivery;
  document.getElementById('splitPlatform').value = sp.platform;
  // Load account IDs
  document.getElementById('sellerAccountId').value = DB.get('seller_account_id', '');
  document.getElementById('deliveryAccountId').value = DB.get('delivery_account_id', '');
}

function saveRazorpayKeys() {
  const config = DB.get('payment_config', {});
  config.rzpKeyId = document.getElementById('rzpKeyId').value.trim();
  config.rzpKeySecret = document.getElementById('rzpKeySecret').value.trim();
  config.rzpLiveMode = document.getElementById('rzpLiveMode').checked;
  DB.set('payment_config', config);
  showToast('Razorpay keys saved! Add to .env for production use.', 'success');
}

function saveUpiSettings() {
  const config = DB.get('payment_config', {});
  config.upiId = document.getElementById('merchantUpiId').value.trim();
  config.upiName = document.getElementById('upiDisplayName').value.trim();
  config.codEnabled = document.getElementById('codEnabled').checked;
  config.upiEnabled = document.getElementById('upiEnabled').checked;
  DB.set('payment_config', config);
  showToast('UPI & COD settings saved!', 'success');
}

// ===== MODALS =====
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) m.classList.remove('active'); });
});

// ===== AUTH =====
function editorLogout() {
  if (confirm('Log out of Store Editor?')) {
    localStorage.removeItem('curfee_user');
    window.location.href = 'login.html';
  }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  // Set admin name
  try {
    const u = JSON.parse(localStorage.getItem('curfee_user') || '{}');
    const name = u.name || 'Admin';
    document.getElementById('sidebarName').textContent = name;
    document.getElementById('sidebarAvatar').textContent = name[0].toUpperCase();
  } catch {}

  loadDashboard();
  updateSplitPreview();
});

// ===== BRANDING =====
function loadBrandingForm() {
  const b = typeof getBranding === 'function' ? getBranding() : {
    companyName:'Curfee', companyFull:'Curfee Organic Market', tagline:'Explore Organic',
    logoEmoji:'\ud83c\udf3f', primaryColor:'#2d6a4f', primaryLight:'#52b788', primaryPale:'#d8f3dc',
    accentColor:'#f77f00', footerText:'\u00a9 2024 Curfee Organic Market. Made with \ud83c\udf3f in India'
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
  const emoji   = document.getElementById('brandLogoEmoji')?.value || '\ud83c\udf3f';
  const footer  = document.getElementById('brandFooterText')?.value || '\u00a9 2024 Curfee Organic Market';
  const pe = document.getElementById('previewEmoji'); if(pe) pe.textContent = emoji;
  const pn = document.getElementById('previewName'); if(pn) pn.textContent = name;
  const pt = document.getElementById('previewTagline'); if(pt) pt.textContent = tagline;
  const pb1 = document.getElementById('previewBtn1'); if(pb1) pb1.style.background = primary;
  const pb2 = document.getElementById('previewBtn2'); if(pb2) { pb2.style.borderColor = primary; pb2.style.color = primary; }
  const pb3 = document.getElementById('previewBtn3'); if(pb3) pb3.style.background = accent;
  const pbg = document.getElementById('previewBadge'); if(pbg) pbg.style.background = primary;
  const pf = document.getElementById('previewFooter'); if(pf) { pf.style.background = primary; pf.textContent = footer; }
}

function saveBranding() {
  const data = {
    companyName:    document.getElementById('brandName').value.trim(),
    companyFull:    document.getElementById('brandFullName').value.trim(),
    tagline:        document.getElementById('brandTagline').value.trim(),
    logoEmoji:      document.getElementById('brandLogoEmoji').value.trim(),
    footerText:     document.getElementById('brandFooterText').value.trim(),
    primaryColor:   document.getElementById('brandPrimaryColor').value,
    primaryLight:   document.getElementById('brandPrimaryLight').value,
    primaryPale:    document.getElementById('brandPrimaryPale').value,
    accentColor:    document.getElementById('brandAccentColor').value,
  };
  const existing = DB.get('branding', {});
  const merged = Object.assign({}, existing, data);
  DB.set('branding', merged);
  localStorage.setItem('ce_branding', JSON.stringify(merged));
  if (typeof applyBranding === 'function') applyBranding();
  updateBrandPreview();
  showToast('Branding saved! Changes will appear on all pages.', 'success');
}

function resetBranding() {
  if (!confirm('Reset all branding to defaults? This cannot be undone.')) return;
  localStorage.removeItem('ce_branding');
  DB.set('branding', null);
  loadBrandingForm();
  if (typeof applyBranding === 'function') applyBranding();
  showToast('Branding reset to defaults.', 'info');
}

// ============================================================
//  HOMEPAGE MANAGER — Banners, Sponsored, Deals
// ============================================================

const DEFAULT_BANNERS = [
  { tag:'🍪 ORGANIC BISCUITS', title:'Fresh Baked Cookies', desc:'Millet, ragi, jaggery cookies — zero refined sugar', cta:'Shop Now →', link:'products.html?category=biscuits', gradient:'linear-gradient(135deg,#b5651d,#d4a574)', emoji:'🍪' },
  { tag:'🍄 MUSHROOM POWER', title:'Mushroom Products', desc:'Dried, powders, snacks & immunity blends', cta:'Explore →', link:'products.html?category=mushroom', gradient:'linear-gradient(135deg,#6d4c41,#8d6e63)', emoji:'🍄' },
  { tag:'🍗 FARM FRESH', title:'Organic Chicken & Mutton', desc:'Antibiotic-free, vacuum sealed & delivered fresh', cta:'Order Now →', link:'products.html?category=chicken', gradient:'linear-gradient(135deg,#c62828,#e53935)', emoji:'🍗' },
  { tag:'🥬 FARM FRESH', title:'Organic Vegetables', desc:'Tomato, carrot, spinach, broccoli — pesticide free', cta:'Shop Fresh →', link:'products.html?category=vegetables', gradient:'linear-gradient(135deg,#43a047,#66bb6a)', emoji:'🥬' },
  { tag:'🍎 SEASONAL FRUITS', title:'Organic Fruits', desc:'Mango, apple, strawberry, banana — naturally grown', cta:'Order Now →', link:'products.html?category=fruits', gradient:'linear-gradient(135deg,#ff6f00,#ffa726)', emoji:'🍎' },
  { tag:'🔥 MEGA DEALS', title:'Up to 40% OFF', desc:'On 200+ organic products — limited time!', cta:'Grab Now →', link:'products.html?bestseller=true', gradient:'linear-gradient(135deg,#1b4332,#2d6a4f)', emoji:'🎉' },
];

const DEFAULT_DEALS = [
  { title:'Biscuits & Cookies', offer:'15 varieties', emojis:'🍪🥜🧁', link:'products.html?category=biscuits', gradient:'linear-gradient(135deg,#fff3e0,#ffe0b2)' },
  { title:'Mushroom Products', offer:'Up to 35% OFF', emojis:'🍄🧪🍵', link:'products.html?category=mushroom', gradient:'linear-gradient(135deg,#efebe9,#d7ccc8)' },
  { title:'Organic Chicken', offer:'Farm Fresh', emojis:'🍗🥩🌡️', link:'products.html?category=chicken', gradient:'linear-gradient(135deg,#ffebee,#ffcdd2)' },
  { title:'Dry Fruits & Nuts', offer:'15 premium items', emojis:'🥜🌰🍇', link:'products.html?category=dryfruits', gradient:'linear-gradient(135deg,#fff8e1,#ffecb3)' },
  { title:'Organic Mutton', offer:'Premium Goat', emojis:'🍖🥩🔥', link:'products.html?category=mutton', gradient:'linear-gradient(135deg,#fbe9e7,#ffccbc)' },
  { title:'Superfoods', offer:'Chia, moringa, spirulina', emojis:'🧬🌱✨', link:'products.html?category=superfoods', gradient:'linear-gradient(135deg,#e8f5e9,#c8e6c9)' },
  { title:'Tea & Coffee', offer:'12 organic blends', emojis:'☕🍵🌿', link:'products.html?category=beverages', gradient:'linear-gradient(135deg,#efebe9,#d7ccc8)' },
  { title:'Honey & Spreads', offer:'Raw honey, nut butters', emojis:'🍯🥜🫙', link:'products.html?category=spreads', gradient:'linear-gradient(135deg,#fff3e0,#ffe0b2)' },
];

function getBanners() { return DB.get('homepage_banners', null) || DEFAULT_BANNERS; }
function getDeals() { return DB.get('homepage_deals', null) || DEFAULT_DEALS; }
function getSponsored() { return DB.get('homepage_sponsored', { title:'Organic Biscuits & Cookies — 15 Varieties', sub:'Kraft paper packaging | Zero preservatives', btn:'Shop Now', link:'products.html?category=biscuits' }); }

function loadHomepageManager() {
  renderBannerList();
  renderDealList();
  const sp = getSponsored();
  document.getElementById('sponsoredTitle').value = sp.title || '';
  document.getElementById('sponsoredSub').value = sp.sub || '';
  document.getElementById('sponsoredBtn').value = sp.btn || 'Shop Now';
  document.getElementById('sponsoredLink').value = sp.link || '';
}

function renderBannerList() {
  const banners = getBanners();
  const list = document.getElementById('bannerList');
  list.innerHTML = banners.map((b, i) => `
    <div style="display:flex;gap:12px;align-items:center;padding:14px;border:1px solid var(--border);border-radius:var(--radius);background:#fff;">
      <div style="width:80px;height:60px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:2rem;color:#fff;flex-shrink:0;" class="deal-preview-bg">${b.emoji}
        <style>.deal-preview-bg{background:${b.gradient};}</style>
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:700;font-size:0.9rem;margin-bottom:2px;">${b.title}</div>
        <div style="font-size:0.75rem;color:var(--text-light);">${b.desc}</div>
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0;">
        <button class="btn btn-outline btn-sm" onclick="editBanner(${i})"><i class="fas fa-edit"></i></button>
        <button class="btn btn-sm" style="background:var(--danger);color:#fff;border:none;" onclick="deleteBanner(${i})"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}

function addBanner() {
  const banners = getBanners();
  banners.push({ tag:'🆕 NEW', title:'New Banner', desc:'Description here', cta:'Shop Now →', link:'products.html', gradient:'linear-gradient(135deg,#2D6A4F,#52B788)', emoji:'🌿' });
  DB.set('homepage_banners', banners);
  renderBannerList();
  editBanner(banners.length - 1);
  showToast('Banner added! Click edit to customize.', 'success');
}

function editBanner(idx) {
  const banners = getBanners();
  const b = banners[idx];
  const html = `<div style="padding:20px;">
    <h3 style="margin-bottom:16px;">Edit Banner #${idx + 1}</h3>
    <div class="form-grid">
      <div class="form-group"><label>Tag Label</label><input type="text" id="eb_tag" class="form-input" value="${b.tag}"></div>
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
  // Create a temporary modal
  let modal = document.getElementById('bannerEditModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'bannerEditModal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }
  modal.innerHTML = `<div class="modal-box">${html}</div>`;
  modal.classList.add('active');
}

function saveBannerEdit(idx) {
  const banners = getBanners();
  banners[idx] = {
    tag: document.getElementById('eb_tag').value,
    title: document.getElementById('eb_title').value,
    desc: document.getElementById('eb_desc').value,
    cta: document.getElementById('eb_cta').value,
    link: document.getElementById('eb_link').value,
    emoji: document.getElementById('eb_emoji').value,
    gradient: document.getElementById('eb_gradient').value,
  };
  DB.set('homepage_banners', banners);
  closeModal('bannerEditModal');
  renderBannerList();
  showToast('Banner updated!', 'success');
}

function deleteBanner(idx) {
  if (!confirm('Delete this banner?')) return;
  const banners = getBanners();
  banners.splice(idx, 1);
  DB.set('homepage_banners', banners);
  renderBannerList();
  showToast('Banner deleted.', 'info');
}

function saveSponsored() {
  DB.set('homepage_sponsored', {
    title: document.getElementById('sponsoredTitle').value,
    sub: document.getElementById('sponsoredSub').value,
    btn: document.getElementById('sponsoredBtn').value,
    link: document.getElementById('sponsoredLink').value,
  });
  showToast('Sponsored banner saved!', 'success');
}

// Deal Cards
function renderDealList() {
  const deals = getDeals();
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
    </div>
  `).join('');
}

function addDealCard() {
  const deals = getDeals();
  deals.push({ title:'New Deal', offer:'Special Offer', emojis:'🆕✨🎉', link:'products.html', gradient:'linear-gradient(135deg,#e8f5e9,#c8e6c9)' });
  DB.set('homepage_deals', deals);
  renderDealList();
  showToast('Deal card added!', 'success');
}

function editDeal(idx) {
  const deals = getDeals();
  const d = deals[idx];
  const html = `<div style="padding:20px;">
    <h3 style="margin-bottom:16px;">Edit Deal Card #${idx + 1}</h3>
    <div class="form-grid">
      <div class="form-group"><label>Title</label><input type="text" id="ed_title" class="form-input" value="${d.title}"></div>
      <div class="form-group"><label>Offer Text</label><input type="text" id="ed_offer" class="form-input" value="${d.offer}"></div>
      <div class="form-group"><label>Emojis</label><input type="text" id="ed_emojis" class="form-input" value="${d.emojis}"></div>
      <div class="form-group"><label>Link</label><input type="text" id="ed_link" class="form-input" value="${d.link}"></div>
      <div class="form-group" style="grid-column:1/-1;"><label>Gradient CSS</label><input type="text" id="ed_gradient" class="form-input" value="${d.gradient}"></div>
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

function saveDealEdit(idx) {
  const deals = getDeals();
  deals[idx] = {
    title: document.getElementById('ed_title').value,
    offer: document.getElementById('ed_offer').value,
    emojis: document.getElementById('ed_emojis').value,
    link: document.getElementById('ed_link').value,
    gradient: document.getElementById('ed_gradient').value,
  };
  DB.set('homepage_deals', deals);
  closeModal('dealEditModal');
  renderDealList();
  showToast('Deal card updated!', 'success');
}

function deleteDeal(idx) {
  if (!confirm('Delete this deal card?')) return;
  const deals = getDeals();
  deals.splice(idx, 1);
  DB.set('homepage_deals', deals);
  renderDealList();
  showToast('Deal card deleted.', 'info');
}

// ============================================================
//  CATEGORIES MANAGER
// ============================================================

const DEFAULT_CATEGORIES = [
  { emoji:'🏠', name:'For You', link:'products.html' },
  { emoji:'🍪', name:'Biscuits', link:'products.html?category=biscuits' },
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
  { emoji:'🥬', name:'Vegetables', link:'products.html?category=vegetables' },
  { emoji:'🍎', name:'Fruits', link:'products.html?category=fruits' },
];

function getCategories() { return DB.get('categories', null) || DEFAULT_CATEGORIES; }

function loadCategoryManager() { renderCategoryList(); }

function renderCategoryList() {
  const cats = getCategories();
  const list = document.getElementById('categoryList');
  list.innerHTML = cats.map((c, i) => `
    <div style="display:flex;gap:12px;align-items:center;padding:12px 14px;border:1px solid var(--border);border-radius:var(--radius);background:#fff;">
      <span style="font-size:1.5rem;cursor:grab;" title="Drag to reorder">${c.emoji}</span>
      <input type="text" class="form-input cat-emoji" value="${c.emoji}" style="width:50px;text-align:center;font-size:1.2rem;" data-idx="${i}">
      <input type="text" class="form-input cat-name" value="${c.name}" style="flex:1;" data-idx="${i}">
      <input type="text" class="form-input cat-link" value="${c.link}" style="flex:2;font-size:0.8rem;" data-idx="${i}">
      <div style="display:flex;gap:4px;flex-shrink:0;">
        ${i > 0 ? `<button class="btn btn-outline btn-sm" onclick="moveCat(${i},-1)" title="Move up"><i class="fas fa-arrow-up"></i></button>` : ''}
        ${i < cats.length-1 ? `<button class="btn btn-outline btn-sm" onclick="moveCat(${i},1)" title="Move down"><i class="fas fa-arrow-down"></i></button>` : ''}
        <button class="btn btn-sm" style="background:var(--danger);color:#fff;border:none;" onclick="deleteCat(${i})"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}

function addCategory() {
  const cats = getCategories();
  cats.push({ emoji:'🆕', name:'New Category', link:'products.html?category=new' });
  DB.set('categories', cats);
  renderCategoryList();
  showToast('Category added! Edit its details below.', 'success');
}

function saveCategories() {
  const emojis = document.querySelectorAll('.cat-emoji');
  const names = document.querySelectorAll('.cat-name');
  const links = document.querySelectorAll('.cat-link');
  const cats = [];
  emojis.forEach((el, i) => {
    cats.push({ emoji: el.value, name: names[i].value, link: links[i].value });
  });
  DB.set('categories', cats);
  showToast('Categories saved! Changes will appear on the homepage.', 'success');
}

function deleteCat(idx) {
  if (!confirm('Delete this category?')) return;
  const cats = getCategories();
  cats.splice(idx, 1);
  DB.set('categories', cats);
  renderCategoryList();
  showToast('Category removed.', 'info');
}

function moveCat(idx, dir) {
  const cats = getCategories();
  const target = idx + dir;
  if (target < 0 || target >= cats.length) return;
  [cats[idx], cats[target]] = [cats[target], cats[idx]];
  DB.set('categories', cats);
  renderCategoryList();
}

function resetCategories() {
  if (!confirm('Reset categories to defaults? This cannot be undone.')) return;
  DB.set('categories', null);
  renderCategoryList();
  showToast('Categories reset to defaults.', 'info');
}
