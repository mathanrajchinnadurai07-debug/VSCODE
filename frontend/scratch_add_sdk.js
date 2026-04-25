const fs = require('fs');
let content = fs.readFileSync('admin.html', 'utf-8');

const sdkHtml = `
  <!-- Firebase Compat SDK -->
  <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"></script>
  <script src="js/firebase-config.js"></script>
  <script src="js/firebase-init.js"></script>
  <script src="js/products-data.js"></script>`;

content = content.replace('<script src="js/products-data.js"></script>', sdkHtml);
fs.writeFileSync('admin.html', content, 'utf-8');
console.log('Appended SDKs');
