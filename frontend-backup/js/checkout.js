/* Curfee — Multi-Step Checkout */
let cartItems=[], currentStep=1, subtotal=0, deliveryFee=0, discount=0, codFee=0, selectedPayment='razorpay';
const RZP_KEY='rzp_test_XXXXXXXXXXXXXXXX', STORE_WA='917845744038';

document.addEventListener('DOMContentLoaded',()=>{
  auth.onAuthStateChanged(u=>{
    if(!u){window.location.href='login.html?redirect=checkout.html';return;}
    document.getElementById('email').value=u.email||'';
    const s=JSON.parse(localStorage.getItem('curfee_user')||'{}');
    if(s.phone)document.getElementById('phone').value=s.phone;
    if(s.name){const p=(s.name||'').split(' ');document.getElementById('firstName').value=p[0]||'';document.getElementById('lastName').value=p.slice(1).join(' ')||'';}
    loadCart(u.uid);
  });
});

async function loadCart(uid){
  const snap=await db.collection('users').doc(uid).collection('cart').get();
  cartItems=snap.docs.map(d=>({id:d.id,...d.data()}));
  if(!cartItems.length){window.location.href='cart.html';return;}
  renderCartStep();renderSidebar();
}

function renderCartStep(){
  const c=document.getElementById('cartItems');if(!c)return;
  c.innerHTML=cartItems.map((item,i)=>`
  <div class="co-item">
    <div class="co-item-img">${item.imageUrl?`<img src="${item.imageUrl}" onerror="this.parentElement.innerHTML='🌿'">`:'🌿'}</div>
    <div class="co-item-info">
      <div class="co-item-name">${item.name}</div>
      <div class="co-item-unit">${item.unit||''}</div>
      <div class="co-item-qty">
        <button onclick="changeQty(${i},-1)">−</button>
        <span>${item.quantity}</span>
        <button onclick="changeQty(${i},1)">+</button>
      </div>
    </div>
    <div class="co-item-right">
      <div class="co-item-price">₹${item.price*item.quantity}</div>
      <button class="co-item-remove" onclick="removeItem(${i})"><i class="fas fa-trash"></i></button>
    </div>
  </div>`).join('');
  updateTotals();
}

function changeQty(i,d){cartItems[i].quantity=Math.max(1,cartItems[i].quantity+d);renderCartStep();renderSidebar();}
async function removeItem(i){
  const id=cartItems[i].id;cartItems.splice(i,1);
  if(!cartItems.length){window.location.href='cart.html';return;}
  try{await fsRemoveFromCart(id);}catch(e){}
  renderCartStep();renderSidebar();
}

function updateTotals(){
  subtotal=cartItems.reduce((s,i)=>s+(i.price*i.quantity),0);
  deliveryFee=subtotal>=499?0:49;
  codFee=selectedPayment==='cod'?25:0;
  const total=subtotal+deliveryFee-discount+codFee;
  const el=id=>document.getElementById(id);
  if(el('cartSubtotal'))el('cartSubtotal').textContent='₹'+subtotal;
  if(el('cartDelivery'))el('cartDelivery').textContent=deliveryFee===0?'FREE':'₹'+deliveryFee;
  if(el('cartTotal'))el('cartTotal').textContent='₹'+total;
}

function renderSidebar(){
  const c=document.getElementById('sidebarItems');if(!c)return;
  subtotal=cartItems.reduce((s,i)=>s+(i.price*i.quantity),0);
  deliveryFee=subtotal>=499?0:49;
  codFee=selectedPayment==='cod'?25:0;
  const total=subtotal+deliveryFee-discount+codFee;
  c.innerHTML=cartItems.map(i=>`<div class="sb-item"><span>${i.name} ×${i.quantity}</span><span>₹${i.price*i.quantity}</span></div>`).join('');
  const el=id=>document.getElementById(id);
  if(el('sbSubtotal'))el('sbSubtotal').textContent='₹'+subtotal;
  if(el('sbDelivery'))el('sbDelivery').textContent=deliveryFee===0?'FREE':'₹'+deliveryFee;
  if(el('sbDiscount'))el('sbDiscount').textContent='-₹'+discount;
  if(el('sbTotal'))el('sbTotal').textContent='₹'+total;
  if(el('payBtnAmt'))el('payBtnAmt').textContent='₹'+total;
}

function goStep(n){
  if(n===2&&currentStep===1){}
  if(n===3&&!validateForm())return;
  document.querySelectorAll('.co-step').forEach(s=>s.classList.remove('active'));
  document.getElementById('step'+n).classList.add('active');
  document.querySelectorAll('.prog-step').forEach((s,i)=>{
    s.classList.remove('active','done');
    if(i+1<n)s.classList.add('done');
    if(i+1===n)s.classList.add('active');
  });
  document.querySelectorAll('.prog-line').forEach((l,i)=>{l.classList.toggle('done',i+1<n);});
  currentStep=n;
  if(n>=2)renderSidebar();
  document.getElementById('orderSidebar').style.display=n>=2?'block':'none';
  window.scrollTo({top:0,behavior:'smooth'});
}

