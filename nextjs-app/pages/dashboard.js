import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { auth, db } from '../firebase/config';
import { doc, getDoc, updateDoc, collection, getDocs, setDoc, query, orderBy } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useCart } from '../context/CartContext';
import { ALL_PRODUCTS } from '../data/products';
import Toast from '../components/Toast';

export default function Dashboard() {
  const router = useRouter();
  const { wishlist, toggleWishlist } = useCart();
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [coins, setCoins] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Edit Profile States
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');

  // Cancellation States
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState('');
  const [cancelReason, setCancelReason] = useState('Changed my mind');
  const [cancelOtherReason, setCancelOtherReason] = useState('');

  useEffect(() => {
    // Generate static random coins just for fun/immersion
    setCoins(Math.floor(Math.random() * 45) + 5);

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        // Fallback to local profile or redirect
        const localUserStr = localStorage.getItem('curfee_user');
        if (localUserStr) {
          const lu = JSON.parse(localUserStr);
          setUser(lu);
          setProfileName(lu.name || '');
          setProfileEmail(lu.email || '');
          setProfilePhone(lu.phone || '');
          loadLocalOrders();
        } else {
          router.push('/login?redirect=dashboard');
        }
        setIsLoaded(true);
        return;
      }
      
      setUser(u);
      setProfileName(u.displayName || '');
      setProfileEmail(u.email || '');
      
      try {
        const udoc = await getDoc(doc(db, 'users', u.uid));
        if (udoc.exists()) {
          const data = udoc.data();
          setProfilePhone(data.phone || '');
          if (data.name) setProfileName(data.name);
        }
      } catch (err) {}

      // Load live orders from Firestore
      try {
        const qSnap = await getDocs(
          query(collection(db, 'users', u.uid, 'orders'), orderBy('createdAt', 'desc'))
        );
        const oList = qSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setOrders(oList);
      } catch (err) {
        // Fallback to local orders
        loadLocalOrders();
      }
      setIsLoaded(true);
    });

    return () => unsubscribe();
  }, [router]);

  const loadLocalOrders = () => {
    try {
      const localOrders = JSON.parse(localStorage.getItem('curfee_orders') || '[]');
      setOrders(localOrders);
    } catch (e) {}
  };

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('curfee_user');
    localStorage.removeItem('curfee_token');
    if (window.showToast) window.showToast('Logged out successfully', 'info');
    router.push('/login');
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileName.trim()) {
      alert('Name is required');
      return;
    }

    const updatedUser = {
      ...user,
      name: profileName,
      email: profileEmail,
      phone: profilePhone
    };

    localStorage.setItem('curfee_user', JSON.stringify(updatedUser));
    setUser(updatedUser);

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          name: profileName,
          email: profileEmail,
          phone: profilePhone
        }, { merge: true });
      } catch (err) {
        console.error(err);
      }
    }

    if (window.showToast) window.showToast('Profile updated successfully! 🌿', 'success');
  };

  const openCancelModal = (orderId) => {
    setCancelOrderId(orderId);
    setCancelReason('Changed my mind');
    setCancelOtherReason('');
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    let reason = cancelReason;
    if (reason === 'Other') {
      reason = cancelOtherReason.trim() || 'Other reason';
    }

    try {
      const timestamp = new Date().toISOString();
      const updatedOrders = orders.map(o => {
        if (o.orderId === cancelOrderId || o.id === cancelOrderId) {
          return {
            ...o,
            status: 'cancelled',
            cancelReason: reason,
            statusHistory: [...(o.statusHistory || []), { status: 'cancelled', timestamp }]
          };
        }
        return o;
      });

      setOrders(updatedOrders);
      
      // Update local storage just in case
      localStorage.setItem('curfee_orders', JSON.stringify(updatedOrders));

      if (auth.currentUser) {
        // Update globally
        const globalRef = doc(db, 'orders', cancelOrderId);
        await updateDoc(globalRef, {
          status: 'cancelled',
          cancelReason: reason
        });
        // Update for user
        const userRef = doc(db, 'users', auth.currentUser.uid, 'orders', cancelOrderId);
        await updateDoc(userRef, {
          status: 'cancelled',
          cancelReason: reason
        });
      }

      setCancelModalOpen(false);
      if (window.showToast) window.showToast('Order cancelled successfully', 'success');
    } catch (err) {
      console.error(err);
      alert('Could not cancel order. Please contact support.');
    }
  };

  const getReferCode = () => {
    if (!user) return 'CURFEE100';
    const namePart = (profileName || 'USER').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
    return `CURFEE${namePart}${100 + (coins % 900)}`;
  };

  const copyReferCode = () => {
    const code = getReferCode();
    navigator.clipboard.writeText(code).then(() => {
      if (window.showToast) window.showToast('Referral code copied! 🎉', 'success');
    }).catch(() => {
      alert('Referral code: ' + code);
    });
  };

  const shareRefer = () => {
    const code = getReferCode();
    const msg = encodeURIComponent(`🌿 Shop organic with Curfee! Use my referral code ${code} and get ₹100 off your first order! 🛒\n\nhttps://curfee-organic-market-demo.surge.sh`);
    window.open('https://wa.me/?text=' + msg, '_blank');
  };

  const wishlistProducts = useMemo(() => {
    if (!wishlist || !wishlist.length) return [];
    return wishlist.map(pid => ALL_PRODUCTS.find(p => p._id === pid || p.slug === pid)).filter(Boolean);
  }, [wishlist]);

  if (!isLoaded) return null;

  return (
    <>
      <Head>
        <title>My Account — Curfee Organic Market</title>
      </Head>

      <div className="fk-account-page">
        {/* User Card */}
        <div className="fk-user-card" style={{ paddingBottom: '12px' }}>
          <div className="fk-user-info">
            <h2 id="userName" style={{ fontSize: '1.4rem', color: 'var(--text)' }}>{profileName || 'Guest User'}</h2>
          </div>
          <div className="fk-coins"><i className="fas fa-coins"></i> <span id="userCoins">{coins}</span></div>
        </div>
        <div className="fk-membership">
          <span className="fk-membership-badge">ORGANIC</span>
          <Link href="/green-member" style={{ textDecoration: 'none', color: 'inherit', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Explore <strong style={{ color: '#2d6a4f' }}>Green Member</strong></span>
            <i className="fas fa-chevron-right" style={{ marginLeft: 'auto' }}></i>
          </Link>
        </div>

        {/* Quick Action Buttons */}
        <div className="fk-quick-grid">
          <button className={`fk-quick-btn ${activeSection === 'orders' ? 'active' : ''}`} onClick={() => setActiveSection('orders')} style={{ cursor: 'pointer', border: 'none', background: 'none' }}><i className="fas fa-box"></i> Orders</button>
          <button className={`fk-quick-btn ${activeSection === 'wishlist' ? 'active' : ''}`} onClick={() => setActiveSection('wishlist')} style={{ cursor: 'pointer', border: 'none', background: 'none' }}><i className="fas fa-heart" style={{ color: '#e53935' }}></i> Wishlist</button>
          <button className={`fk-quick-btn ${activeSection === 'coupons' ? 'active' : ''}`} onClick={() => setActiveSection('coupons')} style={{ cursor: 'pointer', border: 'none', background: 'none' }}><i className="fas fa-ticket-alt" style={{ color: '#ff9800' }}></i> Coupons</button>
          <Link href="/support" className="fk-quick-btn"><i className="fas fa-headset" style={{ color: '#1565c0' }}></i> Help Center</Link>
        </div>

        {/* Dynamic Section Contents */}
        
        {/* Orders Section */}
        {activeSection === 'orders' && (
          <div id="section-orders" className="fk-section" style={{ display: 'block' }}>
            <h3 className="fk-section-title"><i className="fas fa-box"></i> My Orders</h3>
            <div id="ordersList">
              {orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📦</div>
                  <p style={{ color: '#888', marginBottom: '16px' }}>No orders yet</p>
                  <Link href="/products" style={{ color: '#2d6a4f', fontWeight: 600 }}>Start Shopping →</Link>
                </div>
              ) : (
                orders.map((o, idx) => {
                  const isCancelled = o.status === 'cancelled';
                  const isDelivered = o.status === 'delivered';
                  const canCancel = !isCancelled && !isDelivered;
                  const dateStr = o.createdAt?.seconds 
                    ? new Date(o.createdAt.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    : new Date(o.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                  
                  return (
                    <div className="fk-order-card" style={isCancelled ? { opacity: 0.6 } : {}} key={o.orderId || o.id || idx}>
                      <div className="fk-order-head" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span className="fk-order-num">#{o.orderId || o.id}</span>
                        <span className={`fk-order-status ${isCancelled ? 'cancelled' : isDelivered ? 'delivered' : 'placed'}`}>
                          {o.status ? o.status.toUpperCase() : 'PLACED'}
                        </span>
                      </div>
                      <div className="fk-order-items" style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '10px' }}>
                        {o.items?.map(i => `${i.name} × ${i.quantity}`).join(', ')}
                      </div>
                      <div className="fk-order-total" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span>₹{o.total} · {dateStr}</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Link href={`/order-tracking?orderId=${o.orderId || o.id}&uid=${user?.uid}`} style={{ textDecoration: 'none', background: 'var(--primary)', color: '#fff', padding: '6px 14px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>Track</Link>
                          {canCancel && (
                            <button onClick={() => openCancelModal(o.orderId || o.id)} style={{ border: '1px solid #e53935', background: 'none', color: '#e53935', padding: '6px 14px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                          )}
                        </div>
                      </div>
                      {isCancelled && o.cancelReason && (
                        <div style={{ fontSize: '0.72rem', color: '#e53935', marginTop: '6px' }}>Reason: {o.cancelReason}</div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Wishlist Section */}
        {activeSection === 'wishlist' && (
          <div id="section-wishlist" className="fk-section" style={{ display: 'block' }}>
            <h3 className="fk-section-title"><i className="fas fa-heart" style={{ color: '#e53935' }}></i> My Wishlist</h3>
            {wishlistProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>❤️</div>
                <p style={{ color: '#888' }}>Your wishlist is empty</p>
                <Link href="/products" style={{ color: '#2d6a4f', fontWeight: 600 }}>Explore Products</Link>
              </div>
            ) : (
              <div className="product-grid" id="wishlistGrid">
                {wishlistProducts.map(p => {
                  const price = p.discountPrice || p.price;
                  return (
                    <div key={p.slug} className="product-card">
                      <button className="wishlist-btn active" onClick={() => toggleWishlist(p._id || p.slug)}>
                        <i className="fas fa-heart"></i>
                      </button>
                      <Link href={`/product/${p.slug}`} className="product-image">
                        {p.images && p.images[0] ? <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div className="placeholder-icon">🌿</div>}
                      </Link>
                      <div className="product-info">
                        <div className="product-category">{p.category}</div>
                        <h3 className="product-name"><Link href={`/product/${p.slug}`}>{p.name}</Link></h3>
                        <div className="product-price"><span className="price-current">₹{price}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Coupons Section */}
        {activeSection === 'coupons' && (
          <div id="section-coupons" className="fk-section" style={{ display: 'block' }}>
            <h3 className="fk-section-title"><i className="fas fa-ticket-alt" style={{ color: '#ff9800' }}></i> My Coupons</h3>
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎫</div>
              <p style={{ color: '#888', marginBottom: '16px' }}>Use code <strong style={{ color: '#2d6a4f' }}>CURFEE499</strong> for free delivery on orders above ₹499</p>
              <div style={{ background: 'linear-gradient(135deg,#e8f5e9,#c8e6c9)', padding: '16px', borderRadius: '10px', border: '2px dashed #2d6a4f', marginBottom: '12px' }}>
                <strong style={{ fontSize: '1.1rem', color: '#2d6a4f' }}>CURFEE499</strong><br />
                <span style={{ fontSize: '0.8rem', color: '#666' }}>Free delivery on ₹499+ orders</span>
              </div>
              <div style={{ background: 'linear-gradient(135deg,#fff3e0,#ffe0b2)', padding: '16px', borderRadius: '10px', border: '2px dashed #ff9800' }}>
                <strong style={{ fontSize: '1.1rem', color: '#e65100' }}>ORGANIC20</strong><br />
                <span style={{ fontSize: '0.8rem', color: '#666' }}>20% off on first order</span>
              </div>
            </div>
          </div>
        )}

        {/* Profile Settings Section */}
        {activeSection === 'profile' && (
          <div id="section-profile" className="fk-section" style={{ display: 'block' }}>
            <h3 className="fk-section-title"><i className="fas fa-user-cog"></i> Profile Settings</h3>
            <form id="profileForm" onSubmit={handleProfileSubmit} style={{ maxWidth: '500px' }}>
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', fontFamily: 'inherit' }} 
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', fontFamily: 'inherit' }} 
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input 
                  type="tel" 
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', fontFamily: 'inherit' }} 
                />
              </div>
              <button type="submit" style={{ width: '100%', padding: '12px', background: '#2d6a4f', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Save Changes</button>
            </form>
          </div>
        )}

        {/* Refer & Earn Section */}
        {activeSection === 'refer' && (
          <div id="section-refer" className="fk-section" style={{ display: 'block' }}>
            <h3 className="fk-section-title"><i className="fas fa-gift" style={{ color: '#ff9800' }}></i> Refer & Earn</h3>
            <div style={{ textAlign: 'center', padding: '24px 16px' }}>
              <div style={{ fontSize: '4rem', marginBottom: '12px' }}>🎁</div>
              <h2 style={{ margin: '0 0 8px', fontSize: '1.4rem', color: '#2d6a4f' }}>Earn ₹100 for every friend!</h2>
              <p style={{ color: '#666', fontSize: '0.88rem', margin: '0 0 20px', lineHeight: 1.5 }}>Share your referral code with friends. When they place their first order, you both get ₹100 in GreenCoins!</p>
              <div style={{ background: 'linear-gradient(135deg,#e8f5e9,#c8e6c9)', padding: '20px', borderRadius: '14px', border: '2px dashed #2d6a4f', marginBottom: '20px' }}>
                <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Your Referral Code</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2d6a4f', letterSpacing: '2px' }} id="referCode">{getReferCode()}</div>
              </div>
              <button onClick={copyReferCode} style={{ width: '100%', padding: '14px', background: '#2d6a4f', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><i className="fas fa-copy"></i> Copy Referral Code</button>
              <button onClick={shareRefer} style={{ width: '100%', padding: '14px', background: '#25d366', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><i className="fab fa-whatsapp"></i> Share on WhatsApp</button>
            </div>
          </div>
        )}

        {/* Savings & Offers Quick Links */}
        <div className="fk-section" style={{ display: 'block', marginTop: '20px' }}>
          <h3 className="fk-section-title">💰 Savings & Offers</h3>
          <a onClick={() => setActiveSection('coupons')} className="fk-list-item" style={{ cursor: 'pointer' }}>
            <div className="fk-list-icon">🎫</div>
            <div className="fk-list-content">
              <strong>Curfee Coupons</strong>
              <span>Free delivery & discounts on organic products</span>
            </div>
            <i className="fas fa-chevron-right fk-list-arrow"></i>
          </a>
          <a onClick={() => setActiveSection('refer')} className="fk-list-item" style={{ cursor: 'pointer' }}>
            <div className="fk-list-icon">🏷️</div>
            <div className="fk-list-content">
              <strong>Refer & Earn ₹100</strong>
              <span>Invite friends, earn organic rewards</span>
            </div>
            <i className="fas fa-chevron-right fk-list-arrow"></i>
          </a>
        </div>

        {/* General Settings */}
        <div className="fk-settings-list">
          <a onClick={() => setActiveSection('profile')} className="fk-settings-item" style={{ cursor: 'pointer' }}><i className="fas fa-user-cog"></i><span>Edit Profile</span><i className="fas fa-chevron-right fk-arrow"></i></a>
          <a onClick={() => alert('Address management coming soon')} className="fk-settings-item" style={{ cursor: 'pointer' }}><i className="fas fa-map-marker-alt"></i><span>Saved Addresses</span><i className="fas fa-chevron-right fk-arrow"></i></a>
          <Link href="/support" className="fk-settings-item"><i className="fas fa-question-circle"></i><span>FAQ & Help</span><i className="fas fa-chevron-right fk-arrow"></i></Link>
        </div>

        {/* Logout */}
        <button onClick={handleLogout} className="fk-logout-btn" style={{ border: 'none', cursor: 'pointer', display: 'block', width: '92%', margin: '20px auto 0', textAlign: 'center', background: '#ffebee', color: '#e53935' }}><i className="fas fa-sign-out-alt"></i> Log Out</button>

        {/* Cancel Order Modal */}
        {cancelModalOpen && (
          <div id="cancelModal" style={{ display: 'flex', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 999, alignItems: 'center', justifyOrigin: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', width: '90%', maxWidth: '400px', padding: '24px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
              <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', color: '#212121' }}>Cancel Order</h3>
              <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: '#888' }}>Order ID: #{cancelOrderId}</p>
              <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '10px', color: '#333' }}>Why do you want to cancel?</p>
              <div id="cancelReasons" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {['Changed my mind', 'Found better price elsewhere', 'Ordered by mistake', 'Delivery taking too long', 'Other'].map(r => (
                  <label key={r} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="cancelReason" 
                      value={r} 
                      checked={cancelReason === r} 
                      onChange={(e) => setCancelReason(e.target.value)} 
                    /> {r}
                  </label>
                ))}
              </div>
              {cancelReason === 'Other' && (
                <textarea 
                  value={cancelOtherReason}
                  onChange={(e) => setCancelOtherReason(e.target.value)}
                  placeholder="Tell us more (optional)..." 
                  rows="2" 
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', fontFamily: 'inherit', fontSize: '0.88rem', resize: 'none', marginBottom: '16px' }}
                />
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button onClick={() => setCancelModalOpen(false)} style={{ padding: '10px 18px', border: 'none', background: '#f1f3f6', color: '#444', borderRadius: '8px', fontWeight: '600', fontSize: '0.88rem', cursor: 'pointer' }}>Keep Order</button>
                <button onClick={handleConfirmCancel} style={{ padding: '10px 18px', border: 'none', background: '#e53935', color: '#fff', borderRadius: '8px', fontWeight: '600', fontSize: '0.88rem', cursor: 'pointer' }}>Cancel Order</button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Toast />
      <div style={{ height: '80px' }}></div>
    </>
  );
}
