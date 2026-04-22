/* ==========================================================
   Curfee — Dashboard / My Orders Page (Firestore)
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Check auth
  auth.onAuthStateChanged(async user => {
    if (!user) {
      window.location.href = 'login.html?redirect=dashboard.html';
      return;
    }

    // Load user profile
    const profile = await fsGetUserProfile();
    if (profile) {
      const nameEl = document.getElementById('userName') || document.querySelector('.user-name');
      const emailEl = document.getElementById('userEmail') || document.querySelector('.user-email');
      if (nameEl) nameEl.textContent = profile.name || user.displayName || 'User';
      if (emailEl) emailEl.textContent = profile.email || user.email || '';
    }

    // Load orders
    await loadOrders();
  });
});

async function loadOrders() {
  const container = document.getElementById('ordersContainer') || document.getElementById('ordersList');
  if (!container) return;

  container.innerHTML = '<div style="text-align:center;padding:30px;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--primary);"></i></div>';

  try {
    const orders = await fsGetOrders();

    if (!orders.length) {
      container.innerHTML = `
        <div style="text-align:center;padding:60px;">
          <i class="fas fa-shopping-bag fa-3x" style="color:#ccc;margin-bottom:16px;"></i>
          <h3>No orders yet</h3>
          <p style="color:#999;margin-bottom:16px;">Start shopping to see your orders here!</p>
          <a href="products.html" class="btn btn-primary">Shop Now</a>
        </div>`;
      return;
    }

    container.innerHTML = orders.map(order => {
      const date = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Just now';
      const statusColors = { placed: '#f59e0b', confirmed: '#3b82f6', shipped: '#8b5cf6', delivered: '#22c55e', cancelled: '#ef4444' };
      const statusColor = statusColors[order.status] || '#999';
      const items = order.items || [];
      const itemSummary = items.slice(0, 2).map(i => i.name).join(', ') + (items.length > 2 ? ` +${items.length - 2} more` : '');

      return `
        <div class="order-card" style="border:1px solid var(--border);border-radius:var(--radius-sm);padding:20px;margin-bottom:16px;background:#fff;cursor:pointer;" onclick="toggleOrderDetail('${order.id}')">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <div style="font-weight:700;font-size:0.9rem;">#${order.id.substring(0, 8).toUpperCase()}</div>
            <span style="background:${statusColor}15;color:${statusColor};padding:4px 12px;border-radius:20px;font-size:0.75rem;font-weight:600;">${(order.status || 'placed').toUpperCase()}</span>
          </div>
          <div style="color:var(--text-light);font-size:0.8rem;margin-bottom:8px;">${date}</div>
          <div style="font-size:0.85rem;margin-bottom:8px;">${itemSummary}</div>
          <div style="font-weight:700;color:var(--primary);">₹${order.total || 0}</div>
          <div id="detail-${order.id}" style="display:none;margin-top:16px;padding-top:16px;border-top:1px solid #f0f0f0;">
            <h4 style="margin-bottom:12px;">Order Details</h4>
            ${items.map(item => `
              <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f8f8f8;">
                <div style="width:40px;height:40px;border-radius:6px;background:#f5f5f5;overflow:hidden;display:flex;align-items:center;justify-content:center;">
                  ${item.imageUrl ? `<img src="${item.imageUrl}" style="width:100%;height:100%;object-fit:cover;">` : '🌿'}
                </div>
                <div style="flex:1;">
                  <div style="font-weight:500;">${item.name}</div>
                  <div style="color:#999;font-size:0.75rem;">${item.unit || ''} × ${item.quantity}</div>
                </div>
                <div style="font-weight:600;">₹${item.price * item.quantity}</div>
              </div>
            `).join('')}
            ${order.address ? `
              <div style="margin-top:12px;padding:12px;background:#f8fafc;border-radius:8px;">
                <h5 style="margin-bottom:4px;">Delivery Address</h5>
                <p style="font-size:0.85rem;color:#666;">${order.address.name || ''}, ${order.address.street || ''}, ${order.address.city || ''} - ${order.address.pincode || ''}, ${order.address.state || ''}</p>
                ${order.address.phone ? `<p style="font-size:0.8rem;color:#999;">📞 ${order.address.phone}</p>` : ''}
              </div>
            ` : ''}
            ${order.paymentId ? `<div style="margin-top:8px;font-size:0.8rem;color:#999;">Payment ID: ${order.paymentId}</div>` : ''}
          </div>
        </div>`;
    }).join('');

  } catch (err) {
    console.error('Error loading orders:', err);
    container.innerHTML = '<div style="text-align:center;padding:40px;color:#e53e3e;">Failed to load orders. Please try again.</div>';
  }
}

function toggleOrderDetail(orderId) {
  const el = document.getElementById('detail-' + orderId);
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}
