/* ==========================================================
   Curfee — products.js  (Firebase version)
   Uses fsGetProducts / fsSearchProducts / fsAddToCart
   from firebase-init.js — no products-data.js needed
   ========================================================== */

let allProducts = [];
let filtered    = [];
const PAGE_SIZE = 24;
let currentPage = 1;

/* ── Boot ─────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  readURLAndLoad();
  setupFilters();
  setupSearchBar();
});

/* ── 1. Read URL params & load from Firestore ─────────────── */
async function readURLAndLoad() {
  const params   = new URLSearchParams(window.location.search);
  const urlQuery = params.get('search')   || '';
  const urlCat   = params.get('category') || '';

  // Pre-fill UI
  const input     = document.getElementById('searchInput');
  const catSelect = document.getElementById('searchCategory');
  if (input     && urlQuery) input.value     = urlQuery;
  if (catSelect && urlCat)   catSelect.value = urlCat;

  // Tick sidebar checkbox
  if (urlCat) {
    const cb = document.querySelector(`input[name=category][value="${urlCat}"]`);
    if (cb) cb.checked = true;
  }

  // Update page title
  const titleEl = document.getElementById('pageTitle');
  if (titleEl) {
    if (urlQuery)      titleEl.textContent = `Results for "${urlQuery}"`;
    else if (urlCat)   titleEl.textContent = urlCat.charAt(0).toUpperCase() + urlCat.slice(1);
    else               titleEl.textContent = 'All Products';
  }

  showLoadingState();

  try {
    if (urlQuery) {
      // Use fsSearchProducts from firebase-init.js
      allProducts = await fsSearchProducts(urlQuery);
    } else if (urlCat) {
      // Use fsGetProducts with category filter
      allProducts = await fsGetProducts({ category: urlCat });
    } else {
      allProducts = await fsGetProducts({});
    }
    applyFilters();
  } catch (err) {
    console.error('Firestore load error:', err);
    showErrorState(err.message);
  }
}

function showLoadingState() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;
  grid.innerHTML = `
    <div style="grid-column:1/-1;text-align:center;padding:80px 20px;">
      <i class="fas fa-spinner fa-spin" style="font-size:2.5rem;color:#2d6a4f;"></i>
      <p style="margin-top:16px;color:#64748b;font-size:1rem;">Loading fresh products...</p>
    </div>`;
}

function showErrorState(msg) {
  const grid = document.getElementById('productGrid');
  if (!grid) return;
  grid.innerHTML = `
    <div style="grid-column:1/-1;text-align:center;padding:80px 20px;">
      <div style="font-size:3rem;">⚠️</div>
      <h3 style="color:#ef4444;margin-top:12px;">Failed to load products</h3>
      <p style="color:#64748b;margin-top:8px;">${msg || 'Check your internet connection'}</p>
      <button onclick="readURLAndLoad()"
        style="margin-top:20px;padding:12px 28px;background:#2d6a4f;color:#fff;
               border:none;border-radius:8px;cursor:pointer;font-weight:600;">
        <i class="fas fa-redo"></i> Retry
      </button>
    </div>`;
}

/* ── 2. Search bar events ─────────────────────────────────── */
function setupSearchBar() {
  const btn    = document.getElementById('searchBtn');
  const input  = document.getElementById('searchInput');
  const catSel = document.getElementById('searchCategory');

  async function doSearch() {
    const q   = input?.value.trim()  || '';
    const cat = catSel?.value        || '';

    showLoadingState();
    try {
      if (q) {
        allProducts = await fsSearchProducts(q);
        const titleEl = document.getElementById('pageTitle');
        if (titleEl) titleEl.textContent = `Results for "${q}"`;
      } else if (cat) {
        allProducts = await fsGetProducts({ category: cat });
        const titleEl = document.getElementById('pageTitle');
        if (titleEl) titleEl.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
      } else {
        allProducts = await fsGetProducts({});
        const titleEl = document.getElementById('pageTitle');
        if (titleEl) titleEl.textContent = 'All Products';
      }
      applyFilters();
    } catch (err) {
      showErrorState(err.message);
    }
  }

  if (btn)    btn.addEventListener('click', doSearch);
  if (input)  input.addEventListener('keypress', e => { if (e.key === 'Enter') doSearch(); });
  if (catSel) catSel.addEventListener('change', doSearch);
}

/* ── 3. Client-side filters ───────────────────────────────── */
function setupFilters() {
  document.querySelectorAll('input[name=category]')
    .forEach(cb => cb.addEventListener('change', applyFilters));
  document.querySelectorAll('input[name=rating]')
    .forEach(r  => r.addEventListener('change', applyFilters));

  ['minPrice','maxPrice','inStockFilter','featuredFilter','sortSelect'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', applyFilters);
  });

  const clearBtn = document.getElementById('clearFilters');
  if (clearBtn) clearBtn.addEventListener('click', clearAllFilters);
}

