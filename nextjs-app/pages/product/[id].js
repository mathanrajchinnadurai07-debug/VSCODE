import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ALL_PRODUCTS } from '../../data/products';
import { useCart } from '../../context/CartContext';

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  const [product, setProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('description');
  const [activeImage, setActiveImage] = useState('');
  const [activeWeight, setActiveWeight] = useState(null);
  const [qty, setQty] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewName, setReviewName] = useState('');
  const [reviewComment, setReviewComment] = useState('');

  const { addToCart } = useCart();

  useEffect(() => {
    if (id) {
      const foundProduct = ALL_PRODUCTS.find(p => p.slug === id);
      if (foundProduct) {
        setProduct(foundProduct);
        if (foundProduct.images && foundProduct.images.length > 0) {
          setActiveImage(foundProduct.images[0]);
        }
        if (foundProduct.weights && foundProduct.weights.length > 0) {
          setActiveWeight(foundProduct.weights[0]);
        }
        // Load related products
        const related = ALL_PRODUCTS.filter(p => p.category === foundProduct.category && p.slug !== id).slice(0, 4);
        setRelatedProducts(related);
      }
    }
  }, [id]);

  if (!product) {
    return (
      <div className="container product-detail">
        <div style={{padding:'16px 0',fontSize:'0.85rem',color:'var(--text-light)'}}>
          <Link href="/" style={{color:'var(--primary)'}}>Home</Link> / <Link href="/products" style={{color:'var(--primary)'}}>Products</Link> / <span id="breadcrumbName">Loading...</span>
        </div>
        <div className="product-detail-grid" id="detailContent">
          <div style={{padding:'40px',textAlign:'center',gridColumn:'1/-1'}}>
            <div className="skeleton skeleton-image" style={{maxWidth:'400px',margin:'0 auto 20px',height:'300px'}}></div>
            <div className="skeleton skeleton-text" style={{maxWidth:'300px',margin:'0 auto',height:'20px'}}></div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate pricing based on selected weight
  const showPrice = activeWeight ? (activeWeight.discountPrice || activeWeight.price) : (product.discountPrice || product.price);
  const showOriginal = activeWeight ? activeWeight.price : product.price;
  const discount = showOriginal > 0 ? Math.round(((showOriginal - showPrice) / showOriginal) * 100) : 0;
  const emoji = '🌿'; // Fallback emoji
  const outOfStock = product.stock <= 0;

  const changeQty = (delta) => {
    setQty(prev => Math.max(1, Math.min(10, prev + delta)));
  };

  const handleAddToCart = () => {
    if (outOfStock) {
      alert('This product is out of stock');
      return;
    }
    const weightLabel = activeWeight ? activeWeight.label : '250g';
    addToCart(product, weightLabel, qty);
    // Could show a toast notification here
  };

  const buyNow = () => {
    handleAddToCart();
    if (!outOfStock) {
      router.push('/cart');
    }
  };

  const submitReview = (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      alert('Please write a review');
      return;
    }
    alert('Review submitted! Thank you 🌿');
    setReviewComment('');
    setReviewRating(5);
  };

  const starsHTML = (rating) => {
    return Array.from({length: 5}).map((_, i) => (
      <i key={i} className={`fas fa-star ${i < Math.floor(rating) ? '' : 'text-gray'}`} style={{ color: i < rating ? '#f7b731' : '#ddd' }}></i>
    ));
  };

  return (
    <div className="container product-detail">
      <div style={{padding:'16px 0', fontSize:'0.85rem', color:'var(--text-light)'}}>
        <Link href="/" style={{color:'var(--primary)'}}>Home</Link> / <Link href="/products" style={{color:'var(--primary)'}}>Products</Link> / <span id="breadcrumbName">{product.name}</span>
      </div>

      <div className="product-detail-grid" id="detailContent">
        <div className="product-gallery" style={{position:'relative'}}>
          <div className="main-image" style={{background:'#f8fafc',position:'relative'}}>
            <button className="btn-icon" style={{position:'absolute',top:'16px',right:'16px',background:'#fff',boxShadow:'0 2px 8px rgba(0,0,0,0.1)',borderRadius:'50%',width:'40px',height:'40px',zIndex:10}}>
              <i className="fas fa-heart text-gray"></i>
            </button>
            <button className="btn-icon" style={{position:'absolute',top:'66px',right:'16px',background:'#fff',boxShadow:'0 2px 8px rgba(0,0,0,0.1)',borderRadius:'50%',width:'40px',height:'40px',zIndex:10}}>
              <i className="fas fa-share text-gray"></i>
            </button>
            {product.images && product.images.length ? (
              <img id="mainDetailImage" src={activeImage} alt={product.name} style={{width:'100%',height:'100%',objectFit:'contain',mixBlendMode:'multiply'}} />
            ) : (
              <div style={{fontSize:'8rem',display:'flex',alignItems:'center',justifyContent:'center',height:'100%'}}>{emoji}</div>
            )}
            <div style={{position:'absolute',bottom:'16px',left:'16px',background:'#fff',padding:'4px 8px',borderRadius:'16px',fontSize:'0.75rem',fontWeight:700,boxShadow:'0 2px 4px rgba(0,0,0,0.1)',zIndex:10}}>
              {product.rating} <i className="fas fa-star" style={{color:'var(--success)'}}></i> <span style={{color:'#d1d5db',margin:'0 4px'}}>|</span> {product.numReviews}
            </div>
          </div>
          <div className="thumb-list">
            {product.images && product.images.length ? product.images.map((img, i) => (
              <div key={i} className={`thumb ${activeImage === img ? 'active' : ''}`} style={{display:'flex',alignItems:'center',justifyContent:'center',background:'#fff',border:'1px solid #e2e8f0',padding:0,overflow:'hidden',cursor:'pointer'}} onClick={() => setActiveImage(img)}>
                <img src={img} style={{width:'100%',height:'100%',objectFit:'contain'}} alt="thumb" />
              </div>
            )) : (
              <div className="thumb active" style={{display:'flex',alignItems:'center',justifyContent:'center',fontSize:'2rem',background:'#fff'}}>{emoji}</div>
            )}
          </div>
        </div>

        <div className="detail-info">
          <div style={{display:'flex',gap:'8px',marginBottom:'8px',flexWrap:'wrap'}}>
            <span className="badge" style={{background:'var(--primary)',color:'#fff'}}>{product.category}</span>
            {discount > 0 && <span className="badge badge-sale">{discount}% OFF</span>}
            {outOfStock && <span className="badge" style={{background:'var(--danger)',color:'#fff'}}>Out of Stock</span>}
          </div>
          <h1 className="detail-title" style={{fontSize:'1.15rem',marginBottom:'8px',lineHeight:'1.4'}}>{product.name}</h1>
          <p style={{color:'var(--text-light)',fontSize:'0.85rem',marginBottom:'16px',lineHeight:'1.6',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
            {product.description || 'Premium organic product from certified farms.'} <a href="#tabsSection" style={{color:'var(--primary)',fontWeight:600}}>...more</a>
          </p>

          <div style={{display:'flex',alignItems:'baseline',gap:'12px',marginBottom:'16px'}}>
            <span className="detail-price" style={{fontSize:'1.6rem',fontWeight:800}}>₹{showPrice}</span>
            {discount > 0 && (
              <>
                <span className="detail-original" style={{textDecoration:'line-through',color:'var(--text-light)',fontSize:'1rem'}}>₹{showOriginal}</span>
                <span className="detail-discount" style={{color:'var(--success)',fontWeight:700,fontSize:'0.85rem'}}>{discount}% off</span>
              </>
            )}
          </div>

          <div style={{marginBottom:'20px'}}>
            <label style={{fontWeight:600,fontSize:'0.85rem',marginBottom:'8px',display:'block'}}>Weight / Pack Size:</label>
            <div className="weight-options" id="detailWeights">
              {(product.weights || []).map((w, i) => (
                <span key={i} className={`weight-option ${activeWeight?.label === w.label ? 'active' : ''}`} data-weight={w.label} onClick={() => setActiveWeight(w)} style={{cursor:'pointer'}}>
                  {w.label}
                </span>
              ))}
            </div>
          </div>

          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'24px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
              <label style={{fontWeight:600,fontSize:'0.85rem'}}>Qty:</label>
              <div className="quantity-control" style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'6px',display:'flex'}}>
                <button type="button" onClick={() => changeQty(-1)} style={{border:'none',background:'none',padding:'5px 12px',fontWeight:700,cursor:'pointer'}}>−</button>
                <input type="number" id="detailQty" value={qty} readOnly style={{background:'transparent',width:'30px',fontSize:'0.9rem',textAlign:'center',border:'none'}} />
                <button type="button" onClick={() => changeQty(1)} style={{border:'none',background:'none',padding:'5px 12px',fontWeight:700,cursor:'pointer'}}>+</button>
              </div>
            </div>
            <span className={`product-stock ${outOfStock ? 'out-of-stock' : (product.stock > 20 ? 'in-stock' : 'low-stock')}`} style={{fontWeight:600,fontSize:'0.8rem'}}>
              <i className={`fas ${outOfStock ? 'fa-times-circle' : 'fa-check-circle'}`}></i> {outOfStock ? 'Out of Stock' : 'In Stock'}
            </span>
          </div>

          <div className="mob-sticky-bottom" style={{display:'flex',gap:'12px',padding:'12px 16px',background:'#fff',borderTop:'1px solid #e2e8f0',position:'fixed',bottom:0,left:0,right:0,zIndex:100,boxShadow:'0 -2px 10px rgba(0,0,0,0.05)'}}>
            {outOfStock ? (
              <button className="btn btn-lg" disabled style={{flex:1,opacity:0.5,background:'var(--text-light)',color:'#fff',border:'none',textAlign:'center',width:'100%'}}>Out of Stock</button>
            ) : (
              <>
                <button className="btn btn-outline btn-lg" onClick={handleAddToCart} style={{flex:1,fontWeight:700,border:'1px solid #e2e8f0',background:'#fff',color:'var(--text)',cursor:'pointer'}}>Add to cart</button>
                <button className="btn btn-lg" onClick={buyNow} style={{flex:1,fontWeight:700,background:'var(--primary)',color:'#fff',border:'none',cursor:'pointer'}}>Buy at <span id="stickyBuyPrice">₹{showPrice}</span></button>
              </>
            )}
          </div>
          <div style={{height:'60px',display:'none'}} className="mob-spacer"></div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',fontSize:'0.75rem',color:'var(--text-light)',background:'#f8fafc',padding:'16px',borderRadius:'8px'}}>
            <span style={{display:'flex',alignItems:'center',gap:'6px'}}><i className="fas fa-truck text-gray"></i> Free Delivery</span>
            <span style={{display:'flex',alignItems:'center',gap:'6px'}}><i className="fas fa-undo text-gray"></i> 7 Days Replacement</span>
            <span style={{display:'flex',alignItems:'center',gap:'6px'}}><i className="fas fa-money-bill-wave text-gray"></i> Cash on Delivery</span>
            <span style={{display:'flex',alignItems:'center',gap:'6px'}}><i className="fas fa-leaf text-gray"></i> 100% Organic</span>
          </div>
        </div>
      </div>

      <div id="tabsSection" style={{display:'block'}}>
        <div className="tabs">
          <button className={`tab ${activeTab === 'description' ? 'active' : ''}`} onClick={() => setActiveTab('description')}>Description</button>
          <button className={`tab ${activeTab === 'nutrition' ? 'active' : ''}`} onClick={() => setActiveTab('nutrition')}>Nutritional Info</button>
          <button className={`tab ${activeTab === 'farm' ? 'active' : ''}`} onClick={() => setActiveTab('farm')}>Farm Source</button>
          <button className={`tab ${activeTab === 'delivery' ? 'active' : ''}`} onClick={() => setActiveTab('delivery')}>Delivery & Returns</button>
          <button className={`tab ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>Reviews</button>
        </div>

        {activeTab === 'description' && (
          <div className="tab-content active" id="tab-description">
            <div style={{lineHeight:2,color:'var(--text)',fontSize:'0.95rem'}}>
              <p>{product.description || 'Premium organic product from certified farms.'}</p>
              <div style={{marginTop:'20px',display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:'16px'}}>
                <div style={{background:'rgba(45,106,79,0.05)',padding:'16px',borderRadius:'var(--radius-sm)'}}>
                  <h4 style={{color:'var(--primary)',marginBottom:'8px'}}>🌿 Why Organic?</h4>
                  <ul style={{fontSize:'0.85rem',color:'var(--text-light)',lineHeight:2,paddingLeft:'16px'}}>
                    <li>No synthetic pesticides or chemicals</li>
                    <li>Non-GMO verified</li>
                    <li>Sustainably farmed</li>
                    <li>Better for your health & the environment</li>
                  </ul>
                </div>
                <div style={{background:'rgba(247,127,0,0.05)',padding:'16px',borderRadius:'var(--radius-sm)'}}>
                  <h4 style={{color:'var(--accent)',marginBottom:'8px'}}>💡 How to Use</h4>
                  <ul style={{fontSize:'0.85rem',color:'var(--text-light)',lineHeight:2,paddingLeft:'16px'}}>
                    <li>Wash thoroughly before use</li>
                    <li>Store in a cool, dry place</li>
                    <li>Best consumed within 3-5 days</li>
                    <li>Check individual product label for specific instructions</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'nutrition' && (
          <div className="tab-content active" id="tab-nutrition">
            {['herbal'].includes(product.category) ? (
              <div style={{padding:'20px',background:'var(--bg)',borderRadius:'var(--radius-sm)'}}>
                <h3 style={{marginBottom:'12px'}}>🌿 Ingredients & Properties</h3>
                <p style={{lineHeight:1.8,color:'var(--text-light)'}}>This is an external-use herbal product. Nutritional values are not applicable. Please refer to the product packaging for full ingredient list, usage instructions, and allergen information.</p>
                <p style={{marginTop:'12px',fontSize:'0.85rem',color:'var(--text-light)'}}><strong>Safety note:</strong> Perform a patch test before first use. Discontinue if irritation occurs. For external use only. Keep away from eyes. Consult a dermatologist if you have sensitive skin.</p>
              </div>
            ) : (
              <div style={{maxWidth:'500px'}}>
                <table className="cart-table" style={{width:'100%', borderCollapse: 'collapse'}}>
                  <thead>
                    <tr>
                      <th style={{background:'var(--primary)',color:'#fff', padding: '10px', textAlign: 'left'}}>Nutrient</th>
                      <th style={{background:'var(--primary)',color:'#fff', padding: '10px', textAlign: 'left'}}>Per 100g/ml</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{borderBottom: '1px solid var(--border)'}}><td style={{padding: '10px'}}>🔥 <strong>Calories</strong></td><td style={{padding: '10px'}}>{product.nutritionalInfo?.calories || '—'}</td></tr>
                    <tr style={{borderBottom: '1px solid var(--border)'}}><td style={{padding: '10px'}}>💪 <strong>Protein</strong></td><td style={{padding: '10px'}}>{product.nutritionalInfo?.protein || '—'}</td></tr>
                    <tr style={{borderBottom: '1px solid var(--border)'}}><td style={{padding: '10px'}}>🌾 <strong>Carbohydrates</strong></td><td style={{padding: '10px'}}>{product.nutritionalInfo?.carbs || '—'}</td></tr>
                    <tr style={{borderBottom: '1px solid var(--border)'}}><td style={{padding: '10px'}}>🥑 <strong>Fat</strong></td><td style={{padding: '10px'}}>{product.nutritionalInfo?.fat || '—'}</td></tr>
                    <tr><td style={{padding: '10px'}}>🌿 <strong>Dietary Fibre</strong></td><td style={{padding: '10px'}}>{product.nutritionalInfo?.fiber || '—'}</td></tr>
                  </tbody>
                </table>
                <p style={{marginTop:'12px',fontSize:'0.8rem',color:'var(--text-light)'}}>* Approximate values. Actual nutritional content may vary slightly between batches. Based on ICMR guidelines.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'farm' && (
          <div className="tab-content active" id="tab-farm">
            <div style={{background:'linear-gradient(135deg,rgba(45,106,79,0.05),rgba(45,106,79,0.02))',padding:'24px',borderRadius:'var(--radius)',border:'1px solid rgba(45,106,79,0.1)'}}>
              <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'16px'}}>
                <div style={{width:'60px',height:'60px',borderRadius:'50%',background:'var(--primary)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.8rem'}}>🏡</div>
                <div>
                  <h3 style={{margin:0}}>{product.farmSource?.farmName || 'Organic Farm Partner'}</h3>
                  <p style={{color:'var(--text-light)',fontSize:'0.85rem',margin:'4px 0 0'}}><i className="fas fa-map-marker-alt"></i> {product.farmSource?.location || 'India'}</p>
                </div>
              </div>
              <p style={{lineHeight:1.8,color:'var(--text)',marginBottom:'16px'}}>{product.farmSource?.description || 'Our trusted organic farm partner.'}</p>
              <div style={{display:'flex',gap:'16px',flexWrap:'wrap'}}>
                <span style={{background:'#fff',padding:'6px 14px',borderRadius:'20px',fontSize:'0.8rem',border:'1px solid var(--border)'}}><i className="fas fa-certificate" style={{color:'var(--primary)'}}></i> NPOP Certified</span>
                <span style={{background:'#fff',padding:'6px 14px',borderRadius:'20px',fontSize:'0.8rem',border:'1px solid var(--border)'}}><i className="fas fa-leaf" style={{color:'var(--success)'}}></i> 100% Organic</span>
                <span style={{background:'#fff',padding:'6px 14px',borderRadius:'20px',fontSize:'0.8rem',border:'1px solid var(--border)'}}><i className="fas fa-check-circle" style={{color:'var(--primary)'}}></i> FSSAI Approved</span>
                <span style={{background:'#fff',padding:'6px 14px',borderRadius:'20px',fontSize:'0.8rem',border:'1px solid var(--border)'}}><i className="fas fa-hands-helping" style={{color:'var(--accent)'}}></i> Fair Trade</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'delivery' && (
          <div className="tab-content active" id="tab-delivery">
            <div style={{display:'grid',gap:'20px'}}>
              <div style={{background:'rgba(46,204,113,0.05)',padding:'20px',borderRadius:'var(--radius-sm)',borderLeft:'4px solid var(--success)'}}>
                <h3 style={{marginBottom:'8px',color:'var(--success)'}}><i className="fas fa-truck"></i> Delivery Information</h3>
                <p style={{lineHeight:1.8,color:'var(--text)'}}>{product.deliveryInfo || 'Standard delivery within 2-4 business days. Free delivery on orders above ₹500. Express delivery available in select cities.'}</p>
                <div style={{marginTop:'12px',display:'flex',gap:'20px',flexWrap:'wrap',fontSize:'0.85rem',color:'var(--text-light)'}}>
                  <span>📦 Free shipping above ₹500</span><span>🚀 Express delivery in metros</span><span>🌾 Eco-friendly packaging</span>
                </div>
              </div>
              <div style={{background:'rgba(52,152,219,0.05)',padding:'20px',borderRadius:'var(--radius-sm)',borderLeft:'4px solid #3498db'}}>
                <h3 style={{marginBottom:'8px',color:'#3498db'}}><i className="fas fa-undo"></i> Return & Refund Policy</h3>
                <p style={{lineHeight:1.8,color:'var(--text)'}}>{product.returnPolicy || '7-day easy return policy for fresh products. Full refund or replacement if quality standards are not met.'}</p>
                <div style={{marginTop:'12px',fontSize:'0.85rem',color:'var(--text-light)'}}>
                  <p>📝 <strong>How to return:</strong> Contact support within 7 days of delivery with photos of the product. We will arrange a pickup or provide store credit/refund within 48 hours.</p>
                </div>
              </div>
              <div style={{background:'rgba(155,89,182,0.05)',padding:'20px',borderRadius:'var(--radius-sm)',borderLeft:'4px solid #9b59b6'}}>
                <h3 style={{marginBottom:'8px',color:'#9b59b6'}}><i className="fas fa-shield-alt"></i> Quality Guarantee</h3>
                <p style={{lineHeight:1.8,color:'var(--text)'}}>Every product is certified organic (NPOP/USDA), tested for pesticide residues, and inspected before dispatch. If you are not 100% satisfied with the quality, we will make it right — guaranteed.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="tab-content active" id="tab-reviews">
            <div style={{marginBottom:'24px',display:'flex',alignItems:'center',gap:'20px',flexWrap:'wrap'}}>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:'3rem',fontWeight:700,color:'var(--primary)'}}>{product.rating}</div>
                <div className="stars" style={{fontSize:'1.2rem'}}>{starsHTML(product.rating)}</div>
                <div style={{fontSize:'0.85rem',color:'var(--text-light)'}}>{product.numReviews} reviews</div>
              </div>
              <div style={{flex:1,minWidth:'200px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
                  <span style={{fontSize:'0.8rem',width:'30px'}}>5★</span>
                  <div style={{flex:1,height:'8px',background:'var(--border)',borderRadius:'4px',overflow:'hidden'}}>
                    <div style={{width:`${Math.round((product.rating/5)*100)}%`,height:'100%',background:'var(--primary)',borderRadius:'4px'}}></div>
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
                  <span style={{fontSize:'0.8rem',width:'30px'}}>4★</span>
                  <div style={{flex:1,height:'8px',background:'var(--border)',borderRadius:'4px',overflow:'hidden'}}>
                    <div style={{width:`${Math.round((product.rating/5)*80)}%`,height:'100%',background:'var(--primary)',borderRadius:'4px'}}></div>
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
                  <span style={{fontSize:'0.8rem',width:'30px'}}>3★</span>
                  <div style={{flex:1,height:'8px',background:'var(--border)',borderRadius:'4px',overflow:'hidden'}}>
                    <div style={{width:'15%',height:'100%',background:'var(--primary)',borderRadius:'4px'}}></div>
                  </div>
                </div>
              </div>
            </div>

            <div id="reviewsList">
              {product.reviews && product.reviews.length ? product.reviews.map((r, i) => (
                <div key={i} style={{borderBottom:'1px solid var(--border)',padding:'16px 0'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <div style={{width:'36px',height:'36px',borderRadius:'50%',background:'linear-gradient(135deg,var(--primary),var(--primary-light))',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'0.85rem'}}>
                        {(r.userName || 'U').charAt(0)}
                      </div>
                      <div>
                        <strong>{r.userName || 'Customer'}</strong>
                        {r.isVerifiedPurchase && <span style={{fontSize:'0.7rem',color:'var(--success)',marginLeft:'6px'}}><i className="fas fa-check-circle"></i> Verified Purchase</span>}
                      </div>
                    </div>
                    <span className="stars" style={{fontSize:'0.85rem'}}>{starsHTML(r.rating)}</span>
                  </div>
                  <p style={{fontSize:'0.9rem',color:'var(--text-light)',lineHeight:1.6}}>{r.comment}</p>
                </div>
              )) : (
                <p style={{color:'var(--text-light)',padding:'20px 0'}}>No reviews yet. Be the first to review this product!</p>
              )}

              <div style={{background:'var(--bg)',padding:'24px',borderRadius:'var(--radius)',marginTop:'20px'}}>
                <h3 style={{marginBottom:'16px'}}><i className="fas fa-star"></i> Write a Review</h3>
                <form id="reviewForm" onSubmit={submitReview}>
                  <div className="form-group">
                    <label>Your Rating *</label>
                    <div id="ratingStars" style={{fontSize:'1.5rem',cursor:'pointer',letterSpacing:'4px'}}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <span key={n} onClick={() => setReviewRating(n)} style={{color: n <= reviewRating ? '#f7b731' : '#ddd'}}>★</span>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Your Name *</label>
                    <input type="text" id="reviewName" required placeholder="Enter your name" value={reviewName} onChange={e => setReviewName(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Your Review *</label>
                    <textarea id="reviewComment" rows="4" required placeholder="What did you think about this product? How was the quality, freshness, taste?" value={reviewComment} onChange={e => setReviewComment(e.target.value)}></textarea>
                  </div>
                  <button type="submit" className="btn btn-primary"><i className="fas fa-paper-plane"></i> Submit Review</button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      <section className="section" style={{marginTop: '40px'}}>
        <h2 className="section-title">Related Products</h2>
        <div className="product-grid" id="relatedProducts">
          {relatedProducts.length > 0 ? relatedProducts.map(p => (
            <div key={p.slug} className="product-card">
              {p.discountPrice && p.price > p.discountPrice && (
                <div className="badge badge-sale">{Math.round(((p.price - p.discountPrice) / p.price) * 100)}% OFF</div>
              )}
              <button className="btn-icon wishlist-btn" style={{position:'absolute',top:'12px',right:'12px',zIndex:2}}><i className="far fa-heart"></i></button>
              <div className="product-image" style={{cursor:'pointer'}}>
                <Link href={`/product/${p.slug}`}>
                  {p.images && p.images.length ? (
                    <img src={p.images[0]} alt={p.name} style={{width:'100%',height:'100%',objectFit:'contain',mixBlendMode:'multiply'}} />
                  ) : (
                    <div style={{fontSize:'4rem',display:'flex',alignItems:'center',justifyContent:'center',height:'100%'}}>🌿</div>
                  )}
                </Link>
              </div>
              <div className="product-info">
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                  <span className="product-category">{p.category}</span>
                  <div className="product-rating"><i className="fas fa-star" style={{color:'var(--success)'}}></i> {p.rating}</div>
                </div>
                <h3 className="product-title" style={{fontSize:'1rem',marginBottom:'8px',lineHeight:'1.4',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
                  <Link href={`/product/${p.slug}`}>{p.name}</Link>
                </h3>
                <div className="product-price" style={{display:'flex',alignItems:'baseline',gap:'8px',marginBottom:'12px'}}>
                  <span style={{fontSize:'1.2rem',fontWeight:700}}>₹{p.discountPrice || p.price}</span>
                  {p.discountPrice && p.price > p.discountPrice && (
                    <span style={{textDecoration:'line-through',color:'var(--text-light)',fontSize:'0.85rem'}}>₹{p.price}</span>
                  )}
                </div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:'12px',gap:'8px'}}>
                  <select className="weight-select" style={{padding:'6px',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)',fontSize:'0.85rem',background:'var(--bg)',flex:1}}>
                    {p.weights?.map((w,i) => <option key={i} value={w.label}>{w.label}</option>) || <option value="250g">250g</option>}
                  </select>
                  <button className="btn btn-outline" style={{padding:'6px 12px',fontSize:'0.85rem',cursor:'pointer'}} onClick={() => addToCart(p, p.weights?.[0]?.label || '250g', 1)}>Add</button>
                </div>
              </div>
            </div>
          )) : (
            <p style={{color:'var(--text-light)'}}>No related products found.</p>
          )}
        </div>
      </section>
    </div>
  );
}
