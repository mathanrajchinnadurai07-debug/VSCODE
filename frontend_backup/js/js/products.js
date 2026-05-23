/* =========================================
   Curfee — Products Page (Firebase Version)
   ========================================= */

let allProducts = [];
let filtered = [];
const PAGE_SIZE = 24;
let currentPage = 1;

document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  setupFilters();
  setupSearch();
});

// ── 1. Load from Firestore ──────────────────
async function loadProducts() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;
  grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;">
    <i class="fas fa-spinner fa-spin" style="font-size:2rem;color:#2d6a4f;"></i>
    <p style="margin-top:12px;color:#64748b;">Loading products...</p>
  </div>`;

  try {
    // We can use the existing fsGetProducts or db.collection if initialized
    if (typeof db !== 'undefined') {
      const snap = await db.collection('products').orderBy('name').get();
      allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      // Fallback if db isn't global
      allProducts = await fsGetProducts({});
    }
    applyFilters();
  } catch (err) {
    console.error('Firestore error:', err);
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;">
      <div style="font-size:3rem;">⚠️</div>
      <h3 style="color:#ef4444;margin-top:12px;">Failed to load products</h3>
      <p style="color:#64748b;">${err.message}</p>
      <button onclick="loadProducts()" style="margin-top:16px;padding:10px 24px;background:#2d6a4f;color:#fff;border:none;border-radius:8px;cursor:pointer;">Retry</button>
    </div>`;
  }
}

// ── 2. Filters & Search ─────────────────────
function setupSearch() {
  const btn = document.getElementById('searchBtn');
  const input = document.getElementById('searchInput');
  const catSelect = document.getElementById('searchCategory');

  // Read URL params on load
  const params = new URLSearchParams(window.location.search);
  const q = params.get('search') || '';
  const cat = params.get('category') || '';

  if (q && input) {
    input.value = q;
    const title = document.getElementById('pageTitle');
    if (title) title.textContent = `Results for "${q}"`;
  }
  if (cat && catSelect) {
    catSelect.value = cat;
    const catLabel = catSelect.options[catSelect.selectedIndex]?.text || cat;
    const title = document.getElementById('pageTitle');
    if (title) title.textContent = catLabel.charAt(0).toUpperCase() + catLabel.slice(1);
    
    // Also tick the sidebar checkbox
    const cb = document.querySelector(`input[name=category][value="${cat}"]`);
    if (cb) cb.checked = true;
  }

  if (btn) btn.addEventListener('click', applyFilters);
  if (input) input.addEventListener('keypress', e => { if (e.key === 'Enter') applyFilters(); });
  if (catSelect) catSelect.addEventListener('change', applyFilters);
}

function setupFilters() {
  document.querySelectorAll('input[name=category]').forEach(cb => cb.addEventListener('change', applyFilters));
  document.querySelectorAll('input[name=rating]').forEach(r => r.addEventListener('change', applyFilters));
  const minP = document.getElementById('minPrice');
  const maxP = document.getElementById('maxPrice');
  const inStock = document.getElementById('inStockFilter');
  const featured = document.getElementById('featuredFilter');
  const sort = document.getElementById('sortSelect');
  const clear = document.getElementById('clearFilters');

  if (minP) minP.addEventListener('change', applyFilters);
  if (maxP) maxP.addEventListener('change', applyFilters);
  if (inStock) inStock.addEventListener('change', applyFilters);
  if (featured) featured.addEventListener('change', applyFilters);
  if (sort) sort.addEventListener('change', applyFilters);
  if (clear) clear.addEventListener('click', clearAllFilters);
}

function applyFilters() {
  const query = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
  const catSelect = document.getElementById('searchCategory')?.value || '';
  const checkedCats = [...document.querySelectorAll('input[name=category]:checked')].map(c => c.value);
  const rating = document.querySelector('input[name=rating]:checked')?.value || 0;
  const minP = parseFloat(document.getElementById('minPrice')?.value) || 0;
  const maxP = parseFloat(document.getElementById('maxPrice')?.value) || Infinity;
  const inStock = document.getElementById('inStockFilter')?.checked;
  const featuredOnly = document.getElementById('featuredFilter')?.checked;
  const sort = document.getElementById('sortSelect')?.value || '';

  filtered = allProducts.filter(p => {
    const price = p.price || p.originalPrice || 0;
    const name = p.name?.toLowerCase() || '';
    const desc = p.description?.toLowerCase() || '';
    const cat = p.category?.toLowerCase() || '';

    if (query && !name.includes(query) && !desc.includes(query) && !cat.includes(query)) return false;
    if (catSelect && cat !== catSelect) return false;
    if (checkedCats.length && !checkedCats.includes(p.category)) return false;
    if (rating && (p.rating || 0) < parseFloat(rating)) return false;
    if (price < minP || price > maxP) return false;
    if (inStock && (p.stock || 0) <= 0) return false;
    if (featuredOnly && !p.isFeatured && !p.featured) return false;
    return true;
  });

  // Sort
  if (sort === 'price_low') filtered.sort((a, b) => (a.price) - (b.price));
  else if (sort === 'price_high') filtered.sort((a, b) => (b.price) - (a.price));
  else if (sort === 'rating') filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));

  currentPage = 1;
  renderPage();
}