function applyFilters() {
  const checkedCats  = [...document.querySelectorAll('input[name=category]:checked')].map(c => c.value);
  const minRating    = parseFloat(document.querySelector('input[name=rating]:checked')?.value || 0);
  const minP         = parseFloat(document.getElementById('minPrice')?.value)  || 0;
  const maxP         = parseFloat(document.getElementById('maxPrice')?.value)  || Infinity;
  const inStock      = document.getElementById('inStockFilter')?.checked;
  const featuredOnly = document.getElementById('featuredFilter')?.checked;
  const sort         = document.getElementById('sortSelect')?.value || '';

  filtered = allProducts.filter(p => {
    const price = p.discountedPrice || p.price || 0;
    if (checkedCats.length && !checkedCats.includes(p.category))  return false;
    if (minRating && (p.rating || 0) < minRating)                 return false;
    if (price < minP || price > maxP)                             return false;
    if (inStock      && (p.stock || 0) <= 0)                      return false;
    if (featuredOnly && !p.isFeatured && !p.featured)             return false;
    return true;
  });

  if (sort === 'price_low')  filtered.sort((a,b) => (a.discountedPrice||a.price) - (b.discountedPrice||b.price));
  if (sort === 'price_high') filtered.sort((a,b) => (b.discountedPrice||b.price) - (a.discountedPrice||a.price));
  if (sort === 'rating')     filtered.sort((a,b) => (b.rating||0) - (a.rating||0));

  currentPage = 1;
  renderPage();
}

function clearAllFilters() {
  document.querySelectorAll('input[name=category], input[name=rating]')
    .forEach(el => el.checked = false);
  const ids = ['minPrice','maxPrice','searchInput'];
  ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  const inStock = document.getElementById('inStockFilter');
  const featured = document.getElementById('featuredFilter');
  const sort = document.getElementById('sortSelect');
  if (inStock)  inStock.checked  = true;
  if (featured) featured.checked = false;
  if (sort)     sort.value       = '';
  applyFilters();
}

