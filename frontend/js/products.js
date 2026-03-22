/* Products Page Logic — Filtering, sorting, pagination */
document.addEventListener('DOMContentLoaded', () => { const p = new URLSearchParams(window.location.search); if (p.get('category')) { document.querySelectorAll('input[name="category"]').forEach(cb => { if (cb.value===p.get('category')) cb.checked=true; }); document.getElementById('pageTitle').textContent=capitalize(p.get('category')); } if (p.get('search')) { document.getElementById('searchInput').value=p.get('search'); document.getElementById('pageTitle').textContent=`Search: "${p.get('search')}"`; } if (p.get('featured')) document.getElementById('featuredFilter').checked=true; loadProducts(); initFilters(); });

let allProducts = [], currentPage = 1;

async function loadProducts() {
  const params = buildQueryParams();
  try { const data = await api(`/products?${params}`); if (data.products?.length) { allProducts = data.products; renderGrid(data.products); renderPagination(data.pages, data.page); document.getElementById('productCount').textContent = `${data.total} products found`; return; } } catch {}
  loadFallbackAll();
}

function loadFallbackAll() {
  const products = [
    { _id:'1', slug:'organic-tomato', name:'Organic Tomato', category:'vegetables', price:60, discountPrice:49, rating:4.5, numReviews:128, stock:150, images:[], weights:[{label:'250g',price:20,discountPrice:15},{label:'500g',price:35,discountPrice:28},{label:'1kg',price:60,discountPrice:49}], isFeatured:true, isBestSeller:true },
    { _id:'2', slug:'organic-onion', name:'Organic Onion', category:'vegetables', price:45, discountPrice:38, rating:4.3, numReviews:95, stock:200, images:[], weights:[{label:'250g',price:15,discountPrice:12},{label:'500g',price:25,discountPrice:20},{label:'1kg',price:45,discountPrice:38}] },
    { _id:'3', slug:'organic-potato', name:'Organic Potato', category:'vegetables', price:40, discountPrice:32, rating:4.2, numReviews:73, stock:300, images:[], weights:[{label:'250g',price:12,discountPrice:10},{label:'500g',price:22,discountPrice:18},{label:'1kg',price:40,discountPrice:32}] },
    { _id:'4', slug:'organic-carrot', name:'Organic Carrot', category:'vegetables', price:55, discountPrice:45, rating:4.6, numReviews:86, stock:120, images:[], weights:[{label:'250g',price:18,discountPrice:14},{label:'500g',price:30,discountPrice:25},{label:'1kg',price:55,discountPrice:45}], isFeatured:true },
    { _id:'5', slug:'organic-spinach', name:'Organic Spinach', category:'vegetables', price:35, discountPrice:28, rating:4.4, numReviews:62, stock:80, images:[], weights:[{label:'250g',price:12,discountPrice:10},{label:'500g',price:20,discountPrice:16},{label:'1kg',price:35,discountPrice:28}], isFeatured:true },
    { _id:'6', slug:'organic-broccoli', name:'Organic Broccoli', category:'vegetables', price:85, discountPrice:72, rating:4.7, numReviews:45, stock:60, images:[], weights:[{label:'250g',price:25,discountPrice:20},{label:'500g',price:45,discountPrice:38},{label:'1kg',price:85,discountPrice:72}], isFeatured:true },
    { _id:'7', slug:'organic-banana', name:'Organic Banana', category:'fruits', price:50, discountPrice:42, rating:4.5, numReviews:156, stock:200, images:[], weights:[{label:'6 pcs',price:30,discountPrice:25},{label:'12 pcs',price:50,discountPrice:42}], isFeatured:true, isBestSeller:true },
    { _id:'8', slug:'organic-mango', name:'Organic Mango', category:'fruits', price:350, discountPrice:299, rating:4.8, numReviews:210, stock:50, images:[], weights:[{label:'500g',price:180,discountPrice:150},{label:'1kg',price:350,discountPrice:299}], isFeatured:true, isBestSeller:true },
    { _id:'9', slug:'organic-apple', name:'Organic Apple', category:'fruits', price:180, discountPrice:155, rating:4.6, numReviews:132, stock:90, images:[], weights:[{label:'500g',price:95,discountPrice:80},{label:'1kg',price:180,discountPrice:155}], isFeatured:true },
    { _id:'10', slug:'organic-strawberry', name:'Organic Strawberry', category:'fruits', price:120, discountPrice:99, rating:4.7, numReviews:89, stock:40, images:[], weights:[{label:'250g',price:65,discountPrice:55},{label:'500g',price:120,discountPrice:99}], isFeatured:true },
    { _id:'11', slug:'organic-milk', name:'Organic Milk', category:'dairy', price:75, discountPrice:65, rating:4.8, numReviews:234, stock:50, images:[], weights:[{label:'500ml',price:40,discountPrice:35},{label:'1L',price:75,discountPrice:65}], isFeatured:true, isBestSeller:true },
    { _id:'12', slug:'organic-butter', name:'Organic Butter', category:'dairy', price:120, discountPrice:105, rating:4.6, numReviews:98, stock:80, images:[], weights:[{label:'100g',price:55,discountPrice:48},{label:'200g',price:95,discountPrice:82}], isBestSeller:true },
    { _id:'13', slug:'organic-paneer', name:'Organic Paneer', category:'dairy', price:150, discountPrice:130, rating:4.5, numReviews:112, stock:60, images:[], weights:[{label:'200g',price:75,discountPrice:65},{label:'500g',price:150,discountPrice:130}], isFeatured:true },
    { _id:'14', slug:'organic-ghee', name:'Organic Ghee', category:'dairy', price:650, discountPrice:549, rating:4.9, numReviews:305, stock:45, images:[], weights:[{label:'250ml',price:350,discountPrice:299},{label:'500ml',price:650,discountPrice:549}], isFeatured:true, isBestSeller:true },
    { _id:'15', slug:'organic-yogurt', name:'Organic Yogurt', category:'dairy', price:55, discountPrice:45, rating:4.4, numReviews:87, stock:70, images:[], weights:[{label:'200g',price:28,discountPrice:23},{label:'500g',price:55,discountPrice:45}] },
  ];
  allProducts = products; applyLocalFilters();
}

