import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ALL_PRODUCTS } from '../data/products';
import { useCart } from '../context/CartContext';

export default function ProductsPage() {
  const router = useRouter();
  const { addToCart } = useCart();
  
  const PAGE_SIZE = 24;
  
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Sidebar filters
  const [checkedCats, setCheckedCats] = useState([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [inStock, setInStock] = useState(true);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sort, setSort] = useState('');

  // Mobile modals
  const [mobSortModalActive, setMobSortModalActive] = useState(false);
  const [mobFilterDrawerActive, setMobFilterDrawerActive] = useState(false);
  const [mobFilterTab, setMobFilterTab] = useState('category');

  // Sync URL query params into state
  useEffect(() => {
    if (router.isReady) {
      const q = router.query.search || '';
      const cat = router.query.category || '';
      setSearchQuery(q);
      setSelectedCategory(cat);
      if (cat) {
        setCheckedCats([cat]);
      } else {
        setCheckedCats([]);
      }
    }
  }, [router.isReady, router.query]);

  const clearAllFilters = () => {
    setCheckedCats([]);
    setMinPrice('');
    setMaxPrice('');
    setMinRating(0);
    setInStock(true);
    setFeaturedOnly(false);
    setSort('');
    setCurrentPage(1);
  };

  const handleCategoryCheckbox = (cat) => {
    setCheckedCats(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
    setCurrentPage(1);
  };

  // Filter products based on state
  const filteredProducts = useMemo(() => {
    let result = ALL_PRODUCTS;

    // 1. Search Query & Selected Category (from header)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.description && p.description.toLowerCase().includes(q)) || 
        (p.category && p.category.toLowerCase().includes(q))
      );
    } else if (selectedCategory) {
      result = result.filter(p => p.category === selectedCategory);
    }
    
    // 2. Client-side sidebar filters
    result = result.filter(p => {
      const price = p.discountPrice || p.price || 0;
      if (checkedCats.length && !checkedCats.includes(p.category)) return false;
      if (minRating && (p.rating || 0) < minRating) return false;
      if (minPrice !== '' && price < parseFloat(minPrice)) return false;
      if (maxPrice !== '' && price > parseFloat(maxPrice)) return false;
      if (inStock && p.stock !== undefined && p.stock <= 0) return false;
      if (featuredOnly && !p.isFeatured && !p.featured) return false;
      return true;
    });

    // 3. Sorting
    const finalResult = [...result];
    if (sort === 'price_low')  finalResult.sort((a,b) => (a.discountPrice||a.price) - (b.discountPrice||b.price));
    if (sort === 'price_high') finalResult.sort((a,b) => (b.discountPrice||b.price) - (a.discountPrice||a.price));
    if (sort === 'rating')     finalResult.sort((a,b) => (b.rating||0) - (a.rating||0));

    return finalResult;
  }, [searchQuery, selectedCategory, checkedCats, minPrice, maxPrice, minRating, inStock, featuredOnly, sort]);

  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);
  const currentProducts = filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  let pageTitle = 'All Products';
  if (searchQuery) pageTitle = `Results for "${searchQuery}"`;
  else if (selectedCategory) pageTitle = selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1);

  const renderStars = (rating) => {
    const r = Math.round(rating || 0);
    return '★'.repeat(r) + '☆'.repeat(5 - r);
  };

  return (
    <>
      <Head>
        <title>Products — Curfee Organic Market</title>
      </Head>
      <div className="container">
        <div className="page-layout">
          {/* Desktop Filter Sidebar */}
          <aside className="filter-sidebar" id="desktopFilterSidebar">
            <h2 style={{fontSize: '1.1rem', marginBottom: '20px'}}>Filters</h2>
            
            <div className="filter-group">
              <h3>Category</h3>
              {[
                { val: 'vegetables', label: '🥬 Vegetables' },
                { val: 'fruits', label: '🍎 Fruits' },
                { val: 'biscuits', label: '🍪 Biscuits' },
                { val: 'snacks', label: '🥜 Snacks' },
                { val: 'mushroom', label: '🍄 Mushroom' },
                { val: 'chicken', label: '🍗 Chicken' },
                { val: 'mutton', label: '🍖 Mutton' },
                { val: 'grocery', label: '🏪 Grocery' },
                { val: 'herbal', label: '🌿 Herbal' },
                { val: 'dryfruits', label: '🥣 Dry Fruits' },
                { val: 'flour', label: '🌾 Flour' },
                { val: 'beverages', label: '☕ Beverages' },
                { val: 'spreads', label: '🍯 Spreads' },
                { val: 'pickles', label: '🥒 Pickles' },
                { val: 'superfoods', label: '🧬 Superfoods' },
                { val: 'readytocook', label: '🍲 Ready to Cook' },
              ].map(cat => (
                <label key={cat.val}>
                  <input 
                    type="checkbox" 
                    name="category" 
                    value={cat.val} 
                    checked={checkedCats.includes(cat.val)}
                    onChange={() => handleCategoryCheckbox(cat.val)}
                  /> {cat.label}
                </label>
              ))}
            </div>
            
            <div className="filter-group">
              <h3>Price Range</h3>
              <div className="price-range">
                <input 
                  type="number" 
                  id="minPrice" 
                  placeholder="Min" 
                  min="0" 
                  value={minPrice}
                  onChange={e => { setMinPrice(e.target.value); setCurrentPage(1); }}
                />
                <span>—</span>
                <input 
                  type="number" 
                  id="maxPrice" 
                  placeholder="Max" 
                  min="0" 
                  value={maxPrice}
                  onChange={e => { setMaxPrice(e.target.value); setCurrentPage(1); }}
                />
              </div>
            </div>
            
            <div className="filter-group">
              <h3>Rating</h3>
              <label>
                <input 
                  type="radio" 
                  name="rating" 
                  value="4" 
                  checked={minRating === 4}
                  onChange={() => { setMinRating(4); setCurrentPage(1); }}
                /> ★★★★☆ & up
              </label>
              <label>
                <input 
                  type="radio" 
                  name="rating" 
                  value="3" 
                  checked={minRating === 3}
                  onChange={() => { setMinRating(3); setCurrentPage(1); }}
                /> ★★★☆☆ & up
              </label>
            </div>
            
            <div className="filter-group">
              <h3>Availability</h3>
              <label>
                <input 
                  type="checkbox" 
                  id="inStockFilter" 
                  checked={inStock}
                  onChange={e => { setInStock(e.target.checked); setCurrentPage(1); }}
                /> In Stock
              </label>
              <label>
                <input 
                  type="checkbox" 
                  id="featuredFilter" 
                  checked={featuredOnly}
                  onChange={e => { setFeaturedOnly(e.target.checked); setCurrentPage(1); }}
                /> Featured only
              </label>
            </div>
            
            <button className="clear-filters" id="clearFilters" onClick={clearAllFilters}>
              Clear All Filters
            </button>
          </aside>

          <main style={{paddingBottom: '60px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px'}}>
              <h1 style={{fontSize: '1.4rem', fontWeight: 700}} id="pageTitle">{pageTitle}</h1>
              <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                <span id="productCount" style={{fontSize: '0.85rem', color: 'var(--text-light)'}}>
                  {filteredProducts.length} products
                </span>
                <select 
                  id="sortSelect" 
                  className="desktop-sort" 
                  style={{padding: '8px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem'}}
                  value={sort}
                  onChange={e => { setSort(e.target.value); setCurrentPage(1); }}
                >
                  <option value="">Sort by: Relevance</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>

            <div className="product-grid" id="productGrid">
              {filteredProducts.length === 0 ? (
                <div style={{gridColumn: '1/-1', textAlign: 'center', padding: '80px 20px'}}>
                  <div style={{fontSize: '3.5rem'}}>🌿</div>
                  <h3 style={{margin: '16px 0 8px', color: '#1e293b'}}>No products found</h3>
                  <p style={{color: '#64748b'}}>Try adjusting your filters or search differently</p>
                  <button onClick={clearAllFilters}
                    style={{marginTop: '20px', padding: '12px 28px', background: '#2d6a4f', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600}}>
                    Clear Filters
                  </button>
                </div>
              ) : (
                currentProducts.map(p => {
                  const images = Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []);
                  const img = p.imageUrl || images[0] || '';
                  const price = p.discountPrice || p.price || 0;
                  const original = p.price || 0;
                  const discount = original > price ? Math.round(((original - price) / original) * 100) : 0;
                  const isProductInStock = p.stock === undefined || p.stock > 0;
                  const imgSrc = img.startsWith('http') ? img : (img.startsWith('/') ? img : `/assets/images/products/${img}`);
                  const productId = p._id || p.id;
                  
                  return (
                    <div 
                      key={productId}
                      className="product-card" 
                      style={{cursor: 'pointer'}} 
                      onClick={() => router.push(`/product/${p.slug}`)}
                    >
                      <div className="product-img" style={{position: 'relative', background: '#f8f9fa', borderRadius: '8px 8px 0 0', overflow: 'hidden', aspectRatio: '1'}}>
                        {discount > 0 && <span style={{position: 'absolute', top: '8px', left: '8px', background: '#e05a2b', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: '20px', zIndex: 1}}>{discount}% OFF</span>}
                        {(p.isFeatured || p.featured) && <span style={{position: 'absolute', top: '8px', right: '8px', background: '#1a5c38', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: '20px', zIndex: 1}}>⭐ Featured</span>}
                        {img ? (
                          <img 
                            src={imgSrc} 
                            alt={p.name} 
                            loading="lazy"
                            style={{width: '100%', height: '100%', objectFit: 'cover'}}
                            onError={(e) => { e.target.onerror = null; e.target.parentElement.innerHTML = '<div style="font-size:3rem;text-align:center;padding:20px;line-height:1;">🌿</div>'; }}
                          />
                        ) : (
                          <div style={{fontSize: '3rem', textAlign: 'center', padding: '20px', lineHeight: 1}}>🌿</div>
                        )}
                      </div>
                      <div className="product-info" style={{padding: '12px'}}>
                        <div style={{fontWeight: 600, fontSize: '0.9rem', color: '#1e293b', marginBottom: '4px', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>
                          {p.name}
                        </div>
                        <div style={{fontSize: '0.75rem', color: '#64748b', marginBottom: '6px', textTransform: 'capitalize'}}>
                          {p.category || ''}{p.unit ? ' · ' + p.unit : ''}
                        </div>
                        {p.rating ? (
                          <div style={{fontSize: '0.75rem', color: '#f59e0b', marginBottom: '6px'}}>
                            {renderStars(p.rating)} <span style={{color: '#94a3b8'}}>({p.rating})</span>
                          </div>
                        ) : null}
                        <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px'}}>
                          <span style={{fontSize: '1rem', fontWeight: 700, color: '#1a5c38'}}>₹{price}</span>
                          {original > price && <span style={{fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'line-through'}}>₹{original}</span>}
                        </div>
                        {isProductInStock ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart({
                                _id: productId,
                                id: productId,
                                name: p.name,
                                price: price,
                                discountPrice: price,
                                originalPrice: original || price,
                                imageUrl: img || '',
                                image: img || '',
                                stock: p.stock
                              }, 1);
                            }}
                            className="add-to-cart-btn"
                            style={{width: '100%', padding: '9px', background: '#1a5c38', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'background 0.2s'}}
                            onMouseOver={(e) => e.currentTarget.style.background = '#40916c'}
                            onMouseOut={(e) => e.currentTarget.style.background = '#1a5c38'}
                          >
                            <i className="fas fa-cart-plus"></i> Add to Cart
                          </button>
                        ) : (
                          <button disabled style={{width: '100%', padding: '9px', background: '#e2e8f0', color: '#94a3b8', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'not-allowed'}}>
                            Out of Stock
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {totalPages > 1 && (
              <div id="pagination" style={{display: 'flex', justifyContent: 'center', gap: '8px', margin: '30px 0'}}>
                {Array.from({length: totalPages}, (_, i) => i + 1).map(page => (
                  <button 
                    key={page}
                    onClick={() => {
                      setCurrentPage(page);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    style={{
                      padding: '8px 14px', 
                      border: `1px solid ${page === currentPage ? '#1a5c38' : '#e2e8f0'}`, 
                      borderRadius: '8px', 
                      background: page === currentPage ? '#1a5c38' : '#fff', 
                      color: page === currentPage ? '#fff' : '#1e293b', 
                      cursor: 'pointer', 
                      fontWeight: 600, 
                      transition: 'all 0.2s'
                    }}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
            
            {/* Mobile Sticky Sort/Filter Bar */}
            <div className="mob-sort-bar">
              <button onClick={() => setMobSortModalActive(true)}><strong>Sort</strong></button>
              <button onClick={() => setMobFilterDrawerActive(true)}><i className="fas fa-filter" style={{marginRight: '6px'}}></i> <strong>Filter</strong></button>
            </div>

            {/* Mobile Fullscreen Filter Drawer */}
            <div id="mobFilterDrawer" className={`mob-filter-drawer ${mobFilterDrawerActive ? 'active' : ''}`}>
              <div className="mob-filter-header">
                <button onClick={() => setMobFilterDrawerActive(false)}><i className="fas fa-arrow-left"></i></button>
                <h2>Filters</h2>
                <button className="clear-btn" onClick={clearAllFilters}>Clear Filters</button>
              </div>
              <div className="mob-filter-body">
                <div className="mob-filter-sidebar">
                  <button className={mobFilterTab === 'category' ? 'active' : ''} onClick={() => setMobFilterTab('category')}>Category</button>
                  <button className={mobFilterTab === 'price' ? 'active' : ''} onClick={() => setMobFilterTab('price')}>Price</button>
                  <button className={mobFilterTab === 'rating' ? 'active' : ''} onClick={() => setMobFilterTab('rating')}>Rating</button>
                  <button className={mobFilterTab === 'availability' ? 'active' : ''} onClick={() => setMobFilterTab('availability')}>Availability</button>
                </div>
                <div className="mob-filter-content">
                  <div id="mob-panel-category" className={`mob-panel ${mobFilterTab === 'category' ? 'active' : ''}`}>
                    {[
                      { val: 'vegetables', label: 'Vegetables' },
                      { val: 'fruits', label: 'Fruits' },
                      { val: 'biscuits', label: 'Biscuits' },
                      { val: 'chicken', label: 'Chicken' },
                      { val: 'mutton', label: 'Mutton' },
                      { val: 'grocery', label: 'Grocery' },
                      { val: 'herbal', label: 'Herbal' },
                      { val: 'dryfruits', label: 'Dry Fruits' }
                    ].map(cat => (
                      <label key={cat.val}>
                        <input 
                          type="checkbox" 
                          checked={checkedCats.includes(cat.val)}
                          onChange={() => handleCategoryCheckbox(cat.val)}
                        /> {cat.label}
                      </label>
                    ))}
                  </div>
                  <div id="mob-panel-price" className={`mob-panel ${mobFilterTab === 'price' ? 'active' : ''}`}>
                    <label>Min: <input type="number" value={minPrice} onChange={e => { setMinPrice(e.target.value); setCurrentPage(1); }} style={{border: '1px solid #ccc', padding: '4px', width: '100px', marginBottom: '10px'}} /></label>
                    <label>Max: <input type="number" value={maxPrice} onChange={e => { setMaxPrice(e.target.value); setCurrentPage(1); }} style={{border: '1px solid #ccc', padding: '4px', width: '100px'}} /></label>
                  </div>
                  <div id="mob-panel-rating" className={`mob-panel ${mobFilterTab === 'rating' ? 'active' : ''}`}>
                    <label><input type="radio" name="mob_rating" checked={minRating === 4} onChange={() => { setMinRating(4); setCurrentPage(1); }} /> ★★★★☆ & up</label>
                    <label><input type="radio" name="mob_rating" checked={minRating === 3} onChange={() => { setMinRating(3); setCurrentPage(1); }} /> ★★★☆☆ & up</label>
                  </div>
                  <div id="mob-panel-availability" className={`mob-panel ${mobFilterTab === 'availability' ? 'active' : ''}`}>
                    <label><input type="checkbox" checked={inStock} onChange={e => { setInStock(e.target.checked); setCurrentPage(1); }} /> In Stock</label>
                    <label><input type="checkbox" checked={featuredOnly} onChange={e => { setFeaturedOnly(e.target.checked); setCurrentPage(1); }} /> Featured</label>
                  </div>
                </div>
              </div>
              <div className="mob-filter-footer">
                <div style={{fontWeight: 700}}><span id="mobFoundCount">{filteredProducts.length}</span> products found</div>
                <button className="apply-btn" onClick={() => setMobFilterDrawerActive(false)}>Apply</button>
              </div>
            </div>
            
            {/* Mobile Sort Modal */}
            <div id="mobSortModal" className={`mob-sort-modal ${mobSortModalActive ? 'active' : ''}`} onClick={(e) => { if(e.target === e.currentTarget) setMobSortModalActive(false) }}>
              <div className="mob-sort-content">
                <h3 style={{padding: '16px', borderBottom: '1px solid #eee', margin: 0}}>Sort By</h3>
                <div style={{padding: '10px'}}>
                  <label className="mob-sort-option"><input type="radio" name="mob_sort" checked={sort === ''} onChange={() => { setSort(''); setCurrentPage(1); setMobSortModalActive(false); }} /> Relevance</label>
                  <label className="mob-sort-option"><input type="radio" name="mob_sort" checked={sort === 'price_low'} onChange={() => { setSort('price_low'); setCurrentPage(1); setMobSortModalActive(false); }} /> Price: Low to High</label>
                  <label className="mob-sort-option"><input type="radio" name="mob_sort" checked={sort === 'price_high'} onChange={() => { setSort('price_high'); setCurrentPage(1); setMobSortModalActive(false); }} /> Price: High to Low</label>
                  <label className="mob-sort-option"><input type="radio" name="mob_sort" checked={sort === 'rating'} onChange={() => { setSort('rating'); setCurrentPage(1); setMobSortModalActive(false); }} /> Highest Rated</label>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