/* ── 4. Render product cards ──────────────────────────────── */
function renderPage() {
  const grid     = document.getElementById('productGrid');
  const countEl  = document.getElementById('productCount');
  const mobCount = document.getElementById('mobFoundCount');

  if (countEl)  countEl.textContent  = `${filtered.length} products`;
  if (mobCount) mobCount.textContent = filtered.length;

  if (!grid) return;

  if (!filtered.length) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:80px 20px;">
        <div style="font-size:3.5rem;">🌿</div>
        <h3 style="margin:16px 0 8px;color:#1e293b;">No products found</h3>
        <p style="color:#64748b;">Try adjusting your filters or search differently</p>
        <button onclick="clearAllFilters()"
          style="margin-top:20px;padding:12px 28px;background:#2d6a4f;color:#fff;
                 border:none;border-radius:8px;cursor:pointer;font-weight:600;">
          Clear Filters
        </button>
      </div>`;
    renderPagination(0);
    return;
  }

  const start = (currentPage - 1) * PAGE_SIZE;
  const page  = filtered.slice(start, start + PAGE_SIZE);

  grid.innerHTML = page.map(p => productCard(p)).join('');
  renderPagination(Math.ceil(filtered.length / PAGE_SIZE));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function productCard(p) {
  // Support multiple image field names
  const images = Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []);
  const img    = p.imageUrl || images[0] || '';

  const price    = p.discountedPrice || p.price || 0;
  const original = p.price || 0;
  const discount = original > price ? Math.round(((original - price) / original) * 100) : 0;
  const rating   = Math.round(p.rating || 0);
  const stars    = '★'.repeat(rating) + '☆'.repeat(5 - rating);
  const inStock  = p.stock === undefined || p.stock > 0; // default to in-stock if no stock field

  // Image HTML — supports URL or local assets path
  const imgSrc = img.startsWith('http') ? img : `assets/images/products/${img}`;
  const imgHTML = img
    ? `<img src="${imgSrc}" alt="${p.name}" loading="lazy"
           style="width:100%;height:100%;object-fit:cover;"
           onerror="this.onerror=null;this.parentElement.innerHTML='<div style=\'font-size:3rem;text-align:center;padding:20px\'>🌿</div>'">`
    : `<div style="font-size:3rem;text-align:center;padding:20px;line-height:1;">🌿</div>`;

  // Safe product name for JS string
  const safeName = p.name.replace(/'/g, "\\'").replace(/"/g, '\\"');

  return `
  <div class="product-card" style="cursor:pointer;" onclick="window.location='product-detail.html?id=${p.id}'">
    <div class="product-img" style="position:relative;background:#f8f9fa;border-radius:8px 8px 0 0;overflow:hidden;aspect-ratio:1;">
      ${discount ? `<span style="position:absolute;top:8px;left:8px;background:#e05a2b;color:#fff;font-size:0.7rem;font-weight:700;padding:3px 8px;border-radius:20px;z-index:1;">${discount}% OFF</span>` : ''}
      ${p.isFeatured || p.featured ? `<span style="position:absolute;top:8px;right:8px;background:#1a5c38;color:#fff;font-size:0.7rem;font-weight:700;padding:3px 8px;border-radius:20px;z-index:1;">⭐ Featured</span>` : ''}
      ${imgHTML}
    </div>
    <div class="product-info" style="padding:12px;">
      <div style="font-weight:600;font-size:0.9rem;color:#1e293b;margin-bottom:4px;line-height:1.3;
                  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
        ${p.name}
      </div>
      <div style="font-size:0.75rem;color:#64748b;margin-bottom:6px;text-transform:capitalize;">
        ${p.category || ''}${p.unit ? ' · ' + p.unit : ''}
      </div>
      ${p.rating ? `<div style="font-size:0.75rem;color:#f59e0b;margin-bottom:6px;">${stars} <span style="color:#94a3b8;">(${p.rating})</span></div>` : ''}
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
        <span style="font-size:1rem;font-weight:700;color:#1a5c38;">₹${price}</span>
        ${original > price ? `<span style="font-size:0.8rem;color:#94a3b8;text-decoration:line-through;">₹${original}</span>` : ''}
      </div>
      ${inStock
        ? `<button
             onclick="event.stopPropagation(); addToCart('${p.id}','${safeName}',${price},${original},'${img}')"
             style="width:100%;padding:9px;background:#1a5c38;color:#fff;border:none;border-radius:8px;
                    font-weight:600;font-size:0.85rem;cursor:pointer;transition:background 0.2s;"
             onmouseover="this.style.background='#40916c'"
             onmouseout="this.style.background='#1a5c38'">
             <i class="fas fa-cart-plus"></i> Add to Cart
           </button>`
        : `<button disabled
             style="width:100%;padding:9px;background:#e2e8f0;color:#94a3b8;border:none;
                    border-radius:8px;font-weight:600;font-size:0.85rem;cursor:not-allowed;">
             Out of Stock
           </button>`
      }
    </div>
  </div>`;
}

/* ── 5. Pagination ────────────────────────────────────────── */
function renderPagination(totalPages) {
  const el = document.getElementById('pagination');
  if (!el) return;
  if (totalPages <= 1) { el.innerHTML = ''; return; }

  let html = '';
  for (let i = 1; i <= totalPages; i++) {
    const active = i === currentPage;
    html += `<button onclick="goPage(${i})"
      style="padding:8px 14px;border:1px solid ${active ? '#1a5c38' : '#e2e8f0'};
             border-radius:8px;background:${active ? '#1a5c38' : '#fff'};
             color:${active ? '#fff' : '#1e293b'};cursor:pointer;font-weight:600;
             transition:all 0.2s;">${i}</button>`;
  }
  el.innerHTML = html;
}

function goPage(n) {
  currentPage = n;
  renderPage();
}

/* ── 6. addToCart — bridges to fsAddToCart ────────────────── */
// This is the function called by product card buttons.
// It wraps fsAddToCart() from firebase-init.js.
async function addToCart(productId, name, price, originalPrice, image) {
  const user = auth.currentUser;

  if (!user) {
    if (typeof showToast === 'function') {
      showToast('Please login to add items to cart', 'warning');
    }
    setTimeout(() => {
      window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
    }, 1500);
    return;
  }

  try {
    await fsAddToCart({
      id:            productId,
      name:          name,
      price:         price,
      originalPrice: originalPrice || price,
      imageUrl:      image || '',
    });
    // fsAddToCart already shows toast & updates cart badge via startCartListener
  } catch (err) {
    console.error('addToCart error:', err);
    if (typeof showToast === 'function') {
      showToast('Failed to add to cart. Please try again.', 'error');
    }
  }
}

/* ── 7. Mobile filter tab switcher ────────────────────────── */
function switchFilterTab(tab, btn) {
  document.querySelectorAll('.mob-filter-sidebar button')
    .forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.mob-panel')
    .forEach(p => p.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const panel = document.getElementById('mob-panel-' + tab);
  if (panel) panel.classList.add('active');
}