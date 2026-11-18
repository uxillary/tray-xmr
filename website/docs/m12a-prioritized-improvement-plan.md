# M12A — Prioritized improvement plan for M12B

18 November 2026 · Branch **`main`** · HEAD **`5c37ccdc4f96075ced30e845640b110633bf6bb2`**. Website only. M12A is a documentation/planning milestone; **M12B has not started**.

Read with [route audit](m12a-visual-ux-audit.md), [discovery journeys](m12a-organic-discovery-journeys.md) and [visual content specifications](m12a-visual-content-opportunities.md). The E01–E12 references below are defined in the audit. No traffic, conversion or search-performance improvement has been measured or forecast.

## Decision and boundaries

Recommend **six reusable opportunities**, ranks 1–6 below, delivered in bounded phases: available-resource-first hubs; purpose-sensitive article navigation/openings; contextual link placement; readable tables; tool input/result composition; and two diagram pilots. All retain existing routes, graphite/charcoal/orange identity, hero/animation, primary sources and technical limits.

Homepage entry parity, broader navigation/footer design, full typography normalization, new content routes, live data, desktop screenshots, benchmark datasets, a public download, math/parser changes, dependencies and hosting work are outside the proposed M12B implementation scope. Essential keyboard/reflow verification of all touched shared surfaces is still required; an actual newly confirmed defect should be fixed within the relevant phase or explicitly stop acceptance.

The earlier two M12A readiness documents recommend a production/accessibility QA follow-up. They are historical work, not replacements for this requested visual/UX plan. Production origin and assistive-technology QA remain open dependencies; this plan neither publishes nor certifies a release.

## Scoring model

Each dimension is editorial judgment on **1–5**, not a measured statistic:

- **U — user impact:** 1 minor convenience; 5 directly improves central reader tasks.
- **O — organic discovery relevance:** 1 limited search-entry relevance; 5 strongly supports the existing topic/task cluster. This is relevance, not query volume.
- **V — visual improvement:** 1 subtle polish; 5 clearer composition/information hierarchy.
- **E — effort:** 1 small copy/style edit; 5 substantial multi-surface implementation/QA.
- **T — technical risk:** 1 isolated static change; 5 behavioral/model/security/architecture exposure.
- **R — reuse:** 1 isolated page; 5 common pattern across many routes.

Priority points = **`3U + 2O + 2V + 2R − E − T`**. Higher is better; theoretical range is −1 to 43. Effort/risk reduce the score. Ties prefer the more immediately useful task and shared acceptance coverage. These weights and scores deliberately favor reusable reader utility, not traffic estimates. Small differences are not statistically meaningful. Severity and ranking are separate: this audit establishes no P0/P1 and can still prioritize meaningful P2 improvements.

## Ranked backlog — 14 opportunities

All paths in this report are relative to `website/`.

