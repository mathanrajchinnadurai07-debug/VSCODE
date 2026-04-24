/* ==========================================================
   Curfee — Checkout Page (Firestore + Razorpay)
   ========================================================== */

let cartItems = [];
let grandTotal = 0;

document.addEventListener('DOMContentLoaded', async () => {
  // Must be logged in
  if (!auth.currentUser && !localStorage.getItem('curfee_user')) {
    window.location.href = 'login.html?redirect=checkout.html';
    return;
  }

  // Wait for auth to be ready
  auth.onAuthStateChanged(async user => {
    if (!user) {
      window.location.href = 'login.html?redirect=checkout.html';
      return;
    }

    // Load cart items from Firestore
    cartItems = await fsGetCart();
    if (!cartItems.length) {
      document.getElementById('checkoutContent').innerHTML = '<div style="text-align:center;padding:60px;"><h3>Your cart is empty</h3><a href="products.html" class="btn btn-primary" style="margin-top:16px;">Shop Now</a></div>';
      return;
    }

    renderCheckoutItems();
    prefillAddress(user);
  });
});

function renderCheckoutItems() {
  const container = document.getElementById('checkoutItems') || document.getElementById('orderItems');
  if (!container) return;

  const subtotal = cartItems.reduce((s, i) => s + (i.price * i.quantity), 0);
  const delivery = subtotal >= 499 ? 0 : 49;
  grandTotal = subtotal + delivery;

  container.innerHTML = cartItems.map(item => `
    <div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #f0f0f0;">
      <div style="width:50px;height:50px;min-width:50px;border-radius:8px;background:#f5f5f5;overflow:hidden;">
        ${item.imageUrl ? `<img src="${item.imageUrl}" style="width:100%;height:100%;object-fit:cover;">` : '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:1.5rem;">🌿</div>'}
      </div>
      <div style="flex:1;">
        <div style="font-weight:600;">${item.name}</div>
        <div style="color:#999;font-size:0.8rem;">${item.unit || ''} × ${item.quantity}</div>
      </div>
      <div style="font-weight:700;color:var(--primary);">₹${item.price * item.quantity}</div>
    </div>
  `).join('');

  // Update totals
  const subtotalEl = document.getElementById('subtotal') || document.getElementById('checkoutSubtotal');
  const deliveryEl = document.getElementById('delivery') || document.getElementById('checkoutDelivery');
  const totalEl = document.getElementById('total') || document.getElementById('checkoutTotal');
  const payBtn = document.getElementById('payBtn') || document.getElementById('placeOrderBtn');
  if (subtotalEl) subtotalEl.textContent = '₹' + subtotal;
  if (deliveryEl) deliveryEl.textContent = delivery === 0 ? 'FREE' : '₹' + delivery;
  if (totalEl) totalEl.textContent = '₹' + grandTotal;
  if (payBtn) payBtn.textContent = 'Pay Now ₹' + grandTotal;
}

async function prefillAddress(user) {
  try {
    const profile = await fsGetUserProfile();
    if (profile && profile.address) {
      const a = profile.address;
      const nameEl = document.getElementById('addrName') || document.getElementById('fullName');
      const phoneEl = document.getElementById('addrPhone') || document.getElementById('phone');
      const streetEl = document.getElementById('addrStreet') || document.getElementById('address');
      const cityEl = document.getElementById('addrCity') || document.getElementById('city');
      const pincodeEl = document.getElementById('addrPincode') || document.getElementById('pincode');
      const stateEl = document.getElementById('addrState') || document.getElementById('state');
      if (nameEl && profile.name) nameEl.value = profile.name;
      if (phoneEl && profile.phone) phoneEl.value = profile.phone;
      if (streetEl && a.street) streetEl.value = a.street;
      if (cityEl && a.city) cityEl.value = a.city;
      if (pincodeEl && a.pincode) pincodeEl.value = a.pincode;
      if (stateEl && a.state) stateEl.value = a.state;
    }
  } catch (e) {}
}

