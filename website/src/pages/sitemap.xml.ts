import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const routes = ['/', '/ember/', '/learn/', '/guides/', '/troubleshoot/', '/tools/', '/tools/electricity-cost-calculator/', '/trust/'];

export const GET: APIRoute = async ({ site }) => {
  const origin = site?.toString().replace(/\/$/, '') ?? 'https://example.com';
  const articles = await getCollection('articles', ({ data }) => !data.draft);
  const articleRoutes = articles.map(({ id, data }) => `/${data.section}/${id}/`);
  const urls = [...routes, ...articleRoutes].map((route) => `  <url><loc>${origin}${route}</loc></url>`).join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
