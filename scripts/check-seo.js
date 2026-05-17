const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'public');
const indexPath = path.join(publicDir, 'index.html');
const robotsPath = path.join(publicDir, 'robots.txt');
const sitemapPath = path.join(publicDir, 'sitemap.xml');

const errors = [];

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function requireFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    errors.push(`Missing ${label}: ${path.relative(root, filePath)}`);
    return false;
  }
  return true;
}

function metaContent(html, nameOrProperty) {
  const pattern = new RegExp(`<meta\\s+(?:name|property)=["']${nameOrProperty}["']\\s+content=["']([^"']+)["']`, 'i');
  const match = html.match(pattern);
  return match ? match[1].trim() : '';
}

if (requireFile(indexPath, 'homepage')) {
  const html = read(indexPath);

  if (!/<html\s+lang=["']th["']/i.test(html)) {
    errors.push('Homepage must use html lang="th"');
  }

  const title = html.match(/<title>([^<]+)<\/title>/i);
  if (!title || title[1].trim().length < 20) {
    errors.push('Homepage title is missing or too short');
  }

  const description = metaContent(html, 'description');
  if (description.length < 50 || description.length > 180) {
    errors.push('Homepage meta description should be 50-180 characters');
  }

  for (const field of ['og:title', 'og:description', 'og:image', 'og:url', 'og:type']) {
    if (!metaContent(html, field)) {
      errors.push(`Missing Open Graph field: ${field}`);
    }
  }

  for (const field of ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']) {
    if (!metaContent(html, field)) {
      errors.push(`Missing Twitter field: ${field}`);
    }
  }

  if (!/<link\s+rel=["']canonical["']\s+href=["']https:\/\/www\.accdee\.shop\/["']/i.test(html)) {
    errors.push('Homepage canonical URL must be https://www.accdee.shop/');
  }

  const ogImage = metaContent(html, 'og:image');
  if (ogImage.startsWith('https://www.accdee.shop/images/')) {
    const imageName = ogImage.replace('https://www.accdee.shop/images/', '');
    if (!fs.existsSync(path.join(publicDir, 'images', imageName))) {
      errors.push(`Open Graph image file does not exist: public/images/${imageName}`);
    }
  }

  if (!html.includes('application/ld+json')) {
    errors.push('Homepage should include JSON-LD structured data');
  }

  if (/candy365/i.test(html)) {
    errors.push('Homepage should not contain old candy365 branding');
  }
}

if (requireFile(robotsPath, 'robots.txt')) {
  const robots = read(robotsPath);
  if (!robots.includes('Sitemap: https://www.accdee.shop/sitemap.xml')) {
    errors.push('robots.txt must reference the public sitemap');
  }
  for (const privatePath of ['/admin.html', '/admin-login.html', '/api/', '/uploads/']) {
    if (!robots.includes(`Disallow: ${privatePath}`)) {
      errors.push(`robots.txt should disallow ${privatePath}`);
    }
  }
}

if (requireFile(sitemapPath, 'sitemap.xml')) {
  const sitemap = read(sitemapPath);
  if (!sitemap.includes('<loc>https://www.accdee.shop/</loc>')) {
    errors.push('sitemap.xml must include homepage');
  }
  if (/admin|api|uploads|reset-password|orders|wallet/.test(sitemap)) {
    errors.push('sitemap.xml must not include private/admin/API pages');
  }
}

if (errors.length > 0) {
  console.error('SEO check failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('SEO check OK');
