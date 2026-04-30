/* =============================================================
   Curfee — WhatsApp Chat Widget + 24/7 Auto-Response Bot
   Drop this script into every page BEFORE </body>
   ============================================================= */

(function() {
  const WA_NUMBER    = '917845744038';
  const STORE_NAME   = 'Curfee Organic Market';
  const STORE_HOURS  = '9:00 AM – 9:00 PM';
  const CURRENT_HOUR = new Date().getHours();
  const IS_OPEN      = CURRENT_HOUR >= 9 && CURRENT_HOUR < 21;

  // ── Auto-reply messages ──
  const AUTO_REPLIES = {
    greeting: `🌿 *Welcome to ${STORE_NAME}!*\n\nHi! I'm your 24/7 assistant.\n\nHow can I help you today?\n\n1️⃣ Track my order\n2️⃣ Product information\n3️⃣ Delivery & shipping\n4️⃣ Returns & refunds\n5️⃣ Speak to a human agent`,
    order_tracking: `📦 *Track Your Order*\n\nTo track your order:\n🔗 ${window.location.origin}/order-tracking.html\n\nOr share your Order ID (e.g. ORD1234567890) and we'll check it for you!\n\n_Orders placed before 2 PM are shipped same day._`,
    delivery: `🚚 *Delivery Information*\n\n✅ Free delivery on orders above ₹499\n📦 Standard: 2-4 business days\n⚡ Express: Next day (select areas)\n\n*Delivery charges:*\n• Below ₹499 → ₹49 delivery fee\n• Above ₹499 → FREE\n\n📍 We deliver across India!`,
    returns: `↩️ *Returns & Refund Policy*\n\n✅ 7-day easy returns\n✅ Full refund for damaged items\n✅ Replacement for wrong items\n\n*How to return:*\n1. Share your order ID\n2. Tell us the issue\n3. We'll arrange pickup\n4. Refund in 5-7 business days\n\nQuestions? Reply here anytime!`,
    products: `🌿 *Our Products*\n\n📂 16 categories including:\n• 🥬 Fresh Vegetables\n• 🍎 Organic Fruits\n• 🍗 Country Chicken & Mutton\n• 🍯 Honey & Spreads\n• 🌾 Flour & Grains\n• 🍪 Healthy Biscuits\n• And 200+ more products!\n\n🛒 Shop at: ${window.location.origin}/products.html`,
    payment: `💳 *Payment Methods*\n\nWe accept:\n✅ Google Pay\n✅ PhonePe\n✅ Paytm\n✅ Credit / Debit Cards\n✅ Net Banking\n✅ Cash on Delivery (COD)\n✅ UPI\n\n🔒 100% secure payments via Razorpay (RBI approved)`,
    hours: `🕐 *Store Hours*\n\n⏰ We're open: ${STORE_HOURS}\n📅 Monday to Sunday\n\n${IS_OPEN ? '🟢 *We are currently OPEN!*' : '🔴 *We are currently CLOSED*\nLeave a message & we\'ll reply in the morning!'}\n\nFor urgent help, WhatsApp us anytime — our bot is 24/7! 🤖`,
    fallback: `Thanks for reaching out! 🌿\n\nOur team will reply within ${IS_OPEN ? '5 minutes' : 'a few hours (we open at 9 AM)'}.\n\nMeanwhile:\n📦 Track order: ${window.location.origin}/order-tracking.html\n🛒 Shop: ${window.location.origin}/products.html`
  };

  // ── Inject CSS ──
  const css = `
    #curfee-chat-btn{position:fixed;bottom:80px;right:16px;z-index:9999;width:58px;height:58px;border-radius:50%;background:#25D366;color:#fff;border:none;cursor:pointer;box-shadow:0 4px 20px rgba(37,211,102,0.4);display:flex;align-items:center;justify-content:center;font-size:1.6rem;transition:all 0.3s;animation:chat-bounce 2s ease infinite}
    #curfee-chat-btn:hover{transform:scale(1.1);background:#128C7E}
    @keyframes chat-bounce{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
    #curfee-chat-badge{position:absolute;top:-3px;right:-3px;width:18px;height:18px;background:#e05a2b;border-radius:50%;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:0.6rem;font-weight:700;color:#fff}
    #curfee-chat-widget{position:fixed;bottom:150px;right:16px;z-index:9999;width:340px;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.18);display:none;flex-direction:column;font-family:'Segoe UI',sans-serif;max-height:520px}
    #curfee-chat-widget.open{display:flex;animation:cw-slideup 0.3s ease}
    @keyframes cw-slideup{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
    .cw-header{background:linear-gradient(135deg,#1B4332,#2D6A4F);padding:14px 16px;display:flex;align-items:center;gap:10px}
    .cw-avatar{width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0}
    .cw-name{color:#fff;font-weight:700;font-size:0.92rem}
    .cw-status{color:rgba(255,255,255,0.7);font-size:0.72rem;display:flex;align-items:center;gap:4px}
    .cw-dot{width:7px;height:7px;border-radius:50%;background:#4ade80;animation:cw-blink 1.5s infinite}
    @keyframes cw-blink{0%,100%{opacity:1}50%{opacity:0.4}}
    .cw-close{margin-left:auto;background:none;border:none;color:rgba(255,255,255,0.7);cursor:pointer;font-size:1.1rem}
    .cw-close:hover{color:#fff}
    .cw-msgs{background:#f0f2f5;flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;max-height:320px}
    .cw-msg{max-width:85%;border-radius:12px;padding:10px 13px;font-size:0.82rem;line-height:1.45}
    .cw-msg.bot{background:#fff;color:#111;border-bottom-left-radius:2px;align-self:flex-start;box-shadow:0 1px 4px rgba(0,0,0,0.08);white-space:pre-wrap}
    .cw-msg.user{background:#d9fdd3;color:#111;border-bottom-right-radius:2px;align-self:flex-end}
    .cw-msg.typing{padding:12px 16px}
    .cw-typing-dots{display:flex;gap:4px}
    .cw-typing-dots span{width:7px;height:7px;border-radius:50%;background:#999;animation:cw-dot-pulse 1.2s infinite}
    .cw-typing-dots span:nth-child(2){animation-delay:0.2s}
    .cw-typing-dots span:nth-child(3){animation-delay:0.4s}
    @keyframes cw-dot-pulse{0%,100%{transform:scale(0.7);opacity:0.5}50%{transform:scale(1);opacity:1}}
    .cw-quick-btns{padding:10px 12px;background:#f0f2f5;display:flex;flex-wrap:wrap;gap:7px;border-top:1px solid #e2e8f0}
    .cw-qbtn{padding:6px 12px;border-radius:20px;font-size:0.75rem;font-weight:600;border:1.5px solid #25D366;color:#128C7E;background:#fff;cursor:pointer;transition:all 0.15s}
    .cw-qbtn:hover{background:#25D366;color:#fff}
    .cw-input-row{display:flex;background:#fff;border-top:1px solid #e2e8f0;padding:10px 12px;gap:8px}
    .cw-input{flex:1;border:1.5px solid #e2e8f0;border-radius:20px;padding:9px 14px;font-size:0.83rem;outline:none;font-family:inherit}
    .cw-input:focus{border-color:#25D366}
    .cw-send{width:38px;height:38px;border-radius:50%;background:#25D366;color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:0.9rem;transition:background 0.2s}
    .cw-send:hover{background:#128C7E}
    .cw-wa-btn{margin:10px 12px 12px;padding:10px;background:#25D366;color:#fff;border:none;border-radius:10px;font-weight:700;font-size:0.88rem;cursor:pointer;width:calc(100% - 24px);display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none}
    .cw-wa-btn:hover{background:#128C7E}
    @media(max-width:400px){#curfee-chat-widget{width:calc(100vw - 24px);right:12px}}
  `;

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ── Inject HTML ──
  document.body.insertAdjacentHTML('beforeend', `
    <button id="curfee-chat-btn" onclick="curfeeChatToggle()" title="Chat on WhatsApp">
      <i class="fab fa-whatsapp"></i>
      <div id="curfee-chat-badge">1</div>
    </button>
    <div id="curfee-chat-widget">
      <div class="cw-header">
        <div class="cw-avatar">🌿</div>
        <div>
          <div class="cw-name">${STORE_NAME}</div>
          <div class="cw-status"><span class="cw-dot"></span> ${IS_OPEN ? 'Online now' : 'Bot active 24/7'}</div>
        </div>
        <button class="cw-close" onclick="curfeeChatToggle()"><i class="fas fa-times"></i></button>
      </div>
      <div class="cw-msgs" id="cwMsgs"></div>
      <div class="cw-quick-btns">
        <button class="cw-qbtn" onclick="curfeeQuick('track')">📦 Track Order</button>
        <button class="cw-qbtn" onclick="curfeeQuick('delivery')">🚚 Delivery</button>
        <button class="cw-qbtn" onclick="curfeeQuick('returns')">↩️ Returns</button>
        <button class="cw-qbtn" onclick="curfeeQuick('payment')">💳 Payment</button>
        <button class="cw-qbtn" onclick="curfeeQuick('hours')">🕐 Hours</button>
      </div>
      <div class="cw-input-row">
        <input class="cw-input" id="cwInput" placeholder="Type a message..." onkeypress="if(event.key==='Enter') curfeeUserSend()">
        <button class="cw-send" onclick="curfeeUserSend()"><i class="fas fa-paper-plane"></i></button>
      </div>
      <a class="cw-wa-btn" id="cwWaLink" href="https://wa.me/${WA_NUMBER}?text=Hi%20Curfee!" target="_blank">
        <i class="fab fa-whatsapp"></i> Open in WhatsApp
      </a>
    </div>
  `);

  // ── Widget logic ──
  let isOpen = false;
  let msgCount = 0;

  window.curfeeChatToggle = function() {
    isOpen = !isOpen;
    const w = document.getElementById('curfee-chat-widget');
    const badge = document.getElementById('curfee-chat-badge');
    w.classList.toggle('open', isOpen);
    if (isOpen) {
      badge.style.display = 'none';
      if (msgCount === 0) setTimeout(() => botTypingThen(AUTO_REPLIES.greeting), 500);
      setTimeout(() => document.getElementById('cwInput')?.focus(), 300);
    }
  };

  window.curfeeQuick = function(type) {
    const labels = { track:'📦 Track my order', delivery:'🚚 Delivery info', returns:'↩️ Returns policy', payment:'💳 Payment methods', hours:'🕐 Store hours' };
    addMsg(labels[type] || type, 'user');
    updateWaLink(labels[type] || type);
    setTimeout(() => {
      const replies = { track: AUTO_REPLIES.order_tracking, delivery: AUTO_REPLIES.delivery, returns: AUTO_REPLIES.returns, payment: AUTO_REPLIES.payment, hours: AUTO_REPLIES.hours };
      botTypingThen(replies[type] || AUTO_REPLIES.fallback);
    }, 400);
  };

  window.curfeeUserSend = function() {
    const input = document.getElementById('cwInput');
    const text = (input?.value || '').trim();
    if (!text) return;
    input.value = '';
    addMsg(text, 'user');
    updateWaLink(text);

    const lower = text.toLowerCase();
    let reply = AUTO_REPLIES.fallback;
    if (/order|track|where|status|delivery status/.test(lower)) reply = AUTO_REPLIES.order_tracking;
    else if (/deliver|ship|time|days|fee|charge/.test(lower))   reply = AUTO_REPLIES.delivery;
    else if (/return|refund|replace|exchange|damage/.test(lower)) reply = AUTO_REPLIES.returns;
    else if (/pay|gpay|phonepe|card|upi|cod|cash/.test(lower))  reply = AUTO_REPLIES.payment;
    else if (/product|item|organic|fresh|category/.test(lower)) reply = AUTO_REPLIES.products;
    else if (/hour|time|open|close|available/.test(lower))      reply = AUTO_REPLIES.hours;
    else if (/hi|hello|hey|namaste|help/.test(lower))           reply = AUTO_REPLIES.greeting;

    setTimeout(() => botTypingThen(reply), 400);
  };

  function addMsg(text, type) {
    const msgs = document.getElementById('cwMsgs');
    const div = document.createElement('div');
    div.className = 'cw-msg ' + type;
    div.textContent = text;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    msgCount++;
  }

  function botTypingThen(text) {
    const msgs = document.getElementById('cwMsgs');
    const typing = document.createElement('div');
    typing.className = 'cw-msg bot typing';
    typing.innerHTML = '<div class="cw-typing-dots"><span></span><span></span><span></span></div>';
    msgs.appendChild(typing);
    msgs.scrollTop = msgs.scrollHeight;
    setTimeout(() => { typing.remove(); addMsg(text, 'bot'); }, 1000 + Math.random() * 500);
  }

  function updateWaLink(userMsg) {
    const link = document.getElementById('cwWaLink');
    if (link) link.href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(userMsg)}`;
  }

  // Show badge after 3 seconds
  setTimeout(() => {
    const badge = document.getElementById('curfee-chat-badge');
    if (badge && !isOpen) badge.style.display = 'flex';
  }, 3000);

})();