function validateForm(){
  const fields=['firstName','phone','email','address1','city','pincode'];
  for(const f of fields){if(!document.getElementById(f).value.trim()){showToast('Please fill all required fields','error');document.getElementById(f).focus();return false;}}
  if(!/^[6-9]\d{9}$/.test(document.getElementById('phone').value.replace(/\D/g,''))){showToast('Enter valid 10-digit mobile number','error');return false;}
  if(!/^\d{6}$/.test(document.getElementById('pincode').value)){showToast('Enter valid 6-digit PIN','error');return false;}
  return true;
}

function selectPay(m){
  selectedPayment=m;
  document.querySelectorAll('.pay-opt').forEach(e=>e.classList.remove('selected'));
  document.getElementById('pay-'+m).classList.add('selected');
  document.getElementById('cardFields').style.display=m==='card'?'block':'none';
  document.getElementById('codNote').style.display=m==='cod'?'flex':'none';
  renderSidebar();
}

function applyCoupon(){
  const code=document.getElementById('couponInput').value.trim().toUpperCase();
  const coupons={CURFEE10:10,ORGANIC20:20,FIRST50:50};
  if(coupons[code]){discount=Math.round(subtotal*coupons[code]/100);showToast(coupons[code]+'% off applied! 🎉','success');renderSidebar();}
  else showToast('Invalid coupon','error');
}

function getAddress(){return{name:document.getElementById('firstName').value+' '+document.getElementById('lastName').value,phone:document.getElementById('phone').value,email:document.getElementById('email').value,line1:document.getElementById('address1').value,line2:document.getElementById('address2').value,city:document.getElementById('city').value,state:document.getElementById('state').value,pincode:document.getElementById('pincode').value,note:document.getElementById('deliveryNote').value};}

async function processPayment(){
  const addr=getAddress(),total=subtotal+deliveryFee-discount+codFee,user=auth.currentUser,orderId='CF'+new Date().getFullYear()+Date.now().toString().slice(-6);
  if(selectedPayment==='cod'){await saveOrder(orderId,addr,total,user,{method:'cod',status:'pending'});return;}
  const opts={key:RZP_KEY,amount:total*100,currency:'INR',name:'Curfee Organic Market',description:'Order '+orderId,
    prefill:{name:addr.name,email:addr.email,contact:addr.phone.replace(/\D/g,'')},theme:{color:'#1a6b3a'},
    handler:async r=>{await saveOrder(orderId,addr,total,user,{method:selectedPayment,razorpayPaymentId:r.razorpay_payment_id,status:'paid'});},
    modal:{ondismiss:()=>showToast('Payment cancelled','error')}};
  new Razorpay(opts).open();
}

async function saveOrder(orderId,addr,total,user,payment){
  const data={orderId,items:cartItems,address:addr,subtotal,deliveryFee,discount,codFee,total,payment,status:'placed',statusHistory:[{status:'placed',timestamp:new Date().toISOString()}],createdAt:firebase.firestore.FieldValue.serverTimestamp()};
  try{
    await db.collection('users').doc(user.uid).collection('orders').doc(orderId).set(data);
    await db.collection('orders').doc(orderId).set({...data,userId:user.uid});
    const snap=await db.collection('users').doc(user.uid).collection('cart').get();
    const batch=db.batch();snap.docs.forEach(d=>batch.delete(d.ref));await batch.commit();
    showConfirmation(orderId,addr,total,payment);
  }catch(e){console.error(e);showToast('Order failed','error');}
}

function showConfirmation(orderId,addr,total,payment){
  const est=new Date();est.setDate(est.getDate()+2);
  const el=document.getElementById('confirmContent');
  el.innerHTML=`
  <div class="confirm-check"><i class="fas fa-check"></i></div>
  <h2 class="confirm-title">Order Confirmed!</h2>
  <p class="confirm-id">Order ID: <strong>#${orderId}</strong></p>
  <div class="confirm-details">
    <div class="cd-row"><span>📦 Items</span><span>${cartItems.length} products</span></div>
    <div class="cd-row"><span>📍 Delivery</span><span>${addr.city}, ${addr.pincode}</span></div>
    <div class="cd-row"><span>💳 Payment</span><span>${(payment.method||'online').toUpperCase()}${payment.status==='paid'?' ✅':' ⏳'}</span></div>
    <div class="cd-row"><span>🚚 Est. Delivery</span><span>${est.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span></div>
    <div class="cd-row total"><span>Total</span><span>₹${total}</span></div>
  </div>
  <div class="confirm-btns">
    <a href="products.html" class="cbtn cbtn-outline"><i class="fas fa-shopping-bag"></i> Continue Shopping</a>
    <a href="order-tracking.html?orderId=${orderId}&uid=${auth.currentUser.uid}" class="cbtn cbtn-primary"><i class="fas fa-truck"></i> Track Order</a>
  </div>`;
  goStep(4);
}

function showToast(msg,type='info'){const w=document.getElementById('toastWrap');if(!w)return;const t=document.createElement('div');t.className='toast '+type;t.textContent=msg;w.appendChild(t);setTimeout(()=>t.remove(),3500);}