| Rank / ID | Opportunity; evidence | U | O | V | E | T | R | Points | Severity / confidence / scope |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1 / B01 | Put available hub resources first; specific tool action labels; E04 | 5 | 5 | 5 | 2 | 2 | 5 | 41 | P2 recommendation; high source confidence, untested visual benefit. **M12B**. |
| 2 / B02 | Reusable article section navigation and purpose-sensitive openings; E05–E07 | 5 | 5 | 4 | 3 | 2 | 5 | 38 | P2 recommendation; high structural confidence. **M12B**. |
| 3 / B03 | Place existing contextual tool/guide links beside decisions; E07/E08/E12 | 5 | 5 | 3 | 2 | 1 | 4 | 36 | P2 recommendation; high link-inventory confidence, organic benefit hypothetical. **M12B**. |
| 4 / B04 | Readable semantic article/tool tables and narrow-screen treatment; E02/E05/E08 | 5 | 4 | 5 | 3 | 3 | 4 | 35 | P2 recommendation/source omissions; high CSS confidence, reflow unverified. **M12B**. |
| 5 / B05 | Tool input/result hierarchy, completion guidance and targeted UI defects; E08/E09 | 5 | 5 | 5 | 4 | 3 | 3 | 34 | P2 mixed recommendation/confirmed UI issues; behavior QA required. **M12B**. |
| 6 / B06 | Pilot Huge Pages decision aid and profitability two-branch explanation; E06–E09 | 4 | 4 | 5 | 3 | 2 | 4 | 33 | P2 recommendation; technical design specified, comprehension benefit untested. **M12B**, two pilots only. |
| 7 / B07 | Wider navigation/footer review: hidden-scroll affordance, section semantics and zoom clearance; E01/E02 | 4 | 3 | 3 | 2 | 2 | 5 | 30 | P2 prediction/polish; needs browser evidence before broad redesign. Later; touched-surface QA mandatory now. |
| 8 / B08 | Consolidate small secondary type and touched hardcoded tokens across remaining surfaces; E02/E05/E08 | 4 | 3 | 4 | 2 | 2 | 4 | 30 | P2 recommendation; target actual roles, not indiscriminate font increases. Later; tool/table text included in B04/B05. |
| 9 / B09 | Homepage four-task entry parity and published-coverage copy; E03 | 4 | 4 | 4 | 2 | 2 | 2 | 28 | P2 recommendation; preserve hero. Later bounded change. |
| 10 / B10 | Expanded decoder coverage/example explanation with fixture-backed version limits; E08/E09 | 4 | 3 | 3 | 2 | 2 | 2 | 24 | P2 recommendation; no parser expansion. Later; basic scope/error clarity included in B05. |
| 11 / B11 | Broader form announcement/error-recovery refinement after assistive testing; E08 | 4 | 3 | 2 | 2 | 3 | 3 | 23 | P2 investigation; eager validation fix included in B05, broader behavior depends on testing. |
| 12 / B12 | Trustworthy visible update/review metadata policy and optional reading-time method; E05/E07 | 3 | 3 | 2 | 2 | 2 | 4 | 23 | P2/P3 recommendation; updated date visibility may accompany B02, no fabricated review. |
| 13 / B13 | CPU-thread/low-hashrate blank comparison record and three-count visual; E06/E07 | 3 | 3 | 3 | 2 | 1 | 2 | 22 | P2 recommendation; no synthetic device measurements. Later. |
| 14 / B14 | Product/Trust section index and disclosure summaries; E10 | 3 | 2 | 3 | 2 | 2 | 2 | 19 | P2/P3 recommendation; no fresh desktop claims. Later. |

Ranks 7–14 are not silent additions to M12B. B02/B04/B05 include limited typography, metadata and validation work needed to complete their own changes; they do not authorize a whole-site redesign or a new benchmark tool. Reassess after real browser/user/search evidence.

## Phase 0 — establish a reliable QA baseline

**Purpose:** resolve evidence uncertainty before accepting visual implementation. No visual change required in this phase.

- Record branch/HEAD, initial working-tree files and source/build identity. Preserve existing user changes. Put any temporary baseline backup in a durable task directory, not an execution-scoped temporary directory; verify it is readable before a build that might regenerate tracked `.astro` artifacts.
- Build the intended source using a confirmed local audit origin; keep synthetic `.invalid` origins out of deployments. Start a fresh preview on an explicit unused port with strict binding. Independent HTTP success plus current-output/asset comparison is needed before calling it the verified preview. Never use an old listener just because it renders Ember.
- Establish supported browser viewport controls and log actual CSS viewport dimensions and height; screenshots/window sizes alone do not prove CSS width. If unavailable, record the limitation and leave visual acceptance open.
- Capture pre-change representative routes: homepage, all four hubs, all three tools, Huge Pages, setup, security, one Learn article, Ember and Trust; include remaining articles for shared-layout baseline.
- Run initial task/keyboard checks and note existing failures separately so regressions can be attributed correctly. Do not bypass endpoint/security policy or change system protections to make preview work.

**Gate:** if current-build rendering remains blocked, source implementation can be reviewed only as provisional work; no rendered/mobile acceptance may be marked passed. M12B completion requires either access to a testable build or explicitly outstanding visual QA with the milestone left unaccepted. M12A's documented limitation is not itself a website bug.

## Phase 1 — available-resource-first hubs and contextual handoffs

Implements **B01/B03**, without redesigning homepage/product surfaces.

**Exact existing file targets:**

- `src/components/HubPage.astro`, `ResourceCard.astro`, `HubVisual.astro` only if its placement/size needs adjustment.
- `src/pages/learn/index.astro`, `guides/index.astro`, `troubleshoot/index.astro`, `tools/index.astro`.
- `src/styles/site.css`, limited to hub/card and relevant shared typography rules.
- Targeted content link placements in `src/content/articles/xmrig-msr-error.md`, `xmrig-huge-pages.md`, `xmrig-windows-setup.md`; existing calculator help/link sections in the three tool page files. Other article edits only where a specified journey needs an existing destination.

**Intended behavior/visual change:** a short hub introduction immediately precedes published/available resources. Editorial rationale and generic concept strip become supporting material. Tools has three prominent available cards with input/output descriptions and action labels appropriate to calculation/decoding; planned instruments remain separately labelled and non-interactive. Add an optional card action-label prop, preserving article defaults; avoid a second card framework. Guides distinguishes setup versus blocked download; Troubleshoot places the decoder alongside real symptoms. Add only contextual links specified by the journeys report, preserving existing useful links.

