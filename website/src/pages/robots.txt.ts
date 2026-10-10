import type { APIRoute } from 'astro';
import { siteOrigin } from '../lib/site-origin.mjs';

export const GET: APIRoute = ({ site }) => {
  const origin = siteOrigin(site);
  return new Response(`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
