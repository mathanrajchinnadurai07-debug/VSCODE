import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    // Focus search input on mount
    if (inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 300);
    }
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const goBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <>
      <Head>
        <title>Search — Curfee Organic Market</title>
      </Head>

      <div className="search-mode">
        {/* Search Header perfectly matched to screenshot */}
        <header className="search-view-header">
          <button className="search-back-btn" onClick={goBack} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <form onSubmit={handleSearchSubmit} className="search-input-wrap" style={{ display: 'flex', width: '100%' }}>
            <i className="fas fa-search"></i>
            <input 
              ref={inputRef}
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..." 
              autoComplete="off" 
              onKeyPress={handleKeyPress}
            />
          </form>
        </header>

        {/* Recent Searches */}
        <section className="search-section">
          <h2 className="search-section-title">Recent Searches</h2>
          <div className="recent-searches">
            <Link href="/products?search=tomatoes" className="recent-item">
              <div className="recent-img-wrap">
                <span style={{ fontSize: '2rem' }}>🍅</span>
              </div>
              <span className="recent-label">organic<br />tomatoes</span>
            </Link>
            <Link href="/products?search=tea" className="recent-item">
              <div className="recent-img-wrap">
                <span style={{ fontSize: '2rem' }}>🍵</span>
              </div>
              <span className="recent-label">green<br />tea</span>
            </Link>
            <Link href="/products?search=soap" className="recent-item">
              <div className="recent-icon-wrap"><i className="fas fa-history"></i></div>
              <span className="recent-label">herbal<br />soap</span>
            </Link>
            <Link href="/products?search=almond" className="recent-item">
              <div className="recent-img-wrap">
                <span style={{ fontSize: '2rem' }}>🌰</span>
              </div>
              <span className="recent-label">premium<br />almond</span>
            </Link>
            <Link href="/products?search=seeds" className="recent-item">
              <div className="recent-img-wrap">
                <span style={{ fontSize: '2rem' }}>🌱</span>
              </div>
              <span className="recent-label">chia<br />seeds</span>
            </Link>
          </div>
        </section>

        {/* Trending Searches Grid */}
        <section className="search-section">
          <h2 className="search-section-title">Trending Searches</h2>
          <div className="trending-grid">
            <Link href="/products?search=chicken" className="trending-item">
              <div className="trending-img" style={{ background: '#fce7f3' }}><span style={{ fontSize: '1.5rem' }}>🍗</span></div>
              <div className="trending-text">Country chicken cuts</div>
            </Link>
            <Link href="/products?search=honey" className="trending-item">
              <div className="trending-img" style={{ background: '#fdedd3' }}><span style={{ fontSize: '1.5rem' }}>🍯</span></div>
              <div className="trending-text">Raw forest honey</div>
            </Link>
            <Link href="/products?search=cashews" className="trending-item">
              <div className="trending-img" style={{ background: '#e0f2fe' }}><span style={{ fontSize: '1.5rem' }}>🥜</span></div>
              <div className="trending-text">Whole cashews</div>
            </Link>
            <Link href="/products?search=mango" className="trending-item">
              <div className="trending-img" style={{ background: '#fef08a' }}><span style={{ fontSize: '1.5rem' }}>🥭</span></div>
              <div className="trending-text">Fresh alphonso mango</div>
            </Link>
            <Link href="/products?search=mushroom" className="trending-item">
              <div className="trending-img" style={{ background: '#f3f4f6' }}><span style={{ fontSize: '1.5rem' }}>🍄</span></div>
              <div className="trending-text">Oyster mushrooms</div>
            </Link>
          </div>
        </section>
      </div>
      <div style={{ height: '70px' }}></div>
    </>
  );
}
