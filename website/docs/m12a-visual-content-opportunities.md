# M12A — Visual content opportunities

18 November 2026 · `main` · `5c37ccdc4f96075ced30e845640b110633bf6bb2`. Planning only; no illustrations, published copy, components or tools changed.

Use the evidence labels and E01–E12 source index in [the audit](m12a-visual-ux-audit.md). Recommendations are editorial judgments. No current-build screenshots or controlled viewports were available. Existing graphics are predominantly accessible-text HTML/CSS with decorative SVG icons; reuse that approach and the current Phosphor icon component. AI imagery, stock cryptocurrency pictures and replacement hero artwork have no role in this plan.

## Reusable article presentation

The existing quick-answer summary, primary-source list, breadcrumbs and honest product context should remain. The problem is sequencing and repetition: every article currently places a large heading/summary/date, an `ArticleVisual`, optional callout and then the body; several bodies repeat the short answer. `ArticleLayout.astro` does not render a general section index or visible `updatedDate`.

| Article purpose | Recommended opening and progression | Suitable visual/example | Avoid |
| --- | --- | --- | --- |
| Huge Pages diagnosis | Specific answer → signal branches/section links → safe checks → deeper memory explanation | Privilege/allocation decision aid and existing detailed signal table | Another page-block illustration before the actionable branch, or a 100% allocation “all healthy” badge. |
| Windows setup | Standalone scope → compact prerequisites and stop checkpoint → complete task index → retained steps | Existing linked five-stage model plus full index; config anatomy, non-runnable placeholders and first-run signals | A second decorative setup flow; hiding provenance checks behind a discretionary disclosure. |
| Windows security warning | Stop/verify answer → decision links → source/evidence comparison → unresolved-warning stop outcome | Existing safety stages and accessible release-check comparison | A primary continue/run/bypass action, or success styling that claims binary safety. |
| MSR diagnosis | Conditional answer → safe check list → access-boundary explanation | Existing MSR diagram only where it adds access/outcome context | Highlighting firmware changes or custom register settings as routine steps. |
| Low-hashrate investigation | Comparable-baseline answer → ordered, navigable checks → details → record measurements | Existing map as optional context; blank comparison record | Repeating the ordered checklist as another diagram or inventing a device's H/s. |
| RandomX concept | Three-term distinction → compact section index → memory purposes and interactions | Improved labelled memory schematic | Treating physical CPU cache, RandomX initialization cache and dataset as interchangeable resources. |
| CPU-thread explanation | Direct answer → count definitions → resource constraints → reversible comparison | Three-count model and blank worksheet | Turning a schematic dot count into an optimal thread calculator. |

### Shared presentation requirements

- Build section navigation from actual rendered body headings, including raw HTML H2s in setup/security articles. Inspect Astro's available heading data before choosing an implementation; do not assume raw HTML headings are returned by the same mechanism as Markdown headings. Preserve explicit existing IDs, resolve collisions and test all seven articles.
- Place a compact “On this page” list after the answer on mobile and, if useful at wide widths, in a modest side rail. Keep DOM reading order coherent, real anchor links and sticky-header clearance. Do not place a tall fixed rail over narrow content or require JavaScript for navigation.
- Keep the main prose measure comfortable; compare the present 820px wrapper with a constrained prose column plus navigation at ≥1280px. Tables/diagrams may need separate full-width treatment. Do not widen every paragraph or adopt a rigid rail threshold without rendered QA.
- Use visible Published and, when present and accurate, Updated metadata. A publication/update date is not automatically a technical review date. Reading time is optional: compute from rendered article text under a documented method or omit it; never invent an editorial reviewer or fresh-review stamp.
- Give warnings, terms, worked examples and next steps distinct headings and restrained border/icon treatment. Reuse `TechnicalCallout.astro` and `StatusBadge.astro` where their meaning fits; do not wrap every paragraph in a card.
- Preserve nearby limitations, sources and safe stop conditions. Optional explanatory detail can be secondary, but critical safety instructions cannot depend on hover or an initially hidden tooltip.
- Generic Markdown tables need a shared semantic/readable treatment; custom signal and economics tables need appropriate variants. Keep captions, scoped headings, local scroll affordance and keyboard access where overflow is intentional.

