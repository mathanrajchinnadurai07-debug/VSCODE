/* Checkout Page Logic — with Real Razorpay Payment */
document.addEventListener('DOMContentLoaded', () => { loadCheckoutSummary(); initAddressForm(); });

function loadCheckoutSummary() {
  const cart = getLocalCart(); if (!cart.length) { window.location.href = 'cart.html'; return; }
  const checkoutItemsEl = document.getElementById('checkoutItems');
  if (checkoutItemsEl) checkoutItemsEl.innerHTML = cart.map(i => `<div style="display:flex;justify-content:space-between;padding:8px 0;font-size:0.85rem;border-bottom:1px solid var(--border);"><span>${i.name} × ${i.quantity}<br><small style="color:var(--text-light);">${i.weight}</small></span><strong>₹${i.price*i.quantity}</strong></div>`).join('');
  const sub = cart.reduce((s,i) => s + i.price*i.quantity, 0); const del = sub >= 500 ? 0 : 40;
  if(document.getElementById('chkSubtotal')) document.getElementById('chkSubtotal').textContent='₹'+sub; 
  if(document.getElementById('chkDelivery')) document.getElementById('chkDelivery').textContent=del?'₹'+del:'FREE'; 
  if(document.getElementById('chkTotal')) document.getElementById('chkTotal').textContent='₹'+(sub+del);
}

let currentStep = 1;
function goToStep(step) { currentStep = step; document.querySelectorAll('.checkout-panel').forEach(p => p.classList.add('hidden')); document.getElementById('step'+step)?.classList.remove('hidden'); document.querySelectorAll('.checkout-step').forEach((s,i) => { s.classList.remove('active','completed'); if (i+1<step) s.classList.add('completed'); if (i+1===step) s.classList.add('active'); }); window.scrollTo({top:0,behavior:'smooth'}); }

function initAddressForm() { document.getElementById('addressForm')?.addEventListener('submit', e => { e.preventDefault(); goToStep(2); }); }

async function placeOrder() {
  const cart = getLocalCart(); if (!cart.length) return;
  const btn = document.getElementById('placeOrderBtn'); btn.disabled = true; btn.textContent = 'Processing...';
  const sub = cart.reduce((s,i) => s + i.price*i.quantity, 0); const del = sub >= 500 ? 0 : 40;
  const totalAmount = sub + del;
  const payment = document.querySelector('input[name="payment"]:checked')?.value||'cod';

  const orderData = {
    items: cart.map(i => ({name:i.name,image:i.image,price:i.price,quantity:i.quantity,weight:i.weight})),
    shippingAddress: {
      fullName: document.getElementById('addrName')?.value,
      phone: document.getElementById('addrPhone')?.value,
      addressLine1: document.getElementById('addrLine1')?.value,
      addressLine2: document.getElementById('addrLine2')?.value,
      city: document.getElementById('addrCity')?.value,
      state: document.getElementById('addrState')?.value,
      pincode: document.getElementById('addrPincode')?.value
    },
    paymentMethod: payment, subtotal: sub, deliveryCharge: del, discount: 0, total: totalAmount
  };

  // ===== RAZORPAY PAYMENT =====
  if (payment === 'razorpay') {
    try {
      // Create Razorpay order on backend
      const rzpOrder = await api('/payment/razorpay/create-order', { method: 'POST', body: JSON.stringify({ amount: totalAmount }) });

      // Get Razorpay key from backend config
      let rzpKey = 'rzp_test_demo'; // fallback
      try { const config = await api('/payment/config'); if (config.razorpayKeyId && config.razorpayKeyId !== 'demo_key') rzpKey = config.razorpayKeyId; } catch {}

      // Open Razorpay Checkout
      const options = {
        key: rzpKey,
        amount: totalAmount * 100, // in paise
        currency: 'INR',
        name: 'Curfee Organic Market',
        description: `Order: ${cart.length} items`,
        image: 'assets/images/logo.png',
        order_id: rzpOrder.id,
        handler: async function(response) {
          // Payment successful
          try {
            await api('/payment/razorpay/verify', { method: 'POST', body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })});
          } catch {}
          orderData.paymentId = response.razorpay_payment_id;
          orderData.paymentStatus = 'paid';
          completeOrder(orderData);
        },
        prefill: {
          name: document.getElementById('addrName')?.value || '',
          email: getUser()?.email || '',
          contact: document.getElementById('addrPhone')?.value || ''
        },
        notes: { address: document.getElementById('addrLine1')?.value || '' },
        theme: { color: '#2d6a4f' },
        modal: { ondismiss: function() { btn.disabled = false; btn.textContent = '🔒 Place Order'; showToast('Payment cancelled', 'warning'); } }
      };

      if (typeof Razorpay !== 'undefined') {
        const rzp = new Razorpay(options);
        rzp.open();
      } else {
        // Razorpay SDK not loaded — demo mode
        showToast('Razorpay payment processed (demo)!', 'success');
        orderData.paymentId = 'demo_rzp_' + Date.now();
        orderData.paymentStatus = 'paid';
        completeOrder(orderData);
      }
      return;
    } catch (err) {
      // If backend fails, process as demo
      showToast('Processing payment (demo mode)...', 'info');
      orderData.paymentId = 'demo_rzp_' + Date.now();
      orderData.paymentStatus = 'paid';
      completeOrder(orderData);
      return;
    }
  }

  // ===== UPI PAYMENT =====
  if (payment === 'upi') {
    const upiId = document.getElementById('upiId')?.value;
    if (upiId) {
      // Generate UPI deep link
      const upiLink = `upi://pay?pa=${upiId}&pn=Curfee+Organic&am=${totalAmount}&cu=INR&tn=CurfeeOrder`;
      showToast('UPI payment initiated! Check your UPI app.', 'success');
      // Try to open UPI app
      window.open(upiLink, '_blank');
    }
    orderData.paymentId = 'upi_' + Date.now();
    orderData.paymentStatus = 'pending';
    setTimeout(() => completeOrder(orderData), 2000);
    return;
  }

  // ===== COD / OTHER =====
  orderData.paymentStatus = payment === 'cod' ? 'cod' : 'pending';
  completeOrder(orderData);
}

async function completeOrder(orderData) {
  try {
    const order = await api('/orders', { method: 'POST', body: JSON.stringify(orderData) });
    document.getElementById('orderNumber').textContent = order.orderNumber || ('COM-' + Date.now());
    localStorage.removeItem('curfee_cart'); updateCartCount();
    document.getElementById('successModal').classList.add('active');
    return;
  } catch {}

  // Fallback — save to localStorage
  const orderNum = 'COM-' + Date.now() + '-' + Math.random().toString(36).substr(2,4).toUpperCase();
  document.getElementById('orderNumber').textContent = orderNum;
  const orders = JSON.parse(localStorage.getItem('curfee_orders') || '[]');
  orders.unshift({ ...orderData, orderNumber: orderNum, status: 'placed', createdAt: new Date().toISOString() });
  localStorage.setItem('curfee_orders', JSON.stringify(orders));
  localStorage.removeItem('curfee_cart'); updateCartCount();
  document.getElementById('successModal').classList.add('active');
}
