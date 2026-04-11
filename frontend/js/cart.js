/* Cart Page Logic */
document.addEventListener('DOMContentLoaded', renderCart);
function renderCart() {
  const cart = getLocalCart(), content = document.getElementById('cartContent'), empty = document.getElementById('emptyCart');
  if (!cart.length) { content.style.display = 'none'; empty.style.display = 'flex'; return; }
  content.style.display = 'grid'; empty.style.display = 'none';
  document.getElementById('cartItems').innerHTML = `<div style="display:flex;flex-direction:column;gap:16px;">${cart.map(item => `
    <div style="display:flex;align-items:flex-start;gap:16px;padding:16px;border:1px solid var(--border);border-radius:var(--radius-sm);background:#fff;position:relative;">
      <button class="btn-icon" style="position:absolute;top:10px;right:10px;color:var(--danger);" onclick="removeItem('${item.productId}','${item.weight}')"><i class="fas fa-trash"></i></button>
      <div style="width:70px;height:70px;min-width:70px;background:var(--bg);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:2rem;"><img src="${item.image || 'assets/images/products/tomato.png'}" style="width:100%;height:100%;border-radius:8px;object-fit:cover;" onerror="this.style.display='none';this.parentElement.innerHTML='🌿'"></div>
      <div style="flex:1;">
        <div style="font-weight:600;font-size:1rem;margin-bottom:4px;padding-right:24px;">${item.name}</div>
        <div style="color:var(--text-light);font-size:0.8rem;margin-bottom:8px;">${item.weight}</div>
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
          <div style="font-size:1.1rem;font-weight:700;color:var(--primary);">₹${item.price} <span style="font-size:0.75rem;color:var(--text-light);font-weight:400;">(${item.originalPrice>item.price?'<s style="margin-right:2px">₹'+item.originalPrice+'</s>':''}each)</span></div>
          <div class="quantity-control"><button onclick="updateQty('${item.productId}','${item.weight}',-1)">−</button><input type="number" value="${item.quantity}" min="1" readonly style="width:36px;text-align:center;"><button onclick="updateQty('${item.productId}','${item.weight}',1)">+</button></div>
        </div>
      </div>
    </div>`).join('')}</div>`;
  updateSummary(cart);
}
function updateQty(pid, w, d) { const c = getLocalCart(); const i = c.find(x => x.productId === pid && x.weight === w); if (i) { i.quantity = Math.max(1, i.quantity + d); saveLocalCart(c); renderCart(); } }
function removeItem(pid, w) { removeFromLocalCart(pid, w); renderCart(); showToast('Item removed', 'info'); }
function updateSummary(cart) { const sub = cart.reduce((s,i) => s + i.price*i.quantity, 0); const del = sub >= 500 ? 0 : 40; document.getElementById('subtotal').textContent = '₹'+sub; document.getElementById('delivery').textContent = del===0?'FREE':'₹'+del; document.getElementById('total').textContent = '₹'+(sub+del); }
