import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { auth, db } from '../firebase/config';
import { doc, getDoc, updateDoc, onSnapshot, arrayUnion } from 'firebase/firestore';

const STORE_WHATSAPP = '917845744038';

const STATUS_STEPS = [
  { key: 'placed',     icon: '🛍️', name: 'Order Placed',     desc: 'Your order has been received and confirmed.' },
  { key: 'processing', icon: '👨‍🍳', name: 'Being Prepared',   desc: 'Our team is carefully packing your items.' },
  { key: 'shipped',    icon: '🚚', name: 'Out for Delivery',  desc: 'Your order is on the way to your address.' },
  { key: 'delivered',  icon: '✅', name: 'Delivered',         desc: 'Order delivered successfully. Enjoy!' }
];

const STATUS_ORDER = ['placed', 'processing', 'shipped', 'delivered'];

export default function OrderTracking() {
  const router = useRouter();
  const { orderId, uid } = router.query;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchId, setSearchId] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;

    if (orderId && uid) {
      setLoading(true);
      
      const orderRef = doc(db, 'orders', orderId);
      
      // Live updates
      const unsubscribe = onSnapshot(orderRef, (snap) => {
        if (snap.exists()) {
          setOrder({ id: snap.id, ...snap.data() });
          setLoading(false);
        } else {
          // Check user orders
          const userOrderRef = doc(db, 'users', uid, 'orders', orderId);
          getDoc(userOrderRef).then((userSnap) => {
            if (userSnap.exists()) {
              setOrder({ id: userSnap.id, ...userSnap.data() });
            } else {
              setOrder(null);
            }
            setLoading(false);
          }).catch(() => {
            setOrder(null);
            setLoading(false);
          });
        }
      }, (err) => {
        console.error(err);
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setShowSearch(true);
      setLoading(false);
    }
  }, [router.isReady, orderId, uid]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchId.trim()) {
      const currentUid = auth.currentUser ? auth.currentUser.uid : 'guest';
      router.push(`/order-tracking?orderId=${searchId.trim()}&uid=${currentUid}`);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!confirm('Cancel this order? This cannot be undone.')) return;
    
    try {
      const timestamp = new Date().toISOString();
      const newStatusHistory = [...(order.statusHistory || []), { status: 'cancelled', timestamp }];
      
      // Update in global orders
      await updateDoc(doc(db, 'orders', order.id), {
        status: 'cancelled',
        statusHistory: newStatusHistory
      });

      // Update in user orders
      if (uid && uid !== 'guest') {
        await updateDoc(doc(db, 'users', uid, 'orders', order.id), {
          status: 'cancelled',
          statusHistory: newStatusHistory
        });
      }

      alert('Order cancelled successfully.');
    } catch (err) {
      console.error(err);
      alert('Could not cancel order. Please contact support.');
    }
  };

  const statusIdx = order ? STATUS_ORDER.indexOf(order.status || 'placed') : -1;

  return (
    <>
      <Head>
        <title>Track Order — Curfee Organic Market</title>
      </Head>

      <div className="header" style={{ background: 'linear-gradient(135deg,#1a5c38,#40916c)', color: '#fff', padding: '20px 16px 60px', textAlign: 'center' }}>
        <h1 style={{ color: '#fff' }}>🌿 Track Your Order</h1>
        <p style={{ color: '#f1f5f2' }}>Real-time order status updates</p>
        <div className="order-id-badge">
          {order ? `📦 ${order.orderId}` : 'Enter Order ID'}
        </div>
      </div>

      <div className="container" style={{ maxWidth: '520px', margin: '-40px auto 0', padding: '0 16px' }}>
        {showSearch && (
          <div className="search-order show" id="searchBox" style={{ background: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '10px', color: '#64748b' }}>Track a different order</div>
            <form onSubmit={handleSearchSubmit} className="search-row" style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Enter Order ID (e.g. ORD1234567890)" 
                style={{ flex: 1, padding: '10px 13px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem' }}
              />
              <button type="submit" style={{ padding: '10px 18px', background: '#1a5c38', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Track</button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="loading" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#1a5c38', marginBottom: '12px', display: 'block' }}></i>
            <div>Loading your order...</div>
          </div>
        ) : order ? (
          <>
            <div className="card" style={{ background: '#fff', borderRadius: '14px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0', marginBottom: '16px', overflow: 'hidden' }}>
              <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fas fa-route" style={{ color: '#1a5c38' }}></i> Order Status
                </h2>
                <span className={`status-badge status-${order.status || 'placed'}`}>
                  <span className="live-dot"></span>
                  {(order.status || 'placed').charAt(0).toUpperCase() + (order.status || 'placed').slice(1)}
                </span>
              </div>
              <div className="card-body" style={{ padding: '20px' }}>
                <div className="tracker">
                  {STATUS_STEPS.map((step, i) => {
                    const isCancelled = order.status === 'cancelled';
                    let cls = 'pending';
                    if (!isCancelled) {
                      cls = i < statusIdx ? 'done' : i === statusIdx ? 'active' : 'pending';
                    } else {
                      cls = 'pending'; // Show as gray if cancelled unless we want custom red tracker
                    }
                    const timeEntry = (order.statusHistory || []).find(h => h.status === step.key);
                    const timeStr = timeEntry ? new Date(timeEntry.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
                    
                    return (
                      <div key={step.key} className={`tracker-step ${cls}`}>
                        <div className="step-dot">{i < statusIdx ? <i className="fas fa-check"></i> : step.icon}</div>
                        <div className="step-info">
                          <div className="step-name">{step.name}</div>
                          <div className="step-desc">{step.desc}</div>
                          {timeStr && <div className="step-time"><i className="fas fa-clock"></i> {timeStr}</div>}
                        </div>
                      </div>
                    );
                  })}
                  {order.status === 'cancelled' && (
                    <div className="tracker-step done" style={{ color: '#e53935' }}>
                      <div className="step-dot" style={{ background: '#ffebee', borderColor: '#e53935', color: '#e53935' }}><i className="fas fa-times"></i></div>
                      <div className="step-info">
                        <div className="step-name" style={{ color: '#e53935' }}>Order Cancelled</div>
                        <div className="step-desc" style={{ color: '#e53935' }}>This order has been cancelled.</div>
                      </div>
                    </div>
                  )}
                </div>
                {order.status === 'delivered' && (
                  <div style={{ background: '#d1fae5', borderRadius: '10px', padding: '14px', textAlign: 'center', marginTop: '8px' }}>
                    <div style={{ fontSize: '1.5rem' }}>🎉</div>
                    <div style={{ fontWeight: 700, color: '#065f46', marginTop: '4px' }}>Delivered Successfully!</div>
                    <div style={{ fontSize: '0.8rem', color: '#047857', marginTop: '2px' }}>Hope you enjoy your organic products!</div>
                  </div>
                )}
              </div>
            </div>

            <div className="card" style={{ background: '#fff', borderRadius: '14px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0', marginBottom: '16px', overflow: 'hidden' }}>
              <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: '0.95rem', fontWeight: 700 }}><i className="fas fa-box-open" style={{ color: '#e05a2b' }}></i> Items Ordered</h2>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{order.items?.length} item{order.items?.length > 1 ? 's' : ''}</span>
              </div>
              <div className="card-body" style={{ padding: '14px 20px' }}>
                {order.items?.map((item, idx) => (
                  <div className="order-item" key={idx}>
                    <div className="item-thumb">
                      {item.imageUrl ? <img src={item.imageUrl} alt={item.name} onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '🌿'; }} /> : '🌿'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="item-name">{item.name}</div>
                      <div className="item-qty">Qty: {item.quantity}{item.unit ? ' · ' + item.unit : ''}</div>
                    </div>
                    <div className="item-price">₹{(item.discountPrice || item.price) * item.quantity}</div>
                  </div>
                ))}
                <div style={{ marginTop: '14px', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
                  <div className="sum-row"><span>Subtotal</span><span>₹{order.subtotal || 0}</span></div>
                  <div className="sum-row"><span>Delivery</span><span>{order.deliveryFee === 0 ? 'FREE' : '₹' + (order.deliveryFee || 0)}</span></div>
                  {order.discount > 0 && <div className="sum-row"><span style={{ color: '#10b981' }}>Discount</span><span style={{ color: '#10b981' }}>-₹{order.discount}</span></div>}
                  {order.codFee > 0 && <div className="sum-row"><span>COD Fee</span><span>₹{order.codFee}</span></div>}
                  <div className="sum-row total"><span>Total Paid</span><span>₹{order.total || 0}</span></div>
                </div>
              </div>
            </div>

            <div className="card" style={{ background: '#fff', borderRadius: '14px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0', marginBottom: '16px', overflow: 'hidden' }}>
              <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
                <h2 style={{ fontSize: '0.95rem', fontWeight: 700 }}><i className="fas fa-map-marker-alt" style={{ color: '#ef4444' }}></i> Delivery Details</h2>
              </div>
              <div className="card-body" style={{ padding: '20px' }}>
                <div className="info-row"><div className="info-icon"><i className="fas fa-user"></i></div><div><div class="info-label">Customer</div><div className="info-value">{order.address?.name || '—'}</div></div></div>
                <div className="info-row"><div className="info-icon"><i className="fas fa-phone"></i></div><div><div class="info-label">Phone</div><div className="info-value">{order.address?.phone || '—'}</div></div></div>
                <div className="info-row"><div className="info-icon"><i className="fas fa-home"></i></div><div><div class="info-label">Address</div><div className="info-value">{order.address?.line1 || ''}{order.address?.line2 ? ', ' + order.address?.line2 : ''}, {order.address?.city || ''} - {order.address?.pincode || ''}, {order.address?.state || ''}</div></div></div>
                <div className="info-row"><div className="info-icon"><i className="fas fa-credit-card"></i></div><div><div class="info-label">Payment</div><div className="info-value">{order.payment?.method ? order.payment.method.toUpperCase() : 'Online'} — <span style={{ color: '#10b981', fontWeight: 600 }}>{order.payment?.status === 'paid' ? '✅ Paid' : '⏳ Pending'}</span></div></div></div>
                {order.payment?.razorpayPaymentId && <div className="info-row"><div className="info-icon"><i className="fas fa-receipt"></i></div><div><div class="info-label">Payment ID</div><div className="info-value" style={{ fontSize: '0.78rem', fontFamily: 'monospace' }}>{order.payment.razorpayPaymentId}</div></div></div>}
              </div>
            </div>

            <div className="card" style={{ background: '#fff', borderRadius: '14px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0', marginBottom: '16px', overflow: 'hidden' }}>
              <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
                <h2 style={{ fontSize: '0.95rem', fontWeight: 700 }}><i className="fas fa-headset" style={{ color: '#25D366' }}></i> Need Help?</h2>
              </div>
              <div className="card-body" style={{ padding: '20px' }}>
                <div className="action-row" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <a href={`https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent('Hi Curfee! I need help with my order: ' + order.orderId)}`} target="_blank" rel="noreferrer" className="btn btn-whatsapp" style={{ padding: '10px 18px', borderRadius: '9px', fontSize: '0.85rem', fontWeight: 600, color: '#fff', textDecoration: 'none', background: '#25D366' }}><i className="fab fa-whatsapp"></i> WhatsApp Support</a>
                  <a href="tel:+917845744038" className="btn btn-outline" style={{ padding: '10px 18px', borderRadius: '9px', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', background: '#fff', border: '1.5px solid #e2e8f0', color: 'var(--text)' }}><i className="fas fa-phone"></i> Call Us</a>
                  {order.status === 'placed' && (
                    <button className="btn btn-danger" onClick={handleCancelOrder} style={{ padding: '10px 18px', borderRadius: '9px', fontSize: '0.85rem', fontWeight: 600, background: '#fee2e2', color: '#991b1b', border: '1.5px solid #fecaca', cursor: 'pointer' }}><i className="fas fa-times"></i> Cancel Order</button>
                  )}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '12px' }}><i className="fas fa-info-circle"></i> Orders can only be cancelled before they are shipped.</div>
              </div>
            </div>
          </>
        ) : (
          <div className="card" style={{ background: '#fff', borderRadius: '14px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0', marginBottom: '16px', overflow: 'hidden' }}>
            <div className="card-body" style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
              <h3 style={{ marginBottom: '8px' }}>Order not found</h3>
              <p style={{ color: '#64748b', fontSize: '0.87rem', marginBottom: '20px' }}>We couldn't find order <strong>{orderId}</strong>. Please check the order ID.</p>
              <Link href="/dashboard" className="btn btn-primary" style={{ display: 'inline-flex', margin: '0 auto', padding: '10px 18px', borderRadius: '9px', fontSize: '0.85rem', fontWeight: 600, background: '#1a5c38', color: '#fff', textDecoration: 'none' }}><i className="fas fa-list"></i> View All Orders</Link>
            </div>
          </div>
        )}
      </div>
      <div style={{ height: '70px' }}></div>
    </>
  );
}
