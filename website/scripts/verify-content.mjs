import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { htmlToHast } from 'satteri';
import { parse as parseYaml } from 'yaml';

function elements(node) {
  return [...(node.type === 'element' ? [node] : []), ...(node.children ?? []).flatMap(elements)];
}
const textContent = (node) => node.value ?? (node.children ?? []).map(textContent).join('');

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
    else if (item.name.endsWith('.html') && path !== join(dist, '404.html')) files.push(path);
  }
}
walk(dist);

const canonicalUrls = new Set();
const pageTitles = new Set();
const descriptions = new Set();
const errorPath = join(dist, '404.html');
if (!existsSync(errorPath) || !readFileSync(errorPath, 'utf8').includes('name="robots" content="noindex, follow"')) failures.push('missing protected static 404 error document');
let articleCount = 0;
const discoveryGraph = new Map();
for (const file of files) {
  const html = readFileSync(file, 'utf8');
  const renderedElements = elements(htmlToHast(html));
  const ids = renderedElements.flatMap((node) => node.properties.id ? [node.properties.id] : []);
  if (new Set(ids).size !== ids.length) failures.push(`${file}: duplicate rendered IDs`);
  const body = renderedElements.find((node) => node.properties.className?.includes('article-body'));
  if (body) {
    articleCount++;
    const headings = elements(body).filter((node) => /^h[2-6]$/.test(node.tagName)).map((node) => node.properties.id);
    const contents = renderedElements.filter((node) => node.tagName === 'nav' && node.properties.className?.includes('article-contents'));
    if (contents.length !== 2 || !headings.length) failures.push(`${file}: missing article contents or headings`);
    for (const nav of contents) {
      const targets = elements(nav).filter((node) => node.tagName === 'a').map((node) => decodeURIComponent(String(node.properties.href).slice(1)));
      if (JSON.stringify(targets) !== JSON.stringify(headings)) failures.push(`${file}: contents do not match rendered article headings`);
    }
  }
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
  const headings = renderedElements.filter((node) => node.tagName === 'h1');
  if (headings.length !== 1) failures.push(`${file}: expected exactly one H1`);
  const meta = (name) => renderedElements.find((node) => node.tagName === 'meta' && (node.properties.name === name || node.properties.property === name))?.properties.content;
  const renderedTitle = textContent(renderedElements.find((node) => node.tagName === 'title') ?? {});
  for (const name of ['og:title', 'twitter:title']) if (meta(name) !== renderedTitle) failures.push(`${file}: ${name} disagrees with the title`);
  for (const name of ['og:description', 'twitter:description']) if (meta(name) !== meta('description')) failures.push(`${file}: ${name} disagrees with the description`);
  if (meta('twitter:card') !== 'summary_large_image' || meta('og:image:type') !== 'image/png' || meta('og:image:width') !== '1200' || meta('og:image:height') !== '630') failures.push(`${file}: incomplete PNG social card metadata`);
  const schemas = renderedElements.filter((node) => node.tagName === 'script' && node.properties.type === 'application/ld+json').flatMap((node) => {
    try { return [JSON.parse(textContent(node))]; } catch { return []; }
  });
  if (route === '/') {
    const schema = schemas.find((item) => item['@type'] === 'WebSite');
    if (!schema || schema.name !== 'Ember' || schema.url !== canonical || schema.publisher?.name !== 'Ember' || schema.publisher?.['@type'] !== 'Organization') failures.push(`${file}: missing or inconsistent WebSite identity`);
  }
  if (body) {
    const article = schemas.find((item) => item['@type'] === 'TechArticle');
    const times = renderedElements.filter((node) => node.tagName === 'time').map((node) => node.properties.dateTime);
    if (!article || article.mainEntityOfPage !== canonical || article.headline !== textContent(headings[0] ?? {}) || article.description !== meta('description') || !times.includes(article.datePublished) || (article.dateModified && !times.includes(article.dateModified))) failures.push(`${file}: Article schema disagrees with visible content/dates`);
    const crumbs = schemas.find((item) => item['@type'] === 'BreadcrumbList')?.itemListElement;
    const origin = canonical ? new URL(canonical).origin : '';
    if (crumbs?.length !== 3 || crumbs.some((item, i) => item.position !== i + 1) || crumbs[0]?.item !== origin || crumbs[1]?.item !== `${origin}/${route.split('/')[1]}/` || crumbs[2]?.item !== canonical) failures.push(`${file}: inconsistent breadcrumb path`);
  }
  const main = renderedElements.find((node) => node.tagName === 'main');
  const links = elements(main ?? {}).filter((node) => node.tagName === 'a').flatMap((node) => {
    try {
      const url = new URL(String(node.properties.href), canonical);
      return url.origin === new URL(canonical).origin && url.pathname !== route ? [url.pathname] : [];
    } catch { return []; }
  });
  discoveryGraph.set(route, links);
  const mainNav = renderedElements.find((node) => node.tagName === 'nav' && node.properties.ariaLabel === 'Main navigation');
  if (!mainNav) failures.push(`${file}: missing main navigation`);
  else {
    for (const link of elements(mainNav).filter((node) => node.tagName === 'a')) {
      const href = String(link.properties.href);
      const expected = route === href ? 'page' : ['/learn/', '/guides/', '/troubleshoot/', '/tools/'].includes(href) && route.startsWith(href) ? 'location' : undefined;
      if (link.properties.ariaCurrent !== expected) failures.push(`${file}: incorrect current-page/location semantics for ${href}`);
    }
  }
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

if (articleCount !== 8) failures.push(`expected 8 articles with section navigation, found ${articleCount}`);
const reached = new Set(['/']);
const queue = ['/'];
for (const route of queue) for (const target of discoveryGraph.get(route) ?? []) {
  if (discoveryGraph.has(target) && !reached.has(target)) { reached.add(target); queue.push(target); }
}
for (const route of discoveryGraph.keys()) if (!reached.has(route)) failures.push(`${route}: unreachable from homepage main-content HTML links`);

const expected = [
  'guides/xmrig-windows-setup/index.html', 'guides/xmrig-windows-security-warnings/index.html',
  'learn/xmrig-cpu-threads/index.html', 'learn/randomx-memory-cache/index.html',
  'troubleshoot/xmrig-huge-pages/index.html', 'troubleshoot/xmrig-msr-error/index.html',
  'troubleshoot/xmrig-low-hashrate/index.html',
  'troubleshoot/xmrig-pool-shares-payments/index.html',
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
for (const file of readdirSync('src/content/articles').filter((name) => name.endsWith('.md'))) {
  const source = readFileSync(join('src/content/articles', file), 'utf8');
  const data = parseYaml(source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '');
  if (data?.draft) {
    const route = `/${data.section}/${file.replace(/\.md$/, '')}/`;
    if (discoveryGraph.has(route) || sitemap.includes(route)) failures.push(`draft article is published: ${route}`);
  }
}
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
  console.log(`Verified ${files.length} static pages: unique metadata, consistent social/Article/WebSite/Breadcrumb data, resolved local links and fragments, homepage HTML discovery, draft exclusions, ${articleCount} article contents matching rendered headings, unique IDs and sitemap entries.`);
}
