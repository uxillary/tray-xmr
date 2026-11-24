import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolveSiteUrl, resolveSiteIndexing } from './src/lib/site-origin.mjs';

const releaseBuild = process.argv.includes('build');
const mode = releaseBuild ? 'production' : process.env.NODE_ENV ?? 'development';
const envFiles = ['.env', '.env.local', `.env.${mode}`, `.env.${mode}.local`];
const fileValues = {};
for (const file of envFiles) {
  const path = `${process.cwd()}/${file}`;
  if (!existsSync(path)) continue;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?(SITE_URL|SITE_INDEXING)\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    const raw = match[2];
    fileValues[match[1]] = (raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))
      ? raw.slice(1, -1)
      : raw.replace(/\s+#.*$/, '').trim();
  }
}
const site = resolveSiteUrl({ fileValue: fileValues.SITE_URL, envValue: process.env.SITE_URL, releaseBuild });
const indexing = resolveSiteIndexing({ value: process.env.SITE_INDEXING?.trim() || fileValues.SITE_INDEXING, site });

export default {
  site,
  output: 'static',
  trailingSlash: 'always',
  vite: { define: { 'import.meta.env.SITE_INDEXING': JSON.stringify(indexing) } },
  integrations: [{
    name: 'ember-indexing',
    hooks: {
      'astro:build:done': ({ dir }) => {
        writeFileSync(new URL('_headers', dir), indexing === 'noindex'
          ? '/*\n  X-Robots-Tag: noindex\n'
          : '# Indexable production build; no X-Robots-Tag restriction.\n');
      },
    },
  }],
};
