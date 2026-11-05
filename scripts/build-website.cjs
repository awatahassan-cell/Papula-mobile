const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'docs');
const distDir = path.join(root, 'dist-website');

console.log('Building website distribution package in:', distDir);

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy website assets
function copyRecursive(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === 'images') continue; // internal markdown images
      if (!fs.existsSync(destPath)) fs.mkdirSync(destPath, { recursive: true });
      copyRecursive(srcPath, destPath);
    } else {
      if (entry.name.endsWith('.md') || entry.name.endsWith('.txt')) continue;
      fs.copyFileSync(srcPath, destPath);
      console.log('  Copied:', entry.name);
    }
  }
}

copyRecursive(srcDir, distDir);
console.log('\n[SUCCESS] Production website build ready in /dist-website!');
