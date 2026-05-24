import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ALL_PRODUCTS } from '../data/products';
import { useCart } from '../context/CartContext';

export default function CategoriesPage() {
  const router = useRouter();
  const { getCartCount } = useCart();
  const [selectedCat, setSelectedCat] = useState('foryou');

  const cartCount = getCartCount();

  const catMeta = {
    foryou:     { title: 'For You',              sub: 'Curated picks based on popular organic products' },
    vegetables: { title: 'Fresh Vegetables',     sub: 'Pesticide-free, farm-fresh organic vegetables' },
    fruits:     { title: 'Fresh Fruits',          sub: 'Naturally grown, seasonal organic fruits' },
    biscuits:   { title: 'Biscuits & Cookies',   sub: 'Millet, ragi, jaggery — zero refined sugar' },
    snacks:     { title: 'Snacks & Chips',       sub: 'Banana chips, quinoa puffs, makhana & more' },
    mushroom:   { title: 'Mushroom Products',    sub: 'Dried, powder, soup mix, coffee blend' },
    chicken:    { title: 'Organic Chicken',       sub: 'Antibiotic-free, vacuum sealed & fresh' },
    mutton:     { title: 'Organic Mutton',        sub: 'Premium goat meat — curry cut, mince, kebab' },
    grocery:    { title: 'Grocery Essentials',    sub: 'Honey, oils, dal, rice, spices & more' },
    dryfruits:  { title: 'Dry Fruits & Nuts',     sub: 'Almonds, cashews, walnuts, pistachios, seeds' },
    herbal:     { title: 'Herbal & Personal Care',sub: 'Soaps, oils, shampoo, lip balm, face care' },
    flour:      { title: 'Flour & Grains',        sub: 'Wheat, ragi, bajra, jowar, quinoa, oats' },
    beverages:  { title: 'Tea & Coffee',          sub: 'Green tea, masala chai, filter coffee' },
    spreads:    { title: 'Honey & Spreads',       sub: 'Raw honey, peanut butter, almond butter' },
    pickles:    { title: 'Pickles & Chutneys',    sub: 'Mango, lemon, garlic pickle, chutney' },
    superfoods: { title: 'Superfoods',            sub: 'Chia seeds, moringa, spirulina, ashwagandha' },
    readytocook:{ title: 'Ready to Cook',         sub: 'Dosa, idli, upma, khichdi, pancake mixes' }
  };

  const getEmoji = (cat) => {
    const map = {
      vegetables: '🥬', fruits: '🍎', biscuits: '🍪', snacks: '🥜', mushroom: '🍄',
      chicken: '🍗', mutton: '🍖', grocery: '🏪', dryfruits: '🥣', herbal: '🌿',
      flour: '🌾', beverages: '☕', spreads: '🍯', pickles: '🥒', superfoods: '🧬',
      readytocook: '🍲'
    };
    return map[cat] || '🌿';
  };

  // Pre-calculate products for selected category
  const featuredProducts = useMemo(() => {
    return ALL_PRODUCTS.filter(p => p.isFeatured || p.rating >= 4.6).slice(0, 9);
  }, []);

  const popularProducts = useMemo(() => {
    return [...ALL_PRODUCTS].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 6);
  }, []);

  const activeCategoryProducts = useMemo(() => {
    if (selectedCat === 'foryou') return [];
    return ALL_PRODUCTS.filter(p => p.category === selectedCat).slice(0, 12);
  }, [selectedCat]);

  return (
    <>
      <Head>
        <title>Categories — Curfee Organic Market</title>
        <meta name="description" content="Browse 50+ organic products across 16 categories at Curfee Organic Market." />
      </Head>

      {/* Header */}
      <div className="cat-header">
        <h1 style={{ fontWeight: 700 }}>All Categories</h1>
        <div className="cat-header-actions" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link href="/products"><i className="fas fa-search" style={{ color: 'var(--text)' }}></i></Link>
          <Link href="/cart" style={{ position: 'relative' }}>
            <i className="fas fa-shopping-cart" style={{ color: 'var(--text)' }}></i>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>
        </div>
      </div>

      {/* Split Layout */}
      <div className="cat-split">
        {/* Left Sidebar */}
        <div className="cat-sidebar" id="catSidebar">
          <a className={`cat-sidebar-item ${selectedCat === 'foryou' ? 'active' : ''}`} onClick={() => setSelectedCat('foryou')}>
            <div className="icon-wrap">🏠</div>
            <span>For You</span>
          </a>
          {Object.keys(catMeta).filter(c => c !== 'foryou').map(c => (
            <a key={c} className={`cat-sidebar-item ${selectedCat === c ? 'active' : ''}`} onClick={() => setSelectedCat(c)}>
              <div className="icon-wrap">{getEmoji(c)}</div>
              <span>{catMeta[c].title.replace('Fresh ', '').replace(' & Cookies', '').replace(' & Chips', '').replace(' Products', '').replace(' Essentials', '').replace(' & Nuts', '').replace(' & Personal Care', '').replace(' & Grains', '').replace(' & Spreads', '').replace(' & Chutneys', '')}</span>
            </a>
          ))}
        </div>

        {/* Right Content */}
        <div className="cat-content" id="catContent">
          {selectedCat === 'foryou' ? (
            <>
              <div className="cat-content-header">
                <h2>For You</h2>
                <p>Curated picks based on popular organic products</p>
              </div>
              <div className="cat-banner">
                <h3>🌿 Organic Market</h3>
                <p>50+ products across 16 categories</p>
                <Link href="/products">Shop All →</Link>
              </div>
              <div className="cat-section-title">⭐ Featured Products</div>
              <div className="cat-products">
                {featuredProducts.map(p => (
                  <Link key={p.slug} href={`/product/${p.slug}`} className="cat-prod-card">
                    <div className="prod-img">
                      {p.images && p.images[0] ? <img src={p.images[0]} alt={p.name} /> : getEmoji(p.category)}
                    </div>
                    <div className="prod-name">{p.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#2d6a4f', fontWeight: 700, marginTop: '2px' }}>₹{p.discountPrice || p.price}</div>
                  </Link>
                ))}
              </div>
              <div className="cat-section-title">🔥 Popular This Week</div>
              <div className="cat-products">
                {popularProducts.map(p => (
                  <Link key={p.slug} href={`/product/${p.slug}`} className="cat-prod-card">
                    <div className="prod-img">
                      {p.images && p.images[0] ? <img src={p.images[0]} alt={p.name} /> : getEmoji(p.category)}
                    </div>
                    <div className="prod-name">{p.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#2d6a4f', fontWeight: 700, marginTop: '2px' }}>₹{p.discountPrice || p.price}</div>
                  </Link>
                ))}
              </div>
              <div className="cat-section-title">📦 Browse by Category</div>
              <div className="cat-products">
                {Object.keys(catMeta).filter(c => c !== 'foryou').map(c => (
                  <a key={c} onClick={() => setSelectedCat(c)} className="cat-prod-card" style={{ cursor: 'pointer' }}>
                    <div className="prod-img">{getEmoji(c)}</div>
                    <div className="prod-name">{catMeta[c].title}</div>
                  </a>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="cat-content-header">
                <h2>{catMeta[selectedCat].title}</h2>
                <p>{catMeta[selectedCat].sub}</p>
              </div>
              <Link href={`/products?category=${selectedCat}`} style={{ display: 'block', margin: '8px 16px', padding: '10px', background: '#f0faf5', borderRadius: '8px', textDecoration: 'none', color: '#2d6a4f', fontSize: '0.82rem', fontWeight: 600, textAlign: 'center' }}>
                View All {catMeta[selectedCat].title} →
              </Link>
              {activeCategoryProducts.length > 0 ? (
                <div className="cat-products">
                  {activeCategoryProducts.map(p => (
                    <Link key={p.slug} href={`/product/${p.slug}`} className="cat-prod-card">
                      <div className="prod-img">
                        {p.images && p.images[0] ? <img src={p.images[0]} alt={p.name} /> : getEmoji(p.category)}
                      </div>
                      <div className="prod-name">{p.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#2d6a4f', fontWeight: 700, marginTop: '2px' }}>₹{p.discountPrice || p.price}</div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p style={{ padding: '40px', textAlign: 'center', color: '#999' }}>No products found in this category yet.</p>
              )}
            </>
          )}
        </div>
      </div>
      <div style={{ height: '70px' }}></div>
    </>
  );
}