## Five strongest diagram improvements

These improve existing diagrams. They are not five mandatory new components. Recommended M12B diagram work is limited to opportunities 1 and 2 as pilots; opportunities 3–5 remain later candidates unless implementation evidence justifies reprioritization.

### 1. Huge Pages — separate privilege from allocation decisions

- **Exact route:** `/troubleshoot/xmrig-huge-pages/`.
- **Reader question:** “Why does permission granted still leave 0% or partial Huge Pages, and what should I check?”
- **Purpose/change:** evolve the existing page-mapping illustration into an explicit distinction between a process right and each requested allocation. Connect this to the existing signal table; do not duplicate every table cell inside a second graphic.
- **Format/placement:** semantic HTML decision rows or ordered stages with small CSS connectors and existing icons; place alongside the first diagnosis. Branch links lead to relevant detailed checks. SVG is optional for decorative connectors only.
- **Must communicate:** privilege absent/unreported versus granted; allocation unknown/0/partial/full for the particular reported item; granted privilege does not guarantee allocation; one full item does not establish all allocations or good performance; incomplete output warrants no conclusion. Managed-device/system-policy decisions require the existing caveats.
- **Evidence:** existing article's dated XMRig/Microsoft source list and M11B signal table. The [XMRig Huge Pages documentation](https://xmrig.com/docs/miner/hugepages), opened 18 November 2026, separately documents the privilege line, allocation percentage and Windows allocation limitations. This audit adds no percentage performance promises or new policy instructions. Recheck Microsoft privilege guidance before changing any system-policy wording in implementation.
- **Text alternative:** “First read whether the process reports the Huge Pages privilege. Then read allocation for each labelled item. Permission and allocation are separate; missing or partial output does not identify a cause. Use the matching table row for a safe next check.” Keep all substantive branch meanings in normal text.
- **Mobile:** one ordered vertical flow; branch label, limitation and next-check link stay together. No fixed-width canvas, color-only branch or hover detail.
- **Complexity:** **medium**. Existing `ArticleVisual.astro` huge-pages branch and Markdown table supply most content; risk is oversimplifying partial/unknown status. Pilot with technical/content review, keyboard and screen-reader checks.

### 2. Profitability — show how cost changes the operating result

- **Exact route:** `/tools/monero-mining-profitability-calculator/`.
- **Reader question:** “How did the model get from my assumptions to this daily balance?”
- **Purpose/change:** refine the existing five-step formula, which already exists, to show the fiat-price conversion and the separate energy-cost branch clearly. Pair it with a readable daily summary rather than adding another redundant formula illustration.
- **Format/placement:** labelled semantic HTML equation/flow with two input branches joining at net operating result; summary within results, full static method below. Reuse current result values if the summary is dynamic; share the existing calculation output, never recalculate in a drawing.
- **Must communicate:** hashrate × active seconds → hashes; exactly one network basis → expected block equivalents; reward → XMR; XMR price → gross fiat revenue; pool fee → after-fee revenue; watts/runtime/tariff → electricity cost; after-fee revenue minus electricity → operating balance. Distinguish XMR, fiat and energy units, fixed horizons, expected value versus payout and excluded ownership costs. Show the network-hashrate basis as an alternative, not a second simultaneous denominator.
- **Evidence:** `mining-economics.mjs`, `tests/mining-economics.test.mjs`, M10B specification and M11B's existing hypothetical example are the binding implementation evidence. Recheck the Monero interval reference linked by the page if changing explanatory technical wording; the current model's target constant is 120 seconds. No live price/reward assumption should be introduced.
- **Text alternative:** “The model estimates XMR from work, a network assumption and block reward, converts it using your price, subtracts the pool fee, then subtracts electricity calculated from wall watts, runtime and your tariff. The result holds assumptions constant and is not a payout prediction.” Keep the exact equations in static text.
- **Mobile:** vertical branches in logical reading order, large daily net with adjacent revenue/cost labels; period details remain a semantic table or equivalent accessible secondary view. Never shrink financial figures to 9px to make a drawing fit. Sign and meaning must be explicit, including zero and negative values.
- **Complexity:** **medium**. Changes to existing tool markup/styles and possibly output bindings, without touching model functions. Regression risk includes stale values or inconsistent periods; test against the model's existing scenario fixtures.

