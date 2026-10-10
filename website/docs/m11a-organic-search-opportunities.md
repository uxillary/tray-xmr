# M11A — Organic search opportunities

**Research snapshot:** 9 October 2026. Searches were manually bounded and are not a rank-tracking or keyword-volume study. Search engines can personalize results; this document records returned results and page content visible during research, not universal SERP composition.

## Evidence labels

- **Observed result:** returned by a dated web search or directly opened result.
- **Primary technical source:** official Monero, XMRig or Microsoft documentation; use for technical claims.
- **Community signal:** a forum/issue question illustrating a reported problem, not proof of cause or prevalence.
- **Intent inference:** likely user task inferred from query wording and results.
- **Unvalidated opportunity:** plausible content need with no Search Console, keyword volume, or user-support data.

No volume, difficulty, rank, traffic, competitor audience, or conversion numbers are available. Treat all demand estimates as hypotheses.

## Search and competitor observations

| Topic/query family | Observed result pattern (9 Oct 2026) | What it suggests; limits |
|---|---|---|
| Monero mining profitability / calculator | Search returned live-data calculator pages from XMRList and MillionMiner. XMRList showed a calculator coupled to live difficulty, price, reward and P2Pool statistics; MillionMiner promoted “real XMR profit” from live assumptions. | Users may expect a fast estimate and current inputs. Ember can differentiate with visible manual inputs, formulas, scenario limits, local calculation and no live-data claim. These observations do not establish result ranking or accuracy. [XMRList calculator](https://xmrlist.com/tools/mining-calculator), [MillionMiner calculator](https://millionminer.com/mining/calculator/xmr). |
| Windows setup | Results included the official Monero pool guide, XMRig docs, a long 2026 third-party guide spanning CLI/pool/P2Pool/GUI, and videos. | Setup intent spans a quick pool start and decentralization choices. Ember’s sourced standalone path is narrower, safer and should not imply P2Pool support. The third-party Windows guide included advice to whitelist/temporarily disable protection, a safety gap Ember should explicitly avoid. [Monero pool guide](https://web.getmonero.org/resources/user-guides/mine-to-pool.html), [Monero.how guide](https://www.monero.how/how-to-mine-monero-windows). |
| Huge Pages / Windows | Official XMRig Huge Pages docs give Windows privilege instructions and distinguish permission from allocation; GitHub issues and Reddit result snippets show recurring confusion about “permission granted” with partial/unavailable pages. | The exact signal distinction is a useful editorial angle. Community posts demonstrate questions only; XMRig is the technical authority. [XMRig Huge Pages](https://xmrig.com/docs/miner/hugepages), [GitHub issue 2643](https://github.com/xmrig/xmrig/issues/2643). |
| MSR / low hashrate | Search results included unofficial Windows tuning guides and community reports involving MSR, Huge Pages, virtualization and administrator rights. | Users need a safe diagnostic order that doesn’t bundle unrelated firmware/security changes. Do not adopt community fixes without official/source corroboration. Existing low-hashrate and MSR pages provide a foundation. |
| Pool/rejected shares | Search result sample was less conclusive than Huge Pages; official XMRig pool configuration and Monero troubleshooting material distinguish endpoint/TLS configuration, pool behavior and payout policy. | A focused diagnostic resource may help, but new demand is unvalidated. Distinguish rejected share from a failed connection, stale share, and accepted share without payment. [XMRig pool configuration](https://xmrig.com/docs/miner/config/pool), [Monero mining help](https://docs.getmonero.org/interacting/mining/guides/help/). |
| Defender warnings | Returned setup content included unsafe blanket advice to whitelist/disable real-time protection; Microsoft says exclusions create protection gaps and should be used sparingly for a specific problem. | A careful Windows security guidance page could materially improve trust, but must not instruct users to disable Defender, restore quarantined files or create broad exclusions. No exact query demand was validated. [Microsoft exclusions guidance](https://learn.microsoft.com/en-us/microsoft-365/security/defender-endpoint/configure-contextual-file-folder-exclusions-microsoft-defender-antivirus?view=o365-worldwide). |

The official Monero mining overview explains the distinct solo, pool and P2Pool approaches. The technical specification gives a two-minute target block interval and says difficulty retargets each block over a recent window. These are useful foundations for economics explanations; verify figures when revising because consensus documentation can change. [Monero mining](https://docs.getmonero.org/interacting/mining/), [technical specifications](https://docs.getmonero.org/technical-specs/).

## What users appear to need

1. **Economics:** “What inputs determine a mining estimate, and what does it leave out?” Existing tools can answer this without live feeds if they clearly label assumptions. Cost-only and expected-value calculations remain separate intents.
2. **Windows setup:** “How do I obtain/configure XMRig and know it is doing the expected work?” The answer should identify official distribution, validate the file, use a public receiving address, explain pool choices and interpret observable startup signals.
3. **Troubleshooting:** “What does this exact log state mean, and what is a safe next check?” Start from exact output; separate permission, allocation, CPU settings and network states.
4. **Hardware:** “Why did adding threads or enabling an optimization not improve results?” Explain cache, memory, sustained load, measurement variability and reproducible conditions without promising model-specific H/s.

These are intent inferences, not proof of query volume. No Search Console or user support analytics were available in this audit.

## Technical source anchors

- XMRig says Windows Huge Pages require `SeLockMemoryPrivilege`; its log reports the privilege separately from allocation percentages. Its guidance says memory pressure can prevent full allocation. [XMRig Huge Pages](https://xmrig.com/docs/miner/hugepages).
- XMRig’s pool configuration documents endpoint, wallet/user field, TLS and related options. Pool-specific username/payout requirements remain pool-specific. [XMRig pool config](https://xmrig.com/docs/miner/config/pool).
- Monero distinguishes solo, pool and P2Pool and describes trade-offs; do not treat all payout methods as one model. [Monero mining](https://docs.getmonero.org/interacting/mining/).
- Microsoft warns Defender exclusions reduce protection and should be narrow and problem-specific. Do not turn security troubleshooting into an exclusion tutorial. [Microsoft Defender exclusions](https://learn.microsoft.com/en-us/microsoft-365/security/defender-endpoint/configure-contextual-file-folder-exclusions-microsoft-defender-antivirus?view=o365-worldwide).
- Existing calculator formulas are specified in [M10B implementation](m10b-mining-economics-implementation.md). Keep their static, manual-input boundary.

## Prioritization model

Each dimension is rated 1–5 with qualitative judgment: usefulness (U), Ember relevance (R), observed intent evidence (E), differentiation potential (D), technical confidence (T), tool relationship (Tool), maintenance ease (M), and effort ease (Effort). Higher is better for every dimension; for maintenance and effort, 5 means low burden/easy. Weighting: U 20%, R 15%, E 15%, D 15%, T 15%, Tool 10%, M 5%, Effort 5%. Weighted score = sum(rating × weight), expressed on a 1–5 scale. It is a transparent editorial ranking aid, not a demand metric. Confidence is evidence confidence, not score precision.

## Ranked shortlist

| Rank | Opportunity | U | R | E | D | T | Tool | M | Effort | Score | Confidence / type |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | Improve Huge Pages Windows guide with signal-to-action table and source/version date | 5 | 5 | 4 | 5 | 5 | 5 | 4 | 4 | 4.75 | High technical, medium intent; existing-page improvement |
| 2 | Improve profitability calculator guide copy with input provenance and worked hypothetical | 5 | 5 | 4 | 5 | 5 | 5 | 4 | 4 | 4.75 | Medium intent, high model confidence; tool-support improvement |
| 3 | Safe XMRig Windows Defender/download warning explainer, sourced and scoped | 5 | 5 | 4 | 5 | 5 | 4 | 3 | 3 | 4.55 | Medium intent; new content opportunity |
| 4 | Difficulty, network hashrate and expected block-equivalent explainer tied to calculator | 5 | 5 | 3 | 5 | 5 | 5 | 4 | 3 | 4.55 | Medium-low demand; new Learn article |
| 5 | Link wall-power measurement method and electricity/profitability tool journeys | 5 | 5 | 3 | 4 | 5 | 5 | 4 | 4 | 4.45 | User-value strong; search demand unvalidated |
| 6 | Improve Windows XMRig setup guide with dated version and safe security-warning branch | 5 | 5 | 4 | 4 | 5 | 4 | 3 | 3 | 4.40 | High task relevance; existing-page improvement |
| 7 | Rejected shares versus pool connection versus payout diagnosis | 5 | 5 | 3 | 5 | 4 | 5 | 3 | 3 | 4.35 | Medium-low intent; new troubleshooting opportunity |
| 8 | Add reproducible thread/cache comparison example to CPU-thread article | 4 | 5 | 3 | 4 | 5 | 3 | 4 | 4 | 4.05 | Strong technical rationale, unvalidated demand |
| 9 | Document Log Decoder coverage, sample lines and supported-version policy | 4 | 5 | 2 | 4 | 5 | 5 | 4 | 3 | 4.05 | Existing tool relevance; query demand weakly evidenced |
| 10 | Windows pool connection checklist: endpoint, DNS, port, TLS, wallet format | 4 | 5 | 3 | 4 | 4 | 4 | 3 | 3 | 3.90 | Medium-low intent; new troubleshooting |
| 11 | Publish pool reward/payout distinctions for solo, pool, P2Pool | 4 | 4 | 3 | 4 | 5 | 3 | 3 | 3 | 3.80 | Official foundation strong; scope must stay bounded |
| 12 | Add measured whole-PC power workflow and “mining while using PC” scenarios | 4 | 4 | 2 | 4 | 4 | 5 | 3 | 3 | 3.70 | Unvalidated adjacent intent; no generated device data |

Close scores do not imply meaningful empirical differences. Ranks 2/5/7/9 may move after Search Console, support, or user testing data exists. Do not pursue a topic only to add URLs.

## Three M11B candidates

The proposed three are one focused existing-page improvement, one tool-support improvement, and one safety-focused Windows guide. Final selection should be confirmed against any first-party query/support data available at M11B start.

### Candidate A — Improve existing Huge Pages guide

- **Working title/URL:** “XMRig Huge Pages on Windows: Permission, Allocation and Next Steps” — `/troubleshoot/xmrig-huge-pages/` (retain URL).
- **Question / intent:** Why does XMRig report Huge Pages unavailable or partial on Windows, and what should I check safely? Diagnostic.
- **Unique value:** Small branch table maps exact permission/allocation observations to conservative next checks; explicitly separates Windows privilege, allocation and performance impact.
- **Outline:** quick answer; capture relevant log lines; granted/missing privilege; zero/partial/full dataset vs thread allocation; available memory/reboot; managed-PC caveat; verify result; when no action is needed; related concepts.
- **Sources:** current XMRig Huge Pages docs; Microsoft privilege policy page; official XMRig changelog/release notes if version changes; existing RandomX/cache docs.
- **Visual/example:** semantic text decision table; short invented illustrative log labeled as such, no screenshots from user logs.
- **Internal links:** cache, threads, low hashrate, decoder, Windows guide.
- **Maintenance:** check instructions after XMRig Windows behavior changes; avoid locking this to unsupported Windows editions.
- **Acceptance:** every branch maps a signal to an evidence-based next step; no broad admin, registry, Defender-exclusion or firmware instruction; sources/date shown; article tests/link checker pass in M11B.

### Candidate B — Improve the profitability calculator’s input guidance

- **Working title/URL:** “Monero Mining Profitability Calculator: Inputs and Assumptions” — improve `/tools/monero-mining-profitability-calculator/`, retain its route.
- **Question / intent:** What values should I enter, and what does the estimate mean? Tool-use intent.
- **Unique value:** Trace a hypothetical user-entered scenario through the visible formula; separate expected value from payout and the net estimate from total ownership cost.
- **Outline:** input sourcing; units and input checks without universal recommended values; one hypothetical calculation; fee treatment; time horizons; exclusions; reading negative/positive results; electricity-only tool comparison.
- **Sources:** M10B specification/tests, current Monero technical specs for interval/reward terminology, Monero docs for payout-model distinctions.
- **Visual/example:** compact formula flow and hypothetical arithmetic, no live network data.
- **Internal links:** electricity tool, RandomX/cache, threads, low hashrate, Windows setup, tools hub.
- **Maintenance:** keep example consistent with the model; review formula, bounds, fee definition and currency behavior when they change.
- **Acceptance:** independently checked arithmetic; no API/persistence; exclusions visible; positive output is not guaranteed profit; manual assumptions remain clear.

### Candidate C — Safe Windows XMRig security-warning guidance

- **Working title/URL:** “Windows Security Warnings When Downloading XMRig: Safe Checks” — `/guides/xmrig-windows-security-warnings/`.
- **Question / intent:** What should I do if Windows or Defender warns about a miner download? Safety/task completion.
- **Unique value:** Verify provenance without normalizing detections or weakening Windows protection.
- **Outline:** stop before execution; verify official XMRig source and available hash/signature; interpret warning at a high level; do not disable protection, create blanket exclusions or restore quarantined files; managed-device escalation; no Ember download claim.
- **Sources:** current Microsoft Defender/SmartScreen docs; official XMRig download/build/release pages.
- **Visual/example:** safe decision tree emphasizing stop/verify; avoid screenshots tied to one UI version.
- **Internal links:** Windows setup guide, Trust, Huge Pages where relevant; no download CTA.
- **Maintenance:** security UI and release verification can change; recheck source links each release cycle.
- **Acceptance:** no instructions to disable Defender/SmartScreen, exclude broad paths/processes, restore quarantine or run unverified files; no guarantee that a binary is safe; date and sources shown.

### Candidate reconsideration trigger

Replace any candidate if Search Console queries, support requests, or user interviews show a more urgent distinct need, or if source review finds the planned work would duplicate an authoritative resource without meaningful added value. Candidate rankings are editorial, not search-volume predictions.
