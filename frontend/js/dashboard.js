/* Dashboard Page Logic */
document.addEventListener('DOMContentLoaded', () => {
  const user = getUser(); if (!user) { window.location.href = 'login.html'; return; }
  document.getElementById('userName').textContent = user.name; document.getElementById('userEmail').textContent = user.email;
  document.getElementById('userAvatar').textContent = user.name.charAt(0).toUpperCase();
  document.getElementById('profileName').value = user.name; document.getElementById('profileEmail').value = user.email; document.getElementById('profilePhone').value = user.phone || '';
  initDashboardNav(); loadOrders(); loadAddresses(); loadWishlist(); initProfileForm();
});

function initDashboardNav() { document.querySelectorAll('.dashboard-sidebar nav a[data-section]').forEach(link => { link.addEventListener('click', e => { e.preventDefault(); document.querySelectorAll('.dashboard-sidebar nav a').forEach(l => l.classList.remove('active')); link.classList.add('active'); document.querySelectorAll('.dashboard-content > div').forEach(d => d.classList.add('hidden')); document.getElementById('section-'+link.dataset.section)?.classList.remove('hidden'); }); }); }

function loadOrders() {
  const orders = JSON.parse(localStorage.getItem('curfee_orders')||'[]'); const c = document.getElementById('ordersList');
  if (!orders.length) { c.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-light);"><div style="font-size:3rem;margin-bottom:10px;">📦</div><p>No orders yet.</p><a href="products.html" class="btn btn-primary" style="margin-top:12px;">Start Shopping</a></div>'; return; }
  const sc = {placed:'#3498db',confirmed:'#2ecc71',packed:'#f39c12',shipped:'#9b59b6',delivered:'#27ae60',cancelled:'#e74c3c'};
  const canCancel = s => !['shipped','delivered','cancelled'].includes(s);
  c.innerHTML = orders.map(o => `<div style="border:1px solid var(--border);border-radius:var(--radius);padding:20px;margin-bottom:16px;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;"><div><strong>${o.orderNumber}</strong><span style="font-size:0.8rem;color:var(--text-light);margin-left:8px;">${new Date(o.createdAt).toLocaleDateString()}</span></div><span style="padding:4px 12px;border-radius:20px;font-size:0.75rem;font-weight:600;color:#fff;background:${sc[o.status]||'#999'};text-transform:uppercase;">${o.status}</span></div><div style="font-size:0.85rem;color:var(--text-light);">${(o.items||[]).map(i=>i.name+' × '+i.quantity).join(', ')}</div><div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;flex-wrap:wrap;gap:8px;"><strong style="font-size:1.1rem;">₹${o.total}</strong><div style="display:flex;gap:8px;"><button class="btn btn-outline btn-sm" onclick="showToast('Order tracking: ${o.status.toUpperCase()}','info')"><i class="fas fa-truck"></i> Track</button>${canCancel(o.status)?`<button class="btn btn-sm" style="background:var(--danger);color:#fff;border:none;padding:6px 14px;border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;font-weight:600;font-family:var(--font);" onclick="cancelOrder('${o.orderNumber}')"><i class="fas fa-times-circle"></i> Cancel Order</button>`:''}</div></div></div>`).join('');
}

function cancelOrder(orderNumber) {
  if (!confirm('Are you sure you want to cancel this order?')) return;
  const orders = JSON.parse(localStorage.getItem('curfee_orders')||'[]');
  const order = orders.find(o => o.orderNumber === orderNumber);
  if (order) {
    order.status = 'cancelled';
    localStorage.setItem('curfee_orders', JSON.stringify(orders));
    showToast('Order ' + orderNumber + ' has been cancelled.', 'success');
    loadOrders();
  }
}

function loadAddresses() {
  const u = getUser();
  const saved = JSON.parse(localStorage.getItem('curfee_addresses') || '[]');
  if (saved.length) {
    document.getElementById('addressList').innerHTML = saved.map((a, i) => `<div style="border:1px solid ${i===0?'var(--primary)':'var(--border)'};border-radius:var(--radius-sm);padding:16px;margin-bottom:12px;">${i===0?'<span class="badge badge-organic" style="margin-bottom:8px;">Default</span><br>':''}<strong>${a.name || u?.name || ''}</strong><br><span style="font-size:0.85rem;color:var(--text-light);">${a.address}<br>📞 ${a.phone || u?.phone || ''}</span></div>`).join('');
  } else {
    document.getElementById('addressList').innerHTML = `<div style="text-align:center;padding:30px;color:var(--text-light);"><div style="font-size:2.5rem;margin-bottom:10px;">📍</div><p>No saved addresses yet.</p><button class="btn btn-primary" style="margin-top:12px;" onclick="showToast('Address management coming soon!','info')"><i class="fas fa-plus"></i> Add Address</button></div>`;
  }
}

