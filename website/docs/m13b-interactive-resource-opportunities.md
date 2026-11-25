# M13B — Interactive resource opportunities

24 November 2026. **Concepts only; none implemented.** [Research/evidence inventory](m13b-search-intent-research.md#source-inventory), [competitors](m13b-competitor-analysis.md), [ranked decisions](m13b-content-growth-roadmap.md). Source IDs below resolve in the inventory; technical facts use official T sources, community C sources supply questions only.

## Recommended order

1. **Manual mining-efficiency comparison** — add two-configuration H/s and whole-PC watt comparison to the existing electricity resource, subject to UI scope review. Strong community efficiency need (C08–C10), no third-party dataset needed.
2. **Searchable finite diagnostic reference** — static reference first, optional local filtering second, integrated with the existing decoder and symptom guides. Strong question-to-action fit (C01–C07/C13/C14); source/version maintenance is the main cost.
3. **Difficulty and expected-reward teaching control** — deterministic user-controlled comparison attached to one explanation and the existing profitability journey. Direct probability-tool demand is weaker; proceed after comprehension testing, not because sliders look engaging.

These are editorial priorities, not keyword-volume or adoption predictions. M13C should implement at most the first bounded interaction after supporting content and review; the other two remain later candidates.

## 1. Mining efficiency comparison

**Reader decision:** “Does configuration B provide enough extra sustained throughput for its extra whole-system consumption?” Existing electricity/profitability tools calculate cost and assumed rewards; neither compares two profiles or reports H/s per wall watt. R01 already reports profit per watt and R03 exposes wall-power and break-even, so the distinct value is **matched manual configurations with transparent measurement boundaries**, not a novel profitability claim.

**Data and outputs:** labels A/B; sustained hashrate in H/s; average wall watts from the same observation window; hours/day; optional manual tariff/currency. No CPU model lookup or prefilled hardware values. Show a semantic comparison table first, optional bars/scatter view after validation.

| Quantity | Proposed calculation / boundary |
| --- | --- |
| Efficiency | `(H/s) / W`, displayed as H/s per W (dimensionally hashes per joule). Positive watts required for ratio; zero watts produces “undefined,” never infinite efficiency. Zero hashrate at positive watts is zero. |
| Energy | `wall W / 1,000 × hours` kWh/day; same cost-only arithmetic as current electricity model. |
| Electricity cost | `kWh × actual rate`; currency is a label, never conversion. Pence conversion must follow existing electricity behavior. |
| Comparison | Absolute rate, watt, energy and cost differences; percent changes only when baseline denominator is positive. Avoid rounding before comparison. |
| Measurement boundary | Whole-PC consumption by default. Optional idle baseline is separately labelled context; subtract only matched idle and active intervals. Incremental watts must not replace full running watts in an existing bill-cost result. |

**Presentation:** two small input groups and side-by-side labelled values; stacked A/B rows on mobile. A scatter plot is useful only when comparing at least several measured profiles; two configurations need a table and simple bars at most. State the same version/algorithm/window requirement before the fields. Error/result announcements should summarize, not announce every keystroke. No automated “best CPU” winner, price feed or ROI.

**Privacy/security:** all input processing local; no storage, URL query state, telemetry or auto-import. If a later manual CSV download is justified, user initiates it and sees exactly what it contains. No upload, mining, executable generation, scheduling or access to local devices/APIs. Current input guarantees must remain true for all three tools.

**Implementation boundary for a future milestone:** reuse `electricity-cost.mjs` parsing/cost calculation; add ratio/delta logic separately with meaningful boundary tests. Do not alter existing calculator math, defaults, projections or profitability fee semantics. Decide whether the comparison can fit ELECTRIC without crowding the current cost-only task. Only create a distinct efficiency route if task testing establishes a separate landing intent and enough explanatory substance. Unknown power/version inputs should block comparisons, not synthesize missing hardware figures.

**Effort/maintenance:** medium implementation, low arithmetic upkeep, medium editorial review. Acceptance: independent arithmetic checks for zero/positive bounds, unit/currency clarity, keyboard/no-JS explanations, reflow, source-dated method and no network/persistence side effects. Evidence: T11 for measurement modes; C08–C10 for task; R01/R03/R04 for overlap.

## 2. CPU benchmark explorer

**Decision: defer a dataset-backed explorer.** A static “how to read a benchmark” example linking to the original service is a useful first step.

| Feasibility question | Investigated finding and required gate |
| --- | --- |
| Data availability | Official XMRig database T12 has CPU submissions/sample counts and links to T13. No bulk records were collected. |
| API availability | **Documented public read API exists:** T13 describes top results, thread/algorithm filters, CPU-filtered compact results, recent results and a full benchmark by ID. T14 is a separate local miner-control API and is inappropriate for public-site discovery. No API load/availability test was conducted. |
| License / redistribution | T20's GPL software license does not establish rights to the separately hosted database or user submissions. No inspected database/API page established a reuse license, attribution terms, caching permission, rate limits or redistribution permission. Obtain explicit applicable terms/permission before collection or republication; public GET access is not permission. No scraping or redistribution during M13B. |
| Schema/version compatibility | T13's documented algorithm list and newer T12/T16 variant support differ. Verify actual response fields, version, dates, units and variant identifiers before design; never combine RandomX variants into one ranking. |
| Comparability | CPU naming alone is insufficient: sockets/NUMA, workers/affinity, RAM channels/timings, page allocation, optimization state, XMRig build/version and power/thermal conditions can differ or be absent. Mark missing metadata unknown, not “stock.” |
| Benchmark versus mining | Fixed-work benchmark results are not sustained pool rates, whole-PC power or guaranteed earnings. No efficiency sorting without comparable measured wall watts. Selected maxima and sample counts do not supply medians or independent sample quality. |
| Freshness | Require provenance URL, submission date if present, retrieval date, algorithm/version and stale-state label. Editorial refresh schedule cannot promise current data when upstream is unavailable. |
| Needed filters | CPU search/vendor; algorithm first; software version; workers/socket topology; benchmark work size; date; available configuration fields; sample count/missing-data status. Controls may only filter fields actually supplied. |
| Hosting/privacy | Prefer permissioned reviewed build-time snapshots over visitor-time third-party fetches. Do not ship secret API credentials or make visitor queries traceable upstream. Static summary must remain useful without JS. |
| Cost and fallback | High ingestion/normalization/rights/maintenance cost. If permission or metadata is inadequate, publish no explorer; retain external links and an owner-measured profile collection later. |

R04 already provides CPU search, sample filters and explicit best-result caveats. Matching that functionality alone is not differentiation. An Ember explorer would need traceable sustained results and measurement quality, probably from the [original-research programme](m13b-original-research-programme.md), not a lightly restyled third-party table.

## 3. XMRig configuration assistant

**Decision: defer implementation; improve the existing setup guide and link the official wizard.** T05/R09 already serve minimal-config generation. No directly verified demand for an Ember-specific replacement was found.

- **Schema:** T05–T07 plus T15 provide documented option types and a versioned example. T15 is not a formal JSON Schema, and this investigation did not verify an official complete machine-readable schema. A future validator would need a deliberately small, independently reviewed allowlist, version fixture and unsupported-option behavior. Do not promise validation of every XMRig config.
- **Compatibility:** initially pin a specific reviewed release, such as the existing 6.26.0 scope; verify release currency at implementation. Do not advertise “latest compatible” from a hardcoded sample. Record fields intentionally omitted and changes between supported versions.
- **Wallet:** accept only a public receiving address; never ask for keys, seed, RPC authentication or wallet file. A length/prefix check is merely syntactic; meaningful validation needs network/address-type/checksum checks and separate documented pool/mode restrictions. Even valid syntax proves neither ownership nor payout eligibility. No online address lookup.
- **Pool:** allow manually entered documented host/port/TLS pairing; reject malformed ports/credentials/control characters. No reachability or certificate claim without connection testing, and the website should not initiate pool connections. No preferred affiliate pool, automatic fallback, arbitrary command string or disabling certificate validation.
- **Defaults:** foreground operation, CPU auto-configuration, no remote HTTP control, no shell/batch/startup persistence, no custom MSR registers or security changes. Display any chosen optimization/donation setting and its exact upstream semantics. A wizard cannot grant Windows privileges or certify a binary.
- **Export:** explicit user-triggered download of reviewed JSON only; preview meaningful settings, distinguish blank placeholders and prevent accidental executable extensions. No local file overwrite, process launch, installation, RPC or background auto-run. Importing arbitrary JSON later would require a separate bounded parser/security review.
- **Privacy:** local transient input; no account, upload, storage, query-string/share URL or telemetry. Public addresses can still identify a user and should not appear in analytics/errors or illustrative fixtures.
- **Ember relationship:** standalone XMRig output only. No claim of importing into Ember, P2Pool integration or a public Ember download. Keep product-specific desktop provisioning outside this website-only work.

Effort/maintenance/risk are high. Before approval for a later milestone, establish a distinct user task, versioned schema subset, source mapping, safe-default review, validation fixtures and static alternative. No assistant implemented or config exported in M13B.

## 4. Searchable diagnostic reference

**Reader decision:** “Which exact signal did I observe, what does it establish, and what is safe to check next?” Use one substantive static reference with stable sections; add local filtering only if the finite list becomes hard to scan. Do not generate a URL per message or index temporary search/filter variants.

**Source contract:** T02/T03/T07/T17 and future version-pinned log-producing source. T17 is a concrete source for connection/job/share output; OS/CPU allocation/MSR entries need their own pinned producer mapping before authoring. Community C sources inform confusing wording, never automatic remediation. An authoritative source string can establish how a message is emitted without establishing the cause on the reader's machine.

Each supported entry should record ID, observed pattern, platform, reviewed XMRig tag/commit, producer/document URL, meaning, what remains unknown, safe next check, stop/escalate conditions, existing guide link and review date. Synthetic examples must be visibly labelled and exclude real wallet/host/user identifiers. Do not reproduce complete competitor screenshots or user logs.

**Decoder relationship:** `xmrig-log-decoder.mjs` currently has eleven bounded categories, a 200,000-byte UTF-8 cap, ANSI normalization and unknown-line reporting. Preserve all of those and its existing parser. A static reference can explain additional concepts only if it states whether the decoder recognizes them. No undocumented claim that a bare privilege line, arbitrary rejection reason or every connection error is parsed. Link existing output categories to corresponding source-backed sections in a later scoped change, not by widening regexes incidentally.

**Visual/interaction:** signal-state ladder for backend → connection → job → submission → eligibility/payment. Semantic table supplies the full content without JS; optional text filter hides rows locally with a result count and reset button. Keep source/version fields visible, native anchors stable, unknowns explicit and zero-result state useful. Filtering is not a diagnosis and should not accept full logs when a short phrase suffices.

**Maintenance/risk:** medium-high review burden; reassess after upstream output/Windows changes. Prefer a small complete inventory to hundreds of unsupported strings. No instructions to disable Defender, restore quarantined files, weaken TLS/Secure Boot, write custom registers or grant permanent administrator privileges. Future checks cover source-to-entry mapping, supported-versus-reference-only distinctions and keyboard/no-JS/mobile behavior.

## 5. Interactive education

| Topic | Is interaction useful? | Proposed teaching model / visual | Technical and editorial boundary |
| --- | --- | --- | --- |
| RandomX memory/cache | Mostly a static diagram suffices | Labelled layers: dataset, initialization cache and per-worker CPU cache; annotate shared versus separate resources | Reuse MEMORY; no inferred H/s from RAM capacity, no automatic thread recommendation. Any numerical labels must be variant/version scoped to T01/T04. |
| CPU allocation | Useful only for illustrating constraints | Optional illustrative workers/cache capacity controls plus equivalent table; later measured-thread plots are stronger | Cache arithmetic is a teaching simplification, not an optimizer for hybrid/NUMA/shared-cache CPUs. No pretend live CPU detection. |
| Pool share submission | A static state/threshold diagram is likely enough first | Show job, candidate, pool response and separate payout accounting; contrast XMRig counters with P2Pool sidechain shares | T10/T17. No animation implying a browser is mining or connected to a pool. No assumption every accepted miner submission receives immediate XMR. |
| Network difficulty and hashrate | Useful for changing one assumption at a time | Deterministic input → expected block equivalents → expected reward; display formula and table | Reuse PROFIT explanation; keep its model unchanged. Manual values, same units, no live network claim. |
| Expected rewards | Moderate, after readers can identify input provenance | Compare two explicitly hypothetical assumptions while freezing others; accessible delta table | Constant-assumption teaching estimate; fees and omitted costs visible, no financial recommendation. |
| Solo versus pooled variability | Potentially useful but more complex | For idealized solo Poisson arrivals, analytic `P(at least one block by t) = 1 − exp(−h × t / D)` with seconds, constant difficulty and independent trials; static probability table first | Requires independent mathematical review, numeric boundary handling and explicit assumptions. Mean waiting time is not a deadline. This is **not** a P2Pool/PPLNS probability model; pool payment policies and correlations are separate. Defer full mode simulator. |

No random celebratory block animations, fake mining counters, forecast charts disguised as measurements or decorative simulations. Interaction must help a reader compare an assumption or locate a supported explanation; plain text is better for a short definition, security-stop condition or procedural prerequisite.

## 6. Tariff comparison adjacency

Manual peak/off-peak segments can later extend ELECTRIC. Proposed daily cost is `Σ(W_i / 1,000 × hours_i × rate_i)` with non-overlapping hours totaling at most 24; confirm whether watts differ between segments. Reuse existing single-rate math for each segment. Supplier standing charges should be explained separately: normally already payable household costs, not silently assigned entirely to mining. A new connection/tariff solely for mining changes that boundary. T19 distinguishes single/multi-rate and regional/payment contexts; do not label GB cap figures as a universal UK tariff or retrieve users' postcodes.

Need is currently H/weak beyond general electricity questions. Begin with a plain worksheet and actual billed rates; no supplier API, automatic tariff switching or preset current-rate maintenance obligation.

## Shared visual and technical acceptance contract

Preserve graphite/orange identity, existing accessible semantic components, static first rendering, system fonts and reduced-motion rules. Use text labels as well as color; data tables accompany charts, keyboard-operable controls use visible focus and clear labels, and mobile rows preserve units/context. Avoid a heavy chart/search framework for a few data points or entries. No new dependency is justified by this research.

Keep existing main-content anchors and route ownership; do not replace each article with a generic interactive hero and related cards. Diagrams belong at the reader's decision point. Contextual links go from a measured-power uncertainty to measurement help, a log signal to its diagnostic guide, or an uncertain calculator assumption to its explanation. Optional product discovery follows independent task completion and retains availability disclosures.

Current 17 published routes, calculator math, decoder parser, origin validation, fail-closed noindex, static SEO, accessibility fixes and local-input privacy are explicit preservation gates for any future implementation. M13B changes none of them.
