/* Curfee Checkout Logic - Flipkart Style */

document.addEventListener('DOMContentLoaded', () => {
  const cart = getLocalCart();
  if (!cart || cart.length === 0) {
    window.location.href = 'cart.html';
    return;
  }
  
  loadAddress();
  renderOrderSummary(cart);
  updateTotals(cart);
});

function loadAddress() {
  const user = getUser() || {};
  const savedAddr = JSON.parse(localStorage.getItem('curfee_address') || '{}');
  document.getElementById('dispName').innerHTML = (user.name || 'Guest') + ' <span style="background:#f1f3f6;padding:2px 6px;font-size:0.65rem;border-radius:4px;color:#666;margin-left:4px;">HOME</span>';
  document.getElementById('dispAddress').textContent = savedAddr.address || 'Please add your delivery address';
  document.getElementById('dispPhone').textContent = user.phone || savedAddr.phone || '';
}

function renderOrderSummary(cart) {
  const container = document.getElementById('checkoutItemsContainer');
  let html = '';
  
  cart.forEach((item, index) => {
    html += `
      <div class="co-product" ${index === 0 ? 'style="margin-top:0; border-top:none; padding-top:0;"' : ''}>
        <img src="${item.image || 'assets/images/products/green-tea.png'}" class="co-product-img" onerror="this.src='';this.parentElement.innerHTML='🌿'">
        <div class="co-product-details">
          <div class="co-product-title">${item.name}</div>
          <div class="co-product-meta">${item.weight || ''}</div>
          <div style="font-size:0.8rem;color:#878787;margin-bottom:8px;">Qty: ${item.quantity}</div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-weight:700;font-size:1.1rem;color:#212121;">₹${item.price}</span>
            ${item.originalPrice > item.price ? `<span style="text-decoration:line-through;color:#878787;font-size:0.8rem;">₹${item.originalPrice}</span> <span style="color:#388e3c;font-size:0.8rem;font-weight:600;">↓${Math.round(((item.originalPrice-item.price)/item.originalPrice)*100)}%</span>` : ''}
          </div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

let finalTotal = 0;

function updateTotals(cart) {
  let subtotal = 0;
  let originalTotal = 0;
  
  cart.forEach(item => {
    subtotal += item.price * item.quantity;
    originalTotal += (item.originalPrice || item.price) * item.quantity;
  });
  
  const delivery = subtotal >= 500 ? 0 : 40;
  finalTotal = subtotal + delivery;
  const savings = originalTotal - subtotal;
  
  document.getElementById('sumFinal').textContent = '₹' + finalTotal;
  document.getElementById('payFinalAmount').textContent = '₹' + finalTotal;
  
  if (savings > 0) {
    document.getElementById('sumStrike').textContent = '₹' + originalTotal;
    document.getElementById('savingsBanner').innerHTML = `<i class="fas fa-tags"></i> You'll save ₹${savings} on this order!`;
    document.getElementById('savingsBanner').style.display = 'flex';
  } else {
    document.getElementById('sumStrike').style.display = 'none';
    document.getElementById('savingsBanner').style.display = 'none';
  }
  
  // Update all Pay buttons
  document.querySelectorAll('.btnAmt').forEach(el => el.textContent = '₹' + finalTotal);
}

function showPayments() {
  document.getElementById('viewSummary').style.display = 'none';
  document.getElementById('viewPayments').style.display = 'block';
  // Open UPI by default
  togglePay('UPI');
}

function showSummary() {
  document.getElementById('viewPayments').style.display = 'none';
  document.getElementById('viewSummary').style.display = 'block';
}

function togglePay(method) {
  // Clear all actives
  document.querySelectorAll('.pay-accordion').forEach(el => {
    el.classList.remove('active');
    const rad = el.querySelector('input[type="radio"]');
    if (rad) rad.checked = false;
  });
  
  // Set active
  const target = document.getElementById('acc' + method);
  if (target) {
    target.classList.add('active');
    const rad = target.querySelector('input[type="radio"]');
    if (rad) rad.checked = true;
  }
}

function placeOrder() {
  // Find selected method
  const method = document.querySelector('input[name="payment_method"]:checked')?.value || 'cod';
  
  const cart = getLocalCart();
  const orderNumber = 'COM-' + Math.floor(Math.random() * 10000000);
  
  const order = {
    orderNumber,
    date: new Date().toISOString(),
    items: cart,
    total: finalTotal,
    status: 'placed',
    paymentMethod: method
  };
  
  const orders = JSON.parse(localStorage.getItem('curfee_orders') || '[]');
  orders.unshift(order);
  localStorage.setItem('curfee_orders', JSON.stringify(orders));
  
  // Clear cart
  localStorage.removeItem('curfee_cart');
  
  // Show success modal
  document.getElementById('orderNumber').textContent = orderNumber;
  document.getElementById('successModal').style.display = 'flex';
}
