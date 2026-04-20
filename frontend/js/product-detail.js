/* Product Detail Page Logic — with Review Form, Video, Rich Tabs */
let currentProduct = null;
document.addEventListener('DOMContentLoaded', () => { loadProductDetail(); initTabs(); });

// Helper to read admin overrides from localStorage
function getAdminOverrides() {
  try { return JSON.parse(localStorage.getItem('ce_detail_overrides')) || {}; } catch { return {}; }
}
function getAdminStockOverrides() {
  try { return JSON.parse(localStorage.getItem('ce_stock_overrides')) || {}; } catch { return {}; }
}
function getAdminPriceOverrides() {
  try { return JSON.parse(localStorage.getItem('ce_price_overrides')) || {}; } catch { return {}; }
}
function getAdminWeightOverrides() {
  try { return JSON.parse(localStorage.getItem('ce_weight_overrides')) || {}; } catch { return {}; }
}

function applyAdminOverrides(product) {
  const dets = getAdminOverrides()[product._id] || {};
  const stocks = getAdminStockOverrides();
  const prices = getAdminPriceOverrides();
  const weightOvr = getAdminWeightOverrides();

  // Apply name, category, rating, description
  if (dets.name) product.name = dets.name;
  if (dets.category) product.category = dets.category;
  if (dets.rating !== undefined) product.rating = dets.rating;
  if (dets.description) product.description = dets.description;
  if (dets.images) product.images = dets.images;
  if (dets.videoUrl !== undefined) product.videoUrl = dets.videoUrl;

  // Nutritional info
  if (dets.nutritionalInfo && (dets.nutritionalInfo.calories || dets.nutritionalInfo.protein)) {
    product.nutritionalInfo = dets.nutritionalInfo;
  }

  // Farm source
  if (dets.farmSource && (dets.farmSource.farmName || dets.farmSource.location)) {
    product.farmSource = dets.farmSource;
  }

  // Delivery & returns
  if (dets.deliveryInfo) product.deliveryInfo = dets.deliveryInfo;
  if (dets.returnPolicy) product.returnPolicy = dets.returnPolicy;

  // Stock override
  if (stocks[product._id] !== undefined) product.stock = stocks[product._id];

  // Price overrides
  if (prices[product._id + '_price'] !== undefined) product.price = prices[product._id + '_price'];
  if (prices[product._id + '_disc'] !== undefined) product.discountPrice = prices[product._id + '_disc'];

  // Weight/price variant overrides (admin-edited)
  if (weightOvr[product._id] && weightOvr[product._id].length > 0) {
    product.weights = weightOvr[product._id];
  } else if (product.weights && product.weights.length > 0) {
    if (prices[product._id + '_price'] !== undefined) product.weights[0].price = prices[product._id + '_price'];
    if (prices[product._id + '_disc'] !== undefined) product.weights[0].discountPrice = prices[product._id + '_disc'];
  }

  return product;
}

async function loadProductDetail() {
  const slug = new URLSearchParams(window.location.search).get('slug') || new URLSearchParams(window.location.search).get('id');
  if (!slug) { window.location.href = 'products.html'; return; }
  try { let product = await api(`/products/slug/${slug}`); if (product) { renderDetail(applyAdminOverrides(product)); return; } } catch {}
  let fb = getFallbackProduct(slug); if (fb) renderDetail(applyAdminOverrides(fb)); else document.getElementById('detailContent').innerHTML = '<p style="text-align:center;padding:60px;">Product not found.</p>';
}

