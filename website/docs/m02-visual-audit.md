# M02 visual audit

## 1. What already works

- Dark graphite surfaces, warm Ember orange and a calm product voice are consistent with Ember's documented direction.
- The homepage clearly states the product category and development status; the product visual is labelled as illustrative.
- Static Astro pages, semantic landmarks, canonical/social metadata and a reduced-motion media query are already in place.
- The current setup terminology (wallet, manually configured pool, CPU thread profile, verified XMRig) is grounded in the repository.

## 2. What feels generic

- A single radial wash, repeated gradient cards and a stock dashboard-shaped mock window make the design feel like a dark starter template.
- Small index labels and generic card grids carry too much of the site's visual identity.
- The technical flow is a row of three plain boxes rather than a distinct Ember explanation.

## 3. Weakest hierarchy areas

- Product and Trust pages are compact article layouts with similar weight from title through detail panel.
- Four hub pages use the same card layout, status chips and similar “planned” language.
- The preview's sub-labels are smaller and dimmer than useful instrumentation should be.

## 4. Weakest visual areas

- The hero preview lacks a clear product frame, real information grouping and a strong relationship to the headline.
- Repeated bordered gradient panels flatten the page; there is little contrast between editorial breathing room and technical density.
- The flow graphic does not yet explain the local Ember/XMRig boundary or return path for pool results.

## 5. Repetition / inconsistency

- Nearly all global CSS is compressed into one component and one-line rules, making tokens, breakpoints and patterns difficult to review.
- Three-card home discovery, two-column hub cards and trust cards share styling without clear content-type differences.
- Footer links omit two existing hubs; status wording varies among planned, future and in development.

## 6. Mobile concerns

- Mobile navigation relies on horizontal scrolling with no distinct compact treatment.
- The hero mockup is dense at 390px; its smaller text and repeated panels do not adapt as a complete composition.
- A previous overflow issue from the orbit decoration required clipping at tablet sizes; diagram layouts need their own narrow-width treatment.

## 7. Accessibility concerns

- Labels as small as 9–10px are hard to read, and muted labels risk poor contrast.
- The decorative flow and interface mockup need clear accessible names/captions and hidden decorative symbols.
- Link focus is present, but active navigation, target size and hover/focus parity need more deliberate styling.

## 8. Components worth standardising

- Shared site shell and responsive navigation; typography, spacing, surface, border and motion tokens.
- Product preview, status row, metric/readout panel and conceptual mining-flow diagram.
- Editorial discovery card and distinct guide, diagnostic and tool entry patterns.

## 9. Elements that should remain deliberately simple

- Static content delivery, page metadata, status statements and footer.
- No animated dashboard numbers, profitability figures, benchmark claims, third-party font requests, icon package, React hydration or background video.
- No speculative content routes or fake download call-to-action.

## Ember motif

Use one **ember signal trace**: a fine warm line with a small point of light that passes through the technical diagram and anchors product-status details. It represents controlled work moving through a system, not flames. Motion is brief and removed for reduced-motion preferences.
