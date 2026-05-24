import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const { cartItems, removeFromCart, updateQuantity, isLoaded } = useCart();
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const icons = { 
    success: 'fa-check-circle', 
    error: 'fa-exclamation-circle', 
    info: 'fa-info-circle', 
    warning: 'fa-exclamation-triangle' 
  };

  // Ensure hydration match for localStorage dependent state
  if (!isLoaded) return null;

  const isEmpty = cartItems.length === 0;

  const subtotal = cartItems.reduce((acc, item) => {
    const price = item.discountPrice || item.price || 0;
    return acc + (price * item.quantity);
  }, 0);
  
  const delivery = subtotal >= 499 || subtotal === 0 ? 0 : 49;
  const total = subtotal + delivery;

  const handleImageError = (e) => {
    e.target.style.display = 'none';
    if (e.target.nextSibling) {
      e.target.nextSibling.style.display = 'block';
    }
  };

  return (
    <>
      <Head>
        <title>Shopping Cart — Curfee Organic Market</title>
      </Head>

      <div className="container section">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '24px' }}>
          <i className="fas fa-shopping-cart"></i> Shopping Cart
        </h1>

        <div id="cartContent" className="cart-layout" style={{ display: isEmpty ? 'none' : 'grid' }}>
          <div id="cartItems">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {cartItems.map((item) => {
                const imgSrc = item.imageUrl || item.image || item.images?.[0] || '';
                const itemPrice = item.discountPrice || item.price || 0;
                const itemOriginalPrice = item.originalPrice || item.price || 0;
                const id = item._id || item.id || item.slug;

                return (
                  <div 
                    key={id}
                    style={{
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: '16px', 
                      padding: '16px', 
                      border: '1px solid var(--border)', 
                      borderRadius: 'var(--radius-sm)', 
                      background: '#fff', 
                      position: 'relative'
                    }}
                  >
                    <button 
                      className="btn-icon" 
                      style={{ position: 'absolute', top: '10px', right: '10px', color: 'var(--danger)' }} 
                      onClick={() => {
                        removeFromCart(id);
                        showToast('Item removed', 'info');
                      }}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                    
                    <div 
                      style={{
                        width: '70px', 
                        height: '70px', 
                        minWidth: '70px', 
                        background: 'var(--bg)', 
                        borderRadius: '8px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontSize: '2rem'
                      }}
                    >
                      {imgSrc ? (
                        <>
                          <img 
                            src={imgSrc} 
                            alt={item.name}
                            style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover' }} 
                            onError={handleImageError}
                          />
                          <span style={{ display: 'none' }}>🌿</span>
                        </>
                      ) : (
                        <span>🌿</span>
                      )}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '4px', paddingRight: '24px' }}>
                        {item.name}
                      </div>
                      <div style={{ color: 'var(--text-light)', fontSize: '0.8rem', marginBottom: '8px' }}>
                        {item.unit || item.weight || ''}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>
                          ₹{itemPrice}
                          {itemOriginalPrice > itemPrice && (
                            <>
                              {' '}
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 400 }}>
                                <s>₹{itemOriginalPrice}</s>
                              </span>
                            </>
                          )}
                        </div>
                        <div className="quantity-control">
                          <button onClick={() => {
                            if (item.quantity - 1 <= 0) {
                              removeFromCart(id);
                              showToast('Item removed', 'info');
                            } else {
                              updateQuantity(id, item.quantity - 1);
                            }
                          }}>−</button>
                          <input 
                            type="number" 
                            value={item.quantity} 
                            min="1" 
                            readOnly 
                            style={{ width: '36px', textAlign: 'center' }} 
                          />
                          <button onClick={() => updateQuantity(id, item.quantity + 1)}>+</button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="cart-summary" id="cartSummary">
            <h3>Order Summary</h3>
            <div className="summary-row">
              <span>Subtotal</span>
              <span id="subtotal">₹{subtotal}</span>
            </div>
            <div className="summary-row">
              <span>Delivery</span>
              <span id="delivery">{delivery === 0 ? 'FREE' : `₹${delivery}`}</span>
            </div>
            <div className="summary-row">
              <span>Discount</span>
              <span id="discount" style={{ color: 'var(--success)' }}>-₹0</span>
            </div>
            <div className="summary-row summary-total">
              <span>Total</span>
              <span id="total">₹{total}</span>
            </div>
            
            <div style={{ marginTop: '16px' }}>
              <input 
                type="text" 
                placeholder="Coupon code" 
                style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginBottom: '8px' }} 
              />
              <button 
                className="btn btn-outline btn-sm btn-block" 
                onClick={() => showToast('Coupon feature coming soon!', 'info')}
              >
                Apply Coupon
              </button>
            </div>
            
            <Link href="/checkout" className="btn btn-primary btn-lg btn-block" style={{ marginTop: '16px' }} id="checkoutBtn">
              Proceed to Checkout <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
        </div>

        <div id="emptyCart" style={{ display: isEmpty ? 'flex' : 'none', textAlign: 'center', padding: '30px 16px', minHeight: '60vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '160px', height: '160px', background: '#E8F4EC', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <i className="fas fa-shopping-basket" style={{ fontSize: '4.5rem', color: '#52B788' }}></i>
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '12px', fontWeight: 700, color: 'var(--text)' }}>Your cart is empty!</h2>
          <p style={{ color: 'var(--text-light)', maxWidth: '280px', margin: '0 auto 28px', fontSize: '0.95rem', lineHeight: '1.5' }}>
            Looks like you haven't added anything yet.<br />Explore fresh organic produce!
          </p>
          <Link href="/categories" className="btn" style={{ padding: '14px 36px', borderRadius: '10px', fontWeight: 700, fontSize: '1rem', background: 'var(--accent)', color: '#fff', border: 'none', boxShadow: '0 4px 16px rgba(231,111,81,0.25)' }}>
            Browse Products
          </Link>
        </div>
      </div>

      {toast && (
        <div className="toast-container" id="toastContainer">
          <div className={`toast ${toast.type}`} style={{ opacity: 1, transform: 'none', transition: 'all 0.3s' }}>
            <i className={`fas ${icons[toast.type] || icons.info}`}></i> {toast.message}
          </div>
        </div>
      )}
    </>
  );
}