function loadWishlist() {
  const wishlistIds = getWishlist();
  const grid = document.getElementById('wishlistGrid');
  if (!wishlistIds.length) { grid.innerHTML = '<p style="color:var(--text-light);text-align:center;padding:40px;"><div style="font-size:3rem;margin-bottom:10px;">💚</div>Your wishlist is empty. <a href="products.html" style="color:var(--primary);">Browse products</a></p>'; return; }
  const img = 'assets/images/products/';
  const allFallback = [
    { _id:'1', slug:'organic-tomato', name:'Tomato', category:'vegetables', price:60, discountPrice:49, rating:4.5, numReviews:128, stock:150, images:[img+'tomato.png'], weights:[{label:'250g',price:20,discountPrice:15},{label:'500g',price:35,discountPrice:28},{label:'1kg',price:60,discountPrice:49}] },
    { _id:'2', slug:'organic-carrot', name:'Carrot', category:'vegetables', price:55, discountPrice:45, rating:4.6, numReviews:86, stock:120, images:[img+'carrot.png'], weights:[{label:'250g',price:18,discountPrice:14},{label:'500g',price:30,discountPrice:25},{label:'1kg',price:55,discountPrice:45}] },
    { _id:'3', slug:'organic-spinach', name:'Spinach', category:'vegetables', price:35, discountPrice:28, rating:4.4, numReviews:62, stock:80, images:[img+'spinach.png'], weights:[{label:'250g',price:12,discountPrice:10},{label:'500g',price:20,discountPrice:16},{label:'1kg',price:35,discountPrice:28}] },
    { _id:'4', slug:'organic-broccoli', name:'Broccoli', category:'vegetables', price:85, discountPrice:72, rating:4.7, numReviews:45, stock:60, images:[img+'broccoli.png'], weights:[{label:'250g',price:25,discountPrice:20},{label:'500g',price:45,discountPrice:38},{label:'1kg',price:85,discountPrice:72}] },
    { _id:'organic-banana', slug:'organic-banana', name:'Banana', category:'fruits', price:50, discountPrice:42, rating:4.5, numReviews:156, stock:200, images:[img+'banana.png'], weights:[{label:'6 pcs',price:30,discountPrice:25},{label:'12 pcs',price:50,discountPrice:42}] },
    { _id:'organic-mango', slug:'organic-mango', name:'Mango', category:'fruits', price:350, discountPrice:299, rating:4.8, numReviews:210, stock:50, images:[img+'mango.png'], weights:[{label:'500g',price:180,discountPrice:150},{label:'1kg',price:350,discountPrice:299}] },
    { _id:'organic-apple', slug:'organic-apple', name:'Apple', category:'fruits', price:180, discountPrice:155, rating:4.6, numReviews:132, stock:90, images:[img+'apple.png'], weights:[{label:'500g',price:95,discountPrice:80},{label:'1kg',price:180,discountPrice:155}] },
    { _id:'organic-milk', slug:'organic-milk', name:'Milk', category:'dairy', price:75, discountPrice:65, rating:4.8, numReviews:234, stock:50, images:[img+'milk.png'], weights:[{label:'500ml',price:40,discountPrice:35},{label:'1L',price:75,discountPrice:65}] },
    { _id:'organic-paneer', slug:'organic-paneer', name:'Paneer', category:'dairy', price:150, discountPrice:130, rating:4.5, numReviews:112, stock:60, images:[img+'paneer.png'], weights:[{label:'200g',price:75,discountPrice:65},{label:'500g',price:150,discountPrice:130}] },
    { _id:'organic-ghee', slug:'organic-ghee', name:'Ghee', category:'dairy', price:650, discountPrice:549, rating:4.9, numReviews:305, stock:45, images:[img+'ghee.png'], weights:[{label:'250ml',price:350,discountPrice:299},{label:'500ml',price:650,discountPrice:549}] },
  ];
  const matched = wishlistIds.map(id => productsCache[id] || allFallback.find(p => p._id === id || p.slug === id)).filter(Boolean);
  if (matched.length) { grid.innerHTML = matched.map(p => productCardHTML(p)).join(''); }
  else { grid.innerHTML = '<p style="color:var(--text-light);">You have ' + wishlistIds.length + ' wishlisted items. <a href="products.html" style="color:var(--primary);">View them in the store</a></p>'; }
}

function initProfileForm() { document.getElementById('profileForm')?.addEventListener('submit', e => { e.preventDefault(); const u = getUser(); u.name = document.getElementById('profileName').value; u.email = document.getElementById('profileEmail').value; u.phone = document.getElementById('profilePhone').value; localStorage.setItem('curfee_user',JSON.stringify(u)); showToast('Profile updated!','success'); }); }
