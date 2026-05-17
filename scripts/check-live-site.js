const defaultSiteUrl = 'https://www.accdee.shop';
const siteUrl = (process.env.SITE_URL || defaultSiteUrl).replace(/\/+$/, '');
const expectedMainJsVersion = '20260517-customer-flow';

const checks = [];

async function fetchText(pathname) {
  const url = `${siteUrl}${pathname}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'ACCDEE-live-smoke/1.0',
      'Accept': 'text/html,application/json,text/plain,*/*',
    },
  });

  const text = await response.text();
  return { url, response, text };
}

function addCheck(name, passed, detail) {
  checks.push({ name, passed, detail });
}

async function run() {
  const health = await fetchText('/api/health');
  addCheck('health status', health.response.ok, `${health.response.status} ${health.url}`);

  let healthJson = null;
  try {
    healthJson = JSON.parse(health.text);
  } catch {
    addCheck('health json', false, 'health response is not JSON');
  }

  if (healthJson) {
    addCheck('health service', healthJson.service === 'accdee', `service=${healthJson.service}`);
    addCheck('health production', healthJson.environment === 'production', `environment=${healthJson.environment}`);
  }

  const homepage = await fetchText('/');
  addCheck('homepage status', homepage.response.ok, `${homepage.response.status} ${homepage.url}`);
  addCheck('homepage brand', /ACCDEE/i.test(homepage.text), 'ACCDEE brand marker');
  addCheck('homepage customer js version', homepage.text.includes(expectedMainJsVersion), `expected ${expectedMainJsVersion}`);
  addCheck('homepage JSON-LD', homepage.text.includes('application/ld+json'), 'structured data marker');

  const robots = await fetchText('/robots.txt');
  addCheck('robots status', robots.response.ok, `${robots.response.status} ${robots.url}`);
  addCheck('robots sitemap', robots.text.includes(`${siteUrl}/sitemap.xml`), 'sitemap reference');
  addCheck('robots blocks admin', robots.text.includes('Disallow: /admin.html'), 'admin disallow');

  const sitemap = await fetchText('/sitemap.xml');
  addCheck('sitemap status', sitemap.response.ok, `${sitemap.response.status} ${sitemap.url}`);
  addCheck('sitemap homepage', sitemap.text.includes(`<loc>${siteUrl}/</loc>`), 'homepage loc');

  const failed = checks.filter((check) => !check.passed);
  for (const check of checks) {
    const prefix = check.passed ? 'OK' : 'FAIL';
    console.log(`${prefix} ${check.name}: ${check.detail}`);
  }

  if (failed.length > 0) {
    console.error(`Live site check failed: ${failed.length} issue(s)`);
    process.exit(1);
  }

  console.log(`Live site check OK: ${siteUrl}`);
}

run().catch((error) => {
  console.error('Live site check failed:', error.message);
  process.exit(1);
});
