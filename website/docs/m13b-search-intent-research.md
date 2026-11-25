# M13B — Search intent research

Research/access date: **24 November 2026**. Scope: `website/` documentation only. Research and planning complete; no publication, tool implementation or promotion. Read alongside the [ranked roadmap](m13b-content-growth-roadmap.md), [competitor analysis](m13b-competitor-analysis.md), [interactive proposals](m13b-interactive-resource-opportunities.md), [research programme](m13b-original-research-programme.md) and [promotion assessment](m13b-promotion-opportunities.md).

## Checkout and production baseline

| Item | Observed baseline |
| --- | --- |
| Repository / branch / HEAD | `uxillary/tray-xmr`; `main`; `ae9e8061c51b6e7ec13d0df9edb5c59204da13b3` |
| Working tree at entry | Clean: `git status --porcelain=v1` returned no entries. No uncommitted M13A changes existed to preserve; all M13A files were retained. No branch, commit or push made. |
| Required prior reading | [Production/search readiness](m13a-production-search-readiness.md), [performance](m13a-performance-baseline.md), [Search Console](m13a-search-console-onboarding.md), [growth framework](m13a-organic-growth-framework.md), [discovery journeys](m12a-organic-discovery-journeys.md), [M11A research](m11a-organic-search-opportunities.md), [central roadmap](content-roadmap.md). Earlier research keeps its original date; it is not fresh M13B evidence. |
| Route inventory | Ten fixed published pages plus seven non-draft articles = **17**. Source sitemap, three section route generators, article frontmatter, page copy/links and tool modules inspected. `404.html`, robots and sitemap are not additional published content routes. |
| Production / indexing | No confirmed canonical public origin, hosting project, live deployment, Search Console/Bing access, indexing count, impressions, clicks, CTR or backlink baseline. All remain **unavailable**, not zero. No domain guessed. |
| Technical foundation | Static Astro; source-dated article collection; static hub/contextual links; article contents/anchors and accessible scroll regions; inline technical SVGs; graphite/orange identity; system fonts; reduced motion; route-specific tool JavaScript. Origin validation and default HTML/header noindex from M13A retained. |
| Local performance evidence | M13A has 36 local Chromium observations on six routes. It supplies neither field INP nor public CWV acceptance. No new performance claim or build in M13B. |
| Privacy / product | Manual, local browser processing; no log upload, input storage, market feed or client analytics. Ember is in development with no public download; existing lifecycle/release caveats remain. Ordinary host requests are separate from local tool input processing. |
| Owner actions | Confirm host/origin and separately authorize launch; finish native zoom/text scaling, actual screen reader, Firefox/Safari and physical-device acceptance; verify live redirects/status/headers/canonicals; verify search properties and submit the real sitemap; collect dated exports. See M13A onboarding. |

### All current routes and coverage

Route keys below are a join key for the query matrix, not proposed new pages.

| Key | Current published route | Coverage and existing contextual handoffs |
| --- | --- | --- |
| HOME | `/` | Resource hubs, Tools, About and Trust; all 17 reachable through main-content HTML paths per M13A evidence. |
| ABOUT | `/ember/` | Development status → independent resources and Trust. |
| TRUST | `/trust/` | Provisioning/privacy/fee/lifecycle limits; global navigation and repository security reference. |
| LEARN | `/learn/` | Two explanations; setup handoff. Beginner/pool themes are planned, not published. |
| GUIDES | `/guides/` | Two Windows workflows → Troubleshoot. |
| TROUBLE | `/troubleshoot/` | Three symptoms + decoder; security-warning handoff. Pool connection theme remains planned. |
| TOOLS | `/tools/` | Three available tools; future cards are explicitly planned. |
| MEMORY | `/learn/randomx-memory-cache/` | Dataset versus RandomX cache versus CPU cache; NUMA, Huge Pages → THREADS, HP, LOW. |
| THREADS | `/learn/xmrig-cpu-threads/` | Physical/logical/mining counts, cache constraints and controlled comparison → MEMORY, LOW. |
| SETUP | `/guides/xmrig-windows-setup/` | Standalone official download/release checks, pool/address/config, first-run signals → SECURITY, MEMORY, THREADS, diagnostics and electricity. |
| SECURITY | `/guides/xmrig-windows-security-warnings/` | Stop/verify, checksum/signature limits, unresolved alerts → SETUP only when checks satisfactory. |
| HP | `/troubleshoot/xmrig-huge-pages/` | Privilege versus allocation, dataset/thread states, existing five-row signal table and visual → LOW, MEMORY, decoder. Already substantially improved in M11B/M12B. |
| MSR | `/troubleshoot/xmrig-msr-error/` | Meaning, complete context, conservative checks → SECURITY, HP, LOW, decoder. |
| LOW | `/troubleshoot/xmrig-low-hashrate/` | Ordered version/workload/allocation/threads/memory/thermal comparisons and small measurement record → technical guides and both calculators. |
| ELECTRIC | `/tools/electricity-cost-calculator/` | Whole-PC watts × hours × days / 1,000; manual tariff including pence option and GBP/USD/EUR display → PROFIT, MEMORY. Existing measurement note at `#power-note-title`. |
| PROFIT | `/tools/monero-mining-profitability-calculator/` | Difficulty **or** network-hashrate basis; manual reward/price/fee; 1/30/365-day expected balance, break-even tariff; existing input-provenance table, worked hypothetical and formula flow → ELECTRIC, technical guides. Currency selection does not convert values. |
| DECODER | `/tools/xmrig-log-decoder/` | Eleven bounded signal categories; 200,000-byte UTF-8 limit, ANSI removal, counts/order/unknown handling; XMRig 6.26.0 scope. No root-cause or pool-reason diagnosis; privilege-only lines are not generally recognized. Links HP/MSR/LOW. |

