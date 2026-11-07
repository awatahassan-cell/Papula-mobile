const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'docs');
const distDir = path.join(root, 'dist-website');
const zipFile = path.join(root, 'paupla-website.zip');

console.log('Building website distribution package in:', distDir);

if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

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
      if (entry.name.endsWith('.md') || (entry.name.endsWith('.txt') && entry.name !== 'robots.txt')) continue;
      fs.copyFileSync(srcPath, destPath);
      console.log('  Copied:', entry.name);
    }
  }
}

copyRecursive(srcDir, distDir);
console.log('\n[SUCCESS] Production website build ready in /dist-website!');

// Create standard Unix zip using tar (forward slashes for Linux hosts like Hostinger/cPanel)
console.log('\nCreating standard Unix paupla-website.zip...');
if (fs.existsSync(zipFile)) {
  fs.unlinkSync(zipFile);
}
try {
  execSync(`tar -a -c -f "${zipFile}" *`, { cwd: distDir, stdio: 'inherit' });
  const stat = fs.statSync(zipFile);
  console.log(`[SUCCESS] paupla-website.zip created (${(stat.size / 1024 / 1024).toFixed(2)} MB) with forward slashes (/)!`);
} catch (err) {
  console.error('[ERROR] Failed to create zip with tar:', err.message);
}
