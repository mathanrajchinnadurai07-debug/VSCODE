/* Products Page Logic — Uses ALL_PRODUCTS + ALL_PRODUCTS_PART2 from data files */
document.addEventListener('DOMContentLoaded', () => {
  const p = new URLSearchParams(window.location.search);
  if (p.get('category')) {
    document.querySelectorAll('input[name="category"]').forEach(cb => { if (cb.value === p.get('category')) cb.checked = true; });
    document.getElementById('pageTitle').textContent = capitalize(p.get('category'));
  }
  if (p.get('search')) { document.getElementById('searchInput').value = p.get('search'); document.getElementById('pageTitle').textContent = `Search: "${p.get('search')}"`; }
  if (p.get('featured')) document.getElementById('featuredFilter').checked = true;
  loadProducts();
  initFilters();
});

let allProducts = [], currentPage = 1;

async function loadProducts() {
  const params = buildQueryParams();
  try {
    const data = await api(`/products?${params}`);
    if (data.products?.length) { allProducts = data.products; renderGrid(data.products); renderPagination(data.pages, data.page); document.getElementById('productCount').textContent = `${data.total} products found`; return; }
  } catch { }
  loadFallbackAll();
}

function loadFallbackAll() {
  // Use ALL_PRODUCTS and ALL_PRODUCTS_PART2 from products-data.js and products-data2.js
  const part1 = (typeof ALL_PRODUCTS !== 'undefined') ? ALL_PRODUCTS : [];
  const part2 = (typeof ALL_PRODUCTS_PART2 !== 'undefined') ? ALL_PRODUCTS_PART2 : [];
  allProducts = part1.concat(part2);
  applyLocalFilters();
}

function applyLocalFilters() {
  let filtered = [...allProducts]; const params = new URLSearchParams(window.location.search);
  
  let cats = [...document.querySelectorAll('input[name="category"]:checked')].map(c => c.value);
  const mobCats = [...document.querySelectorAll('.mob-cat-param:checked')].map(c => c.value);
  cats = [...new Set([...cats, ...mobCats])];
  
  if (cats.length) filtered = filtered.filter(p => cats.includes(p.category));
  else if (params.get('category')) filtered = filtered.filter(p => p.category === params.get('category'));
  
  const search = params.get('search') || document.getElementById('searchInput')?.value || document.getElementById('mobSearchInput')?.value;
  if (search) filtered = filtered.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()));
  
  const min = document.getElementById('minPrice')?.value; const max = document.getElementById('maxPrice')?.value;
  if (min) filtered = filtered.filter(p => (p.discountPrice || p.price) >= Number(min));
  if (max) filtered = filtered.filter(p => (p.discountPrice || p.price) <= Number(max));
  
  const rating = document.querySelector('input[name="rating"]:checked')?.value || document.querySelector('input[name="mob_rating"]:checked')?.value;
  if (rating) filtered = filtered.filter(p => p.rating >= Number(rating));
  
  if (document.getElementById('mobInStock')?.checked || document.getElementById('inStockFilter')?.checked) filtered = filtered.filter(p => (p.stock || p.stockQuantity || 10) > 0);
  
  if (document.getElementById('featuredFilter')?.checked || params.get('featured')) filtered = filtered.filter(p => p.isFeatured);
  
  if (params.get('bestseller')) filtered = filtered.filter(p => p.isBestSeller || p.isFeatured);
  
  const sort = document.getElementById('sortSelect')?.value;
  if (sort === 'price_low') filtered.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
  else if (sort === 'price_high') filtered.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
  else if (sort === 'rating') filtered.sort((a, b) => b.rating - a.rating);
  
  filtered.forEach(p => { productsCache[p.slug] = p; });
  
  document.getElementById('productCount').textContent = `${filtered.length} products found`;
  const mfc = document.getElementById('mobFilterCount');
  if (mfc) mfc.textContent = `${filtered.length} products found`;
  
  renderGrid(filtered);
}

function renderGrid(products) {
  const g = document.getElementById('productGrid');
  g.innerHTML = products.length ? products.map(p => productCardHTML(p)).join('') : '<p style="text-align:center;padding:40px;color:var(--text-light);">No products found.</p>';
}
function renderPagination(totalPages, cur) { const c = document.getElementById('pagination'); if (totalPages <= 1) { c.innerHTML = ''; return; } let h = ''; for (let i = 1; i <= totalPages; i++) h += `<button class="btn btn-sm ${i === cur ? 'btn-primary' : 'btn-outline'}" onclick="goToPage(${i})">${i}</button>`; c.innerHTML = h; }
function goToPage(page) { currentPage = page; loadProducts(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function buildQueryParams() { const p = new URLSearchParams(window.location.search); const cats = [...document.querySelectorAll('input[name="category"]:checked')].map(c => c.value); let q = `page=${currentPage}&limit=24`; if (cats.length === 1) q += `&category=${cats[0]}`; else if (p.get('category')) q += `&category=${p.get('category')}`; if (p.get('search')) q += `&search=${p.get('search')}`; if (p.get('featured')) q += `&featured=true`; if (p.get('bestseller')) q += `&bestseller=true`; const min = document.getElementById('minPrice')?.value; const max = document.getElementById('maxPrice')?.value; if (min) q += `&minPrice=${min}`; if (max) q += `&maxPrice=${max}`; const rating = document.querySelector('input[name="rating"]:checked')?.value; if (rating) q += `&rating=${rating}`; const sort = document.getElementById('sortSelect')?.value; if (sort) q += `&sort=${sort}`; return q; }
function initFilters() { document.querySelectorAll('.filter-sidebar input, .filter-sidebar select').forEach(el => el.addEventListener('change', () => { currentPage = 1; loadProducts(); })); document.getElementById('sortSelect')?.addEventListener('change', () => { currentPage = 1; loadProducts(); }); document.getElementById('clearFilters')?.addEventListener('click', () => { document.querySelectorAll('.filter-sidebar input').forEach(i => { i.checked = false; i.value = ''; }); document.getElementById('sortSelect').value = ''; window.location.href = 'products.html'; }); }
function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

// Mobile Filter UI Logic
document.addEventListener('DOMContentLoaded', () => {
  const mobFilterBtn = document.getElementById('mobFilterBtn');
  const mobFilterOverlay = document.getElementById('mobFilterOverlay');
  const closeMobFilter = document.getElementById('closeMobFilter');
  const applyMobFilters = document.getElementById('applyMobFilters');
  
  if(mobFilterBtn) {
    mobFilterBtn.addEventListener('click', () => { mobFilterOverlay.classList.add('active'); document.body.style.overflow = 'hidden'; });
    closeMobFilter.addEventListener('click', () => { mobFilterOverlay.classList.remove('active'); document.body.style.overflow = ''; });
    applyMobFilters.addEventListener('click', () => { mobFilterOverlay.classList.remove('active'); document.body.style.overflow = ''; applyLocalFilters(); });
  }

  const tabBtns = document.querySelectorAll('.mob-tab-btn');
  const tabPanes = document.querySelectorAll('.mob-tab-pane');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const tabId = btn.getAttribute('data-tab');
      document.getElementById('mobTab-' + tabId)?.classList.add('active');
    });
  });
});