**Mobile/accessibility:** same useful-content-first DOM order at every width; single-column live cards and compact future topics; full-card keyboard focus; one link per card, no nested controls. Keep headings and availability labels explicit. Use static previews only if they help selection; no mini calculator hydration.

**Risks:** accidentally changing all article card labels, mixing planned/live data, duplicate section IDs, deleting article discovery, or copy advertising planned articles.

**Acceptance:** all four hubs expose real resources before generic editorial visuals in source/reading order; Tools contains exactly three linked available tools; no planned card gets a destination; task-specific tool labels appear; all seven articles remain discoverable; new links/fragments resolve. No fabricated outputs or route additions. Browser QA confirms hierarchy, wrapping, focus and touch use at all required widths.

## Phase 2 — article navigation, openings and tables

Implements **B02/B04**. Keep diagnostic, procedural and conceptual layouts distinct through small optional treatments.

**Exact existing file targets:**

- `src/components/ArticleLayout.astro`, `ArticleVisual.astro`, `TechnicalCallout.astro` only where ordering/semantic roles require changes.
- `src/content.config.ts` only if explicit optional section/presentation metadata proves necessary after inspecting rendered heading support.
- All seven existing articles: `xmrig-huge-pages.md`, `xmrig-windows-setup.md`, `xmrig-windows-security-warnings.md`, `xmrig-msr-error.md`, `xmrig-low-hashrate.md`, `randomx-memory-cache.md`, `xmrig-cpu-threads.md` under `src/content/articles/`.
- `src/styles/site.css` and scoped article styles in `ArticleLayout.astro`; tool comparison styles in `src/styles/mining-profitability.css` as part of B04.
- At most one small reusable `src/components/ArticleContents.astro` if keeping TOC markup separate materially simplifies the existing layout. It is proposed, not an existing file or required new abstraction.

**Intended change:** a compact complete section list follows the quick answer; optional wide-screen rail uses spare space without enlarging every prose line. Inspect `render(entry)` heading data, specifically raw HTML H2s, before implementation; if it cannot represent all headings, prefer a small explicit validated section list for the exceptional articles over a fragile regex parser or dependency. Preserve manual setup/security IDs. Reorder/trim repeated summary/callout/body openings while retaining their safety meaning. Show a real `updatedDate` where supplied, without relabelling it a review date.

**Tables:** create a default article-table presentation plus explicit diagnostic/evidence variants where useful. Security comparison gets a meaningful caption/scoped headers and a navigable local overflow region if retained as a wide table. Huge Pages gets a concise signal-entry summary before the full comparison; do not erase its “does not establish” column to make it fit. Profitability detailed projections may use a labelled local scroll region or accessible secondary period view; choose after rendered QA. Preserve row/column association, units and every modeled value. Target readable default text, not a fixed four-column table forced into 9px cells.

**Mobile/accessibility:** section list stays in flow; a collapsible version only if native/keyboard/screen-reader use remains clear. Avoid a fixed-position mobile rail. Keep code scroll local and copyable. Each scroll region needs an accessible name and discoverable horizontal-scroll instructions. Do not duplicate whole tables for mobile without preventing duplicate assistive-technology content and inconsistent values.

**Risks:** missing raw-HTML headings, duplicate IDs, stale source links, sticky header obscuring anchors, rail overlapping footer/content, changing `TechArticle` metadata inadvertently, or reordering warnings after unsafe actions. CSS table changes can alter code/example geometry.

**Acceptance:** complete usable section navigation for all seven articles, with no sources/diagram headings accidentally masquerading as body sections; every fragment resolves and visible target clears the header; one H1 remains; updated date is truthful; first answer remains concise; long task pages reach config/verify/issues directly. Full signal/evidence meaning and source dates remain. No document overflow; contained table/code regions are reachable by keyboard and touch. Named screen-reader navigation and zoom checks must be recorded, not inferred from static tests.

## Phase 3 — tool composition and two diagram pilots

Implements **B05/B06**, including the narrow confirmed font/validation issues. Prefer existing components and scripts; **do not modify mathematical models or parser recognition**.

**Exact existing file targets:**

