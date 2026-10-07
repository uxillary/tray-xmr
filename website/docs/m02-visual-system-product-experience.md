# M02 visual system and product experience

## Visual improvements

- Replaced the compressed, component-local global CSS with a readable site stylesheet and shared tokens for graphite surfaces, warm Ember accents, local/system typography, content widths, spacing, borders, radii, shadows, focus and motion.
- Refined the sticky header with active-page underline, keyboard-visible focus and a mobile nav that fits the 390px viewport. Expanded the footer to the site's existing routes and repository.
- Reworked the homepage around a larger three-line product message, a setup-oriented desktop composition, principles, a conceptual work diagram, knowledge hubs, trust and a restrained final CTA.
- Recast `/ember/` as a software product page with purpose, user-visible choices, Ember/XMRig relationship, implementation status and explicit release caveats.
- Recast `/trust/` as an implementation ledger and an open-work ledger. It distinguishes implemented process/provisioning boundaries from production verification and release gaps, without claiming certification or guarantees.
- Differentiated the hubs: editorial concepts for Learn; numbered sequential steps for Guides; symptom and system labels for Troubleshoot; instrument-style planned concepts for Tools. No SEO articles, calculators or benchmark data were added.

## Design system and components

- Added `src/styles/site.css` with reusable typography, spacing, surface, status, focus and responsive tokens. System/local font stacks remain in use; no remote font or icon dependency was added.
- Added `ProductPreview.astro` for a static, labelled setup-interface study. It shows repository-backed labels and explicitly says it contains no live mining data.
- Added `TechnicalFlow.astro` to show the conceptual Monero network → pool → Ember-supervised XMRig/CPU path, with result submissions returning to the pool. Supporting copy limits the claim to a conceptual model.
- Refined `HubPage.astro` into four route-specific presentation variants; the shared layout still emits all SEO metadata and semantic landmarks.
- Selected the **ember signal trace** as the single brand motif: a fine warm line and small moving point through technical surfaces. It runs briefly and is disabled by reduced-motion rules.

## Accessibility and responsive work

- Increased instrumentation labels and muted body contrast; links and navigation targets retain readable sizes, hover/active feedback and visible keyboard focus.
- Added descriptive figure captions, labelled sections, decorative-element hiding and clear text alongside status colour.
- Kept the pages usable without JavaScript. The generated pages contain no script tags.
- Checked all seven routes at 1440, 1280, 1024, 768, 720 (a practical narrow-width check for 200% zoom), 600 and 390 CSS pixels: 49 combinations, no document-level horizontal overflow and exactly one H1 per route.
- The 390px review led to tighter navigation spacing so all six primary links fit. The product masthead was widened after the first desktop review exposed mid-word line breaks.
- Confirmed first Tab focus lands on “Skip to content” with a visible 2px focus outline. Reduced-motion behavior is defined in CSS; full OS-level preference emulation was not available in this browser review.

## Performance impact

- Static Astro output is preserved; no client-side JavaScript, React hydration, image payload, animation package, webfont request or icon package was introduced.
- The product composition and diagrams use HTML/CSS. The only motion is short CSS animation with a reduced-motion override.
- A single stylesheet is shared across the seven static routes.

## Intentionally deferred

- Editorial SEO cluster, live calculations, log analysis, benchmark pages/data, telemetry, authentication and analytics remain out of scope.
- No download page/CTA was added because a public release flow is not confirmed.
- Production Start → Mining → Stop verification, clean-machine security checks and release/legal review remain explicit product caveats, not website claims.
- No Article, SoftwareApplication, review, rating or FAQ structured data was added: the current site has no published article content or public product release to support it.

