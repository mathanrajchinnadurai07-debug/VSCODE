import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ALL_PRODUCTS } from '../data/products';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-slide effect
  useEffect(() => {
    const totalSlides = 6; // from html
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Set body class for mobile-home styles
  useEffect(() => {
    document.body.classList.add('mobile-home-body');
    return () => {
      document.body.classList.remove('mobile-home-body');
    };
  }, []);

  const getProducts = (filterFn) => ALL_PRODUCTS.filter(filterFn).slice(0, 8);
  const featured = getProducts(p => p.isFeatured);
  const deals = getProducts(p => p.discountPrice && p.discountPrice < p.price).slice(0, 8);
  
  const getCatProducts = (cat) => getProducts(p => p.category === cat);

  const sections = [
    { id: 'biscuits', title: '🍪 Biscuits & Cookies', sub: 'Ragi, millet, jaggery, oats, coconut cookies in kraft packaging', tint: 'rgba(181,101,29,0.06)' },
    { id: 'snacks', title: '🥜 Snacks & Chips', sub: 'Banana chips, millet chips, quinoa puffs, makhana, trail mix', tint: null },
    { id: 'mushroom', title: '🍄 Mushroom Products', sub: 'Dried mushrooms, powder, soup mix, chips, coffee blend', tint: 'rgba(109,76,65,0.06)' },
    { type: 'deals2' },
    { id: 'chicken', title: '🍗 Chicken Products', sub: 'Breast, mince, sausages, nuggets, tikka — antibiotic-free', tint: null },
    { id: 'mutton', title: '🍖 Mutton Products', sub: 'Curry cut, mince, seekh kebab, chops, biryani cut', tint: 'rgba(141,110,99,0.06)' },
    { type: 'promo' },
    { id: 'grocery', title: '🏪 Grocery Essentials', sub: 'Honey, oils, dal, rice, spices, salt & more', tint: null },
    { id: 'dryfruits', title: '🥣 Dry Fruits & Nuts', sub: 'Almonds, cashews, walnuts, pistachios, seeds, dates', tint: 'rgba(255,143,0,0.06)' },
    { id: 'herbal', title: '🌿 Herbal & Personal Care', sub: 'Soaps, oils, shampoo, lip balm, face pack, kajal', tint: null },
    { id: 'flour', title: '🌾 Flour & Grains', sub: 'Wheat, ragi, bajra, jowar, quinoa, oats', tint: 'rgba(139,195,74,0.06)' },
    { id: 'beverages', title: '☕ Beverages', sub: 'Green tea, masala chai, filter coffee, herbal teas', tint: null },
    { id: 'spreads', title: '🍯 Honey & Spreads', sub: 'Raw honey, peanut butter, almond butter, jams', tint: 'rgba(255,152,0,0.06)' },
    { id: 'pickles', title: '🥒 Pickles & Chutneys', sub: 'Mango, lemon, garlic pickle, coconut chutney powder', tint: null },
    { id: 'superfoods', title: '🧬 Superfoods', sub: 'Chia seeds, moringa, spirulina, ashwagandha, triphala', tint: 'rgba(76,175,80,0.06)' },
    { id: 'readytocook', title: '🍲 Ready to Cook', sub: 'Dosa, idli, upma, khichdi, pancake mixes', tint: null },
    { id: 'vegetables', title: '🥬 Fresh Vegetables', sub: 'Tomato, carrot, spinach, broccoli, onion, potato & more', tint: 'rgba(67,160,71,0.06)' },
    { id: 'fruits', title: '🍎 Fresh Fruits', sub: 'Banana, mango, apple, strawberry, pomegranate, grapes', tint: null }
  ];

  const handleNewsletter = (e) => {
    e.preventDefault();
    alert('Thank you for subscribing! 🌿');
    e.target.reset();
  };

  return (
    <>
      <Head>
        <title>Curfee Organic Market — 50+ Organic Products</title>
        <meta name="description" content="Curfee Organic Market — 50+ organic products: biscuits, snacks, mushroom, chicken, mutton, grocery, herbal, dry fruits, beverages & more." />
      </Head>

      {/* ===== CATEGORY TABS ===== */}
      <div className="m-category-tabs">
        <Link href="/products" className="m-cat-tab active"><div className="m-cat-tab-icon">🏠</div><span>For You</span></Link>
        <Link href="/products?category=biscuits" className="m-cat-tab"><div className="m-cat-tab-icon">🍪</div><span>Biscuits</span></Link>
        <Link href="/products?category=snacks" className="m-cat-tab"><div className="m-cat-tab-icon">🥜</div><span>Snacks</span></Link>
        <Link href="/products?category=mushroom" className="m-cat-tab"><div className="m-cat-tab-icon">🍄</div><span>Mushroom</span></Link>
        <Link href="/products?category=chicken" className="m-cat-tab"><div className="m-cat-tab-icon">🍗</div><span>Chicken</span></Link>
        <Link href="/products?category=mutton" className="m-cat-tab"><div className="m-cat-tab-icon">🍖</div><span>Mutton</span></Link>
        <Link href="/products?category=grocery" className="m-cat-tab"><div className="m-cat-tab-icon">🏪</div><span>Grocery</span></Link>
        <Link href="/products?category=dryfruits" className="m-cat-tab"><div className="m-cat-tab-icon">🥣</div><span>Dry Fruits</span></Link>
        <Link href="/products?category=flour" className="m-cat-tab"><div className="m-cat-tab-icon">🌾</div><span>Flour</span></Link>
        <Link href="/products?category=beverages" className="m-cat-tab"><div className="m-cat-tab-icon">☕</div><span>Beverages</span></Link>
        <Link href="/products?category=spreads" className="m-cat-tab"><div className="m-cat-tab-icon">🍯</div><span>Spreads</span></Link>
        <Link href="/products?category=pickles" className="m-cat-tab"><div className="m-cat-tab-icon">🥒</div><span>Pickles</span></Link>
        <Link href="/products?category=superfoods" className="m-cat-tab"><div className="m-cat-tab-icon">🧬</div><span>Superfoods</span></Link>
        <Link href="/products?category=readytocook" className="m-cat-tab"><div className="m-cat-tab-icon">🍲</div><span>Ready Cook</span></Link>
        <Link href="/products?category=vegetables" className="m-cat-tab"><div className="m-cat-tab-icon">🥬</div><span>Vegetables</span></Link>
        <Link href="/products?category=fruits" className="m-cat-tab"><div className="m-cat-tab-icon">🍎</div><span>Fruits</span></Link>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <main className="m-main-content">
        {/* Hero Slider */}
        <div className="m-hero-slider" id="mHeroSlider">
          <div className="m-hero-track" id="mHeroTrack" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
            <div className="m-hero-card" style={{ background: 'linear-gradient(135deg,#b5651d,#d4a574)' }}><div className="m-hero-text"><span className="m-hero-tag">🍪 ORGANIC BISCUITS</span><h2>Fresh Baked Cookies</h2><p>Millet, ragi, jaggery cookies — zero refined sugar</p><Link href="/products?category=biscuits" className="m-hero-cta">Shop Now →</Link></div><div className="m-hero-img">🍪</div></div>
            <div className="m-hero-card" style={{ background: 'linear-gradient(135deg,#6d4c41,#8d6e63)' }}><div className="m-hero-text"><span className="m-hero-tag">🍄 MUSHROOM POWER</span><h2>Mushroom Products</h2><p>Dried, powders, snacks & immunity blends</p><Link href="/products?category=mushroom" className="m-hero-cta">Explore →</Link></div><div className="m-hero-img">🍄</div></div>
            <div className="m-hero-card" style={{ background: 'linear-gradient(135deg,#c62828,#e53935)' }}><div className="m-hero-text"><span className="m-hero-tag">🍗 FARM FRESH</span><h2>Organic Chicken & Mutton</h2><p>Antibiotic-free, vacuum sealed & delivered fresh</p><Link href="/products?category=chicken" className="m-hero-cta">Order Now →</Link></div><div className="m-hero-img">🍗</div></div>
            <div className="m-hero-card" style={{ background: 'linear-gradient(135deg,#43a047,#66bb6a)' }}><div className="m-hero-text"><span className="m-hero-tag">🥬 FARM FRESH</span><h2>Organic Vegetables</h2><p>Tomato, carrot, spinach, broccoli — pesticide free</p><Link href="/products?category=vegetables" className="m-hero-cta">Shop Fresh →</Link></div><div className="m-hero-img">🥬</div></div>
            <div className="m-hero-card" style={{ background: 'linear-gradient(135deg,#ff6f00,#ffa726)' }}><div className="m-hero-text"><span className="m-hero-tag">🍎 SEASONAL FRUITS</span><h2>Organic Fruits</h2><p>Mango, apple, strawberry, banana — naturally grown</p><Link href="/products?category=fruits" className="m-hero-cta">Order Now →</Link></div><div className="m-hero-img">🍎</div></div>
            <div className="m-hero-card" style={{ background: 'linear-gradient(135deg,#1b4332,#2d6a4f)' }}><div className="m-hero-text"><span className="m-hero-tag">🔥 MEGA DEALS</span><h2>Up to 40% OFF</h2><p>On 50+ organic products — limited time!</p><Link href="/products?bestseller=true" className="m-hero-cta">Grab Now →</Link></div><div className="m-hero-img">🎉</div></div>
          </div>
          <div className="m-hero-dots">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <span key={i} className={`m-dot ${currentSlide === i ? 'active' : ''}`} onClick={() => setCurrentSlide(i)}></span>
            ))}
          </div>
        </div>

        {/* Sponsored */}
        <div className="m-sponsored-banner">
          <div className="m-sponsored-label">Sponsored <i className="fas fa-info-circle"></i></div>
          <div className="m-sponsored-content" style={{ background: 'linear-gradient(135deg,#fff8e1,#ffe0b2)' }}>
            <div className="m-sponsored-text"><strong>Organic Biscuits & Cookies — 15 Varieties</strong><span>Kraft paper packaging | Zero preservatives</span></div>
            <Link href="/products?category=biscuits" className="m-sponsored-btn">Shop Now</Link>
          </div>
        </div>

        {/* Results Header */}
        <div className="m-results-header">
          <span className="m-results-count">Showing 50+ organic products, with fast delivery</span>
          <p>See all products across 16 categories.</p>
        </div>

        {/* Featured */}
        <section className="m-section">
          <div className="m-section-header"><h2>⭐ Featured Products</h2><Link href="/products?featured=true" className="m-see-all">See All →</Link></div>
          <div className="m-product-scroll">
            {featured.map(p => <ProductCard key={p._id || p.slug} product={p} />)}
          </div>
        </section>

        {/* Today's Deals */}
        <section className="m-section m-section-tinted" style={{ '--tint-color': 'rgba(255,111,0,0.06)' }}>
          <div className="m-section-header"><h2>🔥 Today's Deals</h2><Link href="/products?bestseller=true" className="m-see-all">See All →</Link></div>
          <p className="m-section-sub">Top bestsellers with massive discounts</p>
          <div className="m-product-scroll">
            {deals.map(p => <ProductCard key={p._id || p.slug} product={p} />)}
          </div>
        </section>

        {/* Deal Cards */}
        <section className="m-deal-grid">
          <Link href="/products?category=biscuits" className="m-deal-card" style={{ background: 'linear-gradient(135deg,#fff3e0,#ffe0b2)' }}><h3>Biscuits & Cookies</h3><p className="m-deal-off">15 varieties</p><div className="m-deal-img">🍪🥜🧁</div><span className="m-deal-link">Shop now</span></Link>
          <Link href="/products?category=mushroom" className="m-deal-card" style={{ background: 'linear-gradient(135deg,#efebe9,#d7ccc8)' }}><h3>Mushroom Products</h3><p className="m-deal-off">Up to <strong>35% OFF</strong></p><div className="m-deal-img">🍄🧪🍵</div><span className="m-deal-link">Shop now</span></Link>
          <Link href="/products?category=chicken" className="m-deal-card" style={{ background: 'linear-gradient(135deg,#ffebee,#ffcdd2)' }}><h3>Organic Chicken</h3><p className="m-deal-off"><strong>Farm Fresh</strong></p><div className="m-deal-img">🍗🥩🌡️</div><span className="m-deal-link">Shop now</span></Link>
          <Link href="/products?category=dryfruits" className="m-deal-card" style={{ background: 'linear-gradient(135deg,#fff8e1,#ffecb3)' }}><h3>Dry Fruits & Nuts</h3><p className="m-deal-off">15 premium items</p><div className="m-deal-img">🥜🌰🍇</div><span className="m-deal-link">Shop now</span></Link>
        </section>

        {/* Dynamic Sections */}
        {sections.map((sec, idx) => {
          if (sec.type === 'deals2') {
            return (
              <section key={`deals2-${idx}`} className="m-deal-grid">
                <Link href="/products?category=mutton" className="m-deal-card" style={{ background: 'linear-gradient(135deg,#fbe9e7,#ffccbc)' }}><h3>Organic Mutton</h3><p className="m-deal-off"><strong>Premium Goat</strong></p><div className="m-deal-img">🍖🥩🔥</div><span className="m-deal-link">Shop now</span></Link>
                <Link href="/products?category=superfoods" className="m-deal-card" style={{ background: 'linear-gradient(135deg,#e8f5e9,#c8e6c9)' }}><h3>Superfoods</h3><p className="m-deal-off">Chia, moringa, spirulina</p><div className="m-deal-img">🧬🌱✨</div><span className="m-deal-link">Shop now</span></Link>
                <Link href="/products?category=beverages" className="m-deal-card" style={{ background: 'linear-gradient(135deg,#efebe9,#d7ccc8)' }}><h3>Tea & Coffee</h3><p className="m-deal-off">12 organic blends</p><div className="m-deal-img">☕🍵<span data-brand="logo-emoji">🌿</span></div><span className="m-deal-link">Shop now</span></Link>
                <Link href="/products?category=spreads" className="m-deal-card" style={{ background: 'linear-gradient(135deg,#fff3e0,#ffe0b2)' }}><h3>Honey & Spreads</h3><p className="m-deal-off">Raw honey, nut butters</p><div className="m-deal-img">🍯🥜🫙</div><span className="m-deal-link">Shop now</span></Link>
              </section>
            );
          }
          if (sec.type === 'promo') {
            return (
              <div key={`promo-${idx}`} className="m-promo-banner" style={{ background: 'linear-gradient(135deg,#1b4332,#2d6a4f)' }}>
                <div className="m-promo-text">
                  <span><span data-brand="logo-emoji">🌿</span> LIMITED TIME</span>
                  <h3>Free Delivery on ₹499+</h3>
                  <p>Use code: CURFEE499</p>
                </div>
                <Link href="/products" className="m-promo-cta">Shop Now</Link>
              </div>
            );
          }

          const products = getCatProducts(sec.id);
          if (!products.length) return null;

          return (
            <section key={sec.id} className={`m-section ${sec.tint ? 'm-section-tinted' : ''}`} style={sec.tint ? { '--tint-color': sec.tint } : {}}>
              <div className="m-section-header">
                <h2>{sec.title}</h2>
                <Link href={`/products?category=${sec.id}`} className="m-see-all">See All →</Link>
              </div>
              <p className="m-section-sub">{sec.sub}</p>
              <div className="m-product-scroll">
                {products.map(p => <ProductCard key={p._id || p.slug} product={p} />)}
              </div>
            </section>
          );
        })}

        {/* Brand Row */}
        <section className="m-brand-row">
          <div className="m-brand-card"><div className="m-brand-img">🥬</div><strong>Vegetables</strong><span>15 items</span></div>
          <div className="m-brand-card"><div className="m-brand-img">🍎</div><strong>Fruits</strong><span>12 items</span></div>
          <div className="m-brand-card"><div className="m-brand-img">🍪</div><strong>Biscuits</strong><span>15 items</span></div>
          <div className="m-brand-card"><div className="m-brand-img">🍄</div><strong>Mushroom</strong><span>12 items</span></div>
          <div className="m-brand-card"><div className="m-brand-img">🍗</div><strong>Chicken</strong><span>12 items</span></div>
          <div className="m-brand-card"><div className="m-brand-img">🥜</div><strong>Dry Fruits</strong><span>15 items</span></div>
          <div className="m-brand-card"><div className="m-brand-img">☕</div><strong>Beverages</strong><span>12 items</span></div>
          <div className="m-brand-card"><div className="m-brand-img">🧬</div><strong>Superfoods</strong><span>10 items</span></div>
        </section>

        {/* Reviews */}
        <section className="m-section">
          <div className="m-section-header"><h2>💬 Customer Reviews</h2></div>
          <div className="m-review-scroll">
            <div className="m-review-card"><div className="m-review-top"><div className="m-review-avatar" style={{ background: 'linear-gradient(135deg,#2d6a4f,#52b788)' }}>P</div><div><strong>Priya Sharma</strong><div className="m-review-stars">★★★★★</div></div></div><p>"The organic biscuits are amazing! Kids love the ragi cookies."</p></div>
            <div className="m-review-card"><div className="m-review-top"><div className="m-review-avatar" style={{ background: 'linear-gradient(135deg,#f77f00,#fcbf49)' }}>R</div><div><strong>Rahul Verma</strong><div className="m-review-stars">★★★★★</div></div></div><p>"Fresh organic chicken delivered perfectly — vacuum sealed!"</p></div>
            <div className="m-review-card"><div className="m-review-top"><div className="m-review-avatar" style={{ background: 'linear-gradient(135deg,#9b59b6,#c39bd3)' }}>A</div><div><strong>Anita Patel</strong><div className="m-review-stars">★★★★☆</div></div></div><p>"Mushroom products are top quality. The lion's mane powder works great!"</p></div>
          </div>
        </section>

        {/* Help */}
        <div className="m-help-section">
          <h3>Need help?</h3>
          <p>Visit the <Link href="/support">help section</Link> or <Link href="/support">contact us</Link></p>
        </div>

        {/* Newsletter */}
        <section className="m-newsletter">
          <div className="m-newsletter-inner">
            <h2><span data-brand="logo-emoji">🌿</span> Get Weekly Deals</h2>
            <p>50+ organic products — exclusive offers every week!</p>
            <form onSubmit={handleNewsletter} className="m-newsletter-form">
              <input type="email" placeholder="Enter your email..." required />
              <button type="submit"><i className="fas fa-paper-plane"></i></button>
            </form>
          </div>
        </section>

        <div style={{ height: '70px' }}></div>
      </main>
    </>
  );
}
