const fs = require('fs');
let html = fs.readFileSync('c:/Users/Welcome/Desktop/VSCODE/frontend/cart.html', 'utf8');

if (!html.includes('<body class="mobile-home-body">')) {
  // Inject m-header
  html = html.replace('<body>', `<body class="mobile-home-body">
  <!-- Mobile Header -->
  <header class="m-header" id="mHeader">
    <div class="m-header-top">
      <a href="index.html" class="m-logo">
        <div class="m-logo-icon"><span data-brand='logo-emoji'>🌿</span></div>
        <div class="m-logo-text"><span data-brand='name'>Curfee</span><span>Organic</span></div>
      </a>
      <div class="m-header-actions">
        <a href="dashboard.html" class="m-header-btn"><i class="fas fa-user"></i></a>
      </div>
    </div>
  </header>`);
}

if (!html.includes('m-bottom-nav')) {
  // Inject m-bottom-nav
  html = html.replace('</footer>', `</footer>

  <!-- Mobile Bottom Nav -->
  <nav class="m-bottom-nav">
    <a href="index.html" class="m-bnav-item"><i class="fas fa-home"></i><span>Home</span></a>
    <a href="categories.html" class="m-bnav-item"><i class="fas fa-th-large"></i><span>Categories</span></a>
    <a href="cart.html" class="m-bnav-item active"><div class="m-bnav-cart-icon"><i class="fas fa-shopping-cart"></i><span class="m-bnav-badge" id="cartCountMob" style="display:none">0</span></div><span>Cart</span></a>
    <a href="dashboard.html" class="m-bnav-item"><i class="fas fa-user"></i><span>Account</span></a>
    <a href="support.html" class="m-bnav-item"><i class="fas fa-headset"></i><span>Support</span></a>
  </nav>`);
}

fs.writeFileSync('c:/Users/Welcome/Desktop/VSCODE/frontend/cart.html', Buffer.from(html, 'utf8'));
console.log('Mobile layout injected!');
