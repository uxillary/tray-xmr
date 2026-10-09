# M08 — Windows XMRig setup guide

## Final article structure

Published at `/guides/xmrig-windows-setup/` as a static article in the existing `articles` collection. The sequence is: prerequisites; safe official download; minimal pool config; foreground PowerShell start; separate first-session signals; common issues; measured next steps. The first-run section distinguishes process start, CPU backend readiness, Huge Pages permission/allocation, MSR status, pool connectivity/work and accepted shares.

## Visual and component decisions

- Reused the shared `ArticleLayout`, sources/date metadata, breadcrumbs, technical callout styling system and `ArticleVisual` component.
- Added one compact five-stage Prepare → Download → Configure → Start → Verify progression with in-page links. It uses semantic ordered-list markup, existing typography/color tokens, visible keyboard focus and a mobile vertical layout.
- Used a definition list to explain config fields and a semantic list for first-run signals. No screenshots, terminal mockups, client-side framework, hydration or animation were added.
- Existing homepage hero/motion and other visual stories were not changed.

## Content and editorial decisions

- XMRig and Ember are clearly separated. The guide is useful without Ember, says no public Ember release exists, and makes no claim that Ember implements these standalone steps.
- The primary path uses official Windows binaries, a minimal one-pool JSON config, explicit PowerShell `--config` invocation and foreground stop via Ctrl+C. Values are unmistakable placeholders; the host uses `.invalid` and no real address/credentials are present.
- Checksum and GPG signature are described distinctly. The release-specific v6.26.0 SHA-256 is labeled as dated; the article does not claim local binary/signature verification. Readers without key-verification experience are not urged to bypass Windows warnings.
- Windows Security detections receive proportionate treatment: inspect provenance and Protection History; no blanket exclusion, protection shutdown, automatic restore, patched binary or routine elevation.
- No pool endorsement, income/profitability, hashrate promise, universal OS minimum, exact-output guarantee or payout guarantee is made. Sources, uncertainty, version and review date are documented in `m08-xmrig-windows-setup-research.md`.

## Resource and Guides hub integration

The Guides hub now fetches and displays published guide collection entries before planned topics. The new card is labeled “Guides · Windows setup”; remaining guide ideas stay clearly marked planned. Article context links connect the guide to CPU threads, RandomX memory, Huge Pages, MSR, low hashrate, the local XMRig Log Decoder, electricity calculator and Ember status only where useful.

## Accessibility and responsive behavior

The article uses semantic h1/h2 structure, numbered ordered steps, a definition list, keyboard-focusable stage links with `:focus-visible`, text labels in addition to color, descriptive figure text, responsive code blocks inherited from the article template, and a stacked mobile progression/signal map. Reduced motion is inherited; no new movement was introduced.

## SEO and metadata

Title: “How to Set Up XMRig on Windows”. Stable canonical route `/guides/xmrig-windows-setup/`, unique description, published date, shared Open Graph metadata, BreadcrumbList and TechArticle JSON-LD from the existing article layout, and sitemap inclusion from the existing collection-backed sitemap route. No FAQ schema, search-volume assertion or keyword-stuffed section was added.

## Validation and browser QA

Automated checks completed:

- `npm test`: 12 passing, 0 failing.
- `npm run check`: 0 errors, 0 warnings, 0 hints.
- `npm run build`: 15 static pages generated; all 14 pre-existing routes remain and the new guide route is generated.
- `npm run check:links`: verified all 15 static pages, unique canonicals, valid JSON-LD, resolved local links, published article content and sitemap entries, including `/guides/xmrig-windows-setup/`.
- The embedded configuration example parses as JSON. It was not passed to XMRig or executed.
- `git diff --check`: passed.

Browser QA covered the guide and `/guides/` at 1440, 1280, 1024, 768, 600 and 390 px (12 route/width combinations). No document overflow occurred; all six navigation links remained present. The progression is horizontal above 700 px and vertical at 600/390 px. At 390 px the code blocks scroll internally where needed, while the document stays within the viewport. The stage anchors reached their corresponding headings, and keyboard focus on the skip link showed a 2 px outline. Guide screenshots at 768 px, 600 px and 390 px and a 1440 px Guides hub screenshot were inspected; hub rendering shows the published guide before the remaining clearly planned themes. Footer, sources, related reading and next-step links are present in the page structure. No physical-device testing was performed.

No client-side script or external media asset was added; the route uses the existing shared static article renderer and CSS. The release includes no new dependency. No XMRig binary, benchmark or mining-pool connection was run. Desktop application files remain untouched.

## Known limitations and maintenance

- This is a sourced generic setup path, not a guarantee for every Windows policy, CPU, pool or security product. It was not exercised against a live miner or pool.
- The article's release number and digest are time-sensitive. Revisit upon any XMRig release/tag change; recheck official release assets, SHA256SUMS signature, GPG fingerprint, config schema and CLI syntax before changing examples.
- Revisit when Windows release support/security UI, Monero's mining guidance, RandomX memory requirements, or decoder signal coverage changes. The guide's decoder scope is version-qualified as XMRig 6.26.0.

## M09 assessment

**Primary recommendation: a real Ember product media pass**, after the desktop UI and owner-accepted Start → Mining → Stop flow are stable and genuine scrubbed screenshots can be captured. The editorial platform now has its first reproducible guide while product presentation still relies on a labeled illustration; accurate product evidence is the most valuable next website improvement.

Secondary directions, ranked:

1. A focused visual polish pass on actual product surfaces, paired with the media work and grounded in verified app behavior.
2. A hardware/benchmark methodology foundation only when reproducible measurements and suitable equipment exist; do not publish expected-performance tables prematurely.
3. A unit/hashrate converter only after reader evidence establishes a distinct need from the existing calculator and decoder.
