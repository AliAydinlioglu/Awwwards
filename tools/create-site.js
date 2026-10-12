#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const siteName = process.argv[2];

if (!siteName) {
  console.log('\n❌ Usage: npm run new <site-slug>');
  console.log('   Example: npm run new kinetic-monolith\n');
  process.exit(1);
}

const slug = siteName.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
const rootDir = path.resolve(__dirname, '..');
const templateDir = path.join(rootDir, 'sites', '_template');
const targetDir = path.join(rootDir, 'sites', slug);

if (fs.existsSync(targetDir)) {
  console.log(`\n⚠️  Site "sites/${slug}" already exists!`);
  console.log(`   Preview it at: http://localhost:8080/sites/${slug}/\n`);
  process.exit(0);
}

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

copyRecursiveSync(templateDir, targetDir);

// Customize index.html title
const indexPath = path.join(targetDir, 'index.html');
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');
  const titleFormatted = slug.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  html = html.replace('Awwwards Site Template · Studio Concept', `${titleFormatted} · Awwwards Concept`);
  html = html.replace('STUDIO VOID', titleFormatted.toUpperCase());
  fs.writeFileSync(indexPath, html, 'utf8');
}

console.log(`\n✨ Successfully scaffolded new Awwwards site: sites/${slug}/`);
console.log(`📂 Location: ${targetDir}`);
console.log(`🌐 Live URL: http://localhost:8080/sites/${slug}/\n`);