function clearAllFilters() {
  document.querySelectorAll('input[name=category]').forEach(c => c.checked = false);
  document.querySelectorAll('input[name=rating]').forEach(r => r.checked = false);
  const minP = document.getElementById('minPrice');
  const maxP = document.getElementById('maxPrice');
  const inStock = document.getElementById('inStockFilter');
  const featured = document.getElementById('featuredFilter');
  const sort = document.getElementById('sortSelect');
  const input = document.getElementById('searchInput');
  if (minP) minP.value = '';
  if (maxP) maxP.value = '';
  if (inStock) inStock.checked = true;
  if (featured) featured.checked = false;
  if (sort) sort.value = '';
  if (input) input.value = '';
  
  // Clear URL params visually so they don't block clearing search
  window.history.replaceState({}, '', 'products.html');
  
  applyFilters();
}

// ── 3. Render ───────────────────────────────
function renderPage() {
  const grid = document.getElementById('productGrid');
  const countEl = document.getElementById('productCount');
  const mobCount = document.getElementById('mobFoundCount');

  if (countEl) countEl.textContent = `${filtered.length} products`;
  if (mobCount) mobCount.textContent = filtered.length;

  if (!filtered.length) {
    if(grid) grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 20px;">
      <div style="font-size:3.5rem;">🌿</div>
      <h3 style="margin:16px 0 8px;color:#1e293b;">No products found</h3>
      <p style="color:#64748b;">Try adjusting your filters or search term</p>
      <button onclick="clearAllFilters()" style="margin-top:20px;padding:10px 28px;background:#2d6a4f;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;">Clear Filters</button>
    </div>`;
    renderPagination(0);
    return;
  }

  const start = (currentPage - 1) * PAGE_SIZE;
  const page = filtered.slice(start, start + PAGE_SIZE);

  if(grid) grid.innerHTML = page.map(p => productCard(p)).join('');
  renderPagination(Math.ceil(filtered.length / PAGE_SIZE));
}

function productCard(p) {
  // Gracefully handle images based on our schema
  const img = p.imageUrl || p.image || '';
  const price = p.price || 0;
  const original = p.originalPrice || price;
  const discount = original > price ? Math.round(((original - price) / original) * 100) : 0;
  const stars = '★'.repeat(Math.round(p.rating || 0)) + '☆'.repeat(5 - Math.round(p.rating || 0));
  const inStock = (p.stock || 0) > 0 || typeof p.stock === 'undefined'; // assume in stock if missing

  const imgHTML = img
    ? `<img src="${img}" alt="${p.name}" loading="lazy"
         onerror="this.onerror=null;this.parentElement.innerHTML='<div style=\\'font-size:3rem;text-align:center;padding:24px\\'>🌿</div>'">`
    : `<div style="font-size:3rem;text-align:center;padding:24px">🌿</div>`;

  return `
  <div class="product-card" onclick="window.location='product-detail.html?id=${p.id}'">
    <div class="product-img">
      ${discount ? `<span class="badge-discount">${discount}% OFF</span>` : ''}
      ${(p.isFeatured || p.featured) ? `<span class="badge-featured">⭐ Featured</span>` : ''}
      ${imgHTML}
    </div>
    <div class="product-info">
      <div class="product-name">${p.name}</div>
      <div class="product-category">${p.category || ''}</div>
      <div class="product-price">
        <span class="price-now">₹${price}</span>
        ${original > price ? `<span class="price-old">₹${original}</span>` : ''}
      </div>
      <div class="product-rating" style="font-size:0.75rem;color:#f59e0b;margin-bottom:8px;">
        ${stars} <span style="color:#64748b;">(${p.rating || 0})</span>
      </div>
      ${inStock
        ? `<button class="btn-add-cart" onclick="event.stopPropagation();fsAddToCart('${p.id}','${p.name.replace(/'/g,"\\'")}',${price},'${img}','${p.unit||''}')">
             <i class="fas fa-cart-plus"></i> Add to Cart
           </button>`
        : `<button class="btn-add-cart" disabled style="opacity:0.5;cursor:not-allowed;">Out of Stock</button>`
      }
    </div>
  </div>`;
}

// ── 4. Pagination ───────────────────────────
function renderPagination(totalPages) {
  const el = document.getElementById('pagination');
  if (!el || totalPages <= 1) { if (el) el.innerHTML = ''; return; }

  let html = '';
  for (let i = 1; i <= totalPages; i++) {
    html += `<button onclick="goPage(${i})"
      style="padding:8px 14px;border:1px solid ${i === currentPage ? '#2d6a4f' : '#e2e8f0'};
      border-radius:8px;background:${i === currentPage ? '#2d6a4f' : '#fff'};
      color:${i === currentPage ? '#fff' : '#1e293b'};cursor:pointer;font-weight:600;">${i}</button>`;
  }
  el.innerHTML = html;
}

function goPage(n) {
  currentPage = n;
  renderPage();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function switchFilterTab(tab, btn) {
  document.querySelectorAll('.mob-filter-sidebar button').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.mob-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  const panel = document.getElementById('mob-panel-' + tab);
  if (panel) panel.classList.add('active');
}
