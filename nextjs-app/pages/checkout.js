import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { auth, db } from '../firebase/config';
import { collection, doc, getDocs, setDoc, deleteDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const RZP_KEY = 'rzp_test_XXXXXXXXXXXXXXXX';

export default function Checkout() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState('razorpay');
  const [couponInput, setCouponInput] = useState('');
  const [toasts, setToasts] = useState([]);
  const [orderConfirmedData, setOrderConfirmedData] = useState(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address1: '',
    address2: '',
    city: '',
    state: 'Tamil Nadu',
    pincode: '',
    deliveryNote: ''
  });

  const subtotal = cartItems.reduce((s, i) => s + (i.price * i.quantity), 0);
  const deliveryFee = subtotal >= 499 ? 0 : 49;
  const codFee = selectedPayment === 'cod' ? 25 : 0;
  const total = subtotal + deliveryFee - discount + codFee;

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push('/login?redirect=checkout');
        return;
      }
      setUser(u);
      setFormData(prev => ({ ...prev, email: u.email || '' }));

      try {
        const localUserStr = localStorage.getItem('curfee_user') || '{}';
        const localUser = JSON.parse(localUserStr);
        setFormData(prev => ({
          ...prev,
          phone: localUser.phone || prev.phone,
          firstName: localUser.name ? localUser.name.split(' ')[0] : prev.firstName,
          lastName: localUser.name ? localUser.name.split(' ').slice(1).join(' ') : prev.lastName,
        }));
      } catch (e) {}

      loadCart(u.uid);
    });

    return () => {
      unsubscribe();
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [router]);

  const loadCart = async (uid) => {
    try {
      const snap = await getDocs(collection(db, 'users', uid, 'cart'));
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (!items.length) {
        router.push('/cart');
        return;
      }
      setCartItems(items);
    } catch(e) {
      console.error(e);
    }
  };

  const showToast = (msg, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const changeQty = (index, d) => {
    const newItems = [...cartItems];
    newItems[index].quantity = Math.max(1, newItems[index].quantity + d);
    setCartItems(newItems);
  };

  const removeItem = async (index) => {
    const item = cartItems[index];
    const newItems = cartItems.filter((_, i) => i !== index);
    
    // Attempt to remove from firebase
    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'cart', item.id));
      } catch(e) { console.error(e); }
    }
    
    if (!newItems.length) {
      router.push('/cart');
      return;
    }
    setCartItems(newItems);
  };

  const validateForm = () => {
    const fields = ['firstName', 'phone', 'email', 'address1', 'city', 'pincode'];
    for (const f of fields) {
      if (!formData[f].trim()) {
        showToast('Please fill all required fields', 'error');
        document.getElementById(f)?.focus();
        return false;
      }
    }
    if (!/^[6-9]\d{9}$/.test(formData.phone.replace(/\D/g, ''))) {
      showToast('Enter valid 10-digit mobile number', 'error');
      return false;
    }
    if (!/^\d{6}$/.test(formData.pincode)) {
      showToast('Enter valid 6-digit PIN', 'error');
      return false;
    }
    return true;
  };

  const goStep = (n) => {
    if (n === 3 && !validateForm()) return;
    setCurrentStep(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    const coupons = { CURFEE10: 10, ORGANIC20: 20, FIRST50: 50 };
    if (coupons[code]) {
      setDiscount(Math.round(subtotal * coupons[code] / 100));
      showToast(coupons[code] + '% off applied! 🎉', 'success');
    } else {
      showToast('Invalid coupon', 'error');
    }
  };

  const getAddress = () => ({
    name: formData.firstName + ' ' + formData.lastName,
    phone: formData.phone,
    email: formData.email,
    line1: formData.address1,
    line2: formData.address2,
    city: formData.city,
    state: formData.state,
    pincode: formData.pincode,
    note: formData.deliveryNote
  });

  const processPayment = async () => {
    if (!user) return;
    const addr = getAddress();
    const orderId = 'CF' + new Date().getFullYear() + Date.now().toString().slice(-6);

    if (selectedPayment === 'cod') {
      await saveOrder(orderId, addr, { method: 'cod', status: 'pending' });
      return;
    }

    if (typeof window.Razorpay === 'undefined') {
      showToast('Payment gateway is loading. Please try again in a moment.', 'error');
      return;
    }

    const opts = {
      key: RZP_KEY,
      amount: total * 100,
      currency: 'INR',
      name: 'Curfee Organic Market',
      description: 'Order ' + orderId,
      prefill: {
        name: addr.name,
        email: addr.email,
        contact: addr.phone.replace(/\D/g, '')
      },
      theme: { color: '#1a6b3a' },
      handler: async (r) => {
        await saveOrder(orderId, addr, { method: selectedPayment, razorpayPaymentId: r.razorpay_payment_id, status: 'paid' });
      },
      modal: {
        ondismiss: () => showToast('Payment cancelled', 'error')
      }
    };
    const rzp = new window.Razorpay(opts);
    rzp.open();
  };

  const saveOrder = async (orderId, addr, payment) => {
    const data = {
      orderId,
      items: cartItems,
      address: addr,
      subtotal,
      deliveryFee,
      discount,
      codFee,
      total,
      payment,
      status: 'placed',
      statusHistory: [{ status: 'placed', timestamp: new Date().toISOString() }],
      createdAt: serverTimestamp()
    };

    try {
      await setDoc(doc(db, 'users', user.uid, 'orders', orderId), data);
      await setDoc(doc(db, 'orders', orderId), { ...data, userId: user.uid });
      
      const snap = await getDocs(collection(db, 'users', user.uid, 'cart'));
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();

      showConfirmation(orderId, addr, payment);
    } catch (e) {
      console.error(e);
      showToast('Order failed', 'error');
    }
  };

  const showConfirmation = (orderId, addr, payment) => {
    const est = new Date();
    est.setDate(est.getDate() + 2);
    setOrderConfirmedData({
      orderId,
      addr,
      payment,
      total,
      itemCount: cartItems.length,
      estDelivery: est.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    });
    goStep(4);
  };

  return (
    <>
      <Head>
        <title>Checkout — Curfee Organic Market</title>
        <meta name="viewport" content="width=device-width,initial-scale=1.0" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      </Head>

      <div className="topbar">
        <Link href="/cart">
          <i className="fas fa-arrow-left"></i>
        </Link>
        <h1>🌿 Checkout</h1>
      </div>

      {/* Progress Bar */}
      <div className="progress">
        <div className={`prog-step ${currentStep === 1 ? 'active' : ''} ${currentStep > 1 ? 'done' : ''}`}>
          <div className="prog-num">1</div>
          <div className="prog-label">Cart</div>
        </div>
        <div className={`prog-line ${currentStep > 1 ? 'done' : ''}`}></div>
        
        <div className={`prog-step ${currentStep === 2 ? 'active' : ''} ${currentStep > 2 ? 'done' : ''}`}>
          <div className="prog-num">2</div>
          <div className="prog-label">Details</div>
        </div>
        <div className={`prog-line ${currentStep > 2 ? 'done' : ''}`}></div>
        
        <div className={`prog-step ${currentStep === 3 ? 'active' : ''} ${currentStep > 3 ? 'done' : ''}`}>
          <div className="prog-num">3</div>
          <div className="prog-label">Payment</div>
        </div>
        <div className={`prog-line ${currentStep > 3 ? 'done' : ''}`}></div>
        
        <div className={`prog-step ${currentStep === 4 ? 'active' : ''}`}>
          <div className="prog-num">4</div>
          <div className="prog-label">Confirm</div>
        </div>
      </div>

      <div className="co-wrap">
        <div className="co-main">

          {/* STEP 1: Cart */}
          <div className={`co-step ${currentStep === 1 ? 'active' : ''}`}>
            <div className="card">
              <div className="card-title">
                <i className="fas fa-shopping-cart"></i> Your Cart
              </div>
              <div id="cartItems">
                {cartItems.map((item, i) => (
                  <div className="co-item" key={item.id || i}>
                    <div className="co-item-img">
                      {item.imageUrl ? (
                        <img 
                          src={item.imageUrl} 
                          alt={item.name} 
                          onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '🌿'; }} 
                        />
                      ) : (
                        '🌿'
                      )}
                    </div>
                    <div className="co-item-info">
                      <div className="co-item-name">{item.name}</div>
                      <div className="co-item-unit">{item.unit || ''}</div>
                      <div className="co-item-qty">
                        <button onClick={() => changeQty(i, -1)}>−</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => changeQty(i, 1)}>+</button>
                      </div>
                    </div>
                    <div className="co-item-right">
                      <div className="co-item-price">₹{item.price * item.quantity}</div>
                      <button className="co-item-remove" onClick={() => removeItem(i)}>
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '16px', borderTop: '1.5px solid var(--border)', paddingTop: '14px' }}>
                <div className="sum-row"><span>Subtotal</span><span id="cartSubtotal">₹{subtotal}</span></div>
                <div className="sum-row"><span>Delivery</span><span id="cartDelivery">{deliveryFee === 0 ? 'FREE' : '₹' + deliveryFee}</span></div>
                <div className="sum-row total"><span>Total</span><span id="cartTotal">₹{subtotal + deliveryFee}</span></div>
              </div>
            </div>
            <div className="co-btns">
              <button className="btn-next" onClick={() => goStep(2)}>
                Proceed to Details <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>

          {/* STEP 2: Address */}
          <div className={`co-step ${currentStep === 2 ? 'active' : ''}`}>
            <div className="card">
              <div className="card-title">
                <i className="fas fa-map-marker-alt"></i> Delivery Address
              </div>
              <div className="form-grid">
                <div className="fg">
                  <label>First Name *</label>
                  <input type="text" id="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="Raj" />
                </div>
                <div className="fg">
                  <label>Last Name</label>
                  <input type="text" id="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Kumar" />
                </div>
                <div className="fg">
                  <label>Phone *</label>
                  <input type="tel" id="phone" value={formData.phone} onChange={handleInputChange} placeholder="+91 98765 43210" />
                </div>
                <div className="fg">
                  <label>Email *</label>
                  <input type="email" id="email" value={formData.email} onChange={handleInputChange} placeholder="raj@email.com" />
                </div>
                <div className="fg full">
                  <label>Address Line 1 *</label>
                  <input type="text" id="address1" value={formData.address1} onChange={handleInputChange} placeholder="House/Flat No, Street" />
                </div>
                <div className="fg full">
                  <label>Address Line 2</label>
                  <input type="text" id="address2" value={formData.address2} onChange={handleInputChange} placeholder="Landmark, Area" />
                </div>
                <div className="fg">
                  <label>City *</label>
                  <input type="text" id="city" value={formData.city} onChange={handleInputChange} placeholder="Chennai" />
                </div>
                <div className="fg">
                  <label>State *</label>
                  <select id="state" value={formData.state} onChange={handleInputChange}>
                    <option>Tamil Nadu</option>
                    <option>Kerala</option>
                    <option>Karnataka</option>
                    <option>Andhra Pradesh</option>
                    <option>Telangana</option>
                    <option>Maharashtra</option>
                    <option>Delhi</option>
                    <option>Gujarat</option>
                    <option>Rajasthan</option>
                    <option>West Bengal</option>
                    <option>Uttar Pradesh</option>
                    <option>Bihar</option>
                    <option>Madhya Pradesh</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="fg">
                  <label>PIN Code *</label>
                  <input type="text" id="pincode" value={formData.pincode} onChange={handleInputChange} placeholder="600001" maxLength="6" />
                </div>
                <div className="fg">
                  <label>Delivery Instructions</label>
                  <input type="text" id="deliveryNote" value={formData.deliveryNote} onChange={handleInputChange} placeholder="Leave at door..." />
                </div>
              </div>
            </div>
            <div className="co-btns">
              <button className="btn-back" onClick={() => goStep(1)}>
                <i className="fas fa-arrow-left"></i> Back
              </button>
              <button className="btn-next" onClick={() => goStep(3)}>
                Proceed to Payment <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>

          {/* STEP 3: Payment */}
          <div className={`co-step ${currentStep === 3 ? 'active' : ''}`}>
            <div className="card">
              <div className="card-title">
                <i className="fas fa-credit-card"></i> Payment Method
              </div>
              <div className="pay-opts">
                <div className={`pay-opt ${selectedPayment === 'razorpay' ? 'selected' : ''}`} id="pay-razorpay" onClick={() => setSelectedPayment('razorpay')}>
                  <div className="po-check"><i className="fas fa-check"></i></div>
                  <div className="po-icon">💳</div>
                  <div className="po-name">Credit/Debit Card</div>
                </div>
                <div className={`pay-opt ${selectedPayment === 'gpay' ? 'selected' : ''}`} id="pay-gpay" onClick={() => setSelectedPayment('gpay')}>
                  <div className="po-check"><i className="fas fa-check"></i></div>
                  <div className="po-icon">🇬</div>
                  <div className="po-name">Google Pay / UPI</div>
                </div>
                <div className={`pay-opt ${selectedPayment === 'cod' ? 'selected' : ''}`} id="pay-cod" onClick={() => setSelectedPayment('cod')}>
                  <div className="po-check"><i className="fas fa-check"></i></div>
                  <div className="po-icon">💵</div>
                  <div className="po-name">Cash on Delivery</div>
                </div>
              </div>
              
              <div id="cardFields" style={{ display: selectedPayment === 'card' ? 'block' : 'none' }}>
                <div className="form-grid">
                  <div className="fg full"><label>Card Number</label><input type="text" placeholder="1234 5678 9012 3456" maxLength="19" /></div>
                  <div className="fg"><label>Expiry</label><input type="text" placeholder="MM/YY" maxLength="5" /></div>
                  <div className="fg"><label>CVV</label><input type="password" placeholder="•••" maxLength="4" /></div>
                </div>
              </div>
              
              <div className="cod-note" id="codNote" style={{ display: selectedPayment === 'cod' ? 'flex' : 'none' }}>
                <i className="fas fa-info-circle" style={{ marginTop: '2px' }}></i>
                <span>COD available. Extra ₹25 handling fee. Keep exact change ready.</span>
              </div>
              
              <div className="secure">
                <i className="fas fa-shield-alt"></i> 100% Secure Payment via Razorpay · RBI Approved · PCI DSS
              </div>
            </div>
            <div className="co-btns">
              <button className="btn-back" onClick={() => goStep(2)}>
                <i className="fas fa-arrow-left"></i> Back
              </button>
              <button className="btn-next" onClick={processPayment}>
                <i className="fas fa-lock"></i> Pay Securely <span id="payBtnAmt">₹{total}</span>
              </button>
            </div>
          </div>

          {/* STEP 4: Confirm */}
          <div className={`co-step ${currentStep === 4 ? 'active' : ''}`}>
            {orderConfirmedData && (
              <div className="card" id="confirmContent">
                <div className="confirm-check"><i className="fas fa-check"></i></div>
                <h2 className="confirm-title">Order Confirmed!</h2>
                <p className="confirm-id">Order ID: <strong>#{orderConfirmedData.orderId}</strong></p>
                <div className="confirm-details">
                  <div className="cd-row"><span>📦 Items</span><span>{orderConfirmedData.itemCount} products</span></div>
                  <div className="cd-row"><span>📍 Delivery</span><span>{orderConfirmedData.addr.city}, {orderConfirmedData.addr.pincode}</span></div>
                  <div className="cd-row">
                    <span>💳 Payment</span>
                    <span>{(orderConfirmedData.payment.method || 'online').toUpperCase()}{orderConfirmedData.payment.status === 'paid' ? ' ✅' : ' ⏳'}</span>
                  </div>
                  <div className="cd-row"><span>🚚 Est. Delivery</span><span>{orderConfirmedData.estDelivery}</span></div>
                  <div className="cd-row total"><span>Total</span><span>₹{orderConfirmedData.total}</span></div>
                </div>
                <div className="confirm-btns">
                  <Link href="/products" className="cbtn cbtn-outline">
                    <i className="fas fa-shopping-bag"></i> Continue Shopping
                  </Link>
                  <Link href={`/order-tracking?orderId=${orderConfirmedData.orderId}&uid=${user?.uid}`} className="cbtn cbtn-primary">
                    <i className="fas fa-truck"></i> Track Order
                  </Link>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* ORDER SIDEBAR */}
        <div className="co-side" id="orderSidebar" style={{ display: currentStep >= 2 ? 'block' : 'none' }}>
          <div className="card" style={{ position: 'sticky', top: '16px' }}>
            <div className="card-title">
              <i className="fas fa-shopping-bag"></i> Order Summary
            </div>
            <div id="sidebarItems">
              {cartItems.map((item, i) => (
                <div className="sb-item" key={i}>
                  <span>{item.name} ×{item.quantity}</span>
                  <span>₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '14px', borderTop: '1.5px solid var(--border)', paddingTop: '12px' }}>
              <div className="sum-row"><span>Subtotal</span><span id="sbSubtotal">₹{subtotal}</span></div>
              <div className="sum-row"><span>Delivery</span><span id="sbDelivery">{deliveryFee === 0 ? 'FREE' : '₹' + deliveryFee}</span></div>
              <div className="sum-row">
                <span style={{ color: '#10b981' }}>Discount</span>
                <span id="sbDiscount" style={{ color: '#10b981' }}>-₹{discount}</span>
              </div>
              <div className="sum-row total"><span>Total</span><span id="sbTotal">₹{total}</span></div>
            </div>
            <div style={{ marginTop: '14px' }}>
              <input 
                type="text" 
                id="couponInput" 
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="Coupon code" 
                style={{ width: '100%', padding: '10px', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '.88rem', marginBottom: '8px' }} 
              />
              <button 
                onClick={applyCoupon}
                style={{ width: '100%', padding: '9px', background: '#f0faf4', color: 'var(--p)', border: '1.5px solid var(--p)', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '.85rem' }}
              >
                Apply Coupon
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="toast-wrap" id="toastWrap">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.msg}
          </div>
        ))}
      </div>
    </>
  );
}