## Method and evidence quality

Used the available web search service for English query samples, opened primary documentation, public issue bodies and competing resources, followed the benchmark API documentation, and inspected twelve competitor first screens in the in-app browser at **390 × 844 CSS pixels**. Browser override was reset. No form submissions, downloads of miners, accounts, mining or benchmark runs occurred. No dataset was scraped or redistributed.

Search provider's underlying engine, geography, personalization and result ordering were not exposed. This is **not a Google UK rank audit**. Queries were batched; returned results sometimes blended families. Observations below concern returned resources, not top positions, page-one completeness or stable rankings. Search index/cached text can lag the live page: miner.download's extracted text and live browser showed different version labels. No paid keyword provider or legitimate quantitative keyword dataset was available. No monthly volumes, difficulty, CPC, ranking probabilities or traffic forecasts are assigned.

Evidence labels:

- **T**: official project/vendor technical evidence. Authority applies to its documented scope, not universal hardware results.
- **C**: community question/issue. Evidence someone asked, not verified cause, prevalence or a safe fix.
- **R**: competitor's own page. Evidence of its offer/content, not independently verified accuracy or audience.
- **P**: first-party channel/rules evidence. Access does not imply submission eligibility.
- **X**: unavailable/limited access attempt. Supplies no substantive evidence beyond that limitation.
- **S**: search sample below. Qualitative topic visibility only.
- **H**: editorial hypothesis; no direct demand signal found in this bounded sample.

### Search samples

All executed 2026-11-24. The wording here is the actual submitted query; samples are not the full 52-candidate matrix.

| ID | Submitted query | Observations and inference limits |
| --- | --- | --- |
| S01 | `Monero best CPU RandomX hashrate per watt benchmark threads cache` | Returned CPU lists, benchmark aggregators and tuning content. Selection intent visible; no validated purchase demand or model recommendation. |
| S02 | `XMRig huge pages unavailable permission granted MSR failed Windows` | Official Huge Pages, symptom guides and community MSR reports. Strongest technical diagnostic family. |
| S03 | `Monero mining profitability electricity cost calculator UK` | CoinWarz among results; UK-specific task not isolated by this mixed batch. |
| S04 | `XMRig pool connection rejected shares P2Pool mining difficulty payments` | Multiple Reddit questions confuse accepted miner submissions, P2Pool shares and payout timing (C04–C07). |
| S05 | `site:github.com/xmrig/xmrig/issues huge pages permission granted allocation Windows` | Official Huge Pages and issue family; C01 directly inspected separately. |
| S06 | `site:github.com/xmrig/xmrig/discussions low hashrate memory threads` | Issues/source docs surfaced; Discussions endpoint returned 404 (X01). No Discussions-body study claimed. |
| S07 | `site:reddit.com/r/MoneroMining hashrate watt power electricity cost threads` | Efficiency/build questions C08–C10; reported watts are unverified and have inconsistent units/boundaries. |
| S08 | `Monero mining profitability UK electricity tariff Ofgem price cap` | Ofgem and UK mining articles returned. Official regional/unit-rate context supports tariff sourcing, not miner profitability. |
| S09 | `XMRig Windows setup config.json startup error unable open configuration file` | Official config and Reddit startup questions C11/C12; also unwanted-miner/removal results. Distinguish voluntary setup from unexpected execution. |
| S10 | `XMRig Windows Defender security warning download verify` | Official download and unofficial download/config pages; preserve existing provenance/stop boundary. |
| S11 | `RandomX cache mining threads logical processors memory channels` | Technical/cache material surfaced in mixed batch; exact-query demand remains weakly evidenced. |
| S12 | `Monero mining break even electricity power consumption calculator` | Multiple calculators already expose break-even and watts. Another standalone break-even page/tool lacks differentiation. |

Additional targeted source-discovery searches covered Stack Exchange rejected/expired shares, benchmark API/licensing, XMRig log source, Monero resource directories/contribution instructions, Microsoft exclusions and forum/community rules. They are provenance/rules investigations, not additional validated keyword demand. Searches for `site:forum.getmonero.org` mining/rules did not establish a usable current forum rules/body sample; do not infer a forum activity baseline.

## Source inventory

Each row was accessed or attempted on **2026-11-24**, explicitly recorded per row. `Opened` means returned page text, not authenticated access or complete comment loading. `Search only` means a returned title/snippet was inspected; a subsequent full-page attempt may have failed. URLs are evidence destinations, not endorsements. T/R/P types describe the claim being used: a primary website about its own offer is not technical authority for Monero.

| ID | Type | Actual source URL | Access date | Access / relevant observation |
| --- | --- | --- | --- | --- |
| T01 | Official | [XMRig optimization](https://xmrig.com/docs/miner/randomx-optimization-guide) | 2026-11-24 | Opened; cache/NUMA/channel considerations; labels reduced CPU worker count a frequent question. |
| T02 | Official | [XMRig Huge Pages](https://xmrig.com/docs/miner/hugepages) | 2026-11-24 | Opened; separates Windows privilege from allocation; contextual technical anchor for HP. |
| T03 | Official | [XMRig MSR](https://xmrig.com/docs/miner/randomx-optimization-guide/msr) | 2026-11-24 | Opened through official optimization link; supported presets/context, not a reason to bypass security. Short `/docs/miner/msr` attempt failed; use this canonical path. |
| T04 | Official | [RandomX repository](https://github.com/tevador/RandomX) | 2026-11-24 | Opened CPU performance/FAQ; algorithm and system constraints; historical examples are not current Ember benchmarks. |
| T05 | Official | [XMRig configuration](https://xmrig.com/docs/miner/config) | 2026-11-24 | Opened; preferred JSON, config discovery and official wizard. |
| T06 | Official | [CPU configuration](https://xmrig.com/docs/miner/config/cpu) | 2026-11-24 | Opened; CPU/RandomX objects, auto profiles, version-sensitive settings. |
| T07 | Official | [Pool configuration](https://xmrig.com/docs/miner/config/pool) | 2026-11-24 | Opened; endpoint/TLS/user fields; pool-specific user requirements need that pool's docs. |
| T08 | Official | [Monero mining](https://docs.getmonero.org/interacting/mining/) | 2026-11-24 | Opened + mobile; compact solo/pool/P2Pool orientation and navigation. |
| T09 | Official | [Monero technical specs](https://docs.getmonero.org/technical-specs/) | 2026-11-24 | Opened; block/difficulty/reward concepts. Do not infer network activation from miner feature support. |
| T10 | Official | [P2Pool repository](https://github.com/SChernykh/p2pool) | 2026-11-24 | Opened; share-window/payout conditions and operational complexity. |
| T11 | Official | [XMRig benchmark method](https://xmrig.com/docs/miner/benchmark) | 2026-11-24 | Opened; online versus offline benchmark and algorithm variants. |
| T12 | Official service | [XMRig benchmark database](https://xmrig.com/benchmark) | 2026-11-24 | Opened + mobile; CPU results/sample counts/filters; footer links documented Cloud API. No dataset reuse permission established. |
| T13 | Official | [Benchmark API](https://xmrig.com/docs/api/1/benchmark) | 2026-11-24 | Opened; read endpoints for top/recent/CPU-filtered results and full result by ID. Documented algorithm list lags the newer benchmark UI; verify compatibility before use. |
| T14 | Official | [Miner HTTP API](https://xmrig.com/docs/miner/api) | 2026-11-24 | Opened; local miner control/state API, distinct from benchmark service. Do not enable or probe it from a website. |
| T15 | Official | [v6.26.0 config example](https://github.com/xmrig/xmrig/blob/v6.26.0/src/config.json) | 2026-11-24 | Opened; versioned example, **not** a formal JSON Schema. |
| T16 | Official | [v6.26.0 release](https://github.com/xmrig/xmrig/releases/tag/v6.26.0) | 2026-11-24 | Opened; RandomX v2 support and release verification assets. Feature availability is not proof of Monero mainnet use. |
| T17 | Official | [v6.26.0 network source](https://github.com/xmrig/xmrig/blob/v6.26.0/src/net/Network.cpp) | 2026-11-24 | Opened; versioned source for connection/job/share output. Also inspected indexed master excerpt; use tag when authoring. |
| T18 | Official | [Microsoft exclusions overview](https://learn.microsoft.com/en-us/defender-endpoint/microsoft-defender-antivirus-exclusions-overview) | 2026-11-24 | Search returned substantive official text: exclusions reduce protection. No bypass recommendation. |
| T19 | Official | [Ofgem unit rates](https://www.ofgem.gov.uk/your-energy-supply/your-energy-bill/energy-price-cap-unit-rates-and-standing-charges) | 2026-11-24 | Opened redirected canonical; regional/payment-method and multi-rate distinctions. GB context does not cover all UK tariffs/NI. No rate copied as a default. |
| T20 | Official | [XMRig repository/license](https://github.com/xmrig/xmrig) | 2026-11-24 | Search returned repository README/license; GPL software license is not evidence of benchmark-dataset redistribution rights. |
| R01 | Competitor | [CoinWarz calculator](https://www.coinwarz.com/monero-mining-calculator) | 2026-11-24 | Opened + mobile; visible assumption controls, cost/revenue decomposition and caveats. No independent math audit. |
| R02 | Competitor | [WhatToMine XMR](https://whattomine.com/coins/101-xmr-randomx) | 2026-11-24 | Opened + mobile; historical assumption selectors, speculative horizons, advertisements/order links; wide initial mobile content. |
| R03 | Competitor | [XMRList calculator](https://xmrlist.com/tools/mining-calculator) | 2026-11-24 | Opened + mobile; formula, whole-wall watts and P2Pool timing context; live-data dependencies and sponsor/newsletter surfaces. |
| R04 | Competitor | [XMR Utility CPU database](https://xmr.rugward.com/mining/cpus) | 2026-11-24 | Opened + mobile; search/vendor/sample filters and explicit best-result caveats; permissions not independently verified. |
| R05 | Competitor | [Monero.how Windows guide](https://www.monero.how/how-to-mine-monero-windows) | 2026-11-24 | Opened + mobile; broad setup paths and official links; protection-exception/unblocking advice differs from Ember's boundary. |
| R06 | Complementary software | [Gupax](https://gupax.io/) | 2026-11-24 | Opened + mobile; node/P2Pool/XMRig documentation/screenshots; antivirus exception instructions must not be imported. No installation or software QA. |
| R07 | Competitor | [XMR Daily configuration guide](https://xmrdaily.com/xmrig-config-guide-huge-pages-msr-tuning/) | 2026-11-24 | Opened + mobile; dated diagnostic table/source links; overgeneralized tuning/performance prescriptions warrant primary-source checks. |
| R08 | Competitor | [Miner.download console reference](https://miner.download/en/xmrig/messages/) | 2026-11-24 | Opened + mobile; annotated-output approach useful; questionable units/thread generalizations and prominent download/pool surfaces. Live/cached version labels differ. |
| R09 | Complementary tool | [Official XMRig wizard](https://xmrig.com/wizard) | 2026-11-24 | Browser first screen + static extraction; five stages and initial-config purpose. No wallet entered or full export flow tested. |
| C01 | Community issue | [Windows Huge Pages #2643](https://github.com/xmrig/xmrig/issues/2643) | 2026-11-24 | Opened body; 2021 privilege/unavailable confusion. Comments not loaded; historical anecdote. |
| C02 | Community issue | [Low RandomX hashrate #3734](https://github.com/xmrig/xmrig/issues/3734) | 2026-11-24 | Opened 2025 body: asks whether rate is normal despite optimizations. Indexed memory reply not fully inspected; no root-cause conclusion. |
| C03 | Community | [Windows MSR question](https://www.reddit.com/r/MoneroMining/comments/1ks4cjl) | 2026-11-24 | Search only; reports MSR warning despite prior attempts; full fetch failed. |
| C04 | Community | [Shares Found question](https://www.reddit.com/r/MoneroMining/comments/1fafi0o) | 2026-11-24 | Search only; accepted XMRig submissions versus zero P2Pool shares; full fetch failed. |
| C05 | Community | [Interpreting P2Pool output](https://www.reddit.com/r/MoneroMining/comments/wc3oag) | 2026-11-24 | Search only; historical question on miner output after switching pools. |
| C06 | Community | [Accepted but no P2Pool shares](https://www.reddit.com/r/MoneroMining/comments/ulplpq) | 2026-11-24 | Search only; same conceptual mismatch in a separate historical thread. |
| C07 | Community | [Connection refused](https://www.reddit.com/r/MoneroMining/comments/1furzvw) | 2026-11-24 | Search only; connection-state confusion. No network cause inferred. |
| C08 | Community | [Watt efficient build](https://www.reddit.com/r/MoneroMining/comments/1njhucz) | 2026-11-24 | Search only; electricity/efficiency task; full fetch failed. No hardware figures adopted. |
| C09 | Community | [Hardware, electricity and profits](https://www.reddit.com/r/MoneroMining/comments/1agcwa9) | 2026-11-24 | Search only; asks for hardware/cost context; self-reported numbers unverified. |
| C10 | Community | [Six-rig efficiency question](https://www.reddit.com/r/MoneroMining/comments/1vqauqf/mining_xmr_with_6_rigs_any_idea_on_how_to_improve/) | 2026-11-24 | Search only; explicitly asks about improving hash/watt rather than only throughput. |
| C11 | Community | [XMRig will not start](https://www.reddit.com/r/MoneroMining/comments/1hgkau5) | 2026-11-24 | Search only; Windows command/config-file confusion. |
| C12 | Community | [XMRig will not open](https://www.reddit.com/r/MoneroMining/comments/mt4r07) | 2026-11-24 | Search only; historical immediate-exit/config question. |
| C13 | Technical forum | [Expired shares question](https://monero.stackexchange.com/questions/11857/mining-with-xmrig-what-are-expired-shares) | 2026-11-24 | Opened question/answer; 2019 pool-specific wording. Use for need, not universal share-expiry thresholds. |
| C14 | Technical forum | [Understanding console output](https://monero.stackexchange.com/questions/7273/mining-with-xmrig-on-monero-hashvault-i-want-to-understand-what-i-see-on-the-c) | 2026-11-24 | Search returned detailed question/answer; XMRig 2.x/CryptoNight era, not current parser authority. |
| P01 | Channel policy | [GitHub topics](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics) | 2026-11-24 | Opened; repository classification helps discovery; metadata changes remain future owner work outside this scope. |
| P02 | Channel policy | [Stack Exchange promotion](https://monero.stackexchange.com/help/promotion) | 2026-11-24 | Opened; complete relevant answers, supporting links, affiliation disclosure; not link-only promotion. |
| P03 | Channel policy | [Stack Exchange AI policy](https://monero.stackexchange.com/help/gen-ai-policy) | 2026-11-24 | Opened; generated contributions require explicit attribution under current local policy. |
| P04 | Channel policy | [Show HN](https://news.ycombinator.com/showhn.html) | 2026-11-24 | Opened; substantial tryable work; reading-only articles/landing pages do not qualify. |
| P05 | Channel policy | [HN guidelines](https://news.ycombinator.com/newsguidelines.html) | 2026-11-24 | Opened; no primary promotional use, generated post text, automation or solicited engagement. |
| P06 | Community record | [Mining rules update](https://www.reddit.com/r/MoneroMining/comments/mqqplg) | 2026-11-24 | Search returned 2021 moderator rule text on pool spam/referrals. Historical only, not complete current rules verification. |
| P07 | Official directory | [Monero hangouts](https://www.getmonero.org/community/hangouts/) | 2026-11-24 | Opened; establishes relevant communities, not their posting permission. |
| P08 | Directory | [Awesome Monero](https://github.com/hundehausen/awesome-monero) | 2026-11-24 | Opened; software/tools focus; no contribution rules in inspected README. Separate CONTRIBUTING fetch failed. Defer submission. |
| P09 | Contribution policy | [Monero Docs repository](https://github.com/monero-project/monero-docs) | 2026-11-24 | Search returned README contribution instructions: scoped contributions via PR to master. Technical correction value must stand independently of backlinks. |
| X01 | Access limitation | [XMRig Discussions](https://github.com/xmrig/xmrig/discussions) | 2026-11-24 | Direct request returned 404; no discussion posts investigated successfully. |
| X02 | Rules limitation | [MoneroMining current rules](https://www.reddit.com/r/MoneroMining/about/rules/) | 2026-11-24 | Redirected to moderator rules shell without rule bodies; old.reddit alternative inaccessible. |
| X03 | Rules limitation | [Monero current rules](https://www.reddit.com/r/Monero/about/rules/) | 2026-11-24 | Same rules shell limitation; old.reddit alternative inaccessible. |

Other unsuccessful discovery probes: Soft4Mining's Huge Pages page returned a search excerpt but direct fetch failed; guessed monero-ecosystem directory paths and a MoneroEcosystem contributing path were unavailable. They do not support recommendations. No claim that these resources or rules do not exist follows from retrieval failure.

## Topic profiles

The research matrix is normalized to avoid repeating long fields 52 times. **Each Q row inherits audience, format, technical complexity, maintenance, internal links and optional product relevance from its G profile**, with query-specific coverage/evidence/gap in the Q table. Together these record every required field for each candidate. Profile names are consolidated reader tasks, not a commitment to one page per profile. Complexity/maintenance are editorial low/medium/high assessments.

| Group | Cluster; audience and intent | Recommended format / default disposition | Complexity / maintenance | Contextual internal links | Optional product relevance |
| --- | --- | --- | --- | --- | --- |
| G01 | A; CPU shoppers/comparers; selection | Benchmark-literacy guide; defer buying lists | High / high for rankings, medium / medium for method | LOW → benchmark interpretation → THREADS/measurement | Low; no Ember benchmark claims |
| G02 | A; CPU users; understand cache/workers | Expand MEMORY and THREADS with qualified diagram/example | Medium / medium, algorithm/version review | MEMORY ↔ THREADS → LOW | Explains resource choices, after answer |
| G03 | A; users comparing low rates; diagnose | Improve LOW comparison worksheet | Medium / medium | LOW → HP/MSR/THREADS/ELECTRIC | Shows evidence-based status interpretation |
| G04 | A/B; Windows miners; diagnose allocation | Maintain HP signal table; no duplicate article | Medium / medium, Windows/XMRig | HP ↔ DECODER → LOW/MEMORY | Optional current-status link only |
| G05 | A/B; Windows miners; diagnose optimization | Maintain MSR; explicit safe-stop branches | High / high, driver/security changes | MSR → SECURITY/LOW/DECODER | No security-bypass or optimization claim |
| G06 | A/C; existing-PC owners; compare efficiency | Local two-configuration comparison + wall-power method | Medium / low model, medium guidance | THREADS/LOW → ELECTRIC → efficiency → PROFIT | Compare their inputs, no hardware recommendation |
| G07 | B; voluntary first-time Windows users; setup | Expand SETUP config/first-run branches | Medium / high, release/OS | GUIDES → SECURITY/SETUP → diagnostics | Distinguish standalone from developing app |
| G08 | B; connected/pool miners; diagnose | One connection/share/payout decision guide with sections | High / medium-high, pool/version specifics | SETUP/DECODER → guide → source-specific pool help | State visibility, no pool recommendation |
| G09 | B; cautious Windows users; verify | Maintain SECURITY and linked SETUP verification | High / high, security/release evidence | SECURITY ↔ SETUP; Trust after task | Trust value, no download CTA |
| G10 | B; log readers; interpret | Static diagnostic reference enhancing DECODER, searchable later | High / medium-high, finite versioned inventory | DECODER ↔ HP/MSR/LOW/G08 | Explains signal limits without parser expansion |
| G11 | C; miners modelling cost/revenue; calculate | Improve existing PROFIT explanations only where needed | Medium / medium, financial assumptions/manual values | PROFIT ↔ ELECTRIC; future difficulty explainer | Independent value; no financial promise |
| G12 | C; PC owners measuring consumption; practical | Wall-meter workflow; expand ELECTRIC note or one distinct guide | Medium / medium, equipment methods | ELECTRIC/LOW/THREADS → method → PROFIT | Potential later measured profiles only |
| G13 | C; multi-rate/UK users; compare costs | Expand ELECTRIC with manual tariff worksheet; interaction later | Medium / medium-high, tariffs/geography | ELECTRIC ↔ PROFIT; Ofgem at tariff help | No geographic product sales claim |
| G14 | C; prospective upgraders; economic decision | Manual incremental-cost explanation; defer purchase rankings | High / high, prices/assumptions | G01/G06 → PROFIT/ELECTRIC | Low; no ROI or guaranteed payback |
| G15 | D; beginners; learn mechanism | One concise mining overview with RandomX bridge | Medium / medium, protocol review | LEARN → MEMORY/SETUP/G16/G17 | Optional About after independent learning |
| G16 | D; miners interpreting estimates; understand | Difficulty/hashrate/reward explainer; deterministic example | Medium / medium, consensus assumptions | PROFIT input guide ↔ explainer → G17 | No prediction of actual payments |
| G17 | D; pool/P2Pool beginners; understand payment | Shares/payout reference within G08 initially; separate deep mode guide later | High / high for installation, medium for concepts | G08/DECODER → official P2Pool; G16 | No claim Ember supports P2Pool |

## Query opportunity matrix

Intent codes: **I** informational, **D** diagnostic, **P** practical setup/measurement, **C** calculation/comparison, **S** selection. Existing keys resolve in the 17-route table. Evidence combines source IDs and search samples; official documentation and competitor coverage alone establish topic existence, **not demand**. `H` means no exact-query or direct community demand observed. A community signal cell records the recurring question family; repetitions here do not count as independent reports. Proposed improvements are editorial hypotheses even when the underlying problem is well evidenced.

| ID | Query or question | Group / intent | Existing coverage | Competing / technical sources | Qualitative demand evidence | Community question family | Specific quality gap / consolidation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Q01 | Best CPUs for Monero mining | G01 / S | LOW, MEMORY partial; no buying guide | T12, R04, T04 | S01 selection results | C02 asks normal CPU rate, not purchase demand | Explain comparable conditions before any ranked picks; defer list |
| Q02 | RandomX CPU performance comparison | G01 / C | LOW conceptual | T11–T13, R04 | S01 database results | C02 normal-rate question | Version/algorithm/configuration-aware reading, not copied maxima |
| Q03 | Is an XMRig benchmark my sustained mining rate? | G01 / I | LOW comparison already present | T11, T12, R04 | H exact query; database caveats observed | C02 related only | Add concise benchmark-reading example, reserve measured claim for research |
| Q04 | RandomX CPU cache requirements | G02 / I | MEMORY, THREADS strong | T01, T04, R07 | S11; official frequent-question note | No direct new cache-only question | Preserve distinction between CPU cache, initialization cache and RAM |
| Q05 | Mining threads versus logical processors | G02 / I | THREADS strong | T01, T06, R07 | T01 calls reduced-thread question frequent | C02 adjacent, not direct count evidence | Qualified count illustration, not universal cache÷2 prescription |
| Q06 | Does adding more XMRig threads improve hashrate? | G02 / C | THREADS comparison section | T06, R07 | S01/S11 adjacent; exact need H | No independently inspected thread-only report | Add method/example on same URL; actual results require experiment |
| Q07 | Does RAM configuration affect RandomX? | G02 / I | MEMORY, LOW partial | T01, T04, R07 | C02 plus S06 memory-indexed reply, limited | Normal rate despite enabled optimizations | Extend existing memory section with configuration-record checklist |
| Q08 | Single versus dual memory channels for mining | G02 / C | MEMORY, LOW brief | T01, T04, R07 | S11 topic signal; exact comparison H | C02 related only; reply not verified | Explain channel versus DIMM count; no universal gain |
| Q09 | Why is XMRig hashrate low? | G03 / D | LOW substantial | T01, T11, R07 | C02 directly opened; S02/S06 | Expected versus observed rate despite optimizations | Comparable-record template; do not repeat checklist as new article |
| Q10 | Pool hashrate differs from XMRig | G03 / D | LOW brief window distinction | T17, C14, R03 | H exact question in this sample | Share accounting confusion C04–C06 adjacent | Link rate-window explanation to shares reference; no root-cause shortcut |
| Q11 | Huge Pages performance impact | G04 / I | HP, MEMORY, LOW | T02, R07 | S02; C01/C03 related | Warning interpreted as fixed performance loss | No guaranteed percentage; observed gain only after controlled research |
| Q12 | MSR performance implications | G05 / I | MSR, LOW | T03, R07 | C03 search excerpt, S02 | Warning persists despite attempted changes | Maintain safe branch; no promised loss/gain |
| Q13 | Hashrate per watt / mining efficiency | G06 / C | ELECTRIC costs, THREADS conceptual; no ratio tool | R01, R03, T11 | C08/C10 and S07 | Wants lower watts per hash, not fastest CPU | Whole-PC boundary and matched measurement interval are key |
| Q14 | Mining efficiency versus maximum hashrate | G06 / C | LOW, THREADS partial | R03, R04 | C08–C10; S07 | Electricity expense changes goal | Two manually entered configurations; no automatic winner |
| Q15 | XMRig Windows setup | G07 / P | SETUP substantial | T05, R05, R09 | S09/S10; C11 | Where to run command/configure first session | Improve same guide with bounded config-file troubleshooting |
| Q16 | XMRig closes immediately on startup | G07 / D | SETUP partial | T05, R07 | C11/C12 search excerpts | Window disappears before error can be read | Capture original error context; do not prescribe elevation as universal fix |
| Q17 | No valid XMRig configuration found | G07 / D | SETUP file example, not full path reference | T05, R09 | S09, C12 related | Config path/command confusion | Small config-location/JSON branch in SETUP; stop for unexpected miner |
| Q18 | Common config.json mistakes | G07 / P | SETUP, THREADS partial | T05–T07, T15, R09 | S09; C11 related | File/endpoint confusion | Annotated minimal fields; schema assistant deferred |
| Q19 | Huge Pages unavailable on Windows | G04 / D | HP, DECODER, SETUP | T02, R07 | C01 opened, S02 | User thinks a granted right proves working pages | Existing answer already strong; maintain version evidence |
| Q20 | Huge Pages permission granted but 0% | G04 / D | HP explicit branch | T02, R07 | C01 related historical mismatch; S02 | C01 unavailable; not proof of same 0% cause | Maintain separate allocation labels; no new URL |
| Q21 | Partial Huge Pages allocation failure | G04 / D | HP explicit branch | T02, R07 | S02 topic evidence; exact prevalence H | Privilege/allocation mismatch family | State each allocation and unknown cause; research later |
| Q22 | Failed to apply MSR mod on Windows | G05 / D | MSR, DECODER | T03, R07 | C03 snippet, S02 | Attempts do not resolve warning | Preserve stop/verify/security context; no driver bypass |
| Q23 | XMRig pool connection refused or retries | G08 / D | SETUP brief, DECODER limited | T07, T17, R05 | C07 snippet, S04 | Connection state versus successful work | Decision table endpoint/DNS/TLS/auth; pool-specific follow-up |
| Q24 | Pool TLS connection/configuration failure | G08 / D | SETUP TLS field only | T07, R05 | H exact query; official option evidence | C07 adjacent only | Verify documented port/security pairing; never advise disabling verification |
| Q25 | Why are XMRig shares rejected? | G08 / D | DECODER recognizes, no reason analysis | T17, C13, R08 | C13 opened, S04/forum results | Rejected/expired meaning | Separate pool reason, job age, stability hypotheses; no universal threshold |
| Q26 | Accepted shares but no mining payment | G08 / D | PROFIT caveat, SETUP brief | T10, R03 | C04–C06 repeated questions in separate thread titles/excerpts | Accepted submissions mistaken for payout eligibility | Highest-value missing decision branch; authoritative P2Pool corroboration |
| Q27 | Windows security software flags XMRig | G09 / D | SECURITY substantial | T18, T16, R05/R06 | S10 results; no incident-rate estimate | C03 adjacent driver concern only | Maintain trusted-source/stop workflow; no new alert-specific thin pages |
| Q28 | Verify an XMRig download safely | G09 / P | SECURITY, SETUP detailed | T16, R05 | S10; H exact verification demand | No directly inspected new verification question | Refresh source/version when edited; checksum is not safety certification |
| Q29 | Understand XMRig console output | G10 / I | SETUP and DECODER bounded | T17, R08, R07 | C14 detailed search extract, S04 | What do job/difficulty/accepted counters mean? | Searchable static signal-to-meaning table, version tags |
| Q30 | CPU ready but no accepted shares | G10 / D | DECODER cautions partial | T17, T07, R08 | H exact query; C04 adjacent | Backend state mistaken for payment/work state | Show state ladder and unknowns; no parser widening implied |
| Q31 | Is Monero mining profitable? | G11 / C | PROFIT substantial | R01–R03 | S03/S12 many calculator resources | C09 asks full hardware/cost context | Explain scope at decision point; no evergreen yes/no answer |
| Q32 | CPU mining electricity cost | G12 / C | ELECTRIC strong | R01, R03 | S03/S07; C08/C09 | Whole setup cost unclear | Strengthen measurement method rather than another cost calculator |
| Q33 | Mining electricity calculator | G12 / C | ELECTRIC complete base arithmetic | R01–R03 | S03/S12 tool intent | C09 asks comparable inputs | Keep cost-only intent distinct from earnings; no duplicate tool |
| Q34 | Break-even electricity price for XMR mining | G11 / C | PROFIT already outputs tariff | R01/R03 | S12 direct competing functionality | C08 high tariffs adjacent | Same-page explanation of operating break-even, no standalone route |
| Q35 | Mining efficiency calculator | G06 / C | Costs exist; no A/B H/s/W | R01, R03 | S07 community efficiency; exact tool term H | C08/C10 lower watts per hash | Distinct manual A/B comparison, not another profit forecast |
| Q36 | Is a CPU upgrade worth it for mining? | G14 / S | PROFIT excludes purchase costs | R01, R04 | S01 selection adjacent; exact economics H | C09 hardware-cost context | Incremental capex/running-cost method only; defer rankings |
| Q37 | Measure whole-system mining power | G12 / P | ELECTRIC note, LOW handoff | R03, T11 | C09/C10 provide inconsistent reported boundaries | Which watts should be compared? | Repeatable wall-meter averaging and idle context; method before results |
| Q38 | CPU package watts versus wall watts | G12 / I | ELECTRIC explicitly distinguishes | R03/R04 | H exact-query; community boundary ambiguity | C08/C09 context, no verified measurements | Explain once at ELECTRIC and link from comparison tool |
| Q39 | Mine at peak versus off-peak tariffs | G13 / C | ELECTRIC one rate/runtime | T19, R01 | H miner-specific; official multi-rate existence | No direct mining schedule question found | Manual weighted schedule worksheet; do not scrape rates |
| Q40 | Monero mining profitability in the UK | G13 / C | PROFIT GBP labels, ELECTRIC pence | T19, R01/R02 | S08 broad UK results, weak XMR-specific evidence | C08 Europe, not UK proof | Actual tariff/units; GB cap scope, NI separate; no default UK profitability |
| Q41 | kW versus kWh in mining electricity costs | G12 / I | ELECTRIC units/math | T19, R03 | C08 excerpt contains ambiguous units; exact query H | Measurement boundary/units confusion | Compact calculation breakdown at existing tool |
| Q42 | Idle versus active PC power for mining | G12 / C | ELECTRIC whole-wall note only | R03, T11 | H exact demand | C09 comparison context only | Separate total bill estimate from incremental attributable load |
| Q43 | How Monero mining works | G15 / I | LEARN planned, SETUP introduction | T08, T04, R05 | Search families expose educational resources; exact demand H | C14 beginner output question adjacent | Concise conceptual landing page, not full protocol textbook |
| Q44 | What RandomX does | G15 / I | MEMORY technical layers, no short overview | T04, T08, R05 | S01/S11 adjacent; exact demand H | No independently inspected algorithm-only question | Bridge overview to MEMORY; do not create second cache page |
| Q45 | Solo versus pool mining | G17 / I | SETUP brief, PROFIT caveats | T08, T10, R05 | S04 related modes/questions | C05 switching setup context | Trade-off table; deep installation remains upstream |
| Q46 | What is P2Pool? | G17 / I | SETUP overview only | T08, T10, R03/R06 | S04 multiple P2Pool questions | C04–C06 confusion recurs | Explain layers before a setup tutorial; no Ember integration claim |
| Q47 | What does mining difficulty mean? | G16 / I | PROFIT input help; SETUP job brief | T09, T10, R03 | S04 difficulty/share family | C14 asks job difficulty; old context | Distinguish job, sidechain and network difficulty |
| Q48 | Network hashrate versus my hashrate | G16 / I | PROFIT manual-basis help | T09, R01–R03 | S03/S04 calculator context; exact demand H | C02 personal baseline only | Deterministic relative-share diagram, no live feed |
| Q49 | Mining shares versus valid blocks | G17 / I | SETUP signals; PROFIT limits | T10, T17, R03 | C04–C06, C13/C14 | Several uses of share treated as equivalent | State-and-threshold diagram; one shared reference |
| Q50 | Monero block rewards and expected rewards | G16 / I | PROFIT manual reward/formula | T09, R01–R03 | S03 calculator context; exact demand H | C09 rewards/cost adjacent | Reward plus fees/penalties context and expectation, no current-rate promise |
| Q51 | Which mining wallet/address receives payments? | G17 / P | SETUP public receiving address | T07, T10, R05 | H exact-query demand in sample | C04–C06 payout confusion adjacent | Pool/mode-specific address restrictions upstream; never request keys/seed |
| Q52 | Solo versus pooled reward variability | G16 / C | PROFIT says not probability simulator | T09, T10, R03 | C04–C06 waiting questions; exact probability-tool demand H | Expected time mistaken for payout deadline | Analytic probability teaching only after model review; P2Pool separate |

### Strongest findings and limits

1. **Share/payment interpretation:** separate community threads and an older technical-forum question show repeated confusion. T10/T17 provide a primary foundation. This supports a bounded new reference/diagnostic resource, not a prevalence statistic.
2. **Comparison conditions and efficiency:** opened C02 and search-only C08–C10 support better measurement records and whole-PC comparisons. They do not validate any quoted device H/s or watts.
3. **Privilege/allocation and safe warning handling:** official documentation corroborates real distinctions. Ember already answers much of this; refresh and consolidate before adding pages.
4. **Economics tools are competitive:** R01–R04 already offer useful assumptions or caveats. Distinctiveness needs method, boundaries and decision support. Cleaner design alone cannot establish ranking advantage.

No interviews, first-party support logs, Search Console, paid keyword study, large forum sample or representative hardware measurements were available. Community snippets can be stale or incomplete. Proposed topics with H evidence should receive task testing or actual query evidence before costly implementation. This research identifies plausible useful resources; it does not predict search traffic.
