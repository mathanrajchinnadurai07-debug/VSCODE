/* =============================================================
   Curfee — Smart Chatbot Widget (No WhatsApp branding)
   ============================================================= */
(function() {
  const STORE_NAME   = 'Curfee Organic Market';
  const STORE_HOURS  = '9:00 AM – 9:00 PM';
  const CURRENT_HOUR = new Date().getHours();
  const IS_OPEN      = CURRENT_HOUR >= 9 && CURRENT_HOUR < 21;
  const isMobile     = window.innerWidth <= 600;

  const AUTO_REPLIES = {
    greeting: `🌿 Welcome to ${STORE_NAME}!\n\nHi! I'm Curfee Bot, your 24/7 assistant.\n\nHow can I help?\n\n1️⃣ Track my order\n2️⃣ Product information\n3️⃣ Delivery & shipping\n4️⃣ Returns & refunds\n5️⃣ Speak to a human`,
    order_tracking: `📦 Track Your Order\n\nTo track your order:\n🔗 ${window.location.origin}/order-tracking.html\n\nOr share your Order ID and we'll check it for you!\n\nOrders placed before 2 PM ship same day.`,
    delivery: `🚚 Delivery Info\n\n✅ Free delivery above ₹499\n📦 Standard: 2-4 business days\n⚡ Express: Next day (select areas)\n\nBelow ₹499 → ₹49 fee\nAbove ₹499 → FREE\n\n📍 We deliver across India!`,
    returns: `↩️ Returns & Refunds\n\n✅ 7-day easy returns\n✅ Full refund for damaged items\n✅ Replacement for wrong items\n\n1. Share order ID\n2. Tell us the issue\n3. We'll arrange pickup\n4. Refund in 5-7 days`,
    products: `🌿 Our Products\n\n16 categories including:\n• 🥬 Fresh Vegetables\n• 🍎 Organic Fruits\n• 🍗 Country Chicken & Mutton\n• 🍯 Honey & Spreads\n• 🌾 Flour & Grains\n• And 200+ more!\n\n🛒 Shop: ${window.location.origin}/products.html`,
    payment: `💳 Payment Methods\n\n✅ Google Pay / UPI\n✅ PhonePe\n✅ Credit / Debit Cards\n✅ Net Banking\n✅ Cash on Delivery\n\n🔒 Secured by Razorpay (RBI approved)`,
    hours: `🕐 Store Hours\n\n⏰ ${STORE_HOURS}\n📅 Monday to Sunday\n\n${IS_OPEN ? '🟢 We are OPEN!' : '🔴 Currently CLOSED\nLeave a message!'}\n\nBot is 24/7! 🤖`,
    fallback: `Thanks for reaching out! 🌿\n\nOur team will reply within ${IS_OPEN ? '5 minutes' : 'a few hours'}.\n\n📦 Track: ${window.location.origin}/order-tracking.html\n🛒 Shop: ${window.location.origin}/products.html`
  };

  const css = `
#cb-btn{position:fixed;bottom:80px;right:16px;z-index:9999;width:58px;height:58px;border-radius:50%;background:linear-gradient(135deg,#1a5c38,#2d9f5a);color:#fff;border:none;cursor:pointer;box-shadow:0 4px 20px rgba(26,92,56,0.4);display:flex;align-items:center;justify-content:center;font-size:1.5rem;transition:all 0.3s;animation:cb-float 3s ease-in-out infinite}
#cb-btn:hover{transform:scale(1.1);box-shadow:0 6px 28px rgba(26,92,56,0.5)}
@keyframes cb-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
#cb-badge{position:absolute;top:-2px;right:-2px;width:20px;height:20px;background:#e05a2b;border-radius:50%;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:0.6rem;font-weight:700;color:#fff}
#cb-widget{position:fixed;bottom:150px;right:16px;z-index:10000;width:360px;border-radius:18px;overflow:hidden;box-shadow:0 10px 50px rgba(0,0,0,0.2);display:none;flex-direction:column;font-family:'Segoe UI',sans-serif;max-height:540px;background:#fff}
#cb-widget.open{display:flex;animation:cb-up 0.3s ease}
@keyframes cb-up{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
@media(max-width:600px){
  #cb-widget{position:fixed;inset:0;width:100%;max-height:100%;border-radius:0;bottom:0;right:0;max-width:100%}
  #cb-widget.open{animation:cb-slide 0.3s ease}
  @keyframes cb-slide{from{transform:translateY(100%)}to{transform:translateY(0)}}
  #cb-btn{bottom:72px;right:12px;width:54px;height:54px}
}
.cb-head{background:linear-gradient(135deg,#1B4332,#2D6A4F);padding:16px;display:flex;align-items:center;gap:12px}
.cb-avatar{width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0}
.cb-name{color:#fff;font-weight:700;font-size:1rem}
.cb-stat{color:rgba(255,255,255,0.7);font-size:0.73rem;display:flex;align-items:center;gap:5px}
.cb-dot{width:7px;height:7px;border-radius:50%;background:#4ade80;animation:cb-blink 1.5s infinite}
@keyframes cb-blink{0%,100%{opacity:1}50%{opacity:0.3}}
.cb-close{margin-left:auto;background:none;border:none;color:rgba(255,255,255,0.7);cursor:pointer;font-size:1.2rem;padding:4px}
.cb-close:hover{color:#fff}
.cb-msgs{background:#f0f2f5;flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;min-height:200px}
.cb-msg{max-width:85%;border-radius:14px;padding:11px 14px;font-size:0.84rem;line-height:1.5}
.cb-msg.bot{background:#fff;color:#111;border-bottom-left-radius:4px;align-self:flex-start;box-shadow:0 1px 3px rgba(0,0,0,0.06);white-space:pre-wrap}
.cb-msg.user{background:#1a5c38;color:#fff;border-bottom-right-radius:4px;align-self:flex-end}
.cb-msg.typing{padding:14px 18px}
.cb-dots{display:flex;gap:5px}
.cb-dots span{width:8px;height:8px;border-radius:50%;background:#aaa;animation:cb-dp 1.2s infinite}
.cb-dots span:nth-child(2){animation-delay:0.2s}
.cb-dots span:nth-child(3){animation-delay:0.4s}
@keyframes cb-dp{0%,100%{transform:scale(0.7);opacity:0.4}50%{transform:scale(1);opacity:1}}
.cb-quick{padding:10px 14px;background:#f0f2f5;display:flex;flex-wrap:wrap;gap:7px;border-top:1px solid #e2e8f0}
.cb-qb{padding:7px 14px;border-radius:20px;font-size:0.76rem;font-weight:600;border:1.5px solid #1a5c38;color:#1a5c38;background:#fff;cursor:pointer;transition:0.15s}
.cb-qb:hover{background:#1a5c38;color:#fff}
.cb-input{display:flex;background:#fff;border-top:1px solid #e2e8f0;padding:10px 12px;gap:8px}
.cb-input input{flex:1;border:1.5px solid #e2e8f0;border-radius:22px;padding:10px 16px;font-size:0.85rem;outline:none;font-family:inherit}
.cb-input input:focus{border-color:#1a5c38}
.cb-input button{width:40px;height:40px;border-radius:50%;background:#1a5c38;color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:0.9rem;transition:0.2s}
.cb-input button:hover{background:#2d9f5a}
`;

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  document.body.insertAdjacentHTML('beforeend', `
    <button id="cb-btn" onclick="cbToggle()" title="Chat with us">
      <i class="fas fa-comment-dots"></i>
      <div id="cb-badge">1</div>
    </button>
    <div id="cb-widget">
      <div class="cb-head">
        <div class="cb-avatar">🤖</div>
        <div>
          <div class="cb-name">Curfee Bot</div>
          <div class="cb-stat"><span class="cb-dot"></span> ${IS_OPEN ? 'Online now' : 'Always active'}</div>
        </div>
        <button class="cb-close" onclick="cbToggle()"><i class="fas fa-times"></i></button>
      </div>
      <div class="cb-msgs" id="cbMsgs"></div>
      <div class="cb-quick">
        <button class="cb-qb" onclick="cbQuick('track')">📦 Track Order</button>
        <button class="cb-qb" onclick="cbQuick('delivery')">🚚 Delivery</button>
        <button class="cb-qb" onclick="cbQuick('returns')">↩️ Returns</button>
        <button class="cb-qb" onclick="cbQuick('payment')">💳 Payment</button>
        <button class="cb-qb" onclick="cbQuick('hours')">🕐 Hours</button>
      </div>
      <div class="cb-input">
        <input id="cbIn" placeholder="Ask me anything..." onkeypress="if(event.key==='Enter')cbSend()">
        <button onclick="cbSend()"><i class="fas fa-paper-plane"></i></button>
      </div>
    </div>
  `);

  let isOpen = false, msgCount = 0;

  window.cbToggle = function() {
    isOpen = !isOpen;
    document.getElementById('cb-widget').classList.toggle('open', isOpen);
    if (isOpen) {
      document.getElementById('cb-badge').style.display = 'none';
      if (msgCount === 0) setTimeout(() => typeThen(AUTO_REPLIES.greeting), 500);
      setTimeout(() => document.getElementById('cbIn')?.focus(), 300);
      if (isMobile) document.body.style.overflow = 'hidden';
    } else {
      if (isMobile) document.body.style.overflow = '';
    }
  };

  window.cbQuick = function(type) {
    const labels = { track:'📦 Track my order', delivery:'🚚 Delivery info', returns:'↩️ Returns policy', payment:'💳 Payment methods', hours:'🕐 Store hours' };
    addMsg(labels[type], 'user');
    const map = { track:'order_tracking', delivery:'delivery', returns:'returns', payment:'payment', hours:'hours' };
    setTimeout(() => typeThen(AUTO_REPLIES[map[type]] || AUTO_REPLIES.fallback), 400);
  };

  window.cbSend = function() {
    const input = document.getElementById('cbIn');
    const text = (input?.value || '').trim();
    if (!text) return;
    input.value = '';
    addMsg(text, 'user');
    const lo = text.toLowerCase();
    let reply = AUTO_REPLIES.fallback;
    if (/order|track|where|status/.test(lo)) reply = AUTO_REPLIES.order_tracking;
    else if (/deliver|ship|time|days|fee|charge/.test(lo)) reply = AUTO_REPLIES.delivery;
    else if (/return|refund|replace|exchange|damage/.test(lo)) reply = AUTO_REPLIES.returns;
    else if (/pay|gpay|phonepe|card|upi|cod|cash/.test(lo)) reply = AUTO_REPLIES.payment;
    else if (/product|item|organic|fresh|category/.test(lo)) reply = AUTO_REPLIES.products;
    else if (/hour|time|open|close|available/.test(lo)) reply = AUTO_REPLIES.hours;
    else if (/hi|hello|hey|namaste|help/.test(lo)) reply = AUTO_REPLIES.greeting;
    setTimeout(() => typeThen(reply), 400);
  };

  function addMsg(text, type) {
    const msgs = document.getElementById('cbMsgs');
    const div = document.createElement('div');
    div.className = 'cb-msg ' + type;
    div.textContent = text;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    msgCount++;
  }

  function typeThen(text) {
    const msgs = document.getElementById('cbMsgs');
    const t = document.createElement('div');
    t.className = 'cb-msg bot typing';
    t.innerHTML = '<div class="cb-dots"><span></span><span></span><span></span></div>';
    msgs.appendChild(t);
    msgs.scrollTop = msgs.scrollHeight;
    setTimeout(() => { t.remove(); addMsg(text, 'bot'); }, 800 + Math.random() * 500);
  }

  setTimeout(() => {
    const b = document.getElementById('cb-badge');
    if (b && !isOpen) b.style.display = 'flex';
  }, 3000);
})();
