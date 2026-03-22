/* Checkout Page Logic */
document.addEventListener('DOMContentLoaded', () => { loadCheckoutSummary(); initAddressForm(); });
function loadCheckoutSummary() {
  const cart = getLocalCart(); if (!cart.length) { window.location.href = 'cart.html'; return; }
  document.getElementById('checkoutItems').innerHTML = cart.map(i => `<div style="display:flex;justify-content:space-between;padding:8px 0;font-size:0.85rem;border-bottom:1px solid var(--border);"><span>${i.name} × ${i.quantity}<br><small style="color:var(--text-light);">${i.weight}</small></span><strong>₹${i.price*i.quantity}</strong></div>`).join('');
  const sub = cart.reduce((s,i) => s + i.price*i.quantity, 0); const del = sub >= 500 ? 0 : 40;
  document.getElementById('chkSubtotal').textContent='₹'+sub; document.getElementById('chkDelivery').textContent=del?'₹'+del:'FREE'; document.getElementById('chkTotal').textContent='₹'+(sub+del);
}
let currentStep = 1;
function goToStep(step) { currentStep = step; document.querySelectorAll('.checkout-panel').forEach(p => p.classList.add('hidden')); document.getElementById('step'+step)?.classList.remove('hidden'); document.querySelectorAll('.checkout-step').forEach((s,i) => { s.classList.remove('active','completed'); if (i+1<step) s.classList.add('completed'); if (i+1===step) s.classList.add('active'); }); window.scrollTo({top:0,behavior:'smooth'}); }
function initAddressForm() { document.getElementById('addressForm')?.addEventListener('submit', e => { e.preventDefault(); goToStep(2); }); }
async function placeOrder() {
  const cart = getLocalCart(); if (!cart.length) return;
  const btn = document.getElementById('placeOrderBtn'); btn.disabled = true; btn.textContent = 'Processing...';
  const sub = cart.reduce((s,i) => s + i.price*i.quantity, 0); const del = sub >= 500 ? 0 : 40;
  const payment = document.querySelector('input[name="payment"]:checked')?.value||'cod';
  const orderData = { items: cart.map(i => ({name:i.name,image:i.image,price:i.price,quantity:i.quantity,weight:i.weight})), shippingAddress: { fullName:document.getElementById('addrName')?.value, phone:document.getElementById('addrPhone')?.value, addressLine1:document.getElementById('addrLine1')?.value, addressLine2:document.getElementById('addrLine2')?.value, city:document.getElementById('addrCity')?.value, state:document.getElementById('addrState')?.value, pincode:document.getElementById('addrPincode')?.value }, paymentMethod:payment, subtotal:sub, deliveryCharge:del, discount:0, total:sub+del };
  if (payment==='razorpay') { try { await api('/payment/razorpay/create-order',{method:'POST',body:JSON.stringify({amount:sub+del})}); showToast('Razorpay demo order created!','success'); } catch {} }
  else if (payment==='stripe') { try { await api('/payment/stripe/create-intent',{method:'POST',body:JSON.stringify({amount:sub+del})}); showToast('Stripe demo payment created!','success'); } catch {} }
  try { const order = await api('/orders',{method:'POST',body:JSON.stringify(orderData)}); document.getElementById('orderNumber').textContent = order.orderNumber||('COM-'+Date.now()); localStorage.removeItem('curfee_cart'); updateCartCount(); document.getElementById('successModal').classList.add('active'); return; } catch {}
  const orderNum = 'COM-'+Date.now()+'-'+Math.random().toString(36).substr(2,4).toUpperCase();
  document.getElementById('orderNumber').textContent = orderNum;
  const orders = JSON.parse(localStorage.getItem('curfee_orders')||'[]'); orders.unshift({...orderData,orderNumber:orderNum,status:'placed',createdAt:new Date().toISOString()}); localStorage.setItem('curfee_orders',JSON.stringify(orders));
  localStorage.removeItem('curfee_cart'); updateCartCount(); document.getElementById('successModal').classList.add('active');
}