- `src/pages/tools/electricity-cost-calculator.astro`, `monero-mining-profitability-calculator.astro`, `xmrig-log-decoder.astro`.
- `src/styles/electricity-calculator.css`, `mining-profitability.css`, `xmrig-log-decoder.css`; touched shared type/diagram roles in `src/styles/site.css`.
- `src/scripts/mining-profitability.js` for output binding/validation timing; `electricity-calculator.js` or `xmrig-log-decoder.js` only if required for result access, error association or the specified presentation. Preserve current calculate/analyze/reset semantics.
- `src/components/ArticleVisual.astro` huge-pages branch and `src/content/articles/xmrig-huge-pages.md` for the diagnostic pilot.
- Existing `tests/mining-economics.test.mjs`, `electricity-cost.test.mjs`, `xmrig-log-decoder.test.mjs` and `accessibility-contract.test.mjs` for relevant regressions. Add only meaningful behavior checks if controllers change; do not add snapshot tests that merely assert the chosen layout.

**Intended tool behavior:** larger and better-ranked help/result text; compact readable daily summary beside the form on wide screens, in logical order with a direct result-access link when stacked. Do not make an invalid/empty result appear numeric. Profitability separates measured values from externally sourced assumptions, links to the existing input guide, and avoids marking untouched blank controls invalid after the first keystroke. Preserve required validation on a clear completion attempt and touched-field feedback. A visible calculate/review action is optional if needed to define that attempt; select one coherent interaction rather than mixing ambiguous live and submit-only behavior. Record its intended policy before coding.

Electricity keeps blank tariff, illustrative watt default and local calculation; verify pence/currency mismatch does not leave misleading stale results, including energy readouts after edits. Decoder uses `--mono`, maintains nearby privacy/scope text, labels empty/unknown/invalid states, preserves Analyze/Clear and results focus. Do not add fixture-free version claims, file upload, identifiers in results or a general health score.

**Diagrams:** implement only Huge Pages privilege/allocation decision aid and profitability revenue-versus-electricity branching from the visual specifications. Refine existing graphics; do not append duplicate diagrams. Use static semantic markup for the explanation; dynamic summary reads existing result objects/DOM bindings without a second calculation path. Add the missing explicit XMR-price conversion in the formula explanation. Other three diagram proposals remain later work.

**Mobile/accessibility:** expose a meaningful path from inputs to results after the long form; no sticky panel obscuring controls or virtual keyboard. Result focus moves only on explicit navigation/analyze actions, not on every keystroke. Preserve field label/help/error relations and form-radio semantics. Avoid noisy simultaneous live errors for untouched fields. Use sign/text with result colors; no motion-dependent meaning.

**Risks:** duplicated output bindings, stale results after invalid input, changed form timing/keyboard semantics, misleading fiat/XMR units, altered currency handling, changed defaults, or a diagram simplifying technical caveats. The legacy shared `.flow-node`/`.flow-connector` selectors are reused by electricity; scope touched styles carefully to avoid changing the homepage flow or other diagrams.

**Acceptance:** all three tools remain local/no-storage/no-API; initial profitability numerics remain blank; electricity tariff remains blank; negative/zero/positive/invalid/missing states are distinct. Output agrees with existing model fixtures and the M11B hypothetical arithmetic. No stale valid results remain after invalidation; resetting/switching currency/network basis/rate units behaves correctly. Decoder unknown text stays unknown, oversized/empty input recovers, output reveals no matched identifiers, successful analysis focuses results and Clear focuses input. Diagrams communicate the same meaning in plain text at all widths. Calculator/model/parser files in `src/lib/` remain unchanged.

## Phase 4 — regression and browser acceptance

This is the acceptance phase of M12B, not an unbounded redesign phase. M12C can finish specialist investigations or later candidates, but must not retroactively label missing M12B visual evidence a pass.

### Commands proportionate to the implementation

From `website/`, run existing `npm test`, `npm run check`, a release-style build with the correct confirmed test origin, `npm run check:links` and `npm run verify:production-origin` as applicable. `check:links` already builds, so avoid redundant rebuilds without a new reason. Run `git diff --check` from the repository root. Check 17 HTML routes, unchanged draft exclusions, local fragments/links, metadata and sitemap parity. Tests assert calculation/parser contracts; browser checks assert presentation and interaction. No dependency is needed for these planned changes.

### Required browser matrix and evidence record

