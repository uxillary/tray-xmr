# M09B.1 — Visual QA, navigation repairs and technical storytelling

## Scope and strengths preserved

Website-only review. Desktop files are read-only. Existing strengths retained: the homepage hero and animation, graphite/charcoal and warm-orange palette, Phosphor icons, M09B product journey/architecture/freshness key, both tools, all published guides and educational diagrams, and static Astro delivery.

## Routes audited

All 15 published HTML routes were enumerated from the Astro build: `/`, `/ember/`, `/trust/`, `/learn/`, `/learn/randomx-memory-cache/`, `/learn/xmrig-cpu-threads/`, `/guides/`, `/guides/xmrig-windows-setup/`, `/troubleshoot/`, `/troubleshoot/xmrig-huge-pages/`, `/troubleshoot/xmrig-msr-error/`, `/troubleshoot/xmrig-low-hashrate/`, `/tools/`, `/tools/electricity-cost-calculator/`, and `/tools/xmrig-log-decoder/`. `robots.txt`, `sitemap.xml` and the public third-party notices file were also checked as non-HTML destinations.

## Findings before fixes

### Confirmed defects

- Header `aria-current="page"` only matched exact hub paths. Readers on published Learn, Guides, Troubleshoot and Tools details had no active section indication, although the nav supports one visually and semantically.
- `verify-content.mjs` used filesystem existence checks for case validation. On Windows these are case-insensitive, so a capitalization mismatch could pass locally despite failing on a case-sensitive static host.
- The Huge Pages article linked to a Microsoft Learn URL that redirected from `/windows/desktop/` to the current `/windows/win32/` canonical route.

### Design refinement, not a confirmed rendering defect

- Static style inspection showed the M09B journey section retained the full general section bottom padding immediately before its related architecture section. The paired sections now use a more deliberate, closer rhythm; global editorial spacing is unchanged.
- The existing technical diagrams and process flows already explain the major candidates (pool coordination, shares, threads/cache, Huge Pages, MSR and electricity inputs). No additional visual was justified.

### Unverified concerns

- The local Astro preview could not be reached from the in-app browser (connection timed out for both `127.0.0.1` and `localhost`). Thus no rendered visual/overflow claim is made at 1440, 1280, 1024, 768, 600, 390 or 360 px. Responsive behavior, diagram alignment, card heights and visual contrast at those widths remain unverified in a browser.
- External link destination checks are not part of the local link verifier. Reviewed source links are primarily official XMRig, Monero Project, Microsoft Learn, GNU Privacy Guard and repository pages. Current official docs opened during review; Microsoft’s old privilege URL redirected to its Win32 canonical and was updated. The GitHub security-file page could not be inspected through the web reader, so its live availability remains unverified; the corresponding repository file exists locally.

## Fixes implemented

- Header navigation marks the appropriate Learn, Guides, Troubleshoot or Tools section current on its nested detail routes. Other primary routes retain exact matching; no nav destinations or labels changed.
- `verify-content.mjs` now checks each path component against exact directory-entry casing, including static assets and HTML/index routes, before accepting internal URLs. A negative root-case assertion guards the resolver on case-insensitive development filesystems. It continues to check anchors, canonical URLs, JSON-LD, tool script budgets, static article output and sitemap entries.
- Replaced the redirected Microsoft Learn privilege link with its current Win32 URL.
- Tightened only the product journey/architecture section spacing to better group those related explanations.

## Navigation and link audit

The six-item header and eight-item footer navigation have unique destinations within each navigation region. Product CTAs and the M09B resource links target existing routes. Published resource cards are links; planned resource cards are deliberately non-clickable and labeled Planned. Article breadcrumbs and in-content fragments are checked against built HTML. No broken internal URL, missing fragment, placeholder `href`, case mismatch, or unintended internal destination was confirmed in the current build.

The repository-source, official XMRig docs/releases, Monero mining page, Microsoft Learn and GnuPG links were examined for relevance. Official XMRig destinations and current release route resolved; Microsoft’s Lock Pages in Memory article remains valid and explicitly applies to Windows 11 and 10 despite its historical path. No evidence justified replacing it. GitHub security page retrieval was inconclusive, not classified as a confirmed broken link.

## Product storytelling and accessibility

The Configure → Ready → Start → Observe story, user → Ember → XMRig → pool roles and non-metric Fresh / Delayed / Unavailable states remain static and evidence-bounded. No screenshot, simulated metric, mining claim or extra diagram was introduced. Existing semantic heading/list/figure structure, text status labels, 44px navigation/action targets, visible keyboard focus and reduced-motion rules remain. Static inspection found no missing form labels or fake clickable planned cards in the requested calculator/decoder flows. Color contrast and touch behavior were not manually inspected in a rendered browser.

## Verification status

The local rendered browser check was attempted but unavailable, so the requested visual review is pending. Automated results for this milestone are recorded in the task completion report; no browser pass is claimed here. Calculator and decoder source/logic were not altered. No client-side JavaScript, dependency, remote asset, public route or product behavior was added.

## Deliberately deferred

- Full visual assessment at each requested viewport and representative remaining routes, until the local preview is reachable from the review browser.
- Any new technical diagram; current visual explanations already cover the relevant topics.
- Replacing valid official/primary links without a confirmed destination problem.
- Product screenshots until genuine owner-provided, current-build captures are available and scrubbed.
