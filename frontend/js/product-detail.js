/* Product Detail Page Logic */
let currentProduct = null;
document.addEventListener('DOMContentLoaded', () => { loadProductDetail(); initTabs(); });

async function loadProductDetail() {
  const slug = new URLSearchParams(window.location.search).get('slug') || new URLSearchParams(window.location.search).get('id');
  if (!slug) { window.location.href = 'products.html'; return; }
  try { const product = await api(`/products/slug/${slug}`); if (product) { renderDetail(product); return; } } catch {}
  const fb = getFallbackProduct(slug); if (fb) renderDetail(fb); else document.getElementById('detailContent').innerHTML = '<p style="text-align:center;padding:60px;">Product not found.</p>';
}

function renderDetail(product) {
  currentProduct = product; productsCache[product.slug] = product;
  document.title = `${product.name} — Curfee Organic Market`; document.getElementById('breadcrumbName').textContent = product.name;
  const discount = Math.round(((product.price - (product.discountPrice || product.price)) / product.price) * 100);
  const emoji = getCategoryEmoji(product.category);
  document.getElementById('detailContent').innerHTML = `
    <div class="product-gallery"><div class="main-image"><div style="font-size:8rem">${emoji}</div></div><div class="thumb-list"><div class="thumb active" style="display:flex;align-items:center;justify-content:center;font-size:2rem;background:var(--bg);">${emoji}</div><div class="thumb" style="display:flex;align-items:center;justify-content:center;font-size:2rem;background:var(--bg);">🌿</div></div></div>
    <div class="detail-info">
      <div style="display:flex;gap:8px;margin-bottom:12px;"><span class="badge badge-organic">🌿 Certified Organic</span>${discount > 0 ? '<span class="badge badge-sale">'+discount+'% OFF</span>' : ''}</div>
      <h1 class="detail-title">${product.name}</h1>
      <div class="product-rating" style="margin-bottom:12px;"><span class="stars" style="font-size:1rem;">${starsHTML(product.rating)}</span><span style="font-size:0.9rem;color:var(--text-light);">${product.rating} (${product.numReviews} reviews)</span></div>
      <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:16px;"><span class="detail-price">₹${product.discountPrice || product.price}</span>${discount>0?`<span class="detail-original">₹${product.price}</span><span class="detail-discount">Save ₹${product.price - product.discountPrice}</span>`:''}</div>
      <p style="color:var(--text-light);font-size:0.9rem;margin-bottom:20px;line-height:1.6;">${product.description || 'Premium organic product from certified farms.'}</p>
      <div style="margin-bottom:20px;"><label style="font-weight:600;font-size:0.9rem;margin-bottom:8px;display:block;">Weight / Pack Size:</label><div class="weight-options" id="detailWeights">${(product.weights||[]).map((w,i) => `<span class="weight-option ${i===0?'active':''}" data-weight="${w.label}" data-price="${w.discountPrice||w.price}" onclick="selectWeight(this)">${w.label} — ₹${w.discountPrice||w.price}</span>`).join('')}</div></div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;"><label style="font-weight:600;font-size:0.9rem;">Qty:</label><div class="quantity-control"><button onclick="changeQty(-1)">−</button><input type="number" id="detailQty" value="1" min="1" max="10"><button onclick="changeQty(1)">+</button></div><span class="product-stock ${product.stock>20?'in-stock':product.stock>0?'low-stock':'out-of-stock'}"><i class="fas fa-circle" style="font-size:0.5rem"></i> ${product.stock>20?'In Stock':product.stock>0?'Only '+product.stock+' left':'Out of Stock'}</span></div>
      <div style="display:flex;gap:12px;margin-bottom:20px;"><button class="btn btn-primary btn-lg" onclick="addDetailToCart()" style="flex:1;"><i class="fas fa-cart-plus"></i> Add to Cart</button><button class="btn btn-accent btn-lg" onclick="buyNow()" style="flex:1;"><i class="fas fa-bolt"></i> Buy Now</button></div>
      <div style="display:flex;gap:16px;font-size:0.85rem;color:var(--text-light);"><span><i class="fas fa-truck"></i> ${product.deliveryInfo||'Delivered in 2-4 days'}</span><span><i class="fas fa-undo"></i> ${product.returnPolicy||'7-day returns'}</span></div>
    </div>`;
  document.getElementById('tabsSection').style.display = 'block';
  document.getElementById('tab-description').innerHTML = `<p style="line-height:1.8;color:var(--text-light);">${product.description||'Premium organic product.'}</p>`;
  const ni = product.nutritionalInfo||{}; document.getElementById('tab-nutrition').innerHTML = `<table class="cart-table"><tr><td><strong>Calories</strong></td><td>${ni.calories||'N/A'}</td></tr><tr><td><strong>Protein</strong></td><td>${ni.protein||'N/A'}</td></tr><tr><td><strong>Carbs</strong></td><td>${ni.carbs||'N/A'}</td></tr><tr><td><strong>Fat</strong></td><td>${ni.fat||'N/A'}</td></tr><tr><td><strong>Fiber</strong></td><td>${ni.fiber||'N/A'}</td></tr></table>`;
  const fs = product.farmSource||{}; document.getElementById('tab-farm').innerHTML = `<div style="background:var(--bg);padding:20px;border-radius:var(--radius-sm);"><h3>🏡 ${fs.farmName||'Organic Farm'}</h3><p style="color:var(--text-light);margin-top:4px;">${fs.location||'India'} — ${fs.description||'Certified organic'}</p></div>`;
  document.getElementById('tab-delivery').innerHTML = `<p style="line-height:1.8;color:var(--text-light);">🚚 ${product.deliveryInfo||'Standard delivery within 2-4 business days. Free delivery on orders above ₹500.'}<br><br>↩️ ${product.returnPolicy||'Easy 7-day return policy for fresh products.'}</p>`;
  const reviews = product.reviews||[]; document.getElementById('tab-reviews').innerHTML = `<div style="margin-bottom:20px;"><strong>${product.numReviews} Reviews</strong> — Average: ${starsHTML(product.rating)} ${product.rating}/5</div>${reviews.length?reviews.map(r=>`<div style="border-bottom:1px solid var(--border);padding:16px 0;"><strong>${r.userName}</strong> <span class="stars" style="font-size:0.8rem;">${starsHTML(r.rating)}</span><p style="font-size:0.9rem;color:var(--text-light);margin-top:4px;">${r.comment}</p></div>`).join(''):'<p style="color:var(--text-light);">No reviews yet.</p>'}`;
  loadRelated(product.category, product.slug);
}

