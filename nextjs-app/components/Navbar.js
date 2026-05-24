import Link from 'next/link';
import { useCart } from '../context/CartContext';
import { useRouter } from 'next/router';

export default function Navbar() {
  const { getCartCount } = useCart();
  const router = useRouter();
  const isHome = router.pathname === '/';
  const cartCount = getCartCount();

  return (
    <>
      {/* ===== MOBILE HEADER ===== */}
      <header className="m-header" id="mHeader">
        <div className="m-header-top">
          <Link href="/" className="m-logo">
            <div className="m-logo-icon"><span data-brand='logo-emoji'>🌿</span></div>
            <div className="m-logo-text"><span data-brand='name'>Curfee</span><span>Organic</span></div>
          </Link>
          <div className="m-header-actions">
            <Link href="/login" className="m-header-btn" id="authBtn"><i className="fas fa-user"></i></Link>
            {!isHome && <Link href="/dashboard" className="m-header-btn"><i className="fas fa-heart"></i></Link>}
            {isHome && <Link href="/dashboard" className="m-header-btn"><i className="fas fa-heart"></i></Link>}
          </div>
        </div>
        
        {isHome && (
          <>
            <div className="m-search-wrap">
              <select className="m-search-dept" id="searchCategory">
                <option value="">All</option>
                <option value="biscuits">Biscuits</option>
                <option value="snacks">Snacks</option>
                <option value="mushroom">Mushroom</option>
                <option value="chicken">Chicken</option>
                <option value="mutton">Mutton</option>
                <option value="grocery">Grocery</option>
                <option value="herbal">Herbal</option>
                <option value="dryfruits">Dry Fruits</option>
                <option value="flour">Flour</option>
                <option value="beverages">Beverages</option>
                <option value="spreads">Spreads</option>
                <option value="pickles">Pickles</option>
                <option value="superfoods">Superfoods</option>
                <option value="readytocook">Ready to Cook</option>
                <option value="vegetables">Vegetables</option>
                <option value="fruits">Fruits</option>
              </select>
              <i className="fas fa-search m-search-icon"></i>
              <input type="text" id="searchInputMob" placeholder="Search 50+ organic products..." className="m-search-input" readOnly onClick={() => router.push('/search')} />
            </div>
            <div className="m-location-bar">
              <i className="fas fa-map-marker-alt"></i>
              <span>Deliver to <strong id="userLocation">Detect Location</strong></span>
              <i className="fas fa-chevron-down" style={{fontSize:'0.6rem', marginLeft:'2px'}}></i>
              <Link href="/products?bestseller=true" className="m-prime-btn">🔥 Today's Deals</Link>
            </div>
          </>
        )}
      </header>

      {/* ===== DESKTOP TOPBAR & NAVBAR ===== */}
      {!isHome && (
        <>
          <div className="topbar">
            <div className="container">
              <div>
                <i className="fas fa-phone-alt"></i> <span className="app-dynamic-helpline">+91 78457 44038</span> | <Link href="/support">Help</Link>
              </div>
              <div>
                <a href="#" id="locationBtn"><i className="fas fa-map-marker-alt"></i> <span id="userLocation">Detect Location</span></a>
              </div>
            </div>
          </div>
          <nav className="navbar">
            <div className="container">
              <Link href="/" className="logo">
                <div className="logo-icon"><span data-brand='logo-emoji'>🌿</span></div>
                <span data-brand='name'>Curfee</span><span>Organic</span>
              </Link>
              <div className="search-bar">
                <select id="searchCategory">
                  <option value="">All</option>
                  <option value="vegetables">Vegetables</option>
                  <option value="fruits">Fruits</option>
                  <option value="biscuits">Biscuits</option>
                  <option value="snacks">Snacks</option>
                  <option value="mushroom">Mushroom</option>
                  <option value="chicken">Chicken</option>
                  <option value="mutton">Mutton</option>
                  <option value="grocery">Grocery</option>
                  <option value="herbal">Herbal</option>
                  <option value="dryfruits">Dry Fruits</option>
                  <option value="flour">Flour</option>
                  <option value="beverages">Beverages</option>
                  <option value="spreads">Spreads</option>
                  <option value="pickles">Pickles</option>
                  <option value="superfoods">Superfoods</option>
                  <option value="readytocook">Ready to Cook</option>
                </select>
                <input type="text" id="searchInput" placeholder="Search 50+ organic products..." />
                <button id="searchBtn"><i className="fas fa-search"></i></button>
              </div>
              <div className="nav-actions">
                <Link href="/login" className="nav-btn" id="authBtn">
                  <i className="fas fa-user"></i><span>Login</span>
                </Link>
                <Link href="/dashboard" className="nav-btn" id="wishlistNavBtn">
                  <i className="fas fa-heart"></i><span>Wishlist</span>
                  <div className="count" id="wishlistCount" style={{display:'none'}}>0</div>
                </Link>
                <Link href="/cart" className="nav-btn">
                  <i className="fas fa-shopping-cart"></i><span>Cart</span>
                  <div className="count" id="cartCount" style={{display: cartCount > 0 ? 'flex' : 'none'}}>{cartCount}</div>
                </Link>
              </div>
            </div>
          </nav>
        </>
      )}

      {/* ===== MOBILE BOTTOM NAV ===== */}
      <nav className="m-bottom-nav">
        <Link href="/" className={`m-bnav-item ${router.pathname === '/' ? 'active' : ''}`}><i className="fas fa-home"></i><span>Home</span></Link>
        <Link href="/categories" className={`m-bnav-item ${router.pathname === '/categories' ? 'active' : ''}`}><i className="fas fa-th-large"></i><span>Categories</span></Link>
        <Link href="/cart" className={`m-bnav-item ${router.pathname === '/cart' ? 'active' : ''}`}>
          <div className="m-bnav-cart-icon">
            <i className="fas fa-shopping-cart"></i>
            <span className="m-bnav-badge" id="cartCountMob" style={{display: cartCount > 0 ? 'flex' : 'none'}}>{cartCount}</span>
          </div>
          <span>Cart</span>
        </Link>
        <Link href="/dashboard" className={`m-bnav-item ${router.pathname === '/dashboard' ? 'active' : ''}`}><i className="fas fa-user"></i><span>Account</span></Link>
        <Link href="/support" className={`m-bnav-item ${router.pathname === '/support' ? 'active' : ''}`}><i className="fas fa-headset"></i><span>Support</span></Link>
      </nav>
    </>
  );
}
