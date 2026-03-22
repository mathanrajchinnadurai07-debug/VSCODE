/* Product Detail Page Logic — with Review Form, Video, Rich Tabs */
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
  const firstW = product.weights?.[0]; const showPrice = firstW ? (firstW.discountPrice || firstW.price) : (product.discountPrice || product.price);
  const showOriginal = firstW ? firstW.price : product.price;
  const discount = showOriginal > 0 ? Math.round(((showOriginal - showPrice) / showOriginal) * 100) : 0;
  const emoji = getCategoryEmoji(product.category); const outOfStock = product.stock <= 0;

  document.getElementById('detailContent').innerHTML = `
    <div class="product-gallery"><div class="main-image"><div style="font-size:8rem">${emoji}</div></div><div class="thumb-list"><div class="thumb active" style="display:flex;align-items:center;justify-content:center;font-size:2rem;background:var(--bg);">${emoji}</div><div class="thumb" style="display:flex;align-items:center;justify-content:center;font-size:2rem;background:var(--bg);">🌿</div>${product.videoUrl?'<div class="thumb" style="display:flex;align-items:center;justify-content:center;font-size:1.2rem;background:var(--bg);cursor:pointer;" onclick="showProductVideo()">▶️ Video</div>':''}</div>${product.videoUrl?`<div id="productVideo" style="display:none;margin-top:12px;"><video controls style="width:100%;border-radius:var(--radius-sm);max-height:300px;" poster=""><source src="${product.videoUrl}" type="video/mp4">Your browser does not support video.</video></div>`:''}</div>
    <div class="detail-info">
      <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;"><span class="badge badge-organic">🌿 Certified Organic</span><span class="badge" style="background:var(--primary);color:#fff;">${product.category}</span>${discount > 0 ? '<span class="badge badge-sale">'+discount+'% OFF</span>' : ''}${outOfStock?'<span class="badge" style="background:var(--danger);color:#fff;">Out of Stock</span>':''}</div>
      <h1 class="detail-title">${product.name}</h1>
      <div class="product-rating" style="margin-bottom:12px;"><span class="stars" style="font-size:1rem;">${starsHTML(product.rating)}</span><span style="font-size:0.9rem;color:var(--text-light);">${product.rating} (${product.numReviews} reviews)</span></div>
      <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:16px;"><span class="detail-price">₹${showPrice}</span>${discount>0?`<span class="detail-original">₹${showOriginal}</span><span class="detail-discount">Save ₹${showOriginal - showPrice}</span>`:''}</div>
      <p style="color:var(--text-light);font-size:0.9rem;margin-bottom:20px;line-height:1.8;">${product.description || 'Premium organic product from certified farms.'}</p>
      <div style="margin-bottom:20px;"><label style="font-weight:600;font-size:0.9rem;margin-bottom:8px;display:block;">Weight / Pack Size:</label><div class="weight-options" id="detailWeights">${(product.weights||[]).map((w,i) => `<span class="weight-option ${i===0?'active':''}" data-weight="${w.label}" data-price="${w.discountPrice||w.price}" data-original="${w.price}" onclick="selectWeight(this)">${w.label} — ₹${w.discountPrice||w.price}</span>`).join('')}</div></div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;"><label style="font-weight:600;font-size:0.9rem;">Qty:</label><div class="quantity-control"><button onclick="changeQty(-1)">−</button><input type="number" id="detailQty" value="1" min="1" max="10"><button onclick="changeQty(1)">+</button></div><span class="product-stock ${outOfStock?'out-of-stock':product.stock>20?'in-stock':'low-stock'}"><i class="fas fa-circle" style="font-size:0.5rem"></i> ${outOfStock?'Out of Stock':product.stock>20?'In Stock — '+product.stock+' available':'Only '+product.stock+' left — Hurry!'}</span></div>
      <div style="display:flex;gap:12px;margin-bottom:20px;">${outOfStock?'<button class="btn btn-lg" disabled style="flex:1;opacity:0.5;background:var(--text-light);color:#fff;border:none;cursor:not-allowed;border-radius:var(--radius-sm);"><i class="fas fa-ban"></i> Out of Stock</button>':'<button class="btn btn-primary btn-lg" onclick="addDetailToCart()" style="flex:1;"><i class="fas fa-cart-plus"></i> Add to Cart</button><button class="btn btn-accent btn-lg" onclick="buyNow()" style="flex:1;"><i class="fas fa-bolt"></i> Buy Now</button>'}</div>
      <div style="display:flex;gap:16px;font-size:0.85rem;color:var(--text-light);flex-wrap:wrap;"><span><i class="fas fa-truck"></i> ${product.deliveryInfo?product.deliveryInfo.substring(0,60)+'...':'Delivered in 2-4 days'}</span><span><i class="fas fa-undo"></i> ${product.returnPolicy?product.returnPolicy.substring(0,40)+'...':'7-day returns'}</span><span><i class="fas fa-shield-alt"></i> 100% Organic Guarantee</span></div>
    </div>`;

  document.getElementById('tabsSection').style.display = 'block';

  // Tab 1: Description
  document.getElementById('tab-description').innerHTML = `<div style="line-height:2;color:var(--text);font-size:0.95rem;"><p>${product.description||'Premium organic product from certified farms.'}</p><div style="margin-top:20px;display:grid;grid-template-columns:1fr 1fr;gap:16px;"><div style="background:rgba(45,106,79,0.05);padding:16px;border-radius:var(--radius-sm);"><h4 style="color:var(--primary);margin-bottom:8px;">🌿 Why Organic?</h4><ul style="font-size:0.85rem;color:var(--text-light);line-height:2;padding-left:16px;"><li>No synthetic pesticides or chemicals</li><li>Non-GMO verified</li><li>Sustainably farmed</li><li>Better for your health & the environment</li></ul></div><div style="background:rgba(247,127,0,0.05);padding:16px;border-radius:var(--radius-sm);"><h4 style="color:var(--accent);margin-bottom:8px;">💡 How to Use</h4><ul style="font-size:0.85rem;color:var(--text-light);line-height:2;padding-left:16px;"><li>Wash thoroughly before use</li><li>Store in a cool, dry place</li><li>Best consumed within 3-5 days</li><li>Check individual product label for specific instructions</li></ul></div></div></div>`;

  // Tab 2: Nutritional Info
  const ni = product.nutritionalInfo||{};
  const isHerbal = ['herbal'].includes(product.category);
  document.getElementById('tab-nutrition').innerHTML = isHerbal ?
    `<div style="padding:20px;background:var(--bg);border-radius:var(--radius-sm);"><h3 style="margin-bottom:12px;">🌿 Ingredients & Properties</h3><p style="line-height:1.8;color:var(--text-light);">This is an external-use herbal product. Nutritional values are not applicable. Please refer to the product packaging for full ingredient list, usage instructions, and allergen information.</p><p style="margin-top:12px;font-size:0.85rem;color:var(--text-light);"><strong>Safety note:</strong> Perform a patch test before first use. Discontinue if irritation occurs. For external use only. Keep away from eyes. Consult a dermatologist if you have sensitive skin.</p></div>` :
    `<div style="max-width:500px;"><table class="cart-table" style="width:100%;"><thead><tr><th style="background:var(--primary);color:#fff;">Nutrient</th><th style="background:var(--primary);color:#fff;">Per 100g/ml</th></tr></thead><tbody><tr><td>🔥 <strong>Calories</strong></td><td>${ni.calories||'—'}</td></tr><tr><td>💪 <strong>Protein</strong></td><td>${ni.protein||'—'}</td></tr><tr><td>🌾 <strong>Carbohydrates</strong></td><td>${ni.carbs||'—'}</td></tr><tr><td>🥑 <strong>Fat</strong></td><td>${ni.fat||'—'}</td></tr><tr><td>🌿 <strong>Dietary Fibre</strong></td><td>${ni.fiber||'—'}</td></tr></tbody></table><p style="margin-top:12px;font-size:0.8rem;color:var(--text-light);">* Approximate values. Actual nutritional content may vary slightly between batches. Based on ICMR guidelines.</p></div>`;

  // Tab 3: Farm Source
  const fs = product.farmSource||{};
  document.getElementById('tab-farm').innerHTML = `<div style="background:linear-gradient(135deg,rgba(45,106,79,0.05),rgba(45,106,79,0.02));padding:24px;border-radius:var(--radius);border:1px solid rgba(45,106,79,0.1);"><div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;"><div style="width:60px;height:60px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;font-size:1.8rem;">🏡</div><div><h3 style="margin:0;">${fs.farmName||'Organic Farm Partner'}</h3><p style="color:var(--text-light);font-size:0.85rem;margin:4px 0 0;"><i class="fas fa-map-marker-alt"></i> ${fs.location||'India'}</p></div></div><p style="line-height:1.8;color:var(--text);margin-bottom:16px;">${fs.description||'Our trusted organic farm partner.'}</p><div style="display:flex;gap:16px;flex-wrap:wrap;"><span style="background:#fff;padding:6px 14px;border-radius:20px;font-size:0.8rem;border:1px solid var(--border);"><i class="fas fa-certificate" style="color:var(--primary);"></i> NPOP Certified</span><span style="background:#fff;padding:6px 14px;border-radius:20px;font-size:0.8rem;border:1px solid var(--border);"><i class="fas fa-leaf" style="color:var(--success);"></i> 100% Organic</span><span style="background:#fff;padding:6px 14px;border-radius:20px;font-size:0.8rem;border:1px solid var(--border);"><i class="fas fa-check-circle" style="color:var(--primary);"></i> FSSAI Approved</span><span style="background:#fff;padding:6px 14px;border-radius:20px;font-size:0.8rem;border:1px solid var(--border);"><i class="fas fa-hands-helping" style="color:var(--accent);"></i> Fair Trade</span></div></div>`;

  // Tab 4: Delivery & Returns
  document.getElementById('tab-delivery').innerHTML = `<div style="display:grid;gap:20px;"><div style="background:rgba(46,204,113,0.05);padding:20px;border-radius:var(--radius-sm);border-left:4px solid var(--success);"><h3 style="margin-bottom:8px;color:var(--success);"><i class="fas fa-truck"></i> Delivery Information</h3><p style="line-height:1.8;color:var(--text);">${product.deliveryInfo||'Standard delivery within 2-4 business days. Free delivery on orders above ₹500. Express delivery available in select cities.'}</p><div style="margin-top:12px;display:flex;gap:20px;flex-wrap:wrap;font-size:0.85rem;color:var(--text-light);"><span>📦 Free shipping above ₹500</span><span>🚀 Express delivery in metros</span><span>🌾 Eco-friendly packaging</span></div></div><div style="background:rgba(52,152,219,0.05);padding:20px;border-radius:var(--radius-sm);border-left:4px solid #3498db;"><h3 style="margin-bottom:8px;color:#3498db;"><i class="fas fa-undo"></i> Return & Refund Policy</h3><p style="line-height:1.8;color:var(--text);">${product.returnPolicy||'7-day easy return policy for fresh products. Full refund or replacement if quality standards are not met.'}</p><div style="margin-top:12px;font-size:0.85rem;color:var(--text-light);"><p>📝 <strong>How to return:</strong> Contact support within 7 days of delivery with photos of the product. We will arrange a pickup or provide store credit/refund within 48 hours.</p></div></div><div style="background:rgba(155,89,182,0.05);padding:20px;border-radius:var(--radius-sm);border-left:4px solid #9b59b6;"><h3 style="margin-bottom:8px;color:#9b59b6;"><i class="fas fa-shield-alt"></i> Quality Guarantee</h3><p style="line-height:1.8;color:var(--text);">Every product is certified organic (NPOP/USDA), tested for pesticide residues, and inspected before dispatch. If you are not 100% satisfied with the quality, we will make it right — guaranteed.</p></div></div>`;

  // Tab 5: Reviews with submission form
  const reviews = product.reviews||[];
  const avgStars = starsHTML(product.rating);
  const reviewFormHTML = `<div style="background:var(--bg);padding:24px;border-radius:var(--radius);margin-top:20px;"><h3 style="margin-bottom:16px;"><i class="fas fa-star"></i> Write a Review</h3><form id="reviewForm" onsubmit="submitReview(event)"><div class="form-group"><label>Your Rating *</label><div id="ratingStars" style="font-size:1.5rem;cursor:pointer;letter-spacing:4px;" data-rating="5"><span onclick="setRating(1)">★</span><span onclick="setRating(2)">★</span><span onclick="setRating(3)">★</span><span onclick="setRating(4)">★</span><span onclick="setRating(5)">★</span></div></div><div class="form-group"><label>Your Name *</label><input type="text" id="reviewName" required placeholder="Enter your name" value="${getUser()?.name||''}"></div><div class="form-group"><label>Your Review *</label><textarea id="reviewComment" rows="4" required placeholder="What did you think about this product? How was the quality, freshness, taste?"></textarea></div><button type="submit" class="btn btn-primary"><i class="fas fa-paper-plane"></i> Submit Review</button></form></div>`;

  document.getElementById('tab-reviews').innerHTML = `<div style="margin-bottom:24px;display:flex;align-items:center;gap:20px;flex-wrap:wrap;"><div style="text-align:center;"><div style="font-size:3rem;font-weight:700;color:var(--primary);">${product.rating}</div><div class="stars" style="font-size:1.2rem;">${avgStars}</div><div style="font-size:0.85rem;color:var(--text-light);">${product.numReviews} reviews</div></div><div style="flex:1;min-width:200px;"><div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;"><span style="font-size:0.8rem;width:30px;">5★</span><div style="flex:1;height:8px;background:var(--border);border-radius:4px;overflow:hidden;"><div style="width:${Math.round((product.rating/5)*100)}%;height:100%;background:var(--primary);border-radius:4px;"></div></div></div><div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;"><span style="font-size:0.8rem;width:30px;">4★</span><div style="flex:1;height:8px;background:var(--border);border-radius:4px;overflow:hidden;"><div style="width:${Math.round((product.rating/5)*80)}%;height:100%;background:var(--primary);border-radius:4px;"></div></div></div><div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;"><span style="font-size:0.8rem;width:30px;">3★</span><div style="flex:1;height:8px;background:var(--border);border-radius:4px;overflow:hidden;"><div style="width:15%;height:100%;background:var(--primary);border-radius:4px;"></div></div></div></div></div><div id="reviewsList">${reviews.length?reviews.map(r=>`<div style="border-bottom:1px solid var(--border);padding:16px 0;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><div style="display:flex;align-items:center;gap:8px;"><div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--primary-light));color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;">${(r.userName||'U').charAt(0)}</div><div><strong>${r.userName||'Customer'}</strong>${r.isVerifiedPurchase?'<span style="font-size:0.7rem;color:var(--success);margin-left:6px;"><i class="fas fa-check-circle"></i> Verified Purchase</span>':''}</div></div><span class="stars" style="font-size:0.85rem;">${starsHTML(r.rating)}</span></div><p style="font-size:0.9rem;color:var(--text-light);line-height:1.6;">${r.comment}</p></div>`).join(''):'<p style="color:var(--text-light);padding:20px 0;">No reviews yet. Be the first to review this product!</p>'}${reviewFormHTML}</div>`;

  loadRelated(product.category, product.slug);
}

