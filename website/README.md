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

Static assets can be deployed to Cloudflare Pages. Use `website/` as the project root, `npm run build` as the command and `dist/` as the output directory. In the Cloudflare Pages project settings, set `SITE_URL` as a Production environment variable to the confirmed HTTPS canonical origin (for example, `https://your-domain.tld`, without a path). Configure a separate confirmed Preview origin if preview deployments should emit their own metadata; do not use a production domain for an unprotected preview.

Before deployment, verify release output locally. In PowerShell, set the exact confirmed value for the build process, then build and inspect it:

```powershell
$env:SITE_URL = 'https://your-confirmed-domain.tld'
npm run build
npm run verify:production-origin
```

For a safe synthetic verification run without a real domain, use `https://ember-m12a.invalid` in place of the example hostname. The verification checks canonical and Open Graph URLs, social-image URLs, Article/Breadcrumb JSON-LD URLs, sitemap locations, robots sitemap reference, route slashes, placeholder origins and localhost references. A successful local build does not confirm live redirects, TLS, DNS, robots access, or indexing. No production domain, release link, analytics or backend is currently configured.

## Desktop app separation

This folder owns the website tooling and code. Do not add website dependencies to the root package, desktop Vite/Tauri configuration, `src/`, or `src-tauri/`. The desktop app remains under the repository root. Website changes should stay within `website/`.

## Safe areas for website work

- Site source and routes: `website/src/`
- Public site assets: `website/public/`
- Website configuration/dependencies: `website/package.json`, `website/package-lock.json`, `website/astro.config.mjs`, `website/tsconfig.json`
- Strategy and editorial planning: `website/docs/`
- Generated output: `website/dist/` (do not commit)

