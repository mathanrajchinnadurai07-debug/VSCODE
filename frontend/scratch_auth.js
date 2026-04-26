const fs = require('fs');
let content = fs.readFileSync('js/auth.js', 'utf-8');
const searchStr = `    setTimeout(() => {
      const r = new URLSearchParams(window.location.search).get('redirect');
      window.location.href = r || 'index.html';
    }, 800);
  });
}`;
const replaceStr = `    setTimeout(() => {
      const r = new URLSearchParams(window.location.search).get('redirect');
      window.location.href = r || 'index.html';
    }, 800);
  }).catch(err => {
    console.error('Google Sign-In Error:', err);
    if(typeof showToast === 'function') showToast(err.message, 'error');
  });
}`;
content = content.replace(searchStr, replaceStr);
fs.writeFileSync('js/auth.js', content, 'utf-8');
console.log('Fixed googleLogin');
