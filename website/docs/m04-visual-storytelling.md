# M04 visual storytelling and icon system

## Icon implementation

Uses `@phosphor-icons/core` 2.1.1 at build time. `src/components/Icon.astro` imports only the required light SVG assets and injects their markup into static HTML. This adds no browser icon runtime, icon font, remote request, or client-side script. `public/third-party-notices.txt` contains the Phosphor MIT notice and is linked from the shared footer.

Icons supplement adjacent labels; they do not carry meaning alone. The shared component exposes a small size vocabulary, and decorative SVGs are hidden from assistive technology. New icons should use an existing component and should not be added as emoji, remote images, or an icon font.

## Story diagrams

- Home: pool → XMRig mining engine → Ember supervision → CPU/RandomX. Ember does not perform mining; the return path shows accepted results going back to the pool.
- Learn: relationships between system memory, CPU cache, and mining threads; article diagrams separate processor cache, RandomX cache, and the RAM-resident dataset.
- Guides: prepare → configure → review.
- Troubleshoot: observe → narrow → verify. The hashrate map shows possible inspection areas, not a diagnosis.
- Tools: an instrument metaphor with visible assumptions; no planned tool is represented as an active calculator.
- Huge Pages: small and large page mappings plus the distinction between permission, allocation, and actual RandomX work.
- MSR: supported CPU preset behind an access boundary, with applied and unavailable outcomes.
- CPU threads: visible logical processors are not equated with a useful RandomX worker count; cache is shown as a constraint.

All diagrams are HTML/CSS/SVG composition with text labels and captions. They are conceptual and intentionally do not imply measured values, guaranteed performance, or hardware-specific results. Article callouts are rendered by `TechnicalCallout.astro`; each article selects a concise label and accessible status state in its content metadata. Status icons distinguish unavailable with an X-in-circle, and every state retains a text label.

## Resource-card states

`ResourceCard.astro` renders published resources as full-card links and planned resources as non-interactive cards with a visible status label. This prevents topic placeholders from presenting as live destinations. Category metadata is sentence case and 11px to remain readable. Hub visuals are isolated in `HubVisual.astro`; article visuals are isolated in `ArticleVisual.astro` and selected by the content schema's `visual` field.

## Motion and layout

Existing hero/flow motion remains and is disabled by the existing `prefers-reduced-motion` rule. New visual elements are static. Hub and article diagrams adapt at the existing mobile breakpoints; figures retain captions and overflow clipping is limited to diagram containers.

## Verification

Run `npm run check` for Astro/TypeScript diagnostics and `npm run check:links` for a production build plus static route, link, metadata, and sitemap checks. The Phosphor package is pinned through the website lockfile. The local preview was checked at 1440, 1280, 1024, 768, 600, and 390 CSS pixels for every rendered route; the 390px article visual and callout were also inspected directly. The geometry sweep found no horizontal overflow. This is browser QA, not a substitute for testing on physical devices.
