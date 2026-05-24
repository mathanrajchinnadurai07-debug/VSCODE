import Link from 'next/link';
import { useCart } from '../context/CartContext';
import { useState } from 'react';

export default function ProductCard({ product }) {
  const { addToCart, wishlist, toggleWishlist } = useCart();
  const [selectedWeight, setSelectedWeight] = useState(
    product.weights && product.weights.length > 0 ? product.weights[0].label : '250g'
  );

  const pid = product._id || product.id || product.slug;
  const imgSrc = product.imageUrl || (product.images && product.images[0]) || '';
  
  const selectedWeightOption = product.weights?.find(w => w.label === selectedWeight);
  const showPrice = selectedWeightOption 
    ? (selectedWeightOption.discountPrice || selectedWeightOption.price) 
    : (product.discountPrice || product.price);
  const showOriginal = selectedWeightOption 
    ? selectedWeightOption.price 
    : (product.originalPrice || product.price);
  
  const discount = showOriginal > showPrice ? Math.round(((showOriginal - showPrice) / showOriginal) * 100) : 0;
  const detailUrl = `/product/${product.slug}`;
  
  const inW = wishlist?.includes(pid);
  const stockVal = product.stock != null ? product.stock : 100;
  const outOfStock = stockVal <= 0;
  const stockLabel = stockVal > 20 ? 'In Stock' : stockVal > 0 ? 'Only ' + stockVal + ' left' : 'Out of Stock';
  const stockClass = stockVal > 20 ? 'in-stock' : stockVal > 0 ? 'low-stock' : 'out-of-stock';

  const catEmojiMap = {
    vegetables: '🥬', fruits: '🍎', biscuits: '🍪', snacks: '🥜', mushroom: '🍄', 
    chicken: '🍗', mutton: '🍖', grocery: '🏪', herbal: '🌿', dryfruits: '🥣', 
    flour: '🌾', beverages: '☕', spreads: '🍯', pickles: '🥒', superfoods: '🧬', readytocook: '🍲'
  };
  const catEmoji = catEmojiMap[product.category] || '🛒';

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, selectedWeight, 1);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(pid);
  };

  return (
    <div className={`product-card ${outOfStock ? 'out-of-stock-card' : ''}`} data-id={pid}>
      <div className="product-badges">
        {discount > 0 && <span className="badge badge-sale">{discount}% OFF</span>}
      </div>
      <button className={`wishlist-btn ${inW ? 'active' : ''}`} onClick={handleWishlist}>
        <i className={inW ? 'fas fa-heart' : 'far fa-heart'}></i>
      </button>
      <Link href={detailUrl} className="product-image">
        {imgSrc ? (
          <img 
            src={imgSrc} 
            alt={product.name} 
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'calc(var(--radius) - 2px) calc(var(--radius) - 2px) 0 0' }} 
          />
        ) : (
          <div className="placeholder-icon">{catEmoji}</div>
        )}
      </Link>
      <div className="product-info">
        <div className="product-category">{product.category || ''}</div>
        <h3 className="product-name">
          <Link href={detailUrl}>{product.name}</Link>
        </h3>
        <div className="product-price">
          <span className="price-current">₹{showPrice}</span>
          {discount > 0 && (
            <>
              <span className="price-original">₹{showOriginal}</span>
              <span className="price-discount">{discount}% off</span>
            </>
          )}
        </div>
        {product.unit && (
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
            {product.unit}
          </div>
        )}
        <div className={`product-stock ${stockClass}`}>
          <i className="fas fa-circle" style={{ fontSize: '0.5rem' }}></i> {stockLabel}
        </div>
        <button 
          className="add-to-cart-btn" 
          disabled={outOfStock} 
          style={outOfStock ? { opacity: 0.5, cursor: 'not-allowed' } : {}} 
          onClick={handleAddToCart}
        >
          <i className={`fas fa-${outOfStock ? 'ban' : 'cart-plus'}`}></i> {outOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