function selectWeight(el) { el.closest('.weight-options').querySelectorAll('.weight-option').forEach(w => w.classList.remove('active')); el.classList.add('active'); document.querySelector('.detail-price').textContent = '₹' + el.dataset.price; }
function changeQty(delta) { const i = document.getElementById('detailQty'); i.value = Math.max(1, Math.min(10, parseInt(i.value) + delta)); }
function addDetailToCart() { if (!currentProduct) return; const w = document.querySelector('#detailWeights .weight-option.active')?.dataset.weight||'500g'; addToLocalCart(currentProduct, w, parseInt(document.getElementById('detailQty').value)||1); }
function buyNow() { addDetailToCart(); window.location.href = 'cart.html'; }
async function loadRelated(category, excludeSlug) { try { const d = await api(`/products?category=${category}&limit=4`); const r = (d.products||[]).filter(p=>p.slug!==excludeSlug); if (r.length) document.getElementById('relatedProducts').innerHTML = r.map(p=>productCardHTML(p)).join(''); } catch {} }
function initTabs() { document.addEventListener('click', e => { if (e.target.classList.contains('tab')) { document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active')); document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active')); e.target.classList.add('active'); document.getElementById('tab-'+e.target.dataset.tab)?.classList.add('active'); } }); }
function getFallbackProduct(slug) { return { _id:slug, slug, name:slug.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase()), category:'vegetables', price:50, discountPrice:40, rating:4.3, numReviews:50, stock:100, description:'Premium certified organic product from verified farms.', images:[], weights:[{label:'250g',price:15,discountPrice:12},{label:'500g',price:28,discountPrice:22},{label:'1kg',price:50,discountPrice:40}], nutritionalInfo:{}, farmSource:{}, reviews:[] }; }
