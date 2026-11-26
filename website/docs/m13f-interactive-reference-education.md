# M13F — Interactive reference and mining education

26 November 2026. **B07 and B12 implemented locally; ready for owner visual acceptance.** Scope is `website/` only. No commit, branch creation, push, deployment, promotion or mining experiment occurred.

## Baseline and verified preview

Started on clean `main`, HEAD `a68f0f49733ef8f14a8983d4e68dcebab937b4fa`. Verified the reported baseline: **61 passing tests**, **21 published routes**, four existing Tools resources and **15 diagnostic entries in five categories**, scoped to XMRig **6.26.0**. No confirmed production origin was supplied or configured. Reviewed the requested M13A/B/D/E reports, structured inventories, article/reference components, calculator models/controllers, accessibility conventions and visual tokens.

- [XMRig log reference](http://127.0.0.1:4376/troubleshoot/xmrig-log-reference/)
- [Mining difficulty and expected rewards](http://127.0.0.1:4376/learn/mining-difficulty-expected-rewards/)

The loopback Astro preview serves the current `website/dist`. [Browser evidence](evidence/m13f/browser-acceptance.json) verifies HTTP 200 and SHA-256 identity against all **21** built published HTML files. The initial sandbox listener could not be reached (EACCES); it was stopped and replaced by an approved host-context listener bound only to `127.0.0.1`. No firewall or browser security settings were changed. These are local review URLs, not public deployments; they depend on the preview process remaining available.

To restart from `website/`, set `SITE_URL=https://ember-m12b0-audit.invalid` and `SITE_INDEXING=noindex`, run `npm run build`, then `npm run preview -- --host 127.0.0.1 --port 4376 --strictPort`. The first baseline build without `SITE_URL` correctly failed closed; the existing protected audit origin was then used for all successful builds.

## Implemented functionality and interaction architecture

**B07:** `XmrigReference.astro` still renders the original inventory directly into static HTML. Build-time search text includes titles/message families, synthetic excerpts, category labels, explanation boundaries, context, safe next actions, coverage and a small explicit alias table. Categories and counts are derived from the same inventory. The controller indexes attributes on these existing sections and toggles native `hidden` attributes on entries and empty categories. It never renders a second reference or invokes the decoder parser.

Search trims outer whitespace, ignores case, splits on whitespace and requires every literal term to occur somewhere in an entry's search text. It does not require a contiguous phrase, rank entries or expand arbitrary synonyms. Original inventory order is preserved. Maintained aliases include HP/large pages, MSR/model specific registers/US optimization spelling, RX/RandomX and accepted/rejected shares. Punctuation uses string inclusion, never user-built regular expressions. Input is never evaluated, interpreted as markup, transmitted, persisted or placed in URL parameters.

The compact toolbar supplies search, a native category select, visible count, debounced polite count announcements, clear search and reset all. Clear keeps the category and focuses search; reset restores every entry and retains button focus. The no-result state explains the finite version scope and that absence cannot classify a message as valid, harmless or malicious; it links to the existing decoder. Scope/version and the existing decoder handoff stay outside filtered results. A decoder-supported/reference-only filter was deliberately omitted: wording-limited and heuristic coverage would make a binary filter misleading, while all coverage labels remain visible on entries.

Existing category and entry IDs/links remain unchanged. A fragment targeting a hidden entry or category clears both filters and scrolls to the revealed target. Native hash navigation remains in control when the target is already visible. Handling covers direct entry, `hashchange`, same-fragment clicks and back/forward history. Search/filter states create no URLs or indexable routes. If filtering would hide a focused descendant, focus moves to search before hiding it.

**B12:** `RewardTeaching.astro` adds a workspace to the existing lesson. Its controller uses the isolated `reward-education.mjs` model and existing locale number parser without altering calculator models. Miner/network rates have H/s, kH/s, MH/s and GH/s selectors; changing a unit reinterprets the retained number, with an explicit no-conversion note. Precise duration accepts seconds. A synchronized keyboard-operable slider explores whole hours from one to 24; it is hidden with an explanation when a precise duration cannot be represented by that range/step, rather than displaying an inconsistent value. The invented reward and reset are explicit.

Outputs include contribution, hashes, implied difficulty, expected block equivalents, illustrative gross XMR, a ratio, proportional strip, interpretation and conditional zero/one-block rewards reflecting the chosen reward. Invalid assumptions clear dependent output immediately; touched controls expose described errors. Typing updates visual results quietly; change/blur/reset provide debounced polite summaries. Static M13D explanations, tables and fixed examples remain alongside the interaction and are not rewritten as selected values.

Both enhancement roots are hidden until their module initializes. Without JavaScript, all 15 original reference entries, sources, category navigation, entry anchors and the full static lesson remain available; no inactive controls are displayed. Astro inlines the small reference module automatically; the lesson loads its own module and the existing shared number-parser chunk. Neither enhancement is requested on unrelated articles.

## Mathematical model and validation

Normalize hashrates to H/s. With a fixed **120-second** target interval:

```text
relativeContribution       = minerHashrateHs / networkHashrateHs
assumedNetworkDifficulty   = networkHashrateHs × 120
hashesPerformed            = minerHashrateHs × observationSeconds
expectedBlockEquivalents   = hashesPerformed / assumedNetworkDifficulty
expectedGrossReward        = expectedBlockEquivalents × assumedReward
```

The whole network includes the miner. Implied difficulty is derived under constant rates and the target-interval assumption; it is not live measured difficulty. Model arithmetic retains full JavaScript numeric precision; display alone rounds to seven significant digits or four decimal places in scientific notation for values below 0.0001 or at least 10¹². Non-zero supported results never round to an apparent zero.

Bounds are arithmetic safeguards, not plausible hardware/reward claims. Network rate is positive; miner rate and reward may be zero. Non-zero normalized rates are at least 10⁻⁹ H/s and at most 10¹⁸ H/s. Duration ranges from 10⁻⁹ to 315,360,000 seconds (10 × 365 days); non-zero reward ranges from 10⁻⁹ to 10⁶ XMR. Equivalent unit choices use equivalent normalized bounds. Missing, malformed, nonfinite, negative, unsupported-unit and excessive inputs fail validation, as does miner rate above the total network. Derived values are checked for finiteness. Inputs use decimal notation and the existing decimal/grouping conventions, not exponent text.

Independent default verification:

| Quantity | Calculation | Result |
| --- | --- | --- |
| Contribution | 1,000 / 1,000,000 | 0.001 = **0.1%** |
| Implied difficulty | 1,000,000 × 120 | **120,000,000** |
| Hashes performed | 1,000 × 3,600 | **3,600,000** |
| Expected block equivalents | 3,600,000 / 120,000,000 | **0.03** |
| Illustrative gross reward | 0.03 × 0.5 | **0.015 XMR** |

These are hypothetical teaching assumptions, not current Monero conditions. Under fixed other assumptions, doubling miner rate or duration doubles expectation; doubling network rate halves it. Zero miner rate gives zero expected work; zero invented reward gives zero gross reward. No probabilities, random simulation, payment deadline, pool forecast, fiat earnings, electricity costs or operating profit are calculated. Conditional no-block/one-block examples are not an exhaustive outcome distribution. The lesson points to the existing profitability and efficiency calculators for their distinct tasks.

## Visualization and focused visual changes

Both the static and interactive relative-rate strips use the actual percentage width with no minimum-width segment. At very small fractions the orange portion can be narrower than one screen pixel; an adjacent explicit warning, numeric percentage and approximately one-in-N ratio provide equivalent information. No enlarged quantitative segment or unlabeled locator implies a larger contribution. At zero and 100% the strip remains proportionate. Threshold branching remains explicitly conceptual rather than quantitative.

Visible H1s are shortened and sized only on these technical articles; descriptive SEO titles remain intact, and Article schema headlines match the visible H1s. Updated dates reflect 26 November. Controls share existing graphite/orange tokens, input labels and visible focus; entries retain their established structure and contained horizontal console scrolling. Shared site styling, homepage hero, other article layouts and sticky-header clearance rules are preserved. No new animation or dependency was introduced.

Reviewed existing decoder, pool/share/payment, Huge Pages, MSR and low-hashrate handoffs: their entry-level links and finite coverage key remain intact. The lesson retains profitability, measurement and threshold links and adds the relevant efficiency handoff inside the workspace. No repeated promotional block or new navigation section was needed.

## Demonstrations and visual evidence

| Resource/state | Desktop | Mobile |
| --- | --- | --- |
| Reference opening / toolbar | [1440px](evidence/m13f/reference-desktop.png) | [390px](evidence/m13f/reference-390.png), [320px](evidence/m13f/reference-320.png) |
| Filtered reference | [Matching entry](evidence/m13f/reference-filtered.png) | [390px entry](evidence/m13f/reference-match-390.png), [320px entry](evidence/m13f/reference-match-320.png) |
| Teaching example | [1440px workspace](evidence/m13f/teaching-desktop.png) | [390px inputs](evidence/m13f/teaching-390.png), [320px inputs](evidence/m13f/teaching-320.png) |
| Teaching results | [Default workspace](evidence/m13f/teaching-desktop.png) | [390px results](evidence/m13f/teaching-results-390.png), [320px results](evidence/m13f/teaching-results-320.png) |

Additional captures show [no search results](evidence/m13f/reference-no-results.png), [invalid duration](evidence/m13f/teaching-invalid.png), [tiny non-zero contribution](evidence/m13f/teaching-tiny.png), [reference without JavaScript](evidence/m13f/no-javascript-reference.png) and [lesson without JavaScript](evidence/m13f/no-javascript-teaching.png).

To demonstrate filtering, search `huge pages 100%` in CPU & memory: only `huge-pages-full` remains. Switching to Submission results yields zero matches; Clear search retains that category; Reset all restores 15 entries. Follow `#share-rejected` while a Huge Pages search is active: both filters clear and the entry is revealed.

To demonstrate teaching, retain defaults and change miner rate from 1,000 to 2,000 H/s: expectation becomes 0.06 block equivalents and 0.03 XMR. Double network rate to 2,000,000 H/s: reward returns to 0.015 XMR. Double duration to 7,200 seconds: reward becomes 0.03 XMR. All changes are under invented fixed assumptions; reset returns to the M13D example.

## Accessibility and browser acceptance

[Reproducible browser harness](../scripts/verify-interactive-resources.mjs) follows the established M13E approach using installed Edge Chromium and Node built-ins, without a new dependency or personal browser profile. Reproduce with `node scripts/verify-interactive-resources.mjs '<installed Chromium executable>' 'http://127.0.0.1:4376/'` from `website/`.

- **16 responsive records:** both affected routes at **1440, 1280, 1024, 768, 600, 390, 360 and 320 CSS pixels**, one H1 each, no document-level overflow. Console examples remain independently scrollable. Desktop and 390/320px screenshots were visually inspected.
- **13 recorded interaction/mode checks:** initial/search/multiple-term/alias/literal/no-result states, category composition, clear/reset, fragment reveal and back/forward, default/change/unit arithmetic, synchronized slider and precise duration, invalid/recovery/reset, tiny values and zero inputs, keyboard, anchors, contrast/accessibility tree/reduced motion and no-JavaScript content.
- Actual CDP keyboard events verify Tab order, visible focus, Enter clear action and ArrowRight slider operation. Reset retains focus. Text field validation is associated through `aria-describedby`; native select semantics expose selection. Typing does not announce the entire teaching result on each keystroke; blur/change/reset summaries and reference counts are debounced.
- All **16** tested direct entry/lesson anchor positions clear the sticky header. Hidden entry/category reveal, same-fragment links and back/forward were exercised separately.
- **59 computed opaque text/background treatment groups** pass their applicable 4.5:1 or 3:1 threshold; minimum **7.03:1**. These measured samples include controls, result text and the existing technical content; they are not a full accessibility certification.
- Accessibility-tree inspection confirms search labels and numeric educational equivalents. Reduced-motion emulation finds no animated technical-resource elements. A JavaScript-disabled browser reload confirms complete static content and hidden interactive roots. No captured runtime errors, failed HTTP requests or external resource requests occurred during the bounded test.

These checks use headless desktop **Edge/Chromium 158.0.4370.33** and CSS viewport resizing. Native zoom/text scaling, actual screen-reader use, Firefox/Safari, physical devices and owner visual acceptance remain **owner actions**. No such verification is claimed. The initial harness assumed a 2px outline; the existing browser treatment was 3px, so the assertion was corrected to accept visible outlines of at least 2px.

## Performance, static SEO and preservation

[Baseline payloads](evidence/m13f/baseline-payloads.json) were recorded from the successful pre-implementation build. [Final build audit](evidence/m13f/build-audit.json) records final assets, sizes, deltas and protected-source hashes. These are decoded built bytes and offline gzip estimates, following the prior payload-audit method. Inline script bytes are already included in HTML; imported shared script chunks are counted once per route.

| Resource | HTML raw before → after | HTML gzip estimate Δ | CSS raw / gzip estimate Δ | New JavaScript |
| --- | ---: | ---: | ---: | --- |
| Reference | 38,019 → 48,685 | +2,317 | +3,736 / +721 | **1,878 raw bytes inline**, included in HTML |
| Difficulty lesson | 21,750 → 27,337 | +1,539 | +3,736 / +721 | **7,016 raw / 3,071 gzip estimate bytes**, including existing parser chunk |

Both pages request 84,234 raw CSS bytes across four files. Only the two technical resources request the expanded technical CSS; the shared article stylesheet adds 49 raw bytes for the scoped H1 rule. Shared site CSS is unchanged. The reference search bundle excludes the source inventory; search text lives on the existing static sections, avoiding duplicate client-rendered content.

Cache-disabled local CDP observations separately record actual HTTP encoded transfers (gzip plus response overhead): reference **11,003 HTML / 19,505 CSS / 0 external JS bytes**; lesson **8,584 HTML / 19,505 CSS / 3,811 JS bytes**. Exact before/after gzip estimates are comparable payload deltas; actual pre-change HTTP transfers were not collected, so no observed wire-byte improvement is claimed. Local compression, warm workstation conditions and response headers are not public-host or field Core Web Vitals measurements. No LCP/INP/CWV improvement claim is made.

The build/link/origin verifiers pass with **21 routes**, unique metadata, existing canonicals/sitemap, consistent shortened visible/schema headlines and preserved descriptive SEO titles. Complete reference and essential lesson content exist in generated HTML. Filter/query combinations have no separate URLs. Safe-default noindex, HTML/header protection, production-origin validation and the non-indexed error document remain intact. The `.invalid` origin is only an audit configuration; no production domain or indexing status was invented.

The build audit compares the decoder parser, four existing controllers, electricity/profitability/efficiency models, both original data inventories, dependency manifests/lockfile and shared site CSS against HEAD: all unchanged. Existing sources and all entry IDs/version/coverage boundaries remain intact. No desktop files changed, no dependencies were added, and no production deployment occurred. Generated tracked `.astro` files were restored to their clean entry state after checks.

## Automated verification and owner actions

Final checks: `npm test` (**71/71**, ten focused new tests); `npm run check` (**zero errors, warnings or hints**); `npm run build`; `npm run check:links`; `npm run verify:production-origin`; `git diff --check`. The final browser audit matches all 21 served pages to the final build. Tests cover literal filtering, category composition, reset, stable IDs/anchors, supported units and normalized bounds, independent model arithmetic, invalid/missing/nonfinite values, miner/network relation, extremes, tiny non-zero display, rounding and defaults.

Owner actions: visually accept the two local resources and retained static content; perform inherited native zoom, screen-reader, other-engine and physical-device checks. Confirm the real production origin and separately authorize any release/indexing workflow. No additional implementation scope or deployment is assumed. Stop here for owner visual acceptance.

## Exact changed-file inventory

The following inventory includes implementation, tests, reports and all captured evidence. Paths are relative to `website/`; the companion [machine-readable inventory](evidence/m13f/files-changed.json) contains the same list.

- `docs/content-roadmap.md`
- `docs/evidence/m13f/baseline-payloads.json`
- `docs/evidence/m13f/browser-acceptance.json`
- `docs/evidence/m13f/build-audit.json`
- `docs/evidence/m13f/files-changed.json`
- `docs/evidence/m13f/no-javascript-reference.png`
- `docs/evidence/m13f/no-javascript-teaching.png`
- `docs/evidence/m13f/reference-320.png`
- `docs/evidence/m13f/reference-390.png`
- `docs/evidence/m13f/reference-desktop.png`
- `docs/evidence/m13f/reference-filtered.png`
- `docs/evidence/m13f/reference-match-320.png`
- `docs/evidence/m13f/reference-match-390.png`
- `docs/evidence/m13f/reference-no-results.png`
- `docs/evidence/m13f/teaching-320.png`
- `docs/evidence/m13f/teaching-390.png`
- `docs/evidence/m13f/teaching-desktop.png`
- `docs/evidence/m13f/teaching-invalid.png`
- `docs/evidence/m13f/teaching-results-320.png`
- `docs/evidence/m13f/teaching-results-390.png`
- `docs/evidence/m13f/teaching-tiny.png`
- `docs/m13b-content-growth-roadmap.md`
- `docs/m13f-interactive-reference-education.md`
- `scripts/verify-content.mjs`
- `scripts/verify-interactive-resources.mjs`
- `src/components/ArticleLayout.astro`
- `src/components/MiningEducation.astro`
- `src/components/RewardTeaching.astro`
- `src/components/XmrigReference.astro`
- `src/content/articles/mining-difficulty-expected-rewards.md`
- `src/content/articles/xmrig-log-reference.md`
- `src/lib/reference-filter.mjs`
- `src/lib/reward-education.mjs`
- `src/scripts/reference-filter.js`
- `src/scripts/reward-education.js`
- `src/styles/technical-resources.css`
- `tests/interactive-resources.test.mjs`
