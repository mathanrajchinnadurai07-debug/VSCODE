/* Homepage Logic — loads 200+ products from products-data.js + products-data2.js */
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
    // 1. Check if Firestore is configured & available
    if (typeof fsGetProducts !== 'function') {
      console.warn('Firestore helpers not found. Using fallback.');
      loadFallbackProducts();
      return;
    }
    
    const all = await fsGetProducts();
    if (!all || !all.length) {
      loadFallbackProducts();
      return;
    }

    renderProducts('featuredProducts', all.filter(p=>p.isFeatured).slice(0,8));
    renderProducts('dealsProducts', all.filter(p=>p.isBestseller).slice(0,8));
    const cats = ['vegetables','fruits','biscuits','snacks','mushroom','chicken','mutton','grocery','herbal','dryfruits','flour','beverages','spreads','pickles','superfoods','readytocook'];
    cats.forEach(c => { const el = c+'Products'; renderProducts(el, all.filter(p=>p.category===c).slice(0,8)); });
  } catch(e) {
    console.error('Failed to load products from Firestore:', e);
    loadFallbackProducts();
  }
}

function renderProducts(id, products) {
  const c = document.getElementById(id);
  if (!c || !products.length) return;
  c.innerHTML = products.map(p => productCardHTML(p)).join('');
  products.forEach(p => { productsCache[p.id || p.slug] = p; });
}

function loadFallbackProducts() {
  // Combine both data arrays (defined in products-data.js and products-data2.js)
  const fb = (typeof ALL_PRODUCTS !== 'undefined' ? ALL_PRODUCTS : [])
    .concat(typeof ALL_PRODUCTS_PART2 !== 'undefined' ? ALL_PRODUCTS_PART2 : []);

  fb.forEach(p => { productsCache[p.slug] = p; });

  // Render featured
  renderProducts('featuredProducts', fb.filter(p => p.isFeatured).slice(0, 8));

  // Render each category
  const catMap = {
    'biscuits': 'biscuitsProducts',
    'snacks': 'snacksProducts',
    'mushroom': 'mushroomProducts',
    'chicken': 'chickenProducts',
    'mutton': 'muttonProducts',
    'grocery': 'groceryProducts',
    'herbal': 'herbalProducts',
    'dryfruits': 'dryfruitsProducts',
    'flour': 'flourProducts',
    'beverages': 'beveragesProducts',
    'spreads': 'spreadsProducts',
    'pickles': 'picklesProducts',
    'superfoods': 'superfoodsProducts',
    'readytocook': 'readytocookProducts',
    'vegetables': 'vegetablesProducts',
    'fruits': 'fruitsProducts'
  };

  Object.entries(catMap).forEach(([cat, elId]) => {
    renderProducts(elId, fb.filter(p => p.category === cat).slice(0, 8));
  });
}

function initNewsletter() {
  const f = document.getElementById('newsletterForm');
  if (f) f.addEventListener('submit', e => { e.preventDefault(); showToast('Thank you for subscribing! 🌿', 'success'); f.reset(); });
}