let selectedRating = 5;
function setRating(n) {
  selectedRating = n;
  const stars = document.querySelectorAll('#ratingStars span');
  stars.forEach((s, i) => { s.style.color = i < n ? '#f7b731' : '#ddd'; });
}

async function submitReview(e) {
  e.preventDefault();
  const name = document.getElementById('reviewName').value;
  const comment = document.getElementById('reviewComment').value;
  if (!comment.trim()) { showToast('Please write a review', 'error'); return; }
  try {
    await api(`/products/${currentProduct.slug}/reviews`, { method:'POST', body:JSON.stringify({ rating:selectedRating, comment, userName:name }) });
    showToast('Review submitted! Thank you 🌿', 'success');
  } catch {
    // Save review locally in demo mode
    const localReviews = JSON.parse(localStorage.getItem('curfee_reviews')||'[]');
    localReviews.push({ productSlug:currentProduct.slug, userName:name, rating:selectedRating, comment, isVerifiedPurchase:false, createdAt:new Date().toISOString() });
    localStorage.setItem('curfee_reviews', JSON.stringify(localReviews));
    showToast('Review submitted! Thank you 🌿', 'success');
  }
  document.getElementById('reviewForm').reset();
  // Add review to page immediately
  const reviewsList = document.getElementById('reviewsList');
  const newReviewHTML = `<div style="border-bottom:1px solid var(--border);padding:16px 0;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><div style="display:flex;align-items:center;gap:8px;"><div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--accent),#fcbf49);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;">${name.charAt(0)}</div><div><strong>${name}</strong><span style="font-size:0.7rem;color:var(--success);margin-left:6px;"><i class="fas fa-star"></i> Just now</span></div></div><span class="stars" style="font-size:0.85rem;">${starsHTML(selectedRating)}</span></div><p style="font-size:0.9rem;color:var(--text-light);line-height:1.6;">${comment}</p></div>`;
  const form = document.querySelector('#reviewsList > div:last-child');
  form.insertAdjacentHTML('beforebegin', newReviewHTML);
}

