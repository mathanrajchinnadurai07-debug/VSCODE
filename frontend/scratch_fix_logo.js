const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\Welcome\\Desktop\\VSCODE\\frontend';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace the image tag with the old emoji span
  // Sometimes it's inside <div class="m-logo-icon"> or <span class="emoji"> etc.
  // The exact string is: <img src="assets/images/logo.png" alt="Curfee" style="width:100%;height:100%;object-fit:contain;">
  
  const searchStr = '<img src="assets/images/logo.png" alt="Curfee" style="width:100%;height:100%;object-fit:contain;">';
  
  if (content.includes(searchStr)) {
    content = content.split(searchStr).join("<span data-brand='logo-emoji'>🌿</span>");
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Replaced logo in ${file}`);
  }
});

// Also check admin.html for the placeholder text replacements
let adminPath = path.join(dir, 'admin.html');
if (fs.existsSync(adminPath)) {
    let adminContent = fs.readFileSync(adminPath, 'utf8');
    adminContent = adminContent.replace(/<span data-brand='logo-emoji'>🌿<\/span>/g, "🌿"); // just in case it got nested weirdly in placeholders
    fs.writeFileSync(adminPath, adminContent, 'utf8');
}
