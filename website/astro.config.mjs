import { existsSync, readFileSync } from 'node:fs';
import { resolveSiteUrl } from './src/lib/site-origin.mjs';

const releaseBuild = process.argv.includes('build');
const mode = releaseBuild ? 'production' : process.env.NODE_ENV ?? 'development';
const envFiles = ['.env', '.env.local', `.env.${mode}`, `.env.${mode}.local`];
let fileSiteUrl;
for (const file of envFiles) {
  const path = `${process.cwd()}/${file}`;
  if (!existsSync(path)) continue;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?SITE_URL\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    const raw = match[1];
    fileSiteUrl = (raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))
      ? raw.slice(1, -1)
      : raw.replace(/\s+#.*$/, '').trim();
  }
}
const site = resolveSiteUrl({ fileValue: fileSiteUrl, envValue: process.env.SITE_URL, releaseBuild });

export default {
  site,
  output: 'static',
};
