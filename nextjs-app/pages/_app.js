import '../styles/globals.css';
import '../styles/style.css';
import '../styles/mobile-home.css';
import '../styles/flipkart-style.css';
import '../styles/checkout-mobile.css';
import '../styles/checkout.css';
import '../styles/search.css';
import { CartProvider } from '../context/CartContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function App({ Component, pageProps }) {
  return (
    <CartProvider>
      <Navbar />
      <Component {...pageProps} />
      <Footer />
    </CartProvider>
  );
}
