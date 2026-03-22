/* Homepage Logic — Hero slider, load products */
document.addEventListener('DOMContentLoaded', () => { initHeroSlider(); loadHomeProducts(); initNewsletter(); });

function initHeroSlider() {
  const slides = document.querySelectorAll('.hero-slide'), dots = document.querySelectorAll('.hero-dots .dot');
  let current = 0, interval;
  function showSlide(i) { slides.forEach(s => s.classList.remove('active')); dots.forEach(d => d.classList.remove('active')); slides[i]?.classList.add('active'); dots[i]?.classList.add('active'); current = i; }
  function next() { showSlide((current + 1) % slides.length); }
  dots.forEach(dot => { dot.addEventListener('click', () => { clearInterval(interval); showSlide(parseInt(dot.dataset.slide)); interval = setInterval(next, 5000); }); });
  interval = setInterval(next, 5000);
}

async function loadHomeProducts() {
  try {
    const [featured, veg, fruits, dairy] = await Promise.all([api('/products?featured=true&limit=4').catch(()=>null), api('/products?category=vegetables&bestseller=true&limit=4').catch(()=>null), api('/products?category=fruits&limit=4').catch(()=>null), api('/products?category=dairy&limit=4').catch(()=>null)]);
    if (featured?.products?.length) { renderProducts('featuredProducts', featured.products); renderProducts('bestVegetables', veg?.products||[]); renderProducts('seasonalFruits', fruits?.products||[]); renderProducts('dairyProducts', dairy?.products||[]); } else loadFallbackProducts();
  } catch { loadFallbackProducts(); }
}

function renderProducts(id, products) { const c = document.getElementById(id); if (!c||!products.length) return; c.innerHTML = products.map(p => productCardHTML(p)).join(''); products.forEach(p => { productsCache[p.slug] = p; }); }

function loadFallbackProducts() {
  const fb = [
    { _id:'1', slug:'organic-tomato', name:'Organic Tomato', category:'vegetables', price:60, discountPrice:49, rating:4.5, numReviews:128, stock:150, images:[], weights:[{label:'250g',price:20,discountPrice:15},{label:'500g',price:35,discountPrice:28},{label:'1kg',price:60,discountPrice:49}], isFeatured:true },
    { _id:'2', slug:'organic-carrot', name:'Organic Carrot', category:'vegetables', price:55, discountPrice:45, rating:4.6, numReviews:86, stock:120, images:[], weights:[{label:'250g',price:18,discountPrice:14},{label:'500g',price:30,discountPrice:25},{label:'1kg',price:55,discountPrice:45}], isFeatured:true },
    { _id:'3', slug:'organic-spinach', name:'Organic Spinach', category:'vegetables', price:35, discountPrice:28, rating:4.4, numReviews:62, stock:80, images:[], weights:[{label:'250g',price:12,discountPrice:10},{label:'500g',price:20,discountPrice:16},{label:'1kg',price:35,discountPrice:28}], isFeatured:true },
    { _id:'4', slug:'organic-broccoli', name:'Organic Broccoli', category:'vegetables', price:85, discountPrice:72, rating:4.7, numReviews:45, stock:60, images:[], weights:[{label:'250g',price:25,discountPrice:20},{label:'500g',price:45,discountPrice:38},{label:'1kg',price:85,discountPrice:72}], isFeatured:true },
    { _id:'7', slug:'organic-banana', name:'Organic Banana', category:'fruits', price:50, discountPrice:42, rating:4.5, numReviews:156, stock:200, images:[], weights:[{label:'6 pcs',price:30,discountPrice:25},{label:'12 pcs',price:50,discountPrice:42}] },
    { _id:'8', slug:'organic-mango', name:'Organic Mango', category:'fruits', price:350, discountPrice:299, rating:4.8, numReviews:210, stock:50, images:[], weights:[{label:'500g',price:180,discountPrice:150},{label:'1kg',price:350,discountPrice:299}] },
    { _id:'9', slug:'organic-apple', name:'Organic Apple', category:'fruits', price:180, discountPrice:155, rating:4.6, numReviews:132, stock:90, images:[], weights:[{label:'500g',price:95,discountPrice:80},{label:'1kg',price:180,discountPrice:155}] },
    { _id:'10', slug:'organic-strawberry', name:'Organic Strawberry', category:'fruits', price:120, discountPrice:99, rating:4.7, numReviews:89, stock:40, images:[], weights:[{label:'250g',price:65,discountPrice:55},{label:'500g',price:120,discountPrice:99}] },
    { _id:'11', slug:'organic-milk', name:'Organic Milk', category:'dairy', price:75, discountPrice:65, rating:4.8, numReviews:234, stock:50, images:[], weights:[{label:'500ml',price:40,discountPrice:35},{label:'1L',price:75,discountPrice:65}] },
    { _id:'12', slug:'organic-paneer', name:'Organic Paneer', category:'dairy', price:150, discountPrice:130, rating:4.5, numReviews:112, stock:60, images:[], weights:[{label:'200g',price:75,discountPrice:65},{label:'500g',price:150,discountPrice:130}] },
    { _id:'13', slug:'organic-ghee', name:'Organic Ghee', category:'dairy', price:650, discountPrice:549, rating:4.9, numReviews:305, stock:45, images:[], weights:[{label:'250ml',price:350,discountPrice:299},{label:'500ml',price:650,discountPrice:549}] },
    { _id:'14', slug:'organic-yogurt', name:'Organic Yogurt', category:'dairy', price:55, discountPrice:45, rating:4.4, numReviews:87, stock:70, images:[], weights:[{label:'200g',price:28,discountPrice:23},{label:'500g',price:55,discountPrice:45}] },
  ];
  fb.forEach(p => { productsCache[p.slug] = p; });
  renderProducts('featuredProducts', fb.filter(p => p.isFeatured).slice(0, 4));
  renderProducts('bestVegetables', fb.filter(p => p.category === 'vegetables').slice(0, 4));
  renderProducts('seasonalFruits', fb.filter(p => p.category === 'fruits').slice(0, 4));
  renderProducts('dairyProducts', fb.filter(p => p.category === 'dairy').slice(0, 4));
}

function initNewsletter() { const f = document.getElementById('newsletterForm'); if (f) f.addEventListener('submit', e => { e.preventDefault(); showToast('Thank you for subscribing! 🌿', 'success'); f.reset(); }); }
