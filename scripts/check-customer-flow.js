const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const indexPath = path.join(root, 'public', 'index.html');
const mainJsPath = path.join(root, 'public', 'js', 'main.js');

const html = fs.readFileSync(indexPath, 'utf8');
const js = fs.readFileSync(mainJsPath, 'utf8');
const combined = `${html}\n${js}`;
const errors = [];

const requiredDomIds = [
  'guestNav',
  'userNav',
  'navHamburger',
  'modalOverlay',
  'authOverlay',
  'topupOverlay',
  'profileOverlay',
  'contactLine',
  'contactTelegram',
  'contactFacebook',
  'loginBtn',
  'registerBtn',
  'topupBtn',
];

for (const id of requiredDomIds) {
  if (!html.includes(`id="${id}"`)) {
    errors.push(`Missing required customer DOM id: ${id}`);
  }
}

const requiredWindowHandlers = [
  'openAuth',
  'closeAuth',
  'switchAuthTab',
  'doLogin',
  'doRegister',
  'doForgotPassword',
  'doVerifyOtp',
  'doLogout',
  'openModal',
  'closeModal',
  'handleBuy',
  'filterCat',
  'showToast',
  'copyText',
  'toggleDrawer',
  'closeDrawer',
  'openTopup',
  'closeTopup',
  'submitTopup',
  'useCoupon',
  'openProfile',
  'closeProfile',
  'saveUsername',
  'savePassword',
];

for (const handler of requiredWindowHandlers) {
  if (!new RegExp(`function\\s+${handler}\\s*\\(`).test(js)) {
    errors.push(`Missing function definition: ${handler}`);
  }
  if (!js.includes(`  ${handler},`)) {
    errors.push(`Expected ${handler} to be exported on window`);
  }
}

const onclickBodies = [...combined.matchAll(/onclick=["']([^"']+)["']/g)].map((match) => match[1]);
const allowedInlineHandlers = new Set([...requiredWindowHandlers, 'closeModalOuter', 'closeAuthOuter', 'closeTopupOuter', 'closeProfileOuter', 'hcMove']);
const ignoredCalls = new Set(['writeText', 'then']);

for (const body of onclickBodies) {
  const callNames = [...body.matchAll(/([A-Za-z_$][\w$]*)\s*\(/g)].map((match) => match[1]);
  for (const callName of callNames) {
    if (ignoredCalls.has(callName)) continue;
    if (!allowedInlineHandlers.has(callName)) {
      errors.push(`Inline onclick uses unguarded handler: ${callName} in "${body}"`);
    }
  }
}

if (!js.includes('function initLegacyClickDelegation()')) {
  errors.push('Missing initLegacyClickDelegation safety net');
}

if (!js.includes("safeInit('initLegacyClickDelegation', initLegacyClickDelegation)")) {
  errors.push('initLegacyClickDelegation must run on DOMContentLoaded');
}

if (!js.includes('function initContactFallbacks()')) {
  errors.push('Missing initContactFallbacks for dead contact links');
}

if (!js.includes("safeInit('initContactFallbacks', initContactFallbacks)")) {
  errors.push('initContactFallbacks must run on DOMContentLoaded');
}

if (!/contactFacebook[\s\S]*preventDefault\(\)[\s\S]*showToast/.test(js)) {
  errors.push('contactFacebook must prevent dead # clicks and show a fallback message');
}

if (!html.includes('js/main.js?v=')) {
  errors.push('public/js/main.js must be cache-busted in index.html');
}

if (/href="#" class="contact-card" id="contactFacebook"/.test(html) && !js.includes('initContactFallbacks')) {
  errors.push('contactFacebook href="#" requires a JS fallback');
}

if (!/function handleBuy\(productId\)\s*\{[\s\S]*openAuth\('login'\)/.test(js)) {
  errors.push('handleBuy must guide guests to login');
}

if (!/function openTopup\(\)\s*\{[\s\S]*openAuth\('login'\)/.test(js)) {
  errors.push('openTopup must guide guests to login');
}

if (errors.length > 0) {
  console.error('Customer flow check failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Customer flow check OK (${onclickBodies.length} inline click surfaces covered)`);
