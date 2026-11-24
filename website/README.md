# Ember website

The public product and knowledge site for Ember. It presents the Windows Monero mining manager and will grow into a carefully sourced learning, guide and troubleshooting platform. The app is not ready for public release; the site does not currently provide a download.

## Local development

Use a current supported Node.js version for Astro 7 (22.12 or newer), then from this folder:

```sh
npm install
npm run dev
npm run check
```

Local development requires no site URL setting and uses `http://localhost:4321` for generated absolute URLs. A production/release build fails unless `SITE_URL` is explicitly set to the confirmed HTTPS origin. The origin must not contain a path, credentials, query or fragment. The placeholder `example.com` is rejected for release builds. Build output is `dist/`.

## Architecture

- Astro 7, TypeScript, static output; no React hydration or client-side dependencies in the foundation.
- Shared site layout, global token/responsive system and a reusable content hub component live in `src/components/`.
- Routes are file-based under `src/pages/`; future long-form editorial content can move to Markdown/MDX content collections when useful.
- Canonical and Open Graph metadata are emitted by the shared layout. Sitemap and robots are generated from the configured Astro site origin.

## Content authoring

Keep one clear reader intent per page. Source technical claims from authoritative Monero/XMRig documentation, record access dates, and identify assumptions. Label planned content and product features clearly. Do not publish speculative benchmarks, fake metrics/testimonials, profitability promises or thin keyword pages. Use `docs/site-strategy.md` and `docs/content-roadmap.md` for the evidence baseline and sequencing.

## Deployment assumptions

Static assets can be deployed to Cloudflare Pages. Use `website/` as the project root and `dist/` as the output directory. The [M13A configuration table](docs/m13a-production-search-readiness.md) specifies the reproducible installation/build/check command, pinned Node version and owner-side launch gates. These settings have not been applied to a hosting account.

Builds default to `SITE_INDEXING=noindex`: every published page contains a robots noindex directive, and `dist/_headers` adds `X-Robots-Tag: noindex` on hosts supporting Pages-style header files. Astro preview does not apply that header file. Only the Production environment should set `SITE_INDEXING=index`, alongside the owner-confirmed public HTTPS `SITE_URL`. Indexable builds reject synthetic/reserved hostnames; all release builds reject example.com/net/org, localhost and IP-literal origins. Preview must retain `noindex`; it can use the confirmed production `SITE_URL` so canonicals and sitemap references consistently identify production. Before a production domain exists, previews may use the established synthetic HTTPS audit origin and remain noindex. Never deploy a synthetic-origin artifact as production. Robots allows crawling so crawlers can read noindex; robots.txt alone does not prevent indexing.

Before deployment, verify release output locally. In PowerShell, set the exact confirmed value for the build process, then build and inspect it:

```powershell
$env:SITE_URL = 'https://your-confirmed-domain.tld'
$env:SITE_INDEXING = 'index'
npm run build
npm run verify:production-origin
```

For local verification without a real domain, use `SITE_URL=https://ember-m12b0-audit.invalid` and `SITE_INDEXING=noindex`. The verification checks all 17 published routes, canonical and Open Graph URLs, PNG social image, JSON-LD URLs, sitemap locations, robots, indexing metadata/header rules and trailing slashes. A separate noindex `404.html` prevents the Pages default SPA fallback; it is excluded from published-route/sitemap counts. A successful local build does not confirm live redirects, TLS, DNS, robots access, or indexing. No production domain, release link, analytics or backend is configured in this checkout. See [owner onboarding](docs/m13a-search-console-onboarding.md) before hosting or search submission.

## Desktop app separation

This folder owns the website tooling and code. Do not add website dependencies to the root package, desktop Vite/Tauri configuration, `src/`, or `src-tauri/`. The desktop app remains under the repository root. Website changes should stay within `website/`.

## Safe areas for website work

- Site source and routes: `website/src/`
- Public site assets: `website/public/`
- Website configuration/dependencies: `website/package.json`, `website/package-lock.json`, `website/astro.config.mjs`, `website/tsconfig.json`
- Strategy and editorial planning: `website/docs/`
- Generated output: `website/dist/` (do not commit)

