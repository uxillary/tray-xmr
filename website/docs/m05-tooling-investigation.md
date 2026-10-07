# M05 tooling investigation: Astro, Vite, and picomatch

## Reproduction and diagnosis

Before the M05 change, `npm run check` failed while Astro synchronized the Markdown collection. The error was `require is not defined` in `picomatch/index.js`, reached through Vite's `ModuleRunner`. The website uses Node 24 in ESM mode, Astro's `glob()` content loader, and CommonJS `picomatch@4.0.7`. A plain build sometimes succeeded, while `astro check`'s sync path reproduced the failure. This was an ESM/CommonJS evaluation issue in Astro's Vite module-runner path, not an unsupported Node version or a conflicting picomatch install.

The check also exposed that CommonJS dependencies reached through an ESM module-runner import could fail similarly; loading YAML from the content config produced the same `require is not defined` error. Node's native `createRequire()` works because the content loader runs as a Node module rather than being evaluated as source by Vite's module runner.

## Website-only fix

Replaced Astro's `glob()` loader with a small file-backed loader in `src/content/article-loader.mjs`. It reads the existing flat Markdown article directory, parses YAML frontmatter, validates it against the existing Astro collection schema, renders Markdown through Astro's loader context and watches article files in development. The loader uses `createRequire(import.meta.url)('yaml')`, avoiding the Vite module-runner's CommonJS evaluation path. Astro's content config remains typed and declares the same collection schema. YAML `2.9.1` is declared as a direct website build dependency because the loader imports it explicitly; that was the version already present in `node_modules`. No Astro, Vite, picomatch or Node version was changed.

## Environment and dependency versions

- Node: `v24.21.0`
- npm: `11.19.0`
- Astro: `7.3.5` (Node `>=22.12.0`)
- Vite: `8.3.2` (`^20.19.0 || >=22.12.0`)
- `@astrojs/check`: `0.9.10`
- TypeScript: `6.0.3`
- picomatch: `4.0.7` CommonJS; a nested `2.3.2` remains under Astro's `anymatch`
- website package type: `module`

No Astro, Vite, picomatch or Node version was changed. No desktop file or dependency was touched.

## Verification

After replacing the loader, default `npm run check` completes content sync and reports 0 errors, 0 warnings and 0 hints. `npm run build` succeeds and includes all 13 routes. `npm run check:links` runs the production build and validates canonical URLs, JSON-LD, internal links and sitemap entries. `npm test` runs the deterministic calculator tests. The original failing `glob()` loader was removed from the content config; the workaround and its changed code path are documented rather than claiming an Astro/Vite upstream fix.
