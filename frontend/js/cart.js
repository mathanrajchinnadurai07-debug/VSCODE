/* Cart Page Logic */
document.addEventListener('DOMContentLoaded', renderCart);
function renderCart() {
  const cart = getLocalCart(), content = document.getElementById('cartContent'), empty = document.getElementById('emptyCart');
  if (!cart.length) { content.style.display = 'none'; empty.style.display = 'block'; return; }
  content.style.display = 'grid'; empty.style.display = 'none';
  document.getElementById('cartItems').innerHTML = `<table class="cart-table"><thead><tr><th>Product</th><th>Price</th><th>Quantity</th><th>Total</th><th></th></tr></thead><tbody>${cart.map(item => `<tr><td><div class="cart-product"><div class="cart-img" style="display:flex;align-items:center;justify-content:center;font-size:2rem;background:var(--bg);border-radius:var(--radius-sm);">🌿</div><div><div class="cart-name">${item.name}</div><div class="cart-weight">${item.weight}</div></div></div></td><td><strong>₹${item.price}</strong>${item.originalPrice>item.price?'<br><s style="color:#999;font-size:0.75rem;">₹'+item.originalPrice+'</s>':''}</td><td><div class="quantity-control"><button onclick="updateQty('${item.productId}','${item.weight}',-1)">−</button><input type="number" value="${item.quantity}" min="1" readonly><button onclick="updateQty('${item.productId}','${item.weight}',1)">+</button></div></td><td><strong>₹${item.price*item.quantity}</strong></td><td><button class="btn-icon" onclick="removeItem('${item.productId}','${item.weight}')"><i class="fas fa-trash"></i></button></td></tr>`).join('')}</tbody></table>`;
  updateSummary(cart);
}
function updateQty(pid, w, d) { const c = getLocalCart(); const i = c.find(x => x.productId === pid && x.weight === w); if (i) { i.quantity = Math.max(1, i.quantity + d); saveLocalCart(c); renderCart(); } }
function removeItem(pid, w) { removeFromLocalCart(pid, w); renderCart(); showToast('Item removed', 'info'); }
function updateSummary(cart) { const sub = cart.reduce((s,i) => s + i.price*i.quantity, 0); const del = sub >= 500 ? 0 : 40; document.getElementById('subtotal').textContent = '₹'+sub; document.getElementById('delivery').textContent = del===0?'FREE':'₹'+del; document.getElementById('total').textContent = '₹'+(sub+del); }
