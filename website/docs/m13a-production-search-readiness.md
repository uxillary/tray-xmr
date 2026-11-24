# M13A — Production and search readiness

24 November 2026. Scope: `website/` only. **Local readiness work complete; public production acceptance remains owner-dependent.** No hosting project, DNS, deployment, search submission, commit or push was made. M13B has not started.

## Verified baseline

| Item | Evidence at the start of this milestone |
| --- | --- |
| Repository | `uxillary/tray-xmr`; local branch `main` |
| HEAD | `a80288182c1ae4d534df1eff9194d22fc3ed69ee` — `m12b.4 - website` |
| Working tree | Clean; no unrelated changes to preserve. M12B.4 was actually present, rather than assumed from its older acceptance-report SHA. |
| Published routes | 17, rebuilt from source: ten fixed pages and seven non-draft articles. |
| Runtime | Node 24.21.0, npm 11.19.0, Astro 7.3.5. Installed Astro requires Node >=22.12.0 and npm >=9.6.5. Lockfiles/dependencies unchanged. |
| Deployment configuration | Static Astro output; Cloudflare Pages recommendation in README. No `.github` deployment workflow, Wrangler, Netlify, Vercel or `.openai/hosting.json` configuration found. No deploy script. |
| Hosting account evidence | No authorized Cloudflare account/project integration available. GitHub repository metadata confirms public visibility and default branch `main`; combined commit statuses are empty. This does not prove that no external dashboard-only deployment exists. |
| Domain / existing public site | No confirmed production origin, project identity or public deployment URL found. Public TLS, redirects, indexing and previews are **unverified**, not zero/absent measurements. No domain or project slug was guessed. |
| Origin contract | Release builds already required explicit HTTPS `SITE_URL`, rejected non-origin URL parts and example.com. Local development defaulted to `http://localhost:4321`. Retained and strengthened. |
| Existing SEO | Static HTML links, unique titles/descriptions/canonicals, shared OG/Twitter metadata, 17-location sitemap, crawlable robots, seven TechArticle/BreadcrumbList pairs, non-draft route filters. |
| Existing performance | Route-only tool modules, script-free editorial pages/home, shared minified CSS, system fonts, inline SVGs, finite CSS animations and reduced-motion support. |
| Outstanding accessibility | Native browser zoom/text scaling, actual screen reader, Firefox/Safari and physical devices remain owner acceptance requirements from M12B.4. |

Prior evidence read: [M12B.4 acceptance](m12b4-final-acceptance.md), [M12A discovery journeys](m12a-organic-discovery-journeys.md), [M11A opportunities](m11a-organic-search-opportunities.md), [M11A technical SEO](m11a-internal-linking-and-technical-seo.md), [roadmap](content-roadmap.md), README and production/accessibility configuration notes. The old M11A example.com fallback is historical; it is not the current implementation.

## Owner-ready Cloudflare Pages configuration

This is a recommendation, **not applied configuration or deployment authorization**. First establish whether an existing project/domain must be retained. Creating a Git-connected Pages project can itself start a deployment: do that only after explicit owner authorization and the retained acceptance gates.

| Setting | Recommended value |
| --- | --- |
| Provider / repository | Cloudflare **Pages**, Git integration with GitHub `uxillary/tray-xmr`; grant only the necessary repository access |
| Production branch | `main`, the verified current default branch |
| Framework | Astro, static output; no Worker/SSR adapter or Functions needed |
| Root directory | `website/` |
| Dependency installation | Set `SKIP_DEPENDENCY_INSTALL=1`; install deterministically with `npm ci` in the command below |
| Build command | `npm ci && npm test && npm run check && npm run check:links && npm run verify:production-origin` |
| Output directory | `dist/`, relative to `website/` |
| Node | Set `NODE_VERSION=24.21.0`, the locally tested version; do not rely on a provider default. Minimum installed Astro requirement: 22.12.0. |
| Production `SITE_URL` | Exact **owner-confirmed** canonical HTTPS origin, without path/query/credentials/fragment. Value currently unavailable. |
| Production `SITE_INDEXING` | `index` only for the approved public release; use `noindex` for any prelaunch deployment |
| Preview `SITE_URL` | Once confirmed, the **production** origin, so canonicals, OG URLs and sitemap consistently identify production. Until then use `https://ember-m12b0-audit.invalid` for protected review only. |
| Preview `SITE_INDEXING` | Explicit `noindex`; never copy Production's `index` value. Use Cloudflare Access for restricted previews when appropriate. |
| Analytics | Leave Web Analytics/automatic beacon injection disabled; M13A recommends no client analytics |
| Build scope | Watch website changes if desired; no root desktop build or root dependency installation required |

