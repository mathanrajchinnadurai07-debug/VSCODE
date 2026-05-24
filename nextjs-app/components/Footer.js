import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Footer() {
  const router = useRouter();
  const isHome = router.pathname === '/';

  return (
    <>
      {isHome ? (
        <footer className="m-footer">
          <div className="m-footer-top">
            <div className="m-footer-brand">
              <div className="m-logo" style={{justifyContent: 'flex-start', marginBottom: '8px'}}>
                <div className="m-logo-icon"><span data-brand='logo-emoji'>🌿</span></div>
                <div className="m-logo-text"><span data-brand='name'>Curfee</span><span>Organic</span></div>
              </div>
              <p>50+ organic products across 14 categories.</p>
            </div>
            <div className="m-footer-links">
              <div className="m-footer-col">
                <h4>Categories</h4>
                <Link href="/products?category=biscuits">Biscuits</Link>
                <Link href="/products?category=snacks">Snacks</Link>
                <Link href="/products?category=mushroom">Mushroom</Link>
                <Link href="/products?category=chicken">Chicken</Link>
                <Link href="/products?category=grocery">Grocery</Link>
              </div>
              <div className="m-footer-col">
                <h4>More</h4>
                <Link href="/products?category=dryfruits">Dry Fruits</Link>
                <Link href="/products?category=beverages">Beverages</Link>
                <Link href="/products?category=herbal">Herbal</Link>
                <Link href="/products?category=superfoods">Superfoods</Link>
                <Link href="/support">Help</Link>
              </div>
            </div>
          </div>
          <div className="m-footer-bottom">
            <p>&copy; 2024 <span data-brand='full-name'>Curfee Organic Market</span>. Made with <span data-brand='logo-emoji'>🌿</span> in India</p>
          </div>
        </footer>
      ) : (
        <footer className="footer">
          <div className="container">
            <div className="footer-bottom">
              <p>&copy; 2024 <span data-brand='full-name'>Curfee Organic Market</span>.</p>
            </div>
          </div>
        </footer>
      )}
    </>
  );
}