### 3. RandomX — memory location versus purpose

- **Exact route:** `/learn/randomx-memory-cache/`.
- **Reader question:** “Which cache is being discussed, and why does more RAM not resolve every limit?”
- **Purpose/change:** refine the current three-layer graphic with separate location and purpose labels; use initialization/working relationships rather than suggesting a simple physical distance ladder.
- **Format:** static HTML definition groups in CPU and system-RAM containers, CSS grouping and optional accessible SVG connector; no animated memory traffic or capacity bars.
- **Must communicate:** CPU L2/L3 cache is hardware near workers; RandomX cache is an initialization resource in RAM; dataset is a distinct working allocation; NUMA can affect allocation placement; Huge Pages changes mappings rather than adding physical capacity. Any numeric capacity is sourced, mode/version-qualified and not drawn to scale.
- **Evidence:** existing article sources; [XMRig RandomX Optimization Guide](https://xmrig.com/docs/miner/randomx-optimization-guide) and [CPU/RandomX configuration](https://xmrig.com/docs/miner/config/cpu), opened 18 November 2026. These document distinct resource requirements and modes. Recheck initialization semantics against upstream RandomX documentation/source before drawing directional lifecycle arrows. Do not infer a universal CPU performance target.
- **Text alternative:** “Processor cache, RandomX cache and the RandomX dataset have different locations and purposes. Installed RAM capacity does not describe CPU cache availability, bandwidth or placement; Huge Pages does not enlarge them.” Include visible definitions, not an oversized `aria-label` replacing content.
- **Mobile:** two named location groups become one vertical list with purpose text next to each resource; connector directions preserve meaning after reflow.
- **Complexity:** **medium**, existing memory branch in `ArticleVisual.astro` and scoped/shared diagram styles. Technical risk is implying architectural relationships not established by sources.

### 4. CPU threads — three counts and a controlled comparison

- **Exact route:** `/learn/xmrig-cpu-threads/`.
- **Reader question:** “Why do core, logical-processor and mining-worker counts differ?”
- **Purpose/change:** replace the current fixed-dot emphasis with explicit three-count definitions and a comparison method. Retain the useful cache constraint; label any remaining dots “illustrative, not a recommended count.”
- **Format:** semantic three-column definition comparison plus a small static test/record/compare sequence. A blank worksheet supplies fields for version, algorithm, selected profile, worker count, run conditions, rate, wall watts if measured and responsiveness.
- **Must communicate:** physical cores versus scheduled logical processors versus XMRig workers; automatic configuration is a starting point; useful count depends on resources/workload; change one variable and keep comparable conditions; restore a known-good profile if worse. No cache-only formula for optimal threads and no invented H/s or measured power.
- **Evidence:** existing article and [XMRig CPU configuration](https://xmrig.com/docs/miner/config/cpu) / [optimization guidance](https://xmrig.com/docs/miner/randomx-optimization-guide), opened 18 November 2026. Validate any hardware topology example against an identified vendor/source before adding numeric relationships. The current schematic is not such evidence.
- **Text alternative:** “Cores, logical processors and mining workers count different things. A useful worker profile must be tested under comparable conditions rather than chosen to fill every logical processor.” The worksheet remains text, with no suggested measurement values.
- **Mobile:** definitions stack with repeated explicit count labels; comparison record becomes label/value rows. Do not require a wide hardware topology drawing.
- **Complexity:** **small–medium**; reuse existing thread branch and article content. A printable/exportable benchmark feature is outside scope.

### 5. First XMRig session — independent observations, not one success state

- **Exact route:** `/guides/xmrig-windows-setup/`, with an optional later text-only reference from `/tools/xmrig-log-decoder/`.
- **Reader question:** “Does startup, CPU ready, connection, job or accepted share mean my session is working?”
- **Purpose/change:** clarify the existing signal-map section as separate observable checkpoints. The decoder's grouped results are summaries, not a complete chronological reconstruction. Do not represent all events as a guaranteed linear order.
- **Format:** semantic checkpoint list with columns “Observation / establishes / does not establish / next check”; small CSS grouping for local initialization versus pool interaction. Keep it in session verification, not as another large introductory hero.
- **Must communicate:** process running ≠ backend readiness; connection ≠ job; job ≠ accepted share; accepted share ≠ payout; Huge Pages/MSR are distinct optimization signals. Preserve uncertainty when output is missing. Pool configuration/response and payout rules are service-specific.
- **Evidence:** current setup signal map; existing decoder rule definitions/fixtures; [XMRig pool configuration](https://xmrig.com/docs/miner/config/pool), opened 18 November 2026, for endpoint/account/TLS boundaries. Verify any exact new console examples against versioned XMRig output/source and fixture coverage before publishing; pool configuration documentation alone does not validate log order or every message. No guaranteed accepted-share timing.
- **Text alternative:** “Check each observation separately. Startup, readiness, pool work and accepted submissions establish different things, and none alone predicts payout. Use the complete original output and version context.”
- **Mobile:** stacked checkpoints, each with its limitation and next check. No dense horizontal sequence, mandatory animation, wallet/pool identifiers or fake live terminal.
- **Complexity:** **medium**; current Markdown `signal-map` and shared article styling can support it. Do not add new parser rules or claim broader decoder coverage as a visual change.

## Tools hub previews and examples

The current instrument metaphor communicates careful assumptions but not what each tool does. Prefer three prominent available cards with short factual input/result summaries and specific action labels. Keep planned instruments in a smaller separate future-topics area.

| Tool | Useful preview | Boundary |
| --- | --- | --- |
| Electricity | “Wall watts + runtime + your tariff → energy and cost”; optional static W/kWh unit sketch | Empty tariff remains empty; 100 W is visibly illustrative. No default household tariff or implied measured hardware result. |
| Profitability | “Your work/network/reward/price assumptions → expected revenue − electricity”; blank labelled output skeleton | No plausible-looking prefilled result. Existing hypothetical example stays distinctly labelled. |
| Log decoder | Short synthetic supported line paired with fixed interpretation, or a static input/result skeleton | Clearly synthetic, no real identifiers and no health guarantee. Validate sample with the existing parser; unknown samples must remain unknown. |

For M12B, previews should be static and supplementary. The whole-card link must not contain nested buttons/inputs. If a future milestone introduces a functional mini-tool, it needs one authoritative calculation/parser implementation, explicit reset/privacy behavior, accessible labels and measured bundle/interaction impact. It is not required to solve current discovery friction.

## Examples, sources and review policy

Reuse M11B's existing invented profitability scenario if a teaching illustration needs values; do not generate a second near-identical scenario. Keep its label, units, exclusions and arithmetic consistent with the current model. No invented CPU benchmark or XMRig version-support matrix is permitted. A safe example of measurement recording can remain blank.

The four XMRig documentation pages above were opened in this audit for technical design context. Their presence does not revalidate the entire security/setup corpus or establish the latest release. Existing articles' October dates remain truthful historical review dates. Numeric memory units and mode qualifications should be checked against the precise upstream source before a diagram copies them; do not silently normalize MB/MiB or turn rounded guidance into measured capacity.

## Visual acceptance for M12B/M12C

1. Each diagram answers one explicit question and adds a relationship or decision absent from an adjacent paragraph. Remove redundant decorative panels instead of accumulating them.
2. A text-only reading communicates the same substantive relationship; semantic labels/captions remain usable with CSS/JavaScript unavailable where appropriate.
3. No meaning depends only on orange/green, arrow direction, spatial position or animation. Static/reduced-motion views preserve all information.
4. Check 1440/1280/1024/768/600/390/360px and 200%/400% zoom; log actual CSS viewport sizes, browser/version, overflow and keyboard/touch access. No clipped labels, displaced limitations or document-level overflow.
5. Operate a named screen-reader/browser pair on headings, section links, diagram alternatives and table navigation; measure contrast on actual touched states. These tests remain outstanding.
6. For dynamic tool summaries, compare displayed data/units/signs against existing model output for valid, zero, negative, missing and invalid cases. Preserve local processing/no storage and no fake live data.

The bounded phase/file plan and regression requirements are in [the prioritized implementation plan](m12a-prioritized-improvement-plan.md). M12A creates no assets or published visual implementation.
