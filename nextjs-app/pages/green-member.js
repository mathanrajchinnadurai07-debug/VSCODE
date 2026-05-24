import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function GreenMember() {
  const router = useRouter();
  const [userName, setUserName] = useState('User');
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    try {
      const localUserStr = localStorage.getItem('curfee_user');
      if (localUserStr) {
        const u = JSON.parse(localUserStr);
        setUserName(u.name || 'User');
      }
      
      const localOrdersStr = localStorage.getItem('curfee_orders');
      if (localOrdersStr) {
        const o = JSON.parse(localOrdersStr);
        setOrderCount(o.length);
      }
    } catch (e) {}
  }, []);

  const progressPercentage = Math.min(100, Math.round((orderCount / 20) * 100));

  const goBack = () => {
    router.back();
  };

  return (
    <>
      <Head>
        <title>Green Member — Curfee Organic Market</title>
      </Head>

      <div>
        {/* Header */}
        <div className="gm-header" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px', background: '#fff', borderBottom: '1px solid #eee' }}>
          <button onClick={goBack} style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#333', cursor: 'pointer' }}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <h1 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Green Member</h1>
        </div>

        {/* Greeting */}
        <div className="gm-greeting" style={{ padding: '24px 20px 16px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 300, margin: 0 }}>Hello, <strong style={{ fontWeight: 700 }}>{userName}</strong></h2>
        </div>

        {/* Progress Card */}
        <div className="gm-progress-card" style={{ background: '#fff', borderRadius: '16px', margin: '0 16px 20px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="gm-progress-text" style={{ fontSize: '0.88rem', color: '#555', marginBottom: '18px' }}>
            {orderCount < 10 ? (
              <><strong>Green Leaf</strong> benefits are <strong style={{ color: '#2d6a4f' }}>{10 - orderCount} orders</strong> away</>
            ) : orderCount < 20 ? (
              <><strong>Green Tree</strong> benefits are <strong style={{ color: '#c9a227' }}>{20 - orderCount} orders</strong> away</>
            ) : (
              <>🌳 You are a <strong style={{ color: '#9e7c0c' }}>Green Tree</strong> member! Enjoy all benefits.</>
            )}
          </div>
          <div className="gm-progress-bar" style={{ position: 'relative', height: '6px', background: '#e8e8e8', borderRadius: '3px', marginBottom: '10px' }}>
            <div className="gm-progress-fill" style={{ width: `${progressPercentage}%`, height: '100%', background: 'linear-gradient(90deg,#2d6a4f,#52b788)', borderRadius: '3px', transition: 'width 0.8s ease' }}></div>
            <div className="gm-progress-dot" style={{ left: `${progressPercentage}%`, width: '16px', height: '16px', background: '#52b788', position: 'absolute', top: '50%', borderRadius: '50%', border: '3px solid #fff', transform: 'translate(-50%,-50%)', boxShadow: '0 0 6px rgba(0,0,0,0.15)' }}></div>
            <div className="gm-progress-dot" style={{ left: '50%', width: '12px', height: '12px', background: '#ccc', position: 'absolute', top: '50%', borderRadius: '50%', border: '3px solid #fff', transform: 'translate(-50%,-50%)', boxShadow: '0 0 6px rgba(0,0,0,0.15)' }}></div>
            <div className="gm-progress-dot" style={{ left: '100%', width: '12px', height: '12px', background: 'linear-gradient(135deg,#c9a227,#e6c84d)', position: 'absolute', top: '50%', borderRadius: '50%', border: '3px solid #fff', transform: 'translate(-50%,-50%)', boxShadow: '0 0 6px rgba(0,0,0,0.15)' }}></div>
          </div>
          <div className="gm-progress-labels" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#999' }}>
            <div>You completed<br /><strong style={{ display: 'block', color: '#1a1a1a' }}>{orderCount} order{orderCount !== 1 ? 's' : ''}</strong></div>
            <div className="leaf" style={{ color: '#2d6a4f', fontWeight: 700 }}>Green Leaf<br /><span style={{ fontWeight: 400, color: '#999' }}>10 orders</span></div>
            <div className="tree" style={{ color: '#c9a227', fontWeight: 700, textAlign: 'right' }}>Green Tree<br /><span style={{ fontWeight: 400, color: '#999' }}>20 orders</span></div>
          </div>
        </div>

        {/* 🌱 Green Seed (Current Tier) */}
        <div className="gm-tier current" style={{ padding: '20px 16px 8px' }}>
          <div className="gm-tier-head" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}><span className="emoji" style={{ fontSize: '1.4rem' }}>🌱</span><h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 400 }}><strong>Green Seed</strong> Benefits</h3></div>
          <p className="gm-tier-sub" style={{ fontSize: '0.78rem', color: '#2d6a4f', fontWeight: 600, margin: '0 0 14px 40px' }}>✓ Your current tier</p>
          <div className="gm-benefits" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="gm-card" style={{ background: 'linear-gradient(135deg,#e8f5e9,#c8e6c9)', borderRadius: '16px', padding: '18px', position: 'relative', overflow: 'hidden' }}>
              <div className="big" style={{ color: '#2d6a4f', fontSize: '2.2rem', fontWeight: 900, lineHeight: 1 }}>5%</div>
              <div className="label" style={{ color: '#2d6a4f', fontSize: '0.88rem', fontWeight: 700, marginTop: '2px', lineHeight: 1.3 }}>Instant<br />discount</div>
              <div className="desc" style={{ fontSize: '0.72rem', color: '#555', marginTop: '6px', lineHeight: 1.4 }}>on all organic<br />products</div>
              <div className="arrow" style={{ marginTop: '10px', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2d6a4f' }}><i className="fas fa-arrow-right" style={{ color: '#fff', fontSize: '0.75rem' }}></i></div>
            </div>
            <div className="gm-card" style={{ background: 'linear-gradient(135deg,#f1f8e9,#dcedc8)', borderRadius: '16px', padding: '18px', position: 'relative', overflow: 'hidden' }}>
              <div className="label" style={{ color: '#33691e', fontSize: '1rem', fontWeight: 700, marginTop: '2px', lineHeight: 1.3 }}>Free<br />Delivery</div>
              <div className="desc" style={{ fontSize: '0.72rem', color: '#555', marginTop: '6px', lineHeight: 1.4 }}>On orders<br />above ₹299</div>
              <div className="arrow" style={{ marginTop: '10px', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#558b2f' }}><i className="fas fa-arrow-right" style={{ color: '#fff', fontSize: '0.75rem' }}></i></div>
            </div>
            <div className="gm-card" style={{ background: 'linear-gradient(135deg,#fff8e1,#ffecb3)', borderRadius: '16px', padding: '18px', position: 'relative', overflow: 'hidden' }}>
              <div className="big" style={{ color: '#f57f17', fontSize: '2.2rem', fontWeight: 900, lineHeight: 1 }}>1%</div>
              <div className="label" style={{ color: '#f57f17', fontSize: '0.88rem', fontWeight: 700, marginTop: '2px', lineHeight: 1.3 }}>GreenCoins<br />cashback</div>
              <div className="desc" style={{ fontSize: '0.72rem', color: '#555', marginTop: '6px', lineHeight: 1.4 }}>up to <span style={{ color: '#f57f17', fontWeight: 700 }}>🪙25</span></div>
              <div className="arrow" style={{ marginTop: '10px', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f57f17' }}><i className="fas fa-arrow-right" style={{ color: '#fff', fontSize: '0.75rem' }}></i></div>
            </div>
            <div className="gm-card" style={{ background: 'linear-gradient(135deg,#fce4ec,#f8bbd0)', borderRadius: '16px', padding: '18px', position: 'relative', overflow: 'hidden' }}>
              <div className="bolt-icon" style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', background: 'linear-gradient(135deg,#e53935,#ef5350)' }}><i className="fas fa-bolt" style={{ color: '#fff', fontSize: '1rem' }}></i></div>
              <div className="label" style={{ color: '#c62828', fontSize: '0.88rem', fontWeight: 700, marginTop: '2px', lineHeight: 1.3 }}>Priority<br />Support</div>
              <div className="desc" style={{ fontSize: '0.72rem', color: '#555', marginTop: '6px', lineHeight: 1.4 }}>24/7 chat help</div>
              <div className="arrow" style={{ marginTop: '10px', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#c62828' }}><i className="fas fa-arrow-right" style={{ color: '#fff', fontSize: '0.75rem' }}></i></div>
            </div>
          </div>
        </div>

        {/* 🌿 Green Leaf */}
        <div className="gm-tier" style={{ padding: '20px 16px 8px' }}>
          <div className="gm-tier-head" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}><span className="emoji" style={{ fontSize: '1.4rem' }}>🌿</span><h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 400 }}><strong>Green Leaf</strong> Benefits</h3></div>
          <p className="gm-tier-sub" style={{ fontSize: '0.78rem', color: '#999', margin: '0 0 14px 40px' }}>with 10 orders in 12 months</p>
          <div className="gm-benefits" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="gm-card" style={{ background: 'linear-gradient(135deg,#e0f2f1,#b2dfdb)', borderRadius: '16px', padding: '18px', position: 'relative', overflow: 'hidden' }}>
              <div className="big" style={{ color: '#00695c', fontSize: '2.2rem', fontWeight: 900, lineHeight: 1 }}>12%</div>
              <div className="label" style={{ color: '#00695c', fontSize: '0.88rem', fontWeight: 700, marginTop: '2px', lineHeight: 1.3 }}>Instant<br />discount</div>
              <div className="desc" style={{ fontSize: '0.72rem', color: '#555', marginTop: '6px', lineHeight: 1.4 }}>during sale<br />early access</div>
              <div className="arrow" style={{ marginTop: '10px', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#00695c' }}><i className="fas fa-arrow-right" style={{ color: '#fff', fontSize: '0.75rem' }}></i></div>
            </div>
            <div className="gm-card" style={{ background: 'linear-gradient(135deg,#fce4ec,#f8bbd0)', borderRadius: '16px', padding: '18px', position: 'relative', overflow: 'hidden' }}>
              <div className="label" style={{ color: '#c62828', fontSize: '1rem', fontWeight: 700, marginTop: '2px', lineHeight: '1.2' }}>24 Hrs<br />Early<br />Access</div>
              <div className="desc" style={{ fontSize: '0.72rem', color: '#555', marginTop: '6px', lineHeight: 1.4 }}>During sale</div>
              <div className="arrow" style={{ marginTop: '10px', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#c62828' }}><i className="fas fa-arrow-right" style={{ color: '#fff', fontSize: '0.75rem' }}></i></div>
            </div>
          </div>
        </div>

        {/* 🌳 Green Tree */}
        <div className="gm-tier" style={{ margin: '0 16px 16px', background: 'linear-gradient(180deg,rgba(201,162,39,0.06),rgba(201,162,39,0.02))', borderRadius: '18px', padding: '20px 16px 16px' }}>
          <div className="gm-tier-head" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}><span className="emoji" style={{ fontSize: '1.4rem' }}>🌳</span><h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 400 }}><strong style={{ color: '#9e7c0c' }}>Green Tree</strong> Benefits</h3></div>
          <p className="gm-tier-sub" style={{ fontSize: '0.78rem', color: '#999', margin: '0 0 14px 40px' }}>with 20 orders in 12 months</p>
          <div className="gm-benefits" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="gm-card" style={{ background: 'linear-gradient(135deg,#fff8e1,#ffe082)', borderRadius: '16px', padding: '18px', position: 'relative', overflow: 'hidden' }}>
              <div className="big" style={{ color: '#9e7c0c', fontSize: '2.2rem', fontWeight: 900, lineHeight: 1 }}>15%</div>
              <div className="label" style={{ color: '#9e7c0c', fontSize: '0.88rem', fontWeight: 700, marginTop: '2px', lineHeight: 1.3 }}>Instant<br />discount</div>
              <div className="desc" style={{ fontSize: '0.72rem', color: '#555', marginTop: '6px', lineHeight: 1.4 }}>during sale<br />early access</div>
              <div className="arrow" style={{ marginTop: '10px', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#9e7c0c' }}><i className="fas fa-arrow-right" style={{ color: '#fff', fontSize: '0.75rem' }}></i></div>
            </div>
            <div className="gm-card" style={{ background: 'linear-gradient(135deg,#e8eaf6,#c5cae9)', borderRadius: '16px', padding: '18px', position: 'relative', overflow: 'hidden' }}>
              <div className="bolt-icon" style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', background: 'linear-gradient(135deg,#3949ab,#5c6bc0)' }}><i className="fas fa-bolt" style={{ color: '#fff', fontSize: '1rem' }}></i></div>
              <div className="label" style={{ color: '#283593', fontSize: '0.88rem', fontWeight: 700, marginTop: '2px', lineHeight: '1.3' }}>Extra 5%<br />off with<br />GreenCoins*</div>
              <div className="desc" style={{ fontSize: '0.72rem', color: '#555', marginTop: '6px', lineHeight: 1.4 }}>up to 🪙100<br /><span style={{ fontSize: '0.65rem', color: '#aaa' }}>*T&Cs Apply</span></div>
            </div>
          </div>
        </div>

        <div className="gm-footer-space" style={{ height: '80px' }}></div>
      </div>
    </>
  );
}
