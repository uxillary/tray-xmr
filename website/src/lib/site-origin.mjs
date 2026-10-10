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
  if (releaseBuild && (url.hostname === 'example.com' || url.hostname.endsWith('.example.com'))) {
    throw new Error('Production SITE_URL cannot use the placeholder example.com domain. Configure the confirmed production origin.');
  }

  return url.origin;
}

export function siteOrigin(site) {
  if (!site) {
    throw new Error('Astro site origin is unavailable. Configure SITE_URL for production or use the local development default.');
  }
  return site instanceof URL ? site.origin : new URL(String(site)).origin;
}
