# M11A — Internal linking and technical SEO audit

**Audit date:** 9 October 2026 · **Branch:** `main` · **Initial HEAD:** `5bc830688b6d94967762b0522667eefef70793aa` · **HEAD at completion:** `040a3ca02363549694cfca677db781d83b710707`. The repository advanced during the audit as the existing M09/M10 work was committed. No published source was modified for M11A.

## Current linking paths

| Reader task | Existing route | Useful next step / finding |
|---|---|---|
| Understand RandomX memory | `/learn/randomx-memory-cache/` | Links to threads, Huge Pages and low hashrate. Add calculator link only where moving from resource use to economics is useful. |
| Choose mining threads | `/learn/xmrig-cpu-threads/` | Links to cache and troubleshooting. A specific path to wall-power measurement can help when readers compare operating cost, but avoid turning every article into a tool menu. |
| Diagnose Huge Pages | `/troubleshoot/xmrig-huge-pages/` | Links cache, threads, low hashrate and the local log decoder. This is a well-connected cluster. |
| Diagnose low hashrate | `/troubleshoot/xmrig-low-hashrate/` | Links Huge Pages, MSR, threads, cache, decoder and both cost/profitability tools. Good point-of-need route from measurement to economics. |
| Use profitability calculator | `/tools/monero-mining-profitability-calculator/` | Links electricity calculator, setup, RandomX, threads, low hashrate and tool hub. Distinguishes assumptions from payouts. |
| Use electricity calculator | `/tools/electricity-cost-calculator/` | Links profitability calculator, RandomX and Ember. Supports the cost → scenario journey. |
| Decode a log | `/tools/xmrig-log-decoder/` | Links Huge Pages, MSR and low hashrate. Strongly states recognized scope and privacy boundary. |
| Begin setup | `/guides/xmrig-windows-setup/` | Article next steps connect to troubleshooting and tools; link to Ember must preserve its “no public download” status. |
| Evaluate product | `/ember/` | Links concept, troubleshooting, local tools and Trust; open lifecycle and release status are explicit. |
| Learn site structure | Home, hubs, footer | Main and footer nav cover Ember, Learn, Guides, Troubleshoot, Tools and Trust. Hub cards are server-rendered links. |

Avoid repetitive related-link blocks on every page. Prefer contextual links where one question is answered and the next decision naturally arises. Do not route general mining readers to an Ember download CTA because none is available.

## Recommended link architecture

```text
Home ──> Learn / Guides / Troubleshoot / Tools / Ember / Trust
  Learn: RandomX cache <──> CPU threads ──> low hashrate
                 │                 │               │
                 └──> Huge Pages ──┘               ├──> Log Decoder
                                                   ├──> Electricity cost
                                                   └──> Profitability scenario
Windows setup ──> safe first-run signals ──> relevant troubleshooting
Electricity cost <──> profitability scenario (distinct models, shared inputs)
Any product claim ──> Ember current status / Trust scope
```

Priority contextual opportunities (recommendations, not implemented):

1. **New rejection/connection guide:** link from decoder’s pool/share result coverage once exact parser coverage is documented; link back from guide to decoder as a summarizer, not root-cause diagnosis.
2. **Economics concept guide:** link adjacent to difficulty/network-rate explanation in the profitability tool, and from the guide back to the tool. Do not add generic links to all articles.
3. **Electricity measurement method:** link from CPU/low-hashrate articles only at the step where readers compare sustained operating cost; the wall-power tool already makes this distinction.
4. **Windows setup safety:** link the setup guide’s security warning to Trust/product availability and official XMRig distribution docs. Keep standalone instructions independent of Ember.
5. **Guide/troubleshoot hubs:** preserve published-resource lists and label all planned themes “Planned.” Do not create indexable thin placeholder routes.

## Technical SEO findings

