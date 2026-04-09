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
    orders: 'Order Management', branding: 'Branding', settings: 'Store Settings', payment: 'Payment Config'
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
  const lowItems = getAllProducts().filter(p => getProductStock(p) < 30).slice(0, 6);
  if (!lowItems.length) {
    ls.innerHTML = '<div style="padding:0 24px;color:#10b981;font-size:0.85rem;">✅ All products well-stocked!</div>';
  } else {
    ls.innerHTML = lowItems.map(p => {
      const stk = getProductStock(p);
      const cls = stk === 0 ? 'out' : stk < 10 ? 'low' : 'medium';
      return `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 24px;border-bottom:1px solid #f1f5f9;">
        <span style="font-size:0.84rem;font-weight:500;">${p.name}</span>
        <span class="stock-badge ${cls}">${stk === 0 ? 'Out of Stock' : stk + ' left'}</span>
      </div>`;
    }).join('');
  }

  // Payout mini
  renderPayoutDisplay('dashPayoutBar', 'dashPayoutGrid', 0);
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
    const cc = catColors[p.category] || '#475569';
    return `<tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px;">
          <img src="assets/images/products/${p.images?.[0]?.split('/').pop() || 'tomato.png'}" style="width:36px;height:36px;border-radius:8px;object-fit:cover;border:1px solid #e2e8f0;" onerror="this.src='assets/images/products/tomato.png'">
          <div>
            <div style="font-weight:600;font-size:0.85rem;">${p.name}</div>
            <div style="font-size:0.72rem;color:#94a3b8;">${p.slug || p._id}</div>
          </div>
        </div>
      </td>
      <td><span style="background:${cc}22;color:${cc};padding:3px 10px;border-radius:12px;font-size:0.72rem;font-weight:600;">${p.category}</span></td>
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
  showToast('Stock updated!', 'success');
}

function updatePrice(id, type, val) {
  const overrides = getPriceOverrides();
  overrides[id + '_' + type] = parseFloat(val) || 0;
  DB.set('price_overrides', overrides);
  showToast('Price updated!', 'success');
}

function openEditProduct(id) {
  const p = getAllProducts().find(x => x._id === id);
  if (!p) return;
  const dets = getDetailOverrides()[id] || {};
  document.getElementById('editProdId').value = id;
  document.getElementById('editProdName').value = p.name;
  document.getElementById('editProdCat').value = p.category;
  document.getElementById('editProdPrice').value = getProductPrice(p);
  document.getElementById('editProdDiscPrice').value = getProductDiscPrice(p);
  document.getElementById('editProdStock').value = getProductStock(p);
  document.getElementById('editProdRating').value = p.rating || 4.3;
  document.getElementById('editProdDesc').value = dets.description !== undefined ? dets.description : (p.description || '');
  document.getElementById('editProdImage').value = dets.images ? dets.images.join(', ') : (p.images ? p.images.map(i => i.split('/').pop()).join(', ') : '');
  document.getElementById('editProdVideo').value = dets.videoUrl !== undefined ? dets.videoUrl : (p.videoUrl || '');
  document.getElementById('editProductModal').classList.add('active');
}

function saveEditProduct(e) {
  e.preventDefault();
  const id = document.getElementById('editProdId').value;
  updateStock(id, document.getElementById('editProdStock').value);
  updatePrice(id, 'price', document.getElementById('editProdPrice').value);
  updatePrice(id, 'disc', document.getElementById('editProdDiscPrice').value);
  
  const overrides = getDetailOverrides();
  const imgsStr = document.getElementById('editProdImage').value;
  const imgs = imgsStr ? imgsStr.split(',').map(s=>s.trim()).filter(Boolean).map(s => s.startsWith('http') ? s : 'assets/images/products/' + s) : [];
  overrides[id] = {
    description: document.getElementById('editProdDesc').value.trim(),
    videoUrl: document.getElementById('editProdVideo').value.trim(),
    images: imgs.length > 0 ? imgs : undefined
  };
  DB.set('detail_overrides', overrides);

  closeModal('editProductModal');
  showToast('Product updated successfully!', 'success');
  renderProductTable();
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
  document.getElementById('supportEmail').value = s.email || 'support@curfee.com';
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
