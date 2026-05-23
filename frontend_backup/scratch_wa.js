const fs = require('fs');

// Pages to add the WhatsApp chat widget to
const pages = ['index.html', 'products.html', 'cart.html', 'categories.html', 'dashboard.html', 'product-detail.html'];

pages.forEach(page => {
  try {
    let content = fs.readFileSync(page, 'utf-8');
    // Skip if already added
    if (content.includes('whatsapp-chat.js')) {
      console.log(`${page}: already has widget, skipping`);
      return;
    }
    // Insert before </body>
    content = content.replace('</body>', '  <script src="js/whatsapp-chat.js"></script>\n</body>');
    fs.writeFileSync(page, content, 'utf-8');
    console.log(`${page}: ✅ widget added`);
  } catch (e) {
    console.log(`${page}: skipped (${e.message})`);
  }
});
