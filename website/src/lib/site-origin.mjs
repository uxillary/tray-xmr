import { isIP } from 'node:net';

export const LOCAL_SITE_URL = 'http://localhost:4321';

export function resolveSiteUrl({ fileValue, envValue, releaseBuild = false } = {}) {
  const configured = envValue?.trim() || fileValue?.trim() || '';
  if (!configured) {
    if (releaseBuild) {
      throw new Error('Production builds require SITE_URL. Set it to the confirmed HTTPS production origin (for example, https://your-domain.tld) before building.');
    }
    return LOCAL_SITE_URL;
  }

  let url;
  try {
    url = new URL(configured);
  } catch {
    throw new Error('SITE_URL must be a valid absolute origin such as https://your-domain.tld.');
  }

  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('SITE_URL must contain only an HTTP(S) origin, with no credentials, path, query, or fragment.');
  }
  if (releaseBuild && url.protocol !== 'https:') {
    throw new Error('Production SITE_URL must use HTTPS.');
  }
  if (releaseBuild && /(^|\.)example\.(com|net|org)\.?$/i.test(url.hostname)) {
    throw new Error('Production SITE_URL cannot use a placeholder example.com, example.net or example.org domain. Configure the confirmed production origin.');
  }
  if (releaseBuild && (/(^|\.)localhost\.?$/i.test(url.hostname) || isIP(url.hostname.replace(/^\[|\]$/g, '')))) {
    throw new Error('Production SITE_URL cannot use localhost or an IP address. Configure the confirmed HTTPS hostname.');
  }

  return url.origin;
}

export function resolveSiteIndexing({ value, site } = {}) {
  const indexing = value?.trim() || 'noindex';
  if (!['index', 'noindex'].includes(indexing)) {
    throw new Error('SITE_INDEXING must be index or noindex. Leave it unset for protected local and preview builds.');
  }
  if (indexing === 'index') {
    const origin = resolveSiteUrl({ envValue: site, releaseBuild: true });
    if (/\.(invalid|test|example|local)\.?$/i.test(new URL(origin).hostname)) {
      throw new Error('Indexable builds require the confirmed public SITE_URL, not a synthetic or reserved hostname.');
    }
  }
  return indexing;
}

export function siteOrigin(site) {
  if (!site) {
    throw new Error('Astro site origin is unavailable. Configure SITE_URL for production or use the local development default.');
  }
  return site instanceof URL ? site.origin : new URL(String(site)).origin;
}
