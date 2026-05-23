const fs = require('fs');
const content = `\n// Added backward compatibility for addToCart as requested
window.addToCart = async function(productId, name, price, originalPrice, image) {
  // We check if auth and db are available globally
  if (typeof auth === 'undefined' || typeof db === 'undefined') {
    if (typeof fsAddToCart !== 'undefined') {
      return fsAddToCart(productId, name, price, image, '');
    }
    console.error('Firebase not initialized.');
    return;
  }
  
  const user = auth.currentUser;
  if (!user) {
    if (typeof showToast !== 'undefined') showToast('Please login to add items to cart', 'warning');
    setTimeout(() => {
      window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
    }, 1500);
    return;
  }
  try {
    const ref = db.collection('users').doc(user.uid).collection('cart').doc(productId);
    const doc = await ref.get();
    if (doc.exists) {
      await ref.update({ quantity: firebase.firestore.FieldValue.increment(1) });
    } else {
      await ref.set({
        productId, name, price, originalPrice: originalPrice || price,
        image: image || '', quantity: 1,
        addedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    if (typeof showToast !== 'undefined') showToast(\`✅ \${name} added to cart!\`, 'success');
    if (typeof updateCartCount !== 'undefined') updateCartCount();
  } catch (err) {
    console.error('Cart error:', err);
    if (typeof showToast !== 'undefined') showToast('Failed to add to cart. Try again.', 'error');
  }
};
`;
fs.appendFileSync('js/app.js', content, 'utf-8');
console.log('Appended to app.js');
