/* ==========================================================
   Curfee — Cart Page Logic (Firestore Real-Time)
   Uses onSnapshot for live cart updates
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const content = document.getElementById('cartContent');
  const empty = document.getElementById('emptyCart');

  // Check if user is logged in
  if (typeof auth !== 'undefined') {
    auth.onAuthStateChanged(user => {
      if (user) {
        // Start real-time listener for cart
        listenToCart(user.uid);
      } else {
        // Redirect to login page automatically
        window.location.href = 'login.html?redirect=cart.html';
      }
    });
  } else {
    window.location.href = 'login.html?redirect=cart.html';
  }
});

function listenToCart(uid) {
  const content = document.getElementById('cartContent');
  const empty = document.getElementById('emptyCart');

  db.collection('users').doc(uid).collection('cart').onSnapshot(snap => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (!items.length) {
      if (content) content.style.display = 'none';
      if (empty) empty.style.display = 'flex';
      return;
    }

    if (content) content.style.display = 'grid';
    if (empty) empty.style.display = 'none';

    const itemsHTML = items.map(item => {
      const imgSrc = item.imageUrl || item.image || '';
      return `
      <div style="display:flex;align-items:flex-start;gap:16px;padding:16px;border:1px solid var(--border);border-radius:var(--radius-sm);background:#fff;position:relative;">
        <button class="btn-icon" style="position:absolute;top:10px;right:10px;color:var(--danger);" onclick="removeCartItem('${item.id}')"><i class="fas fa-trash"></i></button>
        <div style="width:70px;height:70px;min-width:70px;background:var(--bg);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:2rem;">
          ${imgSrc ? `<img src="${imgSrc}" style="width:100%;height:100%;border-radius:8px;object-fit:cover;" onerror="this.style.display='none';this.parentElement.innerHTML='🌿'">` : '🌿'}
        </div>
        <div style="flex:1;">
          <div style="font-weight:600;font-size:1rem;margin-bottom:4px;padding-right:24px;">${item.name}</div>
          <div style="color:var(--text-light);font-size:0.8rem;margin-bottom:8px;">${item.unit || ''}</div>
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
            <div style="font-size:1.1rem;font-weight:700;color:var(--primary);">₹${item.price}
              ${item.originalPrice > item.price ? `<span style="font-size:0.75rem;color:var(--text-light);font-weight:400;"><s>₹${item.originalPrice}</s></span>` : ''}
            </div>
            <div class="quantity-control">
              <button onclick="updateCartQty('${item.id}', ${item.quantity - 1})">−</button>
              <input type="number" value="${item.quantity}" min="1" readonly style="width:36px;text-align:center;">
              <button onclick="updateCartQty('${item.id}', ${item.quantity + 1})">+</button>
            </div>
          </div>
        </div>
      </div>`;
    }).join('');

    const cartItemsEl = document.getElementById('cartItems');
    if (cartItemsEl) {
      cartItemsEl.innerHTML = `<div style="display:flex;flex-direction:column;gap:16px;">${itemsHTML}</div>`;
    }

    updateSummary(items);
  });
}

// Firestore cart actions
async function updateCartQty(productId, newQty) {
  if (newQty <= 0) {
    await fsRemoveFromCart(productId);
    showToast('Item removed', 'info');
  } else {
    await fsUpdateCartQty(productId, newQty);
  }
}

async function removeCartItem(productId) {
  await fsRemoveFromCart(productId);
  showToast('Item removed', 'info');
}

function updateSummary(items) {
  const sub = items.reduce((s, i) => s + (i.price * i.quantity), 0);
  const del = sub >= 499 ? 0 : 49;
  const subtotalEl = document.getElementById('subtotal');
  const deliveryEl = document.getElementById('delivery');
  const totalEl = document.getElementById('total');
  if (subtotalEl) subtotalEl.textContent = '₹' + sub;
  if (deliveryEl) deliveryEl.textContent = del === 0 ? 'FREE' : '₹' + del;
  if (totalEl) totalEl.textContent = '₹' + (sub + del);
}

// Fallback: render from localStorage
function renderLocalCart() {
  const cart = getLocalCart();
  const content = document.getElementById('cartContent');
  const empty = document.getElementById('emptyCart');
  if (!cart.length) {
    if (content) content.style.display = 'none';
    if (empty) empty.style.display = 'flex';
    return;
  }
  if (content) content.style.display = 'grid';
  if (empty) empty.style.display = 'none';
}