| Area | Source finding | Status / recommendation |
|---|---|---|
| Rendering | Astro config sets `output: 'static'`; page text and hub/article links are emitted as HTML. Tool client scripts are route-level and explanatory content is present without them. | **Strength.** Keep static-first delivery; no evidence that core article content depends on hydration. |
| Canonical origin | `astro.config.mjs` loads `SITE_URL`, then env `SITE_URL`, then `https://example.com`. `SiteLayout` also has an example fallback. | **Confirmed deployment dependency.** No confirmed production origin is in inspected strategy/config. Set the real origin in deployment configuration before build/deploy; do not guess it. With fallback, emitted canonicals, OpenGraph URLs, article schema URLs, robots sitemap URL and sitemap locs point to example.com. |
| Sitemap | Explicit fixed route array plus non-draft content entries; currently yields 10 fixed + 6 articles = 16 routes. Trailing slashes are consistent. | **Implementation present.** The sitemap only becomes production-correct when the site origin is configured. Confirm build output after setting deployment `SITE_URL`. No date/frequency/priority needed. |
| Robots | Returns `Allow: /` and a sitemap URL using the same configured origin. | **Implementation present; origin dependency applies.** No disallow defect found in source. This is not evidence that a deployed host is crawlable. |
| Titles/descriptions | `SiteLayout` emits supplied title and description. Hub/product/tool pages provide explicit metadata; article collection has title/description frontmatter. | **Strength.** `verify-content.mjs` checks uniqueness/coverage. Search snippet eligibility and truncation are outside source audit. |
| Headings | Reviewed homepage, product, trust, hubs, calculator pages and article template use a visible H1 and nested section headings. | **No confirmed hierarchy defect in reviewed source.** A full rendered accessibility audit is separate. |
| Structured data | `ArticleLayout.astro` emits `TechArticle` and `BreadcrumbList` JSON-LD. No calculator rating/review/FAQ markup is present. | **Appropriate and restrained.** Keep schema aligned to visible article content; do not add FAQ schema or product ratings without eligibility/evidence. Verify production URLs after domain set. |
| Images/visuals | ArticleVisual/ProductJourney/ProductArchitecture are code-native illustrations; no content image inventory with missing `alt` was found in the inspected route source. Global social SVG has `og:image:alt`; decorative marks are hidden from assistive technology where reviewed. | **No confirmed image-alt defect from source sample.** Still inspect emitted output for any future `<img>` and ensure meaningful alternatives or empty alt for decoration. |
| Internal URLs | Source uses rooted paths with trailing slash for site routes; content checker validates links and sitemap coverage. | **Strength.** Keep route convention; avoid mixed slash/non-slash links and dead planned-card hrefs. |
| Duplicate routes | Explicit static routes plus collection route generation; current sitemap list and site inventory map to 16 expected public URLs. | **No duplicate confirmed in source.** Build output is not recrawled here; continue automated route validation. |
| JavaScript | Calculators and decoder require client scripts for interaction; their instructions, formulas/privacy boundaries and explanatory text are static. | **Expected tool limitation, not an SEO defect.** Avoid implying results are available without JavaScript. Keep tool intent and help content server-rendered. |
| Mobile | M10B report records browser QA on seven widths for economics tools and reports other prior M09B2 visual inspection. | **Historical evidence, not rerun in M11A.** Screen-reader and measured contrast checks remain outstanding per M10B. |
| Social metadata | OpenGraph/Twitter title, description and image are generated centrally. | **Origin dependency.** Verify absolute image and URL on production build after confirmed `SITE_URL`. |
| Product claims | M09A evidence records owner-tested Start→Mining, open Stop/Quit acceptance and no public release; current Trust page distinguishes implemented versus open. | **Trust alignment requirement.** Keep present-tense claims scoped; Smart Mining is planned, no durable history or earnings claim. Recheck against current product evidence before release/status changes. |

## Defect versus dependency versus optional work

### Confirmed issue requiring deployment configuration

`SITE_URL` has an example.com fallback. This is safe for local preview but wrong for production SEO if deployed unchanged. The production domain is unconfirmed in the inspected repository strategy (`SITE_URL` fallback is explicitly documented). **Domain-dependent canonical, sitemap, robots and social URL verification is blocked until the real deployment origin is supplied/configured.** No placeholder was replaced.

### No confirmed source defect

This source audit did not find a missing canonical mechanism, absent sitemap/robots generator, inconsistent slash convention, duplicate route in the declared inventory, or client-only article content. Search engine indexing, live HTTP status, deployed redirect/canonical correctness, Search Console coverage, Core Web Vitals and backlink state were not examined and are not asserted.

### Optional enhancements

- Add published/updated dates to sitemap only if the project adopts a trustworthy content freshness policy; do not synthesize dates.
- Review social card rendering on the confirmed host.
- Consider an XML sitemap smoke check in deployment after domain setup; existing content validation already covers route presence.
- Create a distinct accessibility QA ticket for screen-reader walkthrough, measured color contrast, focus/zoom and tool status/error announcement checks. No certification claim.

## Domain and indexing checklist for deployment owner

1. Confirm the canonical production hostname (not guessed by this audit).
2. Set `SITE_URL` in the production build environment to that exact HTTPS origin.
3. Build and inspect one canonical, article JSON-LD URL, OpenGraph URL, `/robots.txt` sitemap line and `/sitemap.xml` location.
4. Verify redirects and TLS on the deployed host, then submit/inspect sitemap in the site’s search console if configured.
5. Recheck that no staging origin or example.com remains in generated public HTML.

Until steps 1–4 are completed, presence in source or a successful local build does not prove indexing or discoverability.
