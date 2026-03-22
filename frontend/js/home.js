/* Homepage Logic — Hero slider, load products incl. snacks & herbal */
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
    const [featured, veg, fruits, dairy, snacks, herbal] = await Promise.all([
      api('/products?featured=true&limit=4').catch(()=>null),
      api('/products?category=vegetables&bestseller=true&limit=4').catch(()=>null),
      api('/products?category=fruits&limit=4').catch(()=>null),
      api('/products?category=dairy&limit=4').catch(()=>null),
      api('/products?category=snacks&limit=4').catch(()=>null),
      api('/products?category=herbal&limit=4').catch(()=>null)
    ]);
    if (featured?.products?.length) {
      renderProducts('featuredProducts', featured.products);
      renderProducts('bestVegetables', veg?.products||[]);
      renderProducts('seasonalFruits', fruits?.products||[]);
      renderProducts('dairyProducts', dairy?.products||[]);
      renderProducts('snackProducts', snacks?.products||[]);
      renderProducts('herbalProducts', herbal?.products||[]);
    } else loadFallbackProducts();
  } catch { loadFallbackProducts(); }
}

function renderProducts(id, products) { const c = document.getElementById(id); if (!c||!products.length) return; c.innerHTML = products.map(p => productCardHTML(p)).join(''); products.forEach(p => { productsCache[p.slug] = p; }); }

