# M11A — Organic content roadmap

**Status:** M11A was research and planning only. Created 9 October 2026 from the source audit and bounded web research. The M11B items below were implemented on 10 October 2026; M11A's original research and prioritization are retained. No desktop implementation is part of either website milestone.

## Strategy

Grow through a small set of distinct, evidence-led tasks that connect to existing guides and tools. Current source strengths are qualified product status, static-first explanatory pages, transparent manual calculator assumptions, a bounded local log decoder, and primary technical citations. Organic demand is not validated: no Search Console, keyword-volume, support-ticket, deployed indexing, or user-interview data was supplied. Web result observations identify formats and visible questions only.

Before starting M11B, check whether first-party query/support data changes these priorities. Keep the URL count small, prioritize a useful update over a new article, and do not produce keyword variants or thin planned pages.

## Quick improvements (select during M11B planning)

1. Add a version/review date and a compact signal-to-next-check table to the existing Huge Pages page; preserve its URL and cautious privilege guidance.
2. Improve the profitability tool’s help around input source/provenance with one clearly hypothetical example. Keep every value manual and avoid inserting current network or market data.
3. In Windows setup guidance, add a sourced, safe response to Defender/SmartScreen warnings: stop and verify the official download and hash/signature; do not disable protection, add a broad exclusion, or restore an unknown/quarantined executable.
4. Add a concise tested-output/version coverage note for the log decoder only after parser fixture coverage is verified.
5. Cross-link calculators where a reader moves from energy cost to expected-value scenarios; state the different scope of each tool.

These are candidates, not work authorized/started within M11A.

## Three recommended M11B candidates

### 1. Improve the Windows Huge Pages troubleshooting page

**Title:** “XMRig Huge Pages on Windows: Permission, Allocation and Next Steps”  
**Route:** keep `/troubleshoot/xmrig-huge-pages/`  
**Question/intent:** “Why does XMRig report Huge Pages unavailable or partial, and what can I safely check?” Symptom-led diagnostic.

**Value:** Current page already has useful primary sources and traffic intent clues in official docs/community questions. A compact table can make the distinction between privilege granted and memory allocation especially scannable while preventing risky generic advice.

**Outline:** quick distinction; capture the relevant startup lines; privilege absent; privilege granted but allocation partial; full allocation; memory/NUMA constraints; managed device caution; verify a fresh run; when no change is needed; related reading.