Pages supports monorepo roots and these build variables; disabling automatic installation prevents a duplicate install before `npm ci`. Sources checked 24 November 2026: [build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/) and [build image/version overrides](https://developers.cloudflare.com/pages/configuration/build-image/).

After authorization, attach the chosen domain through Pages **Custom domains** before making the required DNS changes. Apex setup requires a Cloudflare zone/nameservers; subdomain setup can use an external DNS provider and the Pages-provided CNAME. Wait for domain activation and a valid HTTPS certificate. Choose apex versus www explicitly; redirect the other hostname and the production `pages.dev` alias to the canonical host, preserving paths and query strings. Do not redirect arbitrary preview hosts to production. Check HTTP→HTTPS, `/tools`→`/tools/`, `/tools/index.html`→`/tools/`, nested routes, loops and final 200s on the live host. These are owner launch checks, not locally verified behavior. [Custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/), [Pages route handling](https://developers.cloudflare.com/pages/configuration/serving-pages/).

## Indexing contract and corrections

| Environment | Origin | Indexing / generated behavior |
| --- | --- | --- |
| Local development | Localhost default or explicitly configured origin | Defaults to `noindex`; HTML carries `noindex, follow`. Local configuration contract verified. |
| Local release verification | Explicit `https://ember-m12b0-audit.invalid` | Noindex HTML and generated `_headers`; all canonical/OG/schema/sitemap references use this synthetic origin. Not a deployable production artifact. |
| Preview | Prefer confirmed production origin; synthetic origin permissible before domain confirmation | Default/explicit noindex HTML plus `X-Robots-Tag: noindex` in `_headers`. Cloudflare also documents automatic noindex headers on preview deployments; verify the actual response on hash and branch aliases. |
| Public production | Confirmed public HTTPS origin plus explicit `SITE_INDEXING=index` | Self-canonicals, production sitemap/OG/schema URLs; no restrictive noindex on published pages or `_headers`. The error document always remains noindex. Live state unverified. |

`SITE_INDEXING` accepts only `index` or `noindex`; an unset value fails closed to noindex, and a typo fails the build. Indexable builds reject `.invalid`, `.test`, `.example` and `.local`. All release builds additionally reject example.com/net/org (including trailing-dot placeholders), localhost/subdomains and IP literals. Existing missing-origin, HTTPS, credentials/path/query/fragment safeguards remain. An explicit origin is necessary but cannot prove ownership or DNS; owner confirmation remains required.

The shared layout emits the HTML directive; an Astro build hook emits the Pages `_headers` rule for **all static assets**, including PDFs/images if later added. Astro preview does not interpret `_headers`; only generated-file correctness was verified locally. Other providers must translate this rule to their own response-header mechanism. Future SSR/Functions must set headers themselves. [Cloudflare header behavior](https://developers.cloudflare.com/pages/configuration/headers/).

Robots intentionally allows crawling and names the same-origin sitemap in all environments. **Noindex controls indexing; robots.txt controls crawling.** Blocking preview crawling can prevent a crawler seeing noindex. Neither a canonical nor robots disallow alone is a reliable preview exclusion mechanism. A protected preview is not a secrecy boundary unless access control is enabled. [Google noindex guidance](https://developers.google.com/search/docs/crawling-indexing/block-indexing), [Cloudflare preview protection](https://developers.cloudflare.com/pages/configuration/preview-deployments/).

Trailing-slash policy is now explicit in Astro. All 17 published pages remain reachable from homepage **main-content HTML links**, without requiring tool execution or relying on the sitemap/global navigation. The three article route generators still exclude drafts; a temporary `draft: true` fixture was built and confirmed absent from output and sitemap, then removed. A noindex `404.html` was added because Pages otherwise assumes an SPA when no top-level error document exists; it is an error artifact, **not an eighteenth published/search route**. Live 404 status must still be checked on the chosen host.

## All-route search presentation audit

The inventory below covers the **current** output. Search intents/audiences are editorial assessments, not measured query demand. [Exact before/current metadata evidence](evidence/m13a/metadata-audit.json) records every title, description, H1 text, canonical, OG title/description/URL, social image, full JSON-LD and primary main-content links for all 17 routes.

For every row, verified rules are: canonical and `og:url` = **O + route**, where O is the explicitly synthetic `https://ember-m12b0-audit.invalid`; `og:title`/Twitter title = recorded title; `og:description`/Twitter description = recorded description; both image URLs = **O + `/social-card.png`**, 1200×630 PNG. These shared rules are assertions against every generated page, not assumed template coverage. Replace O only by rebuilding with the confirmed origin. All metadata is unique and all pages have one H1; expressive visible hub/home H1s are retained because their titles supply the subject.

| Route | Intent; audience | Title / OG title | H1 (spacing normalized) |
| --- | --- | --- | --- |
| `/ember/` | Understand development status and controls; Prospective desktop users | About Ember — a clearer Monero mining manager | More of the mining process, made understandable. |
| `/guides/` | Choose a Windows setup or warning workflow; New Windows miners | Windows XMRig guides — Ember | A clear next step for Windows mining. |
| `/guides/xmrig-windows-security-warnings/` | Stop and verify a flagged download; Windows users facing a security warning | Windows Security Warnings When Downloading XMRig: Safe Checks — Ember | Windows Security Warnings When Downloading XMRig: Safe Checks |
| `/guides/xmrig-windows-setup/` | Set up standalone XMRig safely; Windows users starting a first session | How to Set Up XMRig on Windows — Ember | How to Set Up XMRig on Windows |
| `/` | Find useful mining resources / evaluate Ember; New visitors and prospective Windows users | Ember — Monero mining, without the mystery | Monero mining, without the mystery. |
| `/learn/` | Choose a RandomX/CPU explanation; Learners and XMRig users | Learn Monero mining — Ember | Understand what your CPU is doing. |
| `/learn/randomx-memory-cache/` | Understand RandomX memory and cache layers; XMRig users interpreting resource limits | RandomX Memory and CPU Cache Explained — Ember | RandomX Memory and CPU Cache Explained |
| `/learn/xmrig-cpu-threads/` | Explain worker counts and cache limits; Users questioning XMRig thread selection | Why XMRig Isn't Using All Your CPU Threads — Ember | Why XMRig Isn't Using All Your CPU Threads |
| `/tools/electricity-cost-calculator/` | Estimate workload energy and cost; Users with measured watts, runtime and tariff | Mining Electricity Cost Calculator | Mining Electricity Cost Calculator |
| `/tools/` | Find an available local instrument; Miners comparing scenarios or reading logs | Monero mining tools — Ember | Small tools. Clearer decisions. |
| `/tools/monero-mining-profitability-calculator/` | Explore expected revenue and electricity balance; Users supplying manual mining/network/price inputs | Monero Mining Profitability Calculator — Ember | Monero Mining Profitability Calculator |
| `/tools/xmrig-log-decoder/` | Interpret supported signals locally; Users with an XMRig output excerpt | XMRig Log Decoder — Ember | What is XMRig actually telling me? |
| `/troubleshoot/` | Choose a symptom-specific next check; Windows XMRig users with a problem | Monero mining troubleshooting — Ember | Start with the signal you can see. |
| `/troubleshoot/xmrig-huge-pages/` | Separate privilege from allocation and choose a check; Windows users seeing unavailable/partial Huge Pages | XMRig Huge Pages Not Working on Windows? What to Check — Ember | XMRig Huge Pages Not Working on Windows? What to Check |
| `/troubleshoot/xmrig-low-hashrate/` | Investigate low sustained hashrate; Users comparing XMRig performance conditions | Why Is My XMRig Hashrate Low? A Windows Checklist — Ember | Why Is My XMRig Hashrate Low? A Windows Checklist |
| `/troubleshoot/xmrig-msr-error/` | Interpret an MSR warning safely; Windows users seeing XMRig MSR errors | XMRig MSR Errors on Windows: What They Mean — Ember | XMRig MSR Errors on Windows: What They Mean |
| `/trust/` | Check privacy, provisioning and evidence limits; Cautious prospective users and contributors | Trust and transparency — Ember | Say what happens. Be clear about what hasn't been proven. |

| Route | Description / OG description | Top-level schema types | Representative main-content discovery links |
| --- | --- | --- | --- |
| `/ember/` | What Ember is building for Windows Monero mining, how its current foundation works, and what remains in development. | None | `/learn/`, `/troubleshoot/`, `/tools/`, `/trust/` |
| `/guides/` | Sourced Windows XMRig guidance for safely checking downloads, configuring a standalone miner and reading first-session signals. | None | `/guides/xmrig-windows-setup/`, `/guides/xmrig-windows-security-warnings/`, `/troubleshoot/` |
| `/guides/xmrig-windows-security-warnings/` | What to check when Windows or Defender warns about an XMRig download: verify the official source and available release evidence, and know when to stop. | BreadcrumbList + TechArticle | `/`, `/guides/`, `/guides/xmrig-windows-setup/`, `/troubleshoot/xmrig-huge-pages/`, `/ember/` |
| `/guides/xmrig-windows-setup/` | Set up standalone XMRig for Monero on Windows: choose the official build, configure a pool and wallet address, start safely and read each first-run signal. | BreadcrumbList + TechArticle | `/`, `/guides/`, `/learn/randomx-memory-cache/`, `/learn/xmrig-cpu-threads/`, `/tools/electricity-cost-calculator/` |
| `/` | Understand Monero mining with practical XMRig guides, local calculators and a log decoder. Explore Ember, a Windows mining manager in development. | WebSite | `/ember/`, `/learn/`, `/guides/`, `/troubleshoot/`, `/tools/` |
| `/learn/` | Understand Monero mining, RandomX, CPU cache and XMRig thread selection through clear, technically grounded explanations. | None | `/learn/randomx-memory-cache/`, `/learn/xmrig-cpu-threads/`, `/guides/xmrig-windows-setup/` |
| `/learn/randomx-memory-cache/` | A practical guide to RandomX's dataset, cache, per-thread CPU cache needs, Huge Pages and NUMA for XMRig users. | BreadcrumbList + TechArticle | `/`, `/learn/`, `/learn/xmrig-cpu-threads/`, `/troubleshoot/xmrig-huge-pages/`, `/troubleshoot/xmrig-low-hashrate/` |
| `/learn/xmrig-cpu-threads/` | Understand logical processors, RandomX mining threads and cache limits so you can interpret XMRig auto-configuration without blindly forcing more threads. | BreadcrumbList + TechArticle | `/`, `/learn/`, `/learn/randomx-memory-cache/`, `/troubleshoot/xmrig-low-hashrate/`, `/ember/` |
| `/tools/electricity-cost-calculator/` | Estimate the electricity energy and running cost of a mining PC or other continuous workload using your own measured power, runtime and tariff. | None | `/tools/monero-mining-profitability-calculator/`, `/learn/randomx-memory-cache/`, `/ember/`, `/tools/` |
| `/tools/` | Use a mining profitability calculator, electricity cost calculator and XMRig log decoder locally in your browser. Manual inputs, no uploads or live data. | None | `/tools/electricity-cost-calculator/`, `/tools/monero-mining-profitability-calculator/`, `/tools/xmrig-log-decoder/` |
| `/tools/monero-mining-profitability-calculator/` | Estimate expected XMR rewards, pool-adjusted revenue, electricity cost and operating balance from your own hashrate and manual network and price assumptions. | None | `/troubleshoot/xmrig-low-hashrate/`, `/learn/randomx-memory-cache/`, `/learn/xmrig-cpu-threads/`, `/guides/xmrig-windows-setup/`, `/tools/electricity-cost-calculator/` |
| `/tools/xmrig-log-decoder/` | Interpret a small set of XMRig startup, Huge Pages, MSR, pool and share signals locally in your browser. | None | `/tools/`, `/troubleshoot/xmrig-huge-pages/`, `/troubleshoot/xmrig-msr-error/`, `/troubleshoot/xmrig-low-hashrate/` |
| `/troubleshoot/` | Evidence-led guidance for XMRig Huge Pages, MSR errors and low RandomX hashrate on Windows. | None | `/troubleshoot/xmrig-huge-pages/`, `/troubleshoot/xmrig-msr-error/`, `/troubleshoot/xmrig-low-hashrate/`, `/tools/xmrig-log-decoder/`, `/guides/xmrig-windows-security-warnings/` |
| `/troubleshoot/xmrig-huge-pages/` | Understand XMRig Huge Pages status on Windows, the Lock Pages in Memory privilege, partial allocation and safe next steps. | BreadcrumbList + TechArticle | `/`, `/troubleshoot/`, `/troubleshoot/xmrig-low-hashrate/`, `/tools/xmrig-log-decoder/`, `/learn/randomx-memory-cache/` |
| `/troubleshoot/xmrig-low-hashrate/` | Diagnose a low XMRig RandomX hashrate by checking allocation, threads, memory, system load, thermals and benchmark conditions in order. | BreadcrumbList + TechArticle | `/`, `/troubleshoot/`, `/troubleshoot/xmrig-huge-pages/`, `/troubleshoot/xmrig-msr-error/`, `/tools/xmrig-log-decoder/` |
| `/troubleshoot/xmrig-msr-error/` | Learn what XMRig's RandomX MSR setup does, why it can fail on Windows, and what to check before changing system security settings. | BreadcrumbList + TechArticle | `/`, `/troubleshoot/`, `/troubleshoot/xmrig-huge-pages/`, `/troubleshoot/xmrig-low-hashrate/`, `/tools/xmrig-log-decoder/` |
| `/trust/` | How Ember currently handles setup, wallet information, XMRig provisioning and process lifecycle, and what remains unverified. | None | Global navigation; inbound from homepage |

Focused changes:

- Homepage description previously led with “A clearer way to run and understand Monero mining on Windows”; it now names the independently useful guides, local calculators and decoder and explicitly calls the desktop manager in development.
- Tools-hub description previously ended “plus planned tools”; it now prioritizes three functioning instruments and states manual/local/no-live-data limits.
- All existing titles and H1s were retained: no duplication, unsupported public availability, unnecessary repeated branding or clear purpose failure justified title churn. Article descriptions distinguish cache, threads, privilege/allocation, MSR, low hashrate, setup and safe download checks. Profitability remains a manual expected-value scenario; electricity remains cost-only. No search-volume or ranking effect is asserted.

## Structured data

Before M13A, seven articles each had **TechArticle** (an Article subtype) and **BreadcrumbList**, with the existing Ember Organization publisher. JSON syntax, same-origin/trailing-slash URLs, breadcrumb order, headline/description and dates against visible content pass. Article frontmatter, original publication/modification dates and publisher facts are unchanged. No invented author or credentials were added.

The homepage now includes **WebSite**, `name: Ember`, root URL and an Ember Organization publisher/root URL, matching visible branding and the existing publisher identity. This addresses site identity without attaching schema to every page. [Google site-name guidance](https://developers.google.com/search/docs/appearance/site-names).

No SoftwareApplication schema is appropriate for the unreleased desktop product. The existing browser tools could truthfully be described as WebApplication, but adding application markup has no demonstrated benefit here and Google's software-app enhancement has additional requirements; no offers, ratings or reviews were manufactured to satisfy them. Hubs/product/trust remain without page-specific schema. No FAQ schema or rich-result expectation was introduced.

Local checks validate JSON syntax, factual alignment and URL consistency. They do **not** constitute a Rich Results Test pass, Schema.org validator run or promise of enhanced search presentation. Schema.org validity and Google's feature eligibility are distinct; selection is not guaranteed even for valid eligible markup. Owner may test the verified public URLs after deployment. [Structured-data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies), [Article guidance](https://developers.google.com/search/docs/appearance/structured-data/article).

## Social sharing

The existing graphite/orange 1200×630 SVG clearly identifies Ember and Monero mining, carries an in-development disclosure and avoids fictional screenshots or earnings. Its generic product line cannot convey each guide/tool's purpose by itself. The confirmed compatibility defect was using SVG as the sole OG/Twitter image, with a square-summary card request despite wide artwork. PNG is a safer shared format; Vercel's documented Twitter-card metadata validation explicitly excludes SVG. [Card format reference](https://vercel.com/docs/deployments/og-preview).

Implemented a bounded correction: rasterized the **unchanged existing SVG** through the installed Sharp pipeline to `public/social-card.png` (82,855 bytes); switched both image tags, added type/dimensions/Twitter alt and `summary_large_image`. Inspected the PNG visually. No generation service, client image request, new dependency or fabricated visual was added. Regenerate from `website/` with `node --input-type=module -e "import sharp from 'sharp'; await sharp('public/social-card.svg').png().toFile('public/social-card.png')"` using the installed locked dependency tree; verify dimensions afterward.

| Sharing surface | Expected presentation and acceptance limit |
| --- | --- |
| Discord | OG title/description plus PNG gives the linked resource's purpose and consistent identity. Actual embed/cache behavior requires a public fetchable URL. |
| Reddit | Post type and community/platform behavior may omit or crop the card. Keep the page title useful without an image; no live share was tested. |
| Messaging apps | OG metadata and common PNG format improve compatibility; cropping, fetching and cache policy vary. Not platform acceptance evidence. |
| Social platforms | Large-image Twitter metadata now matches the wide card. Other platforms may prioritize OG. No guaranteed rendering. |
| GitHub links | Link text remains useful; do not assume arbitrary external links receive rich embeds. This is separate from a repository's uploaded social-preview setting, which was not changed. |

Reusable **proposal**, not an asset-production batch: retain the graphite background/orange accent, Ember mark, 1200×630 canvas and generous crop margins; add a concise category line and factual page heading to the same static SVG template. Homepage/product: identity plus development status; technical guides: question/topic plus “XMRig guide”; troubleshooting: exact signal plus “Safe next checks”; tools: tool name plus input→result explanation/local/manual qualifiers. Export static PNG siblings only when an actual page needs them, with a layout-level image override and matching alt. Start from real page headings; no financial outcomes, invented benchmark numbers or additional image routes/services. Until then the shared card plus page-specific OG text is deliberate.

## Verification and release gates

| Check | Result |
| --- | --- |
| `npm test` | PASS — 47 tests, zero failures/skips; calculation/parser/controller/accessibility coverage retained |
| `npm run check` | PASS — 52 files; zero errors, warnings or hints |
| `npm run check:links` | PASS — 17 published routes, seven article contents/heading matches, unique IDs/metadata, social/schema consistency, internal HTML discovery, links/fragments and draft exclusions |
| `npm run verify:production-origin` | PASS — explicit synthetic HTTPS origin, canonical/OG/social/schema/sitemap/robots consistency, noindex HTML/header artifact and protected error document |
| Environment matrix | PASS — local default, missing-origin rejection, synthetic-indexing rejection, indexable external fixture and default-noindex release with an unpublished draft fixture |
| Final local HTTP identity | PASS — all 33 served files HTTP 200 with matching bytes; `_headers` checked separately as a host-only artifact; two unknown paths returned the matching error document with 404 |
| Measured build identity | PASS — all six timed documents match the final synthetic build |
| Preservation | 46 of 50 pre-existing source files byte-identical; only layout, origin helper and homepage/tools-hub metadata changed. All eight tracked generated Astro files restored from their exact starting-byte snapshots. No desktop, article, calculation, parser, controller or style changes. |
| `git diff --check` | PASS — final scoped diff; no whitespace errors |

See [environment matrix](evidence/m13a/environment-matrix.json), [performance methodology/results](m13a-performance-baseline.md) and [preservation/verification evidence](evidence/m13a/verification.json). Public production origin remains **unavailable**. An indexable build was tested using a clearly external `https://www.cloudflare.com` offline fixture, solely to verify omission of noindex; it is not an Ember origin or deployment. Final output was rebuilt with the established synthetic origin and noindex. No localhost or placeholder fallback was reinstated.

Owner actions before public indexing:

1. Identify/confirm any existing hosting project, canonical origin and access. Authorize hosting/DNS/deployment separately; do not upload the synthetic build.
2. Complete or explicitly accept the unchanged M12B.4 gates: actual browser zoom at 100/200/400% and 200% text scaling where supported; NVDA/browser testing; Firefox and Safari/WebKit; physical phone touch/orientation/virtual keyboard. Record named versions/results. CSS viewport simulation and this headless performance run do not close them.
3. Apply the environment-specific settings, disable automatic analytics injection, configure domain/TLS/alias redirects, rebuild and run the checks with the real origin. Verify live headers, 200/404 responses, trailing slashes, canonical/sitemap/robots/social assets and production absence of noindex.
4. Use [Search Console onboarding](m13a-search-console-onboarding.md) only after verified public deployment. Capture Day 0; do not report unavailable traffic/indexing data as zero.

## Exact changed files

- `website/.env.example`
- `website/README.md`
- `website/astro.config.mjs`
- `website/docs/content-roadmap.md`
- `website/docs/evidence/m13a/environment-matrix.json`
- `website/docs/evidence/m13a/metadata-audit.json`
- `website/docs/evidence/m13a/performance.json`
- `website/docs/evidence/m13a/verification.json`
- `website/docs/m13a-organic-growth-framework.md`
- `website/docs/m13a-performance-baseline.md`
- `website/docs/m13a-production-search-readiness.md`
- `website/docs/m13a-search-console-onboarding.md`
- `website/public/404.html`
- `website/public/social-card.png`
- `website/scripts/measure-performance.mjs`
- `website/scripts/verify-content.mjs`
- `website/scripts/verify-production-origin.mjs`
- `website/src/components/SiteLayout.astro`
- `website/src/lib/site-origin.mjs`
- `website/src/pages/index.astro`
- `website/src/pages/tools/index.astro`
- `website/tests/site-origin.test.mjs`

No change was made outside `website/`. No dependency/lockfile changes, deployment, commit, push or M13B research occurred.