// ── Place Order (COD or Razorpay) ──
async function placeOrder() {
  const method = document.querySelector('input[name="payment_method"]:checked')?.value || 'cod';

  // Collect address
  const address = {
    name: (document.getElementById('addrName') || document.getElementById('fullName'))?.value || '',
    phone: (document.getElementById('addrPhone') || document.getElementById('phone'))?.value || '',
    street: (document.getElementById('addrStreet') || document.getElementById('address'))?.value || '',
    city: (document.getElementById('addrCity') || document.getElementById('city'))?.value || '',
    pincode: (document.getElementById('addrPincode') || document.getElementById('pincode'))?.value || '',
    state: (document.getElementById('addrState') || document.getElementById('state'))?.value || ''
  };

  if (!address.name || !address.phone || !address.street || !address.city || !address.pincode) {
    showToast('Please fill in all address fields', 'error');
    return;
  }

  // Save address to user profile
  await fsSaveUserAddress(address);

  if (method === 'razorpay' || method === 'upi' || method === 'credit_card') {
    // ── Razorpay Payment ──
    await initiateRazorpay(address);
  } else {
    // ── Cash on Delivery ──
    await saveOrderToFirestore(address, 'cod', null, null);
  }
}

async function initiateRazorpay(address) {
  try {
    showToast('Initializing payment...', 'info');

    // Call Cloud Function to create Razorpay order
    // If Cloud Functions not set up, use demo mode
    let razorpayOrderId = 'demo_order_' + Date.now();
    let razorpayKeyId = 'rzp_test_demo'; // Will be replaced with real key

    try {
      const response = await fetch('https://us-central1-curfee-10551.cloudfunctions.net/createRazorpayOrder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: grandTotal })
      });
      const data = await response.json();
      razorpayOrderId = data.orderId;
      razorpayKeyId = data.keyId;
    } catch (e) {
      console.warn('Cloud Functions not set up — using demo mode');
      showToast('Razorpay Cloud Functions not configured yet. Placing COD order.', 'warning');
      await saveOrderToFirestore(address, 'cod', null, null);
      return;
    }

    const user = auth.currentUser;
    const profile = getUser() || {};

    const options = {
      key: razorpayKeyId,
      amount: grandTotal * 100, // paise
      currency: 'INR',
      name: 'Curfee Organic Market',
      description: 'Order Payment',
      order_id: razorpayOrderId,
      prefill: {
        name: profile.name || user.displayName || '',
        email: user.email || '',
        contact: profile.phone || ''
      },
      theme: { color: '#2d6a4f' },
      handler: async function (response) {
        // Payment success — verify and save order
        try {
          await fetch('https://us-central1-curfee-10551.cloudfunctions.net/verifyRazorpayPayment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
          });
        } catch (e) {
          console.warn('Verification skipped (Cloud Functions not set up)');
        }

        await saveOrderToFirestore(address, 'razorpay', response.razorpay_payment_id, response.razorpay_order_id);
      }
    };

    const rzp = new Razorpay(options);
    rzp.open();
  } catch (err) {
    showToast('Payment error: ' + err.message, 'error');
  }
}

async function saveOrderToFirestore(address, paymentMethod, paymentId, razorpayOrderId) {
  try {
    const items = cartItems.map(i => ({
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      unit: i.unit || '',
      imageUrl: i.imageUrl || ''
    }));

    const orderId = await fsSaveOrder({
      items,
      total: grandTotal,
      address,
      paymentMethod,
      paymentId: paymentId || null,
      razorpayOrderId: razorpayOrderId || null,
      paymentStatus: paymentId ? 'paid' : 'pending'
    });

    // Clear cart
    await fsClearCart();

    // Show success
    const orderNumEl = document.getElementById('orderNumber');
    if (orderNumEl) orderNumEl.textContent = orderId || 'Order Placed';
    const modal = document.getElementById('successModal');
    if (modal) {
      modal.style.display = 'flex';
    } else {
      showToast('Order placed successfully! 🎉', 'success');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 2000);
    }
  } catch (err) {
    showToast('Error placing order: ' + err.message, 'error');
  }
}

// Expose placeOrder globally
window.placeOrder = placeOrder;