**Required sources:** current [XMRig Huge Pages documentation](https://xmrig.com/docs/miner/hugepages), current Microsoft `SeLockMemoryPrivilege` / policy documentation, and XMRig release notes if observed behavior is version-dependent.

**Visual:** accessible text-first branch table or flow diagram; any log snippet marked illustrative and not copied from a user.

**Links:** RandomX memory/cache, CPU threads, low-hashrate, decoder, Windows setup guide.

**Maintenance:** review when XMRig changes Windows instructions; keep Windows version claims dated and scoped.

**Acceptance:** every instruction is sourced; outcomes are not conflated; no broad elevation, registry edit, Defender exclusion, firmware change, or guaranteed hashrate gain; original URL retained; content/link checks pass.

### 2. Improve profitability calculator input guidance

**Title:** “Monero Mining Profitability Calculator: Inputs and Assumptions”  
**Route:** keep `/tools/monero-mining-profitability-calculator/`  
**Question/intent:** “What values should I enter, and what does the estimate mean?” Tool-use intent.

**Value:** Current search-result examples commonly foreground live assumptions. Ember can differentiate with visible manual inputs and limitations, without fetching live values or implying certainty.

**Outline:** input sourcing and units; hypothetical worked calculation; fee treatment; time horizons; exclusions; reading positive/negative output; electricity-only tool distinction.

**Required sources:** M10B calculation specification/tests, current Monero technical specifications, and Monero mining-mode/payout documentation.

**Visual:** compact formula flow and checked hypothetical arithmetic; no current network/price values.

**Links:** electricity tool, RandomX/cache, threads, low hashrate, Windows setup and tool hub.

**Maintenance:** keep example consistent with code; revisit when formula, bounds, fee definition or currency handling changes.

**Acceptance:** independently verify arithmetic; no API or persistence; assumptions/exclusions visible; estimates are not guaranteed profit or investment guidance.

### 3. Write safe Windows XMRig security-warning guidance

**Title:** “Windows Security Warnings When Downloading XMRig: Safe Checks”  
**Route:** `/guides/xmrig-windows-security-warnings/`  
**Question/intent:** “What should I do if Windows or Defender warns about a miner download?” Safety/task completion.

**Value:** Returned setup content included advice to whitelist or temporarily disable protection. A safe, official-source-backed page can address this without asserting that detections are false positives.

**Outline:** stop before execution; confirm official XMRig source; verify available hash/signature; explain warnings at a high level; do not disable protection or add blanket exclusions; managed-device escalation; no Ember download availability.

**Required sources:** current Microsoft Defender and SmartScreen documentation, official XMRig download/build/release pages.

**Visual:** safe decision tree, without UI screenshots that can become stale.

**Links:** Windows setup, Trust and Huge Pages where relevant; no download CTA.

**Maintenance:** verify security UI and upstream distribution guidance each release cycle.

**Acceptance:** no instruction to disable Defender/SmartScreen, create broad exclusions, restore quarantine or run unverified files; no guarantee of binary safety; current sources and review date shown.

## Later opportunities

| Candidate | When to consider | Evidence limitation |
|---|---|---|
| Windows Defender/XMRig download warning explainer | If support or first-party query data shows frequent confusion | Search result content includes risky advice, but demand is not quantified. Requires conservative review and Microsoft sourcing. |
| Pool connection/rejected-share diagnosis | If first-party support/query data validates a separate troubleshooting need | Keep pool-specific codes and payout policies sourced; demand evidence is weaker than for Huge Pages/calculator intent. |
| CPU thread/cache comparison worksheet | If readers need a repeatable way to test more threads | Do not publish fabricated CPU benchmarks; no lab measurement set exists. |
| Whole-system power measurement and mining-while-using-PC guide | If users need practical measurement beyond existing calculator copy | No original device/power data exists. Label any examples hypothetical. |
| Solo, pool and P2Pool payout mechanics | If enough source review justifies a distinct learner need | Avoid overpromising payout frequency; pool rules differ and change. |
| Log decoder coverage guide | Once supported output families and fixtures are inventoried | Search intent weakly observed; the tool itself currently states its limits. |

## Content quality standard

- One distinct reader question and intent per route; answer early, then explain scope and limits.
- Prefer official Monero/XMRig/Microsoft documentation for technical guidance. Community posts can reveal confusing symptoms but cannot establish the fix.
- Date and version information where material; mark hypothetical examples as such; never invent current network, hardware, reward, price, or benchmark values.
- State when an instruction is Windows-version- or pool-specific. Treat system privileges and security settings conservatively.
- Link to the next relevant concept/tool at the moment of need; avoid repetitive “related resources” spam.
- Keep concepts independent from Ember. Describe the app only with current evidence; it has no public download, Smart Mining remains planned, Stop/Quit acceptance is open, and no persistent history/profitability capability should be implied.
- Review each page’s sources, links, wording, reading order, headings, keyboard use, mobile layout and required accessibility checks before publishing.
- Avoid claims of ranking, guaranteed savings, earnings, security certification, or universal performance.

## Visual opportunities (not implemented)

1. **Mining reward calculation:** show the dimensions from hashrate × time to hashes, expected block equivalents, reward assumption, fee and energy cost. Label scenarios as expected value.
2. **Pool coordination:** show connection, job, share submission, pool accounting and eventual payout as separate states; no implication that an accepted share is a payment.
3. **CPU/RandomX behavior:** relate worker count to per-thread cache, memory dataset and system responsiveness, without claiming performance numbers.
4. **Troubleshooting decision paths:** use text-first accessible branches for Huge Pages and pool/rejection states.

Prefer a small inline SVG/CSS figure, meaningful text equivalent, and a source note. Do not use generic crypto imagery or decorative diagrams that merely restate a heading.

## Technical SEO and domain dependency

The source has static rendering, canonical/meta generation, a route sitemap and an allow-all robots response. Both Astro config and layout fall back to `https://example.com`. The inspected strategy has no confirmed production host. Before deployment, a deployment owner must configure the actual `SITE_URL` and verify generated canonical, sitemap, robots and social URLs. Do not guess a domain. Source presence does not demonstrate live indexing.

All M11A recommendations are subordinate to that domain configuration dependency; no indexing or live rank is asserted.

## Accessibility backlog

M10B reports that dedicated screen-reader testing and measured contrast checks remain outstanding. Create a small separate accessibility QA milestone to test keyboard/focus and zoom, screen-reader labels/errors/status updates across the calculators and decoder, measured contrast in relevant states, and mobile/reflow behavior. Record actual browser/assistive technology and contrast method. Do not call the site certified based on automated checks or visual review.

## Deferred work

- Keyword-volume, rank, conversion and competitor-traffic claims until an appropriate first-party or licensed data source exists.
- New route publication, tool changes, new schema, diagrams, live APIs, benchmark databases and desktop changes.
- Generic cryptocurrency investing/trading/pricing content or other-coin coverage.
- Any M11B implementation in M11A.

## Original M11A recommendation (preserved for history)

M11A recommended choosing one existing-page improvement plus up to two new resources after checking available Search Console/support evidence. The M11B implementation status below records the outcome. Keep this original recommendation as research history; it is no longer pending work.

## M11B implementation status (10 October 2026)

- **Completed:** Huge Pages article updated with dated technical review and a sourced semantic table separating privilege, allocation, partial/full results and inconclusive excerpts. Existing URL retained.
- **Completed:** profitability calculator now explains input sourcing, measured versus external versus hypothetical values, limitations, and one synthetic worked example verified against the existing calculation module. Formula and validation code were not changed.
- **Completed:** new Windows security-warning guide added at `/guides/xmrig-windows-security-warnings/`, with official-source and release-evidence guidance, limitations of checksums/signatures, safe unresolved-warning steps and an accessible decision flow.
- Search Console/support evidence remained unavailable in repository state; the M11B priorities were implemented without asserting demand metrics.