function renderDetail(product) {
  currentProduct = product; productsCache[product.slug] = product;
  document.title = `${product.name} — Curfee Organic Market`; document.getElementById('breadcrumbName').textContent = product.name;
  const firstW = product.weights?.[0]; const showPrice = firstW ? (firstW.discountPrice || firstW.price) : (product.discountPrice || product.price);
  const showOriginal = firstW ? firstW.price : product.price;
  const discount = showOriginal > 0 ? Math.round(((showOriginal - showPrice) / showOriginal) * 100) : 0;
  const emoji = getCategoryEmoji(product.category); const outOfStock = product.stock <= 0;

  document.getElementById('detailContent').innerHTML = `
    <div class="product-gallery" style="position:relative;">
      <div class="main-image" style="background:#f8fafc;position:relative;">
        <button class="btn-icon" style="position:absolute;top:16px;right:16px;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.1);border-radius:50%;width:40px;height:40px;z-index:10;"><i class="fas fa-heart text-gray"></i></button>
        <button class="btn-icon" style="position:absolute;top:66px;right:16px;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.1);border-radius:50%;width:40px;height:40px;z-index:10;"><i class="fas fa-share text-gray"></i></button>
        ${product.images&&product.images.length?`<img id="mainDetailImage" src="${product.images[0]}" alt="${product.name}" style="width:100%;height:100%;object-fit:contain;mix-blend-mode:multiply;">`:`<div style="font-size:8rem;display:flex;align-items:center;justify-content:center;height:100%;">${emoji}</div>`}
        <div style="position:absolute;bottom:16px;left:16px;background:#fff;padding:4px 8px;border-radius:16px;font-size:0.75rem;font-weight:700;box-shadow:0 2px 4px rgba(0,0,0,0.1);z-index:10;">${product.rating} <i class="fas fa-star" style="color:var(--success);"></i> <span style="color:#d1d5db;margin:0 4px;">|</span> ${product.numReviews}</div>
      </div>
      <div class="thumb-list">${product.images&&product.images.length?product.images.map((img,i)=>`<div class="thumb ${i===0?'active':''}" style="display:flex;align-items:center;justify-content:center;background:#fff;border:1px solid #e2e8f0;padding:0;overflow:hidden;" onclick="document.getElementById('mainDetailImage').src='${img}';document.querySelectorAll('.thumb').forEach(t=>t.classList.remove('active'));this.classList.add('active');"><img src="${img}" style="width:100%;height:100%;object-fit:contain;" alt="thumb"></div>`).join(''):`<div class="thumb active" style="display:flex;align-items:center;justify-content:center;font-size:2rem;background:#fff;">${emoji}</div>`}</div>
    </div>
    <div class="detail-info">
      <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;"><span class="badge" style="background:var(--primary);color:#fff;">${product.category}</span>${discount > 0 ? '<span class="badge badge-sale">'+discount+'% OFF</span>' : ''}${outOfStock?'<span class="badge" style="background:var(--danger);color:#fff;">Out of Stock</span>':''}</div>
      <h1 class="detail-title" style="font-size:1.15rem;margin-bottom:8px;line-height:1.4;">${product.name}</h1>
      <p style="color:var(--text-light);font-size:0.85rem;margin-bottom:16px;line-height:1.6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${product.description || 'Premium organic product from certified farms.'} <a href="#tabsSection" style="color:var(--primary);font-weight:600;">...more</a></p>
      
      <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:16px;"><span class="detail-price" style="font-size:1.6rem;font-weight:800;">₹${showPrice}</span>${discount>0?`<span class="detail-original" style="text-decoration:line-through;color:var(--text-light);font-size:1rem;">₹${showOriginal}</span><span class="detail-discount" style="color:var(--success);font-weight:700;font-size:0.85rem;">${discount}% off</span>`:''}</div>
      
      <div style="margin-bottom:20px;"><label style="font-weight:600;font-size:0.85rem;margin-bottom:8px;display:block;">Weight / Pack Size:</label><div class="weight-options" id="detailWeights">${(product.weights||[]).map((w,i) => `<span class="weight-option ${i===0?'active':''}" data-weight="${w.label}" data-price="${w.discountPrice||w.price}" data-original="${w.price}" onclick="selectWeight(this)">${w.label}</span>`).join('')}</div></div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;"><div style="display:flex;align-items:center;gap:12px;"><label style="font-weight:600;font-size:0.85rem;">Qty:</label><div class="quantity-control" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;"><button onclick="changeQty(-1)" style="border:none;background:none;padding:5px 12px;font-weight:700;">−</button><input type="number" id="detailQty" value="1" min="1" max="10" style="background:transparent;width:30px;font-size:0.9rem;" readonly><button onclick="changeQty(1)" style="border:none;background:none;padding:5px 12px;font-weight:700;">+</button></div></div><span class="product-stock ${outOfStock?'out-of-stock':product.stock>20?'in-stock':'low-stock'}" style="font-weight:600;font-size:0.8rem;"><i class="fas ${outOfStock?'fa-times-circle':'fa-check-circle'}"></i> ${outOfStock?'Out of Stock':'In Stock'}</span></div>
      
      <div class="mob-sticky-bottom" style="display:flex;gap:12px;padding:12px 16px;background:#fff;border-top:1px solid #e2e8f0;position:fixed;bottom:0;left:0;right:0;z-index:100;box-shadow:0 -2px 10px rgba(0,0,0,0.05);">
        ${outOfStock?
          '<button class="btn btn-lg" disabled style="flex:1;opacity:0.5;background:var(--text-light);color:#fff;border:none;text-align:center;width:100%;">Out of Stock</button>'
          :
          '<button class="btn btn-outline btn-lg" onclick="addDetailToCart()" style="flex:1;font-weight:700;border:1px solid #e2e8f0;background:#fff;color:var(--text);">Add to cart</button><button class="btn btn-lg" onclick="buyNow()" style="flex:1;font-weight:700;background:var(--primary);color:#fff;border:none;">Buy at <span id="stickyBuyPrice">₹'+showPrice+'</span></button>'
        }
      </div>
      <div style="height:60px;display:none;" class="mob-spacer"></div>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:0.75rem;color:var(--text-light);background:#f8fafc;padding:16px;border-radius:8px;">
        <span style="display:flex;align-items:center;gap:6px;"><i class="fas fa-truck text-gray"></i> Free Delivery</span>
        <span style="display:flex;align-items:center;gap:6px;"><i class="fas fa-undo text-gray"></i> 7 Days Replacement</span>
        <span style="display:flex;align-items:center;gap:6px;"><i class="fas fa-money-bill-wave text-gray"></i> Cash on Delivery</span>
        <span style="display:flex;align-items:center;gap:6px;"><i class="fas fa-leaf text-gray"></i> 100% Organic</span>
      </div>
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
    // Save review locally as fallback when backend is unavailable
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
  const stickyPrice = document.getElementById('stickyBuyPrice');
  if (stickyPrice) stickyPrice.textContent = '₹' + el.dataset.price;
  if (el.dataset.original && el.dataset.price !== el.dataset.original) {
    const origEl = document.querySelector('.detail-original'); if (origEl) origEl.textContent = '₹' + el.dataset.original;
    const saveEl = document.querySelector('.detail-discount'); if (saveEl) saveEl.textContent = Math.round(((el.dataset.original - el.dataset.price)/el.dataset.original)*100) + '% off';
  }
}
function changeQty(delta) { const i = document.getElementById('detailQty'); i.value = Math.max(1, Math.min(10, parseInt(i.value) + delta)); }
function addDetailToCart() { if (!currentProduct || currentProduct.stock <= 0) { showToast('This product is out of stock', 'error'); return; } const w = document.querySelector('#detailWeights .weight-option.active')?.dataset.weight||'250g'; addToLocalCart(currentProduct, w, parseInt(document.getElementById('detailQty').value)||1); }
function buyNow() { addDetailToCart(); if (currentProduct && currentProduct.stock > 0) window.location.href = 'cart.html'; }
async function loadRelated(category, excludeSlug) {
  try { const d = await api(`/products?category=${category}&limit=4`); const r = (d.products||[]).filter(p=>p.slug!==excludeSlug); if (r.length) { document.getElementById('relatedProducts').innerHTML = r.map(p=>productCardHTML(p)).join(''); return; } } catch {}
  // Use fallback data
  const all = (typeof ALL_PRODUCTS !== 'undefined' ? ALL_PRODUCTS : []).concat(typeof ALL_PRODUCTS_PART2 !== 'undefined' ? ALL_PRODUCTS_PART2 : []);
  const related = all.filter(p => p.category === category && p.slug !== excludeSlug).slice(0, 4);
  if (related.length) { related.forEach(p => { productsCache[p.slug] = p; }); document.getElementById('relatedProducts').innerHTML = related.map(p => productCardHTML(p)).join(''); }
}
function initTabs() { document.addEventListener('click', e => { if (e.target.classList.contains('tab')) { document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active')); document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active')); e.target.classList.add('active'); document.getElementById('tab-'+e.target.dataset.tab)?.classList.add('active'); } }); }

function getFallbackProduct(slug) {
  // Search in ALL_PRODUCTS and ALL_PRODUCTS_PART2 first
  const part1 = (typeof ALL_PRODUCTS !== 'undefined') ? ALL_PRODUCTS : [];
  const part2 = (typeof ALL_PRODUCTS_PART2 !== 'undefined') ? ALL_PRODUCTS_PART2 : [];
  const allData = part1.concat(part2);
  const found = allData.find(p => p.slug === slug);
  if (found) return found;

  // If not found in data files, create generic fallback
  const img = 'assets/images/products/';
  const imgMap = {'organic-tomato':img+'tomato.png','organic-millet-cookies':img+'millet_cookies.png','organic-neem-soap':img+'trail_mix.png','organic-onion':img+'onion.png','organic-potato':img+'potato.png','organic-carrot':img+'carrot.png','organic-spinach':img+'spinach.png','organic-broccoli':img+'broccoli.png','organic-banana':img+'banana.png','organic-mango':img+'mango.png','organic-apple':img+'apple.png','organic-strawberry':img+'strawberry.png','organic-trail-mix':img+'trail_mix.png'};
  return { _id:slug, slug, name:slug.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase()), category:'grocery', price:50, discountPrice:40, rating:4.3, numReviews:50, stock:100, description:'Premium certified organic product from verified farms.', images: imgMap[slug] ? [imgMap[slug]] : [], weights:[{label:'250g',price:15,discountPrice:12},{label:'500g',price:28,discountPrice:22},{label:'1kg',price:50,discountPrice:40}], nutritionalInfo:{calories:'Varies',protein:'Varies',carbs:'Varies',fat:'Varies',fiber:'Varies'}, farmSource:{farmName:'Organic Farm Partner',location:'India',description:'Certified organic farm.'}, deliveryInfo:'Delivered within 2-4 business days. Free delivery above ₹500.', returnPolicy:'7-day return policy with full refund or replacement.', reviews:[], videoUrl:'' };
}

