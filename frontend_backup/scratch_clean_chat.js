const fs = require('fs');
const path = require('path');
const dir = 'c:\\Users\\Welcome\\Desktop\\VSCODE\\frontend';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
  const fp = path.join(dir, file);
  let c = fs.readFileSync(fp, 'utf8');
  const before = c.length;
  
  // Remove entire chat-widget blocks (multi-line)
  c = c.replace(/<div class="chat-widget">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi, '');
  
  // Remove wa-float-btn links
  c = c.replace(/<a[^>]*class="wa-float-btn"[^>]*>[\s\S]*?<\/a>/gi, '');
  
  // Remove wa-tooltip divs
  c = c.replace(/<div[^>]*class="wa-tooltip"[^>]*>[\s\S]*?<\/div>/gi, '');
  
  // Remove standalone whatsapp floating buttons
  c = c.replace(/<a[^>]*wa\.me[^>]*>[\s\S]*?<\/a>/gi, (match) => {
    // Only remove if it's a floating/standalone WA link, not inline text
    if (match.includes('wa-float') || match.includes('position:fixed')) return '';
    return match; // keep inline wa.me links
  });

  if (c.length !== before) {
    fs.writeFileSync(fp, c, 'utf8');
    console.log(`✅ ${file}: cleaned (${before - c.length} chars removed)`);
  } else {
    console.log(`⏭️  ${file}: already clean`);
  }
});
