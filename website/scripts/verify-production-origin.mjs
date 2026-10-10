import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { resolveSiteUrl } from '../src/lib/site-origin.mjs';

const dist = resolve('dist');
const failures = [];
const rawOrigin = process.env.SITE_URL;
let origin;
try {
  origin = resolveSiteUrl({ envValue: rawOrigin, releaseBuild: true });
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

if (!existsSync(dist)) {
  console.error('Production output is missing. Run npm run build with SITE_URL set before this verification.');
  process.exit(1);
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

const htmlFiles = walk(dist).filter((path) => path.endsWith('.html'));
const canonicalUrls = new Set();
const expectedImage = `${origin}/social-card.svg`;
const absolutePlaceholder = /(?:https?:)?\/\/(?:[a-z0-9-]+\.)*example\.com\b/i;
const localAbsoluteUrl = /https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:\/|\b)/i;
const metadata = (html, property) => {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.match(new RegExp(`<meta\\s+(?:property|name)="${escaped}"\\s+content="([^"]+)"`, 'i'))?.[1];
};

function routeForFile(file) {
  const rel = relative(dist, file).split(sep).join('/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${dirname(rel).split(sep).join('/')}/`;
  return `/${rel.replace(/\.html$/, '')}`;
}

function checkStructuredUrls(value, file) {
  if (Array.isArray(value)) {
    for (const item of value) checkStructuredUrls(item, file);
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (['url', 'item', 'mainEntityOfPage'].includes(key) && typeof child === 'string') {
      try {
        const parsed = new URL(child);
        if (parsed.origin !== origin) failures.push(`${file}: JSON-LD ${key} uses ${parsed.origin}, expected ${origin}`);
        if (parsed.pathname !== '/' && !parsed.pathname.endsWith('/')) failures.push(`${file}: JSON-LD ${key} lacks a trailing slash`);
      } catch {
        failures.push(`${file}: JSON-LD ${key} is not an absolute URL`);
      }
    } else {
      checkStructuredUrls(child, file);
    }
  }
}

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const route = routeForFile(file);
  const expectedCanonical = `${origin}${route}`;
  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];
  const ogUrl = metadata(html, 'og:url');
  const ogImage = metadata(html, 'og:image');
  const twitterImage = metadata(html, 'twitter:image');

  if (!route.endsWith('/')) failures.push(`${file}: generated route ${route} lacks a trailing slash`);
  if (canonical !== expectedCanonical) failures.push(`${file}: canonical is ${canonical ?? '(missing)'}, expected ${expectedCanonical}`);
  if (ogUrl !== expectedCanonical) failures.push(`${file}: Open Graph URL is ${ogUrl ?? '(missing)'}, expected ${expectedCanonical}`);
  if (ogImage !== expectedImage) failures.push(`${file}: Open Graph image is ${ogImage ?? '(missing)'}, expected ${expectedImage}`);
  if (twitterImage !== expectedImage) failures.push(`${file}: Twitter image is ${twitterImage ?? '(missing)'}, expected ${expectedImage}`);
  if (canonical) canonicalUrls.add(canonical);
  if (absolutePlaceholder.test(html)) failures.push(`${file}: placeholder example.com URL appears in production HTML`);
  if (localAbsoluteUrl.test(html)) failures.push(`${file}: localhost/loopback absolute URL appears in production HTML`);

  for (const [, encoded] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try { checkStructuredUrls(JSON.parse(encoded), file); }
    catch (error) {
      if (error instanceof SyntaxError) failures.push(`${file}: invalid JSON-LD`);
      else throw error;
    }
  }
}

if (htmlFiles.length !== 17) failures.push(`expected 17 static HTML routes, found ${htmlFiles.length}`);

const sitemapPath = join(dist, 'sitemap.xml');
const robotsPath = join(dist, 'robots.txt');
if (!existsSync(sitemapPath)) failures.push('sitemap.xml is missing');
if (!existsSync(robotsPath)) failures.push('robots.txt is missing');

if (existsSync(sitemapPath)) {
  const sitemap = readFileSync(sitemapPath, 'utf8');
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) => loc);
  for (const loc of locations) {
    try {
      const parsed = new URL(loc);
      if (parsed.origin !== origin) failures.push(`sitemap location uses ${parsed.origin}: ${loc}`);
      if (parsed.pathname !== '/' && !parsed.pathname.endsWith('/')) failures.push(`sitemap location lacks trailing slash: ${loc}`);
    } catch { failures.push(`invalid sitemap location: ${loc}`); }
  }
  if (locations.length !== htmlFiles.length) failures.push(`sitemap has ${locations.length} locations for ${htmlFiles.length} static pages`);
  for (const canonical of canonicalUrls) if (!locations.includes(canonical)) failures.push(`sitemap is missing canonical ${canonical}`);
  if (absolutePlaceholder.test(sitemap) || localAbsoluteUrl.test(sitemap)) failures.push('sitemap contains a placeholder or localhost URL');
}

if (existsSync(robotsPath)) {
  const robots = readFileSync(robotsPath, 'utf8');
  if (!robots.split(/\r?\n/).includes(`Sitemap: ${origin}/sitemap.xml`)) failures.push('robots.txt sitemap URL does not match the configured production origin');
  if (absolutePlaceholder.test(robots) || localAbsoluteUrl.test(robots)) failures.push('robots.txt contains a placeholder or localhost URL');
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Verified ${htmlFiles.length} static routes against ${origin}: canonical, Open Graph, social image, JSON-LD, sitemap, robots, slashes, and no example.com or localhost URLs.`);
}
