const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\Welcome\\Desktop\\VSCODE\\frontend';

function processDir(d) {
  const entries = fs.readdirSync(d, { withFileTypes: true });
  entries.forEach(e => {
    const fp = path.join(d, e.name);
    if (e.isDirectory() && e.name !== 'node_modules' && e.name !== '.git') {
      processDir(fp);
    } else if (e.isFile() && /\.(html|js|css)$/.test(e.name)) {
      let c = fs.readFileSync(fp, 'utf8');
      const orig = c;

      // Replace "50+" with "50+"
      c = c.replace(/175\+/g, '50+');

      // Replace "50+" with "50+"
      c = c.replace(/200\+/g, '50+');

      if (c !== orig) {
        fs.writeFileSync(fp, c, 'utf8');
        const count175 = (orig.match(/175\+/g) || []).length;
        const count200 = (orig.match(/200\+/g) || []).length;
        console.log(`✅ ${path.relative(dir, fp)}: replaced ${count175}x "50+" and ${count200}x "50+"`);
      }
    }
  });
}

processDir(dir);
console.log('\nDone! All product counts updated to 50+');
