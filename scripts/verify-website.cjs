const fs = require('fs');
const path = require('path');
const docsDir = path.resolve(__dirname, '../docs');

const files = ['index.html', 'privacy.html', 'terms.html'];
let totalLinks = 0;
let errors = 0;

for (const f of files) {
  const content = fs.readFileSync(path.join(docsDir, f), 'utf8');
  const regex = /(?:src|href)="([^"]+)"/g;
  let match;
  console.log(`\n--- Checking ${f} ---`);
  while ((match = regex.exec(content)) !== null) {
    const val = match[1];
    if (val.startsWith('#') || val.startsWith('http') || val.startsWith('mailto:')) continue;
    const cleanPath = val.split('#')[0];
    const resolved = path.join(docsDir, cleanPath);
    totalLinks++;
    if (!fs.existsSync(resolved)) {
      console.error(`  [FAIL] Missing: ${val}`);
      errors++;
    } else {
      console.log(`  [OK] Found: ${val}`);
    }
  }
}

console.log(`\nTotal verified links/assets: ${totalLinks}`);
console.log(`Errors: ${errors}`);
process.exit(errors > 0 ? 1 : 0);