function showProductVideo() {
  const v = document.getElementById('productVideo');
  if (v) { v.style.display = v.style.display === 'none' ? 'block' : 'none'; }
}

function selectWeight(el) {
  el.closest('.weight-options').querySelectorAll('.weight-option').forEach(w => w.classList.remove('active'));
  el.classList.add('active');
  document.querySelector('.detail-price').textContent = '₹' + el.dataset.price;
  if (el.dataset.original && el.dataset.price !== el.dataset.original) {
    const origEl = document.querySelector('.detail-original'); if (origEl) origEl.textContent = '₹' + el.dataset.original;
    const saveEl = document.querySelector('.detail-discount'); if (saveEl) saveEl.textContent = 'Save ₹' + (el.dataset.original - el.dataset.price);
  }
}
function changeQty(delta) { const i = document.getElementById('detailQty'); i.value = Math.max(1, Math.min(10, parseInt(i.value) + delta)); }
function addDetailToCart() { if (!currentProduct || currentProduct.stock <= 0) { showToast('This product is out of stock', 'error'); return; } const w = document.querySelector('#detailWeights .weight-option.active')?.dataset.weight||'250g'; addToLocalCart(currentProduct, w, parseInt(document.getElementById('detailQty').value)||1); }
function buyNow() { addDetailToCart(); if (currentProduct && currentProduct.stock > 0) window.location.href = 'cart.html'; }
async function loadRelated(category, excludeSlug) { try { const d = await api(`/products?category=${category}&limit=4`); const r = (d.products||[]).filter(p=>p.slug!==excludeSlug); if (r.length) document.getElementById('relatedProducts').innerHTML = r.map(p=>productCardHTML(p)).join(''); } catch {} }
function initTabs() { document.addEventListener('click', e => { if (e.target.classList.contains('tab')) { document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active')); document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active')); e.target.classList.add('active'); document.getElementById('tab-'+e.target.dataset.tab)?.classList.add('active'); } }); }