function applyLocalFilters() {
  let filtered = [...allProducts]; const params = new URLSearchParams(window.location.search);
  const cats = [...document.querySelectorAll('input[name="category"]:checked')].map(c => c.value);
  if (cats.length) filtered = filtered.filter(p => cats.includes(p.category)); else if (params.get('category')) filtered = filtered.filter(p => p.category === params.get('category'));
  const search = params.get('search') || document.getElementById('searchInput')?.value; if (search) filtered = filtered.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const min = document.getElementById('minPrice')?.value; const max = document.getElementById('maxPrice')?.value;
  if (min) filtered = filtered.filter(p => (p.discountPrice || p.price) >= Number(min)); if (max) filtered = filtered.filter(p => (p.discountPrice || p.price) <= Number(max));
  const rating = document.querySelector('input[name="rating"]:checked')?.value; if (rating) filtered = filtered.filter(p => p.rating >= Number(rating));
  if (document.getElementById('featuredFilter')?.checked || params.get('featured')) filtered = filtered.filter(p => p.isFeatured);
  if (params.get('bestseller')) filtered = filtered.filter(p => p.isBestSeller);
  const sort = document.getElementById('sortSelect')?.value;
  if (sort === 'price_low') filtered.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
  else if (sort === 'price_high') filtered.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
  else if (sort === 'rating') filtered.sort((a, b) => b.rating - a.rating);
  filtered.forEach(p => { productsCache[p.slug] = p; }); document.getElementById('productCount').textContent = `${filtered.length} products found`; renderGrid(filtered);
}

function renderGrid(products) { const g = document.getElementById('productGrid'); g.innerHTML = products.length ? products.map(p => productCardHTML(p)).join('') : '<p style="text-align:center;padding:40px;color:var(--text-light);">No products found.</p>'; }
function renderPagination(totalPages, cur) { const c = document.getElementById('pagination'); if (totalPages <= 1) { c.innerHTML = ''; return; } let h = ''; for (let i = 1; i <= totalPages; i++) h += `<button class="btn btn-sm ${i===cur?'btn-primary':'btn-outline'}" onclick="goToPage(${i})">${i}</button>`; c.innerHTML = h; }
function goToPage(page) { currentPage = page; loadProducts(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function buildQueryParams() { const p = new URLSearchParams(window.location.search); const cats = [...document.querySelectorAll('input[name="category"]:checked')].map(c => c.value); let q = `page=${currentPage}&limit=12`; if (cats.length===1) q += `&category=${cats[0]}`; else if (p.get('category')) q += `&category=${p.get('category')}`; if (p.get('search')) q += `&search=${p.get('search')}`; if (p.get('featured')) q += `&featured=true`; if (p.get('bestseller')) q += `&bestseller=true`; const min = document.getElementById('minPrice')?.value; const max = document.getElementById('maxPrice')?.value; if (min) q += `&minPrice=${min}`; if (max) q += `&maxPrice=${max}`; const rating = document.querySelector('input[name="rating"]:checked')?.value; if (rating) q += `&rating=${rating}`; const sort = document.getElementById('sortSelect')?.value; if (sort) q += `&sort=${sort}`; return q; }
function initFilters() { document.querySelectorAll('.filter-sidebar input, .filter-sidebar select').forEach(el => el.addEventListener('change', () => { currentPage = 1; loadProducts(); })); document.getElementById('sortSelect')?.addEventListener('change', () => { currentPage = 1; loadProducts(); }); document.getElementById('clearFilters')?.addEventListener('click', () => { document.querySelectorAll('.filter-sidebar input').forEach(i => { i.checked = false; i.value = ''; }); document.getElementById('sortSelect').value = ''; window.location.href = 'products.html'; }); }
function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }
