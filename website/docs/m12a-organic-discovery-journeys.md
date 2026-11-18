# M12A — Organic discovery journeys

18 November 2026 · `main` · `5c37ccdc4f96075ced30e845640b110633bf6bb2` · website documentation only.

This report uses the current source/generated-markup evidence indexed in [the visual audit](m12a-visual-ux-audit.md). All 17 routes were inspected. No Search Console, traffic, rankings, query volumes, conversion rates, deployed crawl or confirmed production origin was available. Search-entry intents and expected benefits below are **editorial hypotheses**, not validated performance. M11A's October search observations retain their historical dates; they were not repeated as a new competitive/SERP study.

## Current information architecture

| Layer | Published destinations | Current role / planning implication |
| --- | --- | --- |
| Orientation | `/`, `/ember/`, `/trust/` | Product introduction, current availability and evidence boundaries. Preserve truthful status; do not require a homepage visit before using knowledge/tools. |
| Concepts | `/learn/`, RandomX memory/cache, CPU threads | A coherent but narrow two-article collection. Beginner mining, hashrate and pools are visibly planned; do not advertise them as existing articles. |
| Workflows | `/guides/`, Windows setup, Windows security warnings | Two related standalone-XMRig paths. Select by task rather than publication date. |
| Diagnosis | `/troubleshoot/`, Huge Pages, MSR, low hashrate | Symptom-specific guides, with decoder and security links. Pool-connection topic remains planned. |
| Instruments | `/tools/`, electricity, profitability, decoder | Three usable browser tools. Converter and CPU scenario concepts remain non-interactive planned cards. |

The three article route generators filter the same non-draft collection by section. Sitemap has ten fixed HTML paths plus seven published articles; robots refers to the configured sitemap. Current origin validation requires an explicit HTTPS release origin, superseding the old example.com fallback reported by M11A. **Production hostname, live robots, redirects, indexing and canonical correctness remain unverified.** Do not reintroduce a fallback or guess a domain as a UX change.

Fresh generated markup confirmed every non-home route has an inbound link from another page's main content, excluding global header/footer. **No orphan was found in that bounded check.** All pages have one H1. This is not a complete SEO certification: external links, HTTP responses, search-engine rendering and JavaScript-generated decoder links were not fully crawled. No new routes are needed for M12B.

## Journey A — Huge Pages search

**Hypothesized query/task:** “XMRig permission granted but huge pages 0%,” “Huge Pages not working Windows.” Entry: `/troubleshoot/xmrig-huge-pages/`.

**Existing path:** clear answer → conceptual allocation graphic → callout → Quick diagnosis and five-row signal table → local decoder or low-hashrate guide → shared About Ember aside. Memory/threads/setup links already support this path. The decoder can return Huge Pages guide links; it does not diagnose allocation causes or generally parse the privilege line.

**Friction, source-confirmed:** multiple introductory layers precede the diagnostic table; no shared section navigation; the table's 880px minimum exceeds the article's 820px maximum. A search visitor with one known signal needs to locate the matching branch without reading every conceptual section. This is a P2 recommendation, not a measured abandonment finding.

**Recommended path:**

1. Existing quick answer identifies privilege versus allocation.
2. Compact “Which signal do you have?” links to unavailable privilege, 0/partial allocation, full allocation or insufficient excerpt sections. Branch labels must match the full table's qualified wording.
3. Place “Have the startup excerpt? Inspect supported signals locally” beside the log/excerpt step. Explain that unknown lines stay unknown and output does not determine cause.
4. Full allocation but low performance → the existing low-hashrate checklist, beside the relevant branch.
5. Optional, single product handoff after solving the task: “How Ember presents XMRig state; current development status.” No download claim.

**Targets:** `ArticleLayout.astro`, `ArticleVisual.astro`, `xmrig-huge-pages.md`; decoder presentation only as specified in the implementation plan. Keep managed-device and privilege-risk guidance beside policy decisions. Do not add a second generic Huge Pages article.

**Acceptance:** a visitor can identify the matching branch and reach the decoder/checklist from that branch; all existing caveats remain; links and anchors work without client scripting; section navigation is keyboard usable and not hidden under the sticky header.

## Journey B — Mining profitability search

**Hypothesized query/task:** “Monero mining profitability calculator,” “electricity cost versus XMR revenue.” Entry: `/tools/monero-mining-profitability-calculator/`.

**Existing path:** manual/no-live-data introduction → blank assumptions form/result panel → formula → input-provenance table → invented worked example → limitations → electricity/memory/threads/low-hashrate/setup links. Formula, input guide and hypothetical arithmetic already exist from M11B. Do not propose them as missing content.

**Friction:** help is comprehensive but most provenance explanation follows the complete workspace. There are no in-page links to the input guide, formula or worked example. Result figures shrink on mobile; untouched fields receive errors as soon as a numeric value is entered. Late generic related links are less useful than a contextual handoff beside an uncertain input.

**Recommended path:**

1. Keep “manual scenario; no live data” before the form.
2. Measured input group → hashrate guidance to the low-hashrate measurement section and whole-system watts guidance to the electricity tool's existing measurement section.
3. Sourced assumption group → in-page input-provenance table; label difficulty versus network hashrate and currency non-conversion next to those controls.
4. Valid result → readable daily revenue after pool fee, electricity cost and operating balance; detailed 30/365-day table remains secondary.
5. “How this is calculated” → existing formula and hypothetical example. Keep example values unprefilled and visibly synthetic.
6. Cost-only question → electricity calculator; resource/thread question → existing RandomX/CPU guidance at the matching explanatory paragraph.

**Reverse path:** electricity already links profitability in its context section. Strengthen the label to explain the change from cost-only to manual revenue assumptions. Do not transfer numbers between pages or persist scenarios in M12B; that is extra interaction scope and could imply consistency of externally sourced values.

**Targets:** both calculator pages/styles, relevant existing explanatory section IDs, and optional contextual sentences in CPU/low-hashrate articles. Preserve `mining-economics.mjs` and `electricity-cost.mjs`.

**Acceptance:** input help and formulas are reachable before completing the form; cost and revenue retain clear units/horizons; a positive result is not labelled total profitability; no new API, assumed tariff, current market value or fictitious benchmark appears.

## Journey C — Windows mining setup search

**Hypothesized query/task:** “how to set up XMRig Windows,” “first XMRig run.” Entry: `/guides/xmrig-windows-setup/`.

**Existing path:** standalone scope/requirements → official release verification → security warning handoff → config/start/verification → decoder or specific diagnostics → Ember status. Security guide and setup guide already link each other; three troubleshooting articles and electricity tool are already contextual. The current five-stage visual covers the main path but not all seven major sections.

**Recommended path:** complete task index plus a compact prerequisite/stop checkpoint; preserve all release-verification detail rather than hiding it in an optional tooltip. At a Windows block, offer the security guide as the primary next step before any execution instruction. At first-session verification, identify process, backend, connection, job and accepted share as separate observations. Decoder is an optional summarizer of supported output, not proof of a healthy session.

Security guidance must retain a **stop** outcome when evidence is unresolved. Return to setup only when the required checks are satisfactory; never imply that passing checksum/signature checks overrides a security warning. Place current Ember availability after independent setup help, as it is now.

**Targets:** setup/security Markdown, `ArticleLayout.astro`, existing setup/security visual branches. Do not add another release/download path or a public Ember install CTA.

**Acceptance:** a returning reader reaches config, safe start/stop, verification or issues directly; every linked stage lands at the correct existing heading; safe verification precedes execution in DOM/reading order; tool use remains optional.

## Additional entry journeys

| Entry | Existing handoff | Specific improvement / restraint |
| --- | --- | --- |
| MSR error article | Huge Pages, low hashrate, local decoder | Add security-warning guide at the provenance/blocked-driver check. Do not turn Secure Boot discussion into an action CTA. |
| Low-hashrate article | All four technical articles, decoder, both calculators | Keep the existing strong cluster. Link each ordered check to its detailed section; use cost tools only after a meaningful measurement. |
| CPU-thread article | Memory, low hashrate, related Huge Pages | Optional electricity tool link at a new measured-power comparison step. Do not imply 100% CPU or a computed thread count is the goal. |
| RandomX memory article | Threads, Huge Pages, low hashrate | Improve term definitions and section access first. No mandatory product/economics panel is needed. |
| Decoder | Huge Pages/MSR result links and three static guide links | Put coverage/version limits close to input; allow a labelled synthetic example. Pool/rejected-share explanatory content is a later sourced-content hypothesis, not a new route in M12B. |
| Ember or Trust | Ember links resources/Trust; Trust has global return navigation | Short product-status and key-disclosure anchors improve evaluation. Preserve no-public-release and fee/lifecycle boundaries. |

## Contextual link specification

Examples below are proposed editorial labels, not published copy. Add links only where the surrounding sentence supplies the question.

| Source and placement | Destination | Suggested purpose/label | Status |
| --- | --- | --- | --- |
| Huge Pages, incomplete-log branch | `/tools/xmrig-log-decoder/` | “Inspect supported startup signals locally” | Link exists; improve prominence, do not duplicate. |
| Huge Pages, full allocation branch | `/troubleshoot/xmrig-low-hashrate/` | “Allocation is full but performance is low?” | Link exists; retain point-of-need placement. |
| Profitability, whole-system watts help | Electricity page measurement section | “Which power measurement should I use?” | Proposed section anchor at existing explanation. |
| Profitability, network/reward group | Same-page input guide | “Where to obtain these assumptions” | Proposed in-page link/heading ID. |
| Profitability, result summary | Same-page method/example | “Inspect the formula and teaching example” | Proposed navigation to existing content. |
| Electricity, income context | `/tools/monero-mining-profitability-calculator/` | “Compare cost with a manual mining-revenue scenario” | Link exists; clarify distinction. |
| MSR, source/driver block check | `/guides/xmrig-windows-security-warnings/` | “Check a Windows security warning safely” | Contextual link missing. |
| Setup, download warning | Security-warning guide | “Stop and check this warning” | Exists; preserve before launch instructions. |
| CPU threads, comparison record | Electricity page measurement section | “Measure whole-system power for a cost comparison” | Optional only if the comparison text is added. |
| Trust introduction/summary | `/ember/` and same-page fee/open-work anchors | “Current product status”; “Developer time share”; “Open release work” | Proposed body orientation; existing global nav still works. |

Use section IDs derived from real headings, not arbitrary fragments. Exact new IDs must be verified against rendered Astro/Markdown output in implementation. Avoid adding the same three-tool block to every article, duplicating existing related lists or adding links to planned topics. Product discovery should explain a relevant role, never interrupt safety diagnosis or imply a launch.

## Hub and homepage entry policy

- Keep the six global nav categories; a new taxonomy/search/filter control is unnecessary for seven articles.
- Put published resources before editorial feature/HubVisual material, and available tools before planned instruments. Clearly distinguish purpose: concepts, procedures, symptoms, calculations.
- Retain task-specific hub identity through labels/icons/concise descriptions rather than a large repeated preamble.
- Guides should distinguish starting a setup from handling a warning; Troubleshoot should expose the decoder alongside existing symptoms; Tools should name each input and result.
- Home should eventually make four tasks legible: learn the existing concepts, troubleshoot XMRig, calculate costs, understand Ember. Homepage entry parity is ranked for a later bounded change, outside the recommended six-item M12B package.
- Do not advertise foundational articles that are only planned. Real beginner/pool/economics additions require separate sourcing and evidence of a distinct need.

## Validation and future measurement

Before implementation, use the verified-build browser gate in [the plan](m12a-prioritized-improvement-plan.md). After changes, validate rooted paths, fragments, draft exclusions and sitemap parity using existing checks plus rendered manual inspection. Confirm static links survive JavaScript being disabled; tools may require JavaScript for calculation, but explanations and navigation must remain available.

If first-party evidence later becomes available, examine actual landing-page queries, indexing, task completion and common support questions. Record property/date/sample limits. Task-based user testing can ask users to find the correct Huge Pages branch, identify a missing calculator assumption, or stop safely at a warning. Do not invent baseline percentages or forecast traffic gains from these recommendations. M12C can reassess priorities using that evidence; M12A publishes no measurement result beyond the repository/build observations stated here.