function getFallbackProduct(slug) {
  const allFallback = {
    'organic-tomato': { name:'Organic Tomato', category:'vegetables', price:60, discountPrice:49, rating:4.5, numReviews:128, stock:150, description:'Farm-fresh organic tomatoes bursting with flavour and nutrition. Rich in lycopene, vitamin C, and potassium. Hand-picked from certified organic farms in Nashik.', weights:[{label:'250g',price:20,discountPrice:15},{label:'500g',price:35,discountPrice:28},{label:'1kg',price:60,discountPrice:49}], nutritionalInfo:{calories:'18 kcal per 100g',protein:'0.9g',carbs:'3.9g',fat:'0.2g',fiber:'1.2g'}, farmSource:{farmName:'Green Valley Organic Farm',location:'Nashik, Maharashtra',description:'50-acre NPOP-certified organic farm since 1998.'}, deliveryInfo:'Harvested fresh, delivered in 2-3 business days in eco-friendly packaging.', returnPolicy:'7-day freshness guarantee. Full refund or free replacement.', reviews:[], videoUrl:'' },
    'organic-millet-cookies': { name:'Organic Millet Cookies', category:'snacks', price:180, discountPrice:149, rating:4.6, numReviews:94, stock:120, description:'Crispy organic millet cookies made with ragi, jaggery, and coconut oil. Zero refined sugar, zero maida. Baked, not fried.', weights:[{label:'100g',price:65,discountPrice:55},{label:'250g',price:180,discountPrice:149},{label:'500g',price:320,discountPrice:269}], nutritionalInfo:{calories:'420 kcal per 100g',protein:'7.5g',carbs:'62g',fat:'15g',fiber:'4g'}, farmSource:{farmName:'Ancient Grains Bakery',location:'Bengaluru, Karnataka',description:'Artisanal organic bakery using solar-powered ovens.'}, deliveryInfo:'Airtight packaging. Shelf life 60 days.', returnPolicy:'Replacement for broken or stale products.', reviews:[], videoUrl:'' },
    'organic-neem-soap': { name:'Organic Neem Soap', category:'herbal', price:150, discountPrice:125, rating:4.6, numReviews:176, stock:200, description:'Handcrafted cold-process neem soap. Antibacterial, antifungal. Free from SLS, parabens, synthetic fragrances.', weights:[{label:'75g',price:80,discountPrice:65},{label:'125g',price:150,discountPrice:125},{label:'375g (3 bars)',price:400,discountPrice:340}], nutritionalInfo:{calories:'N/A',protein:'N/A',carbs:'N/A',fat:'N/A',fiber:'N/A'}, farmSource:{farmName:'Ayur Herbals Workshop',location:'Thrissur, Kerala',description:'3rd-generation Ayurvedic soap workshop.'}, deliveryInfo:'Handmade paper wrap. Shelf life 18 months.', returnPolicy:'Replacement for cracked or damaged bars.', reviews:[], videoUrl:'' },
  };
  const fb = allFallback[slug];
  if (fb) return { _id:slug, slug, ...fb, images:[] };
  return { _id:slug, slug, name:slug.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase()), category:'vegetables', price:50, discountPrice:40, rating:4.3, numReviews:50, stock:100, description:'Premium certified organic product from verified farms. Grown without synthetic pesticides, GMOs, or chemical fertilisers. Rich in essential nutrients and naturally flavourful.', images:[], weights:[{label:'250g',price:15,discountPrice:12},{label:'500g',price:28,discountPrice:22},{label:'1kg',price:50,discountPrice:40}], nutritionalInfo:{calories:'Varies',protein:'Varies',carbs:'Varies',fat:'Varies',fiber:'Varies'}, farmSource:{farmName:'Organic Farm Partner',location:'India',description:'Certified organic farm following sustainable farming practices.'}, deliveryInfo:'Delivered within 2-4 business days. Free delivery on orders above ₹500.', returnPolicy:'7-day return policy with full refund or replacement.', reviews:[], videoUrl:'' };
}