| Surface | Widths / states | Acceptance evidence |
| --- | --- | --- |
| All 17 routes | 1440, 1280, 1024, 768, 600, 390, 360 CSS px | Browser/version, viewport width/height, source/build identity, screenshot/reference, navigation/footer wrap, no clipping or document-level overflow. All shared changes affect more than the edited route. |
| Hubs | All widths; keyboard/card hover/focus/touch | Live resources reached promptly; planned/live distinction; long titles/badges; no nested focus targets. |
| Articles | All widths; all body section links, tables/code | Rail/list behavior, anchor clearance, reading order, complete raw-HTML heading support, local scrolling and preserved caveats. |
| Tools | All widths; empty/valid/invalid/recovered/reset states | Inputs, result access, long values, currency/rate/network variants, synthetic example parity and error/focus behavior. |
| Shared shell and representative articles/tools | 200% zoom and 400% reflow; both sides of touched breakpoints | No hidden focused element, text loss, overlapping sticky header/rail or inaccessible horizontal nav. Recheck footer around 768–1024px. |
| Diagrams and hero | Reduced motion, normal motion, text alternatives | Hero retained; all new explanations understandable without motion/color/position alone. |

Use a Chromium desktop browser plus Firefox or another independent engine if available; record actual versions rather than asserting cross-browser support from one run. Test at least one real mobile Safari/Android browser in M12C if unavailable locally; emulator widths alone are not real-device evidence. Test touch where supported and distinguish simulation from physical-device use.

Operate NVDA with an identified browser/version, or another named screen reader, for landmarks/headings, TOC, form names/units/help, live validation/result announcements, decoder focus and table row/column association. Measure contrast for actual foreground/background states, including changed small text, borders, focus/error/hover and gradients. Historical solid-color ratios do not cover these changes. No WCAG compliance claim follows from the matrix alone.

### Stop conditions and regression boundaries

- Do not change desktop files, models, parser rules, route inventory, origin contracts or dependencies in a presentation patch.
- Any new security/technical instruction needs authoritative source review and accurate dates. No automatic elevation, protection bypass, current earnings or “healthy log” claim.
- A broken anchor, inaccessible input/result, wrong value/unit, missing warning or loss of published content blocks that phase's acceptance.
- A preview failure blocks rendered acceptance and must be recorded as an environment limitation unless independently proved a site defect. Do not claim widths or keyboard/screen-reader passes that were not run.
- Keep broader production-origin/deployment verification separate from local UX acceptance. Real hostname/configuration remains owner-dependent; no hosting changes are authorized by M12A.

## M12A completion and verification record

Deliverables are this plan and the three companion documents linked above; the central `docs/content-roadmap.md` receives only planning status and recommended next step. Existing M11/M12 readiness reports are retained, not revised.

- Baseline: `main` / `5c37ccdc4f96075ced30e845640b110633bf6bb2`; four pre-existing modified generated `.astro` files recorded in the audit. No branch/commit/push/PR was created.
- Audit coverage: ten fixed pages and seven published articles, **17 total**. Sitemap and robots implementations also inspected; no new route published.
- Specific investigation: fresh synthetic-origin `npm run build` **passed**, 17 pages. Generated markup inventory found one H1 on each and an inbound main-content link for every non-home route. This is not browser/accessibility/indexing validation.
- Preview: fresh strict port 4339 reported ready; independent shell HTTP was socket-blocked; in-app and Opera browser navigation timed out. Preview stopped. Exact widths rendered: **none**. No interaction/zoom/screen-reader or fresh contrast pass claimed.
- `git diff --check`: **passed** after documentation edits. Separate checks of all four new (untracked) documents passed for trailing whitespace and relative Markdown links; 17 unique numbered route sections and all 14 backlog score calculations were verified. Git emitted LF-to-CRLF notices, not whitespace errors. Whitespace checks do not validate UX recommendations or historical reports.
- No published source, desktop file, dependency, calculator model or parser was intentionally changed. Build output is ignored; newly generated preview metadata is removed during cleanup. Pre-existing generated differences remain outside the documentation deliverable.
- Final path review: Git status contains the four initially modified `.astro` paths plus exactly the four requested reports and the central roadmap update. A targeted diff of desktop source/manifests and website source/public/configuration/manifests is empty. Branch and HEAD are unchanged. No visual implementation, new route or dependency change is present.
- Full application tests/checks were not rerun for documentation-only edits. The build was run solely for the preview/generated-markup investigation. Historical test passes are not new verification results.

### Unverified assumptions and limitations

Visual impressions are source-based composition assessments; all mobile/overflow/contrast/focus outcomes need controlled rendering. The audit has no user tests, search analytics, production crawl, measured speed or conversion evidence. Product claims are assessed for website consistency with existing dated evidence, not revalidated by inspecting/running the desktop application. November primary-source checks were limited to four XMRig documentation pages for diagram context; the entire Windows security/release corpus was not re-reviewed and the current latest XMRig version is not asserted. Implementation effort/risk scores are relative judgments, not time/cost commitments.

**M12A ends with this plan. Recommended next step: M12B Phase 0, then the six ranked improvements with bounded regression and browser acceptance.**