function loadFallbackProducts() {
  const fb = [
    // Vegetables
    { _id:'1', slug:'organic-tomato', name:'Organic Tomato', category:'vegetables', price:60, discountPrice:49, rating:4.5, numReviews:128, stock:150, images:[], weights:[{label:'250g',price:20,discountPrice:15},{label:'500g',price:35,discountPrice:28},{label:'1kg',price:60,discountPrice:49}], isFeatured:true },
    { _id:'2', slug:'organic-carrot', name:'Organic Carrot', category:'vegetables', price:55, discountPrice:45, rating:4.6, numReviews:86, stock:120, images:[], weights:[{label:'250g',price:18,discountPrice:14},{label:'500g',price:30,discountPrice:25},{label:'1kg',price:55,discountPrice:45}], isFeatured:true },
    { _id:'3', slug:'organic-spinach', name:'Organic Spinach', category:'vegetables', price:35, discountPrice:28, rating:4.4, numReviews:62, stock:80, images:[], weights:[{label:'250g',price:12,discountPrice:10},{label:'500g',price:20,discountPrice:16},{label:'1kg',price:35,discountPrice:28}], isFeatured:true },
    { _id:'4', slug:'organic-broccoli', name:'Organic Broccoli', category:'vegetables', price:85, discountPrice:72, rating:4.7, numReviews:45, stock:60, images:[], weights:[{label:'250g',price:25,discountPrice:20},{label:'500g',price:45,discountPrice:38},{label:'1kg',price:85,discountPrice:72}], isFeatured:true },
    // Fruits
    { _id:'7', slug:'organic-banana', name:'Organic Banana', category:'fruits', price:50, discountPrice:42, rating:4.5, numReviews:156, stock:200, images:[], weights:[{label:'250g (2-3pcs)',price:15,discountPrice:12},{label:'500g (5-6pcs)',price:30,discountPrice:25},{label:'1kg (10-12pcs)',price:50,discountPrice:42}] },
    { _id:'8', slug:'organic-mango', name:'Organic Mango', category:'fruits', price:350, discountPrice:299, rating:4.8, numReviews:210, stock:50, images:[], weights:[{label:'250g (1pc)',price:90,discountPrice:75},{label:'500g (2pcs)',price:180,discountPrice:150},{label:'1kg (3-4pcs)',price:350,discountPrice:299}] },
    { _id:'9', slug:'organic-apple', name:'Organic Apple', category:'fruits', price:180, discountPrice:155, rating:4.6, numReviews:132, stock:90, images:[], weights:[{label:'250g (1-2pcs)',price:50,discountPrice:42},{label:'500g (3-4pcs)',price:95,discountPrice:80},{label:'1kg (6-7pcs)',price:180,discountPrice:155}] },
    { _id:'10', slug:'organic-strawberry', name:'Organic Strawberry', category:'fruits', price:120, discountPrice:99, rating:4.7, numReviews:89, stock:40, images:[], weights:[{label:'250g',price:65,discountPrice:55},{label:'500g',price:120,discountPrice:99}] },
    // Dairy
    { _id:'11', slug:'organic-milk', name:'Organic Milk', category:'dairy', price:75, discountPrice:65, rating:4.8, numReviews:234, stock:50, images:[], weights:[{label:'250ml',price:22,discountPrice:18},{label:'500ml',price:40,discountPrice:35},{label:'1L',price:75,discountPrice:65}] },
    { _id:'12', slug:'organic-paneer', name:'Organic Paneer', category:'dairy', price:150, discountPrice:130, rating:4.5, numReviews:112, stock:60, images:[], weights:[{label:'250g',price:85,discountPrice:72},{label:'500g',price:150,discountPrice:130}] },
    { _id:'13', slug:'organic-ghee', name:'Organic Ghee', category:'dairy', price:650, discountPrice:549, rating:4.9, numReviews:305, stock:45, images:[], weights:[{label:'250ml',price:350,discountPrice:299},{label:'500ml',price:650,discountPrice:549}] },
    { _id:'14', slug:'organic-yogurt', name:'Organic Yogurt', category:'dairy', price:55, discountPrice:45, rating:4.4, numReviews:87, stock:70, images:[], weights:[{label:'250g',price:30,discountPrice:25},{label:'500g',price:55,discountPrice:45}] },
    // Snacks
    { _id:'15', slug:'organic-millet-cookies', name:'Organic Millet Cookies', category:'snacks', price:180, discountPrice:149, rating:4.6, numReviews:94, stock:120, images:[], weights:[{label:'100g',price:65,discountPrice:55},{label:'250g',price:180,discountPrice:149},{label:'500g',price:320,discountPrice:269}], isFeatured:true },
    { _id:'16', slug:'organic-quinoa-crackers', name:'Organic Quinoa Crackers', category:'snacks', price:220, discountPrice:189, rating:4.5, numReviews:67, stock:80, images:[], weights:[{label:'100g',price:85,discountPrice:72},{label:'250g',price:220,discountPrice:189}], isFeatured:true },
    { _id:'17', slug:'organic-jaggery-biscuits', name:'Organic Jaggery Biscuits', category:'snacks', price:120, discountPrice:99, rating:4.4, numReviews:118, stock:150, images:[], weights:[{label:'100g',price:45,discountPrice:38},{label:'250g',price:120,discountPrice:99},{label:'500g',price:210,discountPrice:179}] },
    { _id:'18', slug:'organic-trail-mix', name:'Organic Dry Fruit Trail Mix', category:'snacks', price:350, discountPrice:299, rating:4.7, numReviews:78, stock:60, images:[], weights:[{label:'100g',price:120,discountPrice:99},{label:'250g',price:350,discountPrice:299},{label:'500g',price:650,discountPrice:549}], isFeatured:true },
    // Herbal
    { _id:'19', slug:'organic-neem-soap', name:'Organic Neem Soap', category:'herbal', price:150, discountPrice:125, rating:4.6, numReviews:176, stock:200, images:[], weights:[{label:'75g',price:80,discountPrice:65},{label:'125g',price:150,discountPrice:125},{label:'375g (3 bars)',price:400,discountPrice:340}], isFeatured:true },
    { _id:'20', slug:'organic-coconut-oil', name:'Organic Coconut Oil', category:'herbal', price:350, discountPrice:299, rating:4.8, numReviews:245, stock:120, images:[], weights:[{label:'250ml',price:190,discountPrice:160},{label:'500ml',price:350,discountPrice:299},{label:'1L',price:650,discountPrice:549}], isFeatured:true },
    { _id:'21', slug:'organic-lip-balm', name:'Organic Lip Balm', category:'herbal', price:199, discountPrice:169, rating:4.5, numReviews:132, stock:150, images:[], weights:[{label:'5g',price:99,discountPrice:85},{label:'10g',price:199,discountPrice:169}], isFeatured:true },
    { _id:'22', slug:'organic-hair-oil', name:'Organic Bhringraj Hair Oil', category:'herbal', price:320, discountPrice:269, rating:4.7, numReviews:198, stock:90, images:[], weights:[{label:'100ml',price:150,discountPrice:125},{label:'250ml',price:320,discountPrice:269},{label:'500ml',price:580,discountPrice:499}], isFeatured:true },
    { _id:'23', slug:'organic-face-pack', name:'Organic Face Pack', category:'herbal', price:180, discountPrice:149, rating:4.5, numReviews:109, stock:100, images:[], weights:[{label:'50g',price:80,discountPrice:65},{label:'100g',price:180,discountPrice:149},{label:'250g',price:380,discountPrice:320}], isFeatured:true },
    { _id:'24', slug:'organic-hair-pack', name:'Organic Amla Hair Pack', category:'herbal', price:160, discountPrice:135, rating:4.4, numReviews:87, stock:110, images:[], weights:[{label:'50g',price:65,discountPrice:55},{label:'100g',price:160,discountPrice:135},{label:'250g',price:350,discountPrice:299}] },
  ];
  fb.forEach(p => { productsCache[p.slug] = p; });
  renderProducts('featuredProducts', fb.filter(p => p.isFeatured).slice(0, 4));
  renderProducts('bestVegetables', fb.filter(p => p.category === 'vegetables').slice(0, 4));
  renderProducts('seasonalFruits', fb.filter(p => p.category === 'fruits').slice(0, 4));
  renderProducts('dairyProducts', fb.filter(p => p.category === 'dairy').slice(0, 4));
  renderProducts('snackProducts', fb.filter(p => p.category === 'snacks').slice(0, 4));
  renderProducts('herbalProducts', fb.filter(p => p.category === 'herbal').slice(0, 4));
}

function initNewsletter() { const f = document.getElementById('newsletterForm'); if (f) f.addEventListener('submit', e => { e.preventDefault(); showToast('Thank you for subscribing! 🌿', 'success'); f.reset(); }); }
