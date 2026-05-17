const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const indexPath = path.join(root, 'public', 'index.html');
const mainJsPath = path.join(root, 'public', 'js', 'main.js');

const html = fs.readFileSync(indexPath, 'utf8');
const js = fs.readFileSync(mainJsPath, 'utf8');

const errors = [];

function unique(values) {
  return [...new Set(values)];
}

const openModalIds = unique([...html.matchAll(/openModal\('([^']+)'\)/g)].map((match) => match[1]));

function productEntry(id) {
  const startMarker = `  '${id}': {`;
  const start = js.indexOf(startMarker);
  if (start === -1) return '';

  const nextEntry = js.indexOf('\n  \'', start + startMarker.length);
  const productsEnd = js.indexOf('\n};', start + startMarker.length);
  const end = nextEntry === -1 ? productsEnd : Math.min(nextEntry, productsEnd);

  return js.slice(start, end);
}

for (const id of openModalIds) {
  if (!productEntry(id)) {
    errors.push(`Missing products entry for openModal('${id}')`);
  }
}

const contactOnlyIds = [
  'ig-premium',
  'bm-premium',
  'gmail',
  'fb-personal',
  'ig-personal',
  'tt-personal',
  'netflix',
];

for (const id of contactOnlyIds) {
  const entry = productEntry(id);
  if (!entry.includes('contactOnly: true')) {
    errors.push(`Expected contact-only product '${id}' to include contactOnly: true`);
  }
}

const directBuyIds = ['fb-blank', 'fb-10page', 'fb-5page', 'tw-1k'];

for (const id of directBuyIds) {
  const entry = productEntry(id);
  if (entry.includes('contactOnly: true')) {
    errors.push(`Direct-buy product '${id}' should not be contactOnly`);
  }
}

const requiredWindowHandlers = [
  'openAuth',
  'openModal',
  'handleBuy',
  'openTopup',
  'showToast',
  'closeModal',
];

for (const handler of requiredWindowHandlers) {
  if (!js.includes(`  ${handler},`)) {
    errors.push(`Expected ${handler} to be exported on window for inline HTML handlers`);
  }
}

if (!/function openModal\(id\)\s*\{[\s\S]*openContactProductModal\(null/.test(js)) {
  errors.push('openModal must show a fallback modal for unknown product ids');
}

if (!/function handleBuy\(productId\)\s*\{[\s\S]*showAuthMsg\('loginMsg'/.test(js)) {
  errors.push('handleBuy must guide guests to login/register before purchase');
}

if (!html.includes('js/main.js?v=')) {
  errors.push('index.html should cache-bust public/js/main.js with a version query');
}

if (errors.length) {
  console.error('Storefront check failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Storefront check OK (${openModalIds.length} product modal ids covered)`);
