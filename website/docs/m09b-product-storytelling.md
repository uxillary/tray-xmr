# M09B — Evidence-based product storytelling

## Evidence reviewed

Reviewed the M09A desktop capability audit, website evidence map and media plan, plus the M07 cohesion record, M08 Windows setup guide record, current site strategy, homepage, `/ember/`, `/trust/`, shared styles and existing technical-flow diagram. Desktop evidence remains read-only. M09A records current-build owner evidence for Start → Mining with authenticated XMRig telemetry, a connected pool and real hashrate; Stop/Quit owner acceptance remains open. No newer desktop capability was assumed or tested here.

## Claims corrected

- Product and trust status now distinguish owner-tested Start → Mining from outstanding Stop/Quit acceptance. The earlier loopback API failure is not presented as current.
- No public release/download remains explicit. Release hardening, legal review and clean-machine security-product checks remain open.
- Static thread profiles, local telemetry freshness, process-local Activity, planned Smart Mining and the 5% time-based developer fee are described within their evidence boundaries.

## Website changes

- Homepage hero and animation were preserved. Its existing closing product-status paragraph now says Start → Mining has been observed and identifies open Stop/Quit acceptance and release status.
- `/ember/` now tells a four-stage Configure → Ready → Start → Observe journey. Copy separates local Ember setup/process supervision, XMRig’s CPU work and the user-configured external pool.
- Added a static user → Ember → XMRig → pool diagram and a concise Fresh / Delayed / Unavailable telemetry key. The freshness states are explanatory labels, not simulated readings or a fake dashboard.
- Product status now separates implemented setup, owner-tested Start → Mining, open Stop/Quit acceptance and unavailable public distribution. Existing links to learning, troubleshooting and tools remain.
- `/trust/` now accurately describes the reported owner session and the unaccepted Stop/Quit boundary while retaining local-first, non-custodial and non-certification caveats.
- `site-strategy.md` was updated where its current product facts said the whole lifecycle was unresolved.

## Visual and accessibility decisions

Kept the graphite/charcoal and warm-orange palette, existing typography, Phosphor-based existing site, Astro static rendering and homepage hero/animation. New diagrams use semantic lists, headings, figure captions and text labels; color is not the only freshness cue. Responsive layout moves from four columns to two and then a single column. No product screenshots, live-looking metric values, client-side scripts, dependencies or downloads were added.

## Limitations and future screenshot integration

No genuine desktop screenshots were supplied. The product journey and diagrams are conceptual explanations, not depictions of the application UI or a network trace. A real overview/mining capture should be considered only when an owner supplies a current-build screenshot from a genuine session. Preserve actual values and freshness indicators; scrub wallet, pool, worker, device/account names, paths, process/session identifiers, tokens, diagnostics and unrelated notifications. Do not imply Stop/Quit acceptance until it is recorded for that build. Smart Mining, persistent mining history and Ember contribution remain future/inactive.

## Verification

`npm test` passed (12 tests); `npm run check` reported 0 errors, warnings and hints; `npm run build` generated 15 static pages; `npm run check:links` verified canonical URLs, JSON-LD, local links, published content and sitemap entries; `git diff --check` passed. Browser review was attempted against the local Astro preview but the in-app browser could not reach the local server, so the requested six-width visual review remains unverified. No runtime testing of Ember or a miner was performed. Desktop source was not modified.
