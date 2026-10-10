import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const dist = resolve('dist');
const failures = [];
const files = [];
function existsWithExactCase(path) {
  const parts = relative(dist, path).split(/[\\/]+/).filter(Boolean);
  let current = dist;
  for (const part of parts) {
    if (!existsSync(current) || !statSync(current).isDirectory()) return false;
    if (!readdirSync(current).includes(part)) return false;
    current = join(current, part);
  }
  return existsSync(current);
}

if (existsWithExactCase(join(dist, 'Index.html'))) {
  failures.push('case-sensitive path resolver accepted mismatched root route casing');
}

function walk(directory) {
  for (const item of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, item.name);
    if (item.isDirectory()) walk(path);
    else if (item.name.endsWith('.html')) files.push(path);
  }
}
walk(dist);

const canonicalUrls = new Set();
const pageTitles = new Set();
const descriptions = new Set();
for (const file of files) {
  const html = readFileSync(file, 'utf8');
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1];
  const title = html.match(/<title>(.*?)<\/title>/i)?.[1];
  const description = html.match(/<meta name="description" content="([^"]+)"/i)?.[1];
  if (!canonical || !title || !description) failures.push(`${file}: missing title, description or canonical`);
  if (canonicalUrls.has(canonical)) failures.push(`${file}: duplicate canonical ${canonical}`);
  canonicalUrls.add(canonical);
  if (pageTitles.has(title)) failures.push(`${file}: duplicate page title ${title}`);
  pageTitles.add(title);
  if (descriptions.has(description)) failures.push(`${file}: duplicate meta description`);
  descriptions.add(description);

  for (const [, json] of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) {
    try { JSON.parse(json); }
    catch { failures.push(`${file}: invalid JSON-LD`); }
  }
  const scriptTags = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  const clientScripts = scriptTags.filter(([, attrs]) => !/type="application\/ld\+json"/i.test(attrs));
  const route = canonical ? new URL(canonical).pathname : '';
  if (route === '/tools/electricity-cost-calculator/' || route === '/tools/xmrig-log-decoder/' || route === '/tools/monero-mining-profitability-calculator/') {
    const attrs = clientScripts[0]?.[1] ?? '';
    const scriptSrc = attrs.match(/\bsrc="([^"]+)"/i)?.[1];
    const scriptFile = scriptSrc ? join(dist, decodeURIComponent(new URL(scriptSrc, canonical).pathname.replace(/^\/+/, ''))) : null;
    if (clientScripts.length !== 1 || !/type="module"/i.test(attrs) || !scriptFile || !existsSync(scriptFile)) {
      failures.push(`${file}: expected one external tool module asset`);
    } else if (statSync(scriptFile).size > (route.includes('decoder') ? 16_000 : 12_000)) failures.push(`${file}: tool script exceeds its uncompressed size budget`);
    const required = route.includes('profitability')
      ? ['All numeric inputs start blank', 'Expected-value estimate', 'not a payout', 'no live data', 'expectedRewardPerBlock']
      : route.includes('decoder')
      ? ['Your pasted log is processed locally', 'not uploaded by this tool', 'Unknown output stays unknown', 'wallet addresses']
      : ['How the calculation works', 'kWh = (watts ÷ 1,000) × hours', 'CPU package power', 'no tariff is assumed'];
    for (const text of required) {
      if (!html.includes(text)) failures.push(`${file}: missing static tool content: ${text}`);
    }
  } else if (clientScripts.length) {
    failures.push(`${file}: unexpected client-side script outside the calculator route`);
  }

  for (const [, href] of html.matchAll(/\bhref="([^"]*)"/g)) {
    if (!href || href === '#' || /^(javascript|data):/i.test(href)) {
      failures.push(`${file}: empty or placeholder href ${JSON.stringify(href)}`);
      continue;
    }
    let url;
    try { url = new URL(href, canonical); }
    catch { failures.push(`${file}: invalid href ${href}`); continue; }
    if (url.origin !== new URL(canonical).origin) continue;
    const pathname = decodeURIComponent(url.pathname);
    const target = join(dist, pathname.replace(/^\/+/, ''));
    const candidates = [target, join(target, 'index.html'), `${target}.html`];
    const targetFile = candidates.find((candidate) => existsWithExactCase(candidate) && statSync(candidate).isFile());
    if (!targetFile) {
      failures.push(`${file}: broken internal link ${href}`);
      continue;
    }
    if (url.hash) {
      const targetHtml = readFileSync(targetFile, 'utf8');
      const id = decodeURIComponent(url.hash.slice(1)).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (!new RegExp(`\\bid=["']${id}["']`).test(targetHtml)) failures.push(`${file}: missing fragment target ${href}`);
    }
  }
}

const expected = [
  'guides/xmrig-windows-setup/index.html', 'guides/xmrig-windows-security-warnings/index.html',
  'learn/xmrig-cpu-threads/index.html', 'learn/randomx-memory-cache/index.html',
  'troubleshoot/xmrig-huge-pages/index.html', 'troubleshoot/xmrig-msr-error/index.html',
  'troubleshoot/xmrig-low-hashrate/index.html',
  'tools/electricity-cost-calculator/index.html',
  'tools/monero-mining-profitability-calculator/index.html',
  'tools/xmrig-log-decoder/index.html',
];
for (const path of expected) {
  const fullPath = join(dist, path);
  if (!existsSync(fullPath)) failures.push(`missing published article ${path}`);
  else if (!readFileSync(fullPath, 'utf8').includes('<article')) failures.push(`article content is not statically rendered: ${path}`);
}

const sitemap = readFileSync(join(dist, 'sitemap.xml'), 'utf8');
for (const path of expected.map((item) => `/${item.replace('/index.html', '/')}`)) {
  if (!sitemap.includes(path)) failures.push(`sitemap is missing ${path}`);
}
if (/draft/i.test(sitemap)) failures.push('sitemap contains a draft marker');
for (const canonical of canonicalUrls) {
  if (!sitemap.includes(`<loc>${canonical}</loc>`)) failures.push(`sitemap is missing ${canonical}`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Verified ${files.length} static pages: unique canonical URLs, valid JSON-LD, resolved local links, published article content and sitemap entries.`);
}
