/* ==========================================================
   Curfee — Products Page (Firestore)
   Reads products from Firestore, supports filters from URL
   ========================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const category = params.get('category');
  const search = params.get('search');
  const bestseller = params.get('bestseller');
  const featured = params.get('featured');

  const grid = document.getElementById('productsGrid') || document.querySelector('.products-grid');
  const title = document.getElementById('pageTitle') || document.querySelector('.page-title');

  if (!grid) return;
  grid.innerHTML = '<div class="loading-spinner" style="text-align:center;padding:40px;grid-column:1/-1;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--primary);"></i><p>Loading products...</p></div>';

  try {
    let products = [];

    if (search) {
      // Search — client-side filter since Firestore doesn't support substring
      products = await fsSearchProducts(search);
      if (title) title.textContent = `Search: "${search}"`;
    } else if (category) {
      products = await fsGetProducts({ category });
      if (title) title.textContent = category.charAt(0).toUpperCase() + category.slice(1) + ' Products';
    } else if (bestseller) {
      products = await fsGetProducts({ isBestseller: true });
      if (title) title.textContent = 'Bestsellers';
    } else if (featured) {
      products = await fsGetProducts({ isFeatured: true });
      if (title) title.textContent = 'Featured Products';
    } else {
      products = await fsGetProducts({});
      if (title) title.textContent = 'All Products';
    }

    if (products.length === 0) {
      grid.innerHTML = '<div style="text-align:center;padding:60px;grid-column:1/-1;"><i class="fas fa-box-open fa-3x" style="color:#ccc;margin-bottom:16px;"></i><h3>No products found</h3><p style="color:#999;">Try a different search or category.</p><a href="products.html" class="btn btn-primary" style="margin-top:16px;">View All Products</a></div>';
      return;
    }

    grid.innerHTML = products.map(p => productCardHTML(p)).join('');

    // Product count
    const countEl = document.getElementById('productCount');
    if (countEl) countEl.textContent = products.length + ' Products';

  } catch (err) {
    console.error('Error loading products:', err);
    grid.innerHTML = '<div style="text-align:center;padding:40px;grid-column:1/-1;color:#e53e3e;"><i class="fas fa-exclamation-triangle fa-2x"></i><p>Failed to load products. Please try again.</p></div>';
  }

  // ── Real-time search filter ──
  const searchInput = document.getElementById('productSearch') || document.getElementById('searchInput');
  if (searchInput) {
    let allProducts = null;
    searchInput.addEventListener('input', async e => {
      const q = e.target.value.trim().toLowerCase();
      if (q.length < 2) {
        // Reload current products
        if (allProducts) {
          grid.innerHTML = allProducts.map(p => productCardHTML(p)).join('');
        }
        return;
      }
      if (!allProducts) {
        allProducts = await fsGetProducts({});
      }
      const filtered = allProducts.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
      grid.innerHTML = filtered.length
        ? filtered.map(p => productCardHTML(p)).join('')
        : '<div style="text-align:center;padding:40px;grid-column:1/-1;"><p>No products match "' + q + '"</p></div>';
    });
  }

  // ── Category filter buttons (if present) ──
  document.querySelectorAll('.category-filter-btn, [data-category-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.category || btn.dataset.categoryFilter;
      if (cat) window.location.href = 'products.html?category=' + cat;
    });
  });
});
