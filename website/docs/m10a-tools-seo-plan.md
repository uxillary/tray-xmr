# M10A — Mining economics tools SEO plan

**Research snapshot:** 9 October 2026. This is a qualitative search-result and competitor review, not keyword-volume, ranking or traffic research. No SEO implementation is included in M10A.

## Search intent

Search queries reviewed included “Monero mining calculator,” “XMR mining profitability calculator,” “Monero mining electricity cost,” “CPU mining profitability,” “mining power consumption,” “XMR mining break-even cost” and “Monero network difficulty explained.” Current result pages commonly join four intents: estimate expected XMR, translate it into a chosen fiat currency, subtract electricity/pool costs, and understand which network assumptions produced the estimate. “Difficulty explained” is an adjacent informational intent and should be served by a focused explainer rather than keyword text stuffed into the calculator.

Search results vary by location, date and device. This snapshot does not establish search volume, competitiveness, user preference or rank position. Recheck Search Console queries and page behavior after a public release; do not infer a traffic opportunity from the existence of competing pages alone.

## Competitor observations

Pages were opened on 9 October 2026. These are observations of public page content and product behavior, not an endorsement or a correctness audit of their live feeds.

| Example | Observed strengths | Gaps/opportunity for Ember |
| --- | --- | --- |
| [XMRList Monero calculator](https://xmrlist.com/tools/mining-calculator) | Combines live difficulty, price, recent average reward, electricity, pool fee, break-even rate, solo block interval and P2Pool-chain context. It discloses a calculation relationship based on hashrate share × blocks/day × recent average reward. | Dense and data-rich; it mixes profitability calculation with current network monitoring and P2Pool selection. Ember can make manual assumptions, units and expected-versus-realized limits easier to audit without live-data dependency. |
| [MillionMiner XMR calculator](https://millionminer.com/mining/calculator/xmr) | Presents hashrate, watts, tariff and pool fee, with XMR and fiat outputs over several horizons. It discloses a network rate, exchange rate, fixed block reward and block time used at the observed page snapshot. | The capture illustrates how a page can mix refreshed market/network fields with a fixed reward/time assumption. Ember should show source, units and date beside every assumption and avoid “real profit” language. It also routes into commercial hardware results; Ember can remain neutral. |
| [HiddenSwap Monero calculator](https://hiddenswap.com/monero-mining-calculator) | Offers multiple setup/pool scenarios and day/week/month/year figures, explains reward and payout variability, and describes how its network data are sourced. | It connects calculator intent with swapping and financial product flows. Ember can focus on transparent math, electricity measurement and a clean privacy boundary without exchange or wallet calls to action. |

Search output also surfaced live calculator pages with break-even tariff and payout estimates. These features can be useful, but they depend on fresh and attributable sources. A manual-input tool is deliberately differentiated by reproducibility, no external requests and clear “assumption, not forecast” framing; it should not suggest that manual inputs are inherently more accurate.

## Proposed page metadata and URL

- **Canonical:** `/tools/monero-mining-profitability-calculator/`
- **Page title:** `Monero Mining Profitability Calculator — Ember`
- **Meta description:** `Estimate expected XMR rewards, pool-adjusted revenue, electricity cost and operating balance from your own hashrate and manual network and price assumptions.`
- **H1:** `Monero Mining Profitability Calculator`
- **Primary query theme:** Monero mining calculator / XMR mining profitability calculator.
- **Supporting language:** XMR expected rewards, mining electricity cost, CPU hashrate, mining power consumption, break-even electricity price, Monero difficulty and network hashrate. Use only where it helps explain the actual inputs and method.

This follows the existing Astro site’s clean route, one-intent page, title/description, canonical URL, static sitemap and social metadata conventions. Exact wording should be tested in the final page’s actual snippet; meta descriptions are a proposal, not a promise that Google will display them.

## Content hierarchy

1. Short lead that names the estimate and says it uses manually entered assumptions, not live market data.
2. Compact assumption/data status: all inputs are user-supplied; show units and currency; no freshness badge pretending to be live.
3. **Your mining setup** form: hashrate, whole-system measured watts, mining hours/day, electricity tariff.
4. **Network and reward assumptions**: choose difficulty or network hashrate, enter expected full block reward, XMR price, pool-fee percentage and display currency.
5. **Estimated results**: XMR before/after fee; gross value; pool-fee value; energy and electricity expense; operating balance; break-even tariff. Offer day, fixed 30-day and fixed 365-day horizons.
6. **How to read the estimate**: expected-value versus realized-payout distinction, pool-only scope, constant-input horizon and excluded costs.
7. **Method and definitions**: equations, units, difficulty/hashrate conversion and reward provenance, with links to authoritative sources.
8. Related education and tools; do not append generic crypto FAQs or padded topic copy.

## Internal linking

- Add a card on `/tools/` only when the working calculator launches; distinguish it from the existing available electricity calculator and the currently planned “CPU mining scenario” concept.
- On the electricity-cost page, add a contextual link to profitability results after the new tool can accurately use the same whole-system measurement and tariff.
- Link to `/learn/randomx-memory-cache/` and `/learn/xmrig-cpu-threads/` where hashrate variability and CPU configuration are explained.
- Link to `/troubleshoot/xmrig-low-hashrate/` for measured-hashrate caveats, and `/guides/xmrig-windows-setup/` for practical standalone XMRig setup context.
- Keep current page-to-page anchors useful to readers. Avoid repeated exact-match link text in every article or changing existing canonical routes.

## Structured data

Use the existing canonical/title/description metadata and static page content; **no extra schema is recommended initially**. A calculator is not an offer for a desktop app. Google’s `SoftwareApplication` rich-result guidance requires an offer plus review or aggregate rating, which this project does not have and must not fabricate. Google also does not guarantee a rich result just because markup validates. See [Software app structured data](https://developers.google.com/search/docs/appearance/structured-data/software-app) and [general structured-data guidance](https://developers.google.com/search/docs/appearance/structured-data/sd-policies), checked 9 October 2026. Do not add fake reviews, ratings, FAQ markup or software prices. An `Article` type belongs on a real authored guide, not the calculator form; the site already uses source-supported article metadata where appropriate.

## Future guide opportunities

Prioritize only after the calculator’s formula and claims are stable:

1. **Difficulty and network hashrate, in plain language.** Explain that difficulty is expected work per block while network hashrate is work per second, and why a target block interval is needed to convert between them. Include units and a sourced, worked example rather than live figures.
2. **Expected XMR versus a pool payout.** Explain solo variance, pool share methods, fees, payout thresholds, stale shares and why short windows differ from an expected average. Keep pool documentation date-stamped.
3. **Measure a mining PC’s wall power.** Explain CPU package versus whole-system watts, workload state, meter limitations, and the existing electricity calculator’s fixed tariff/runtime assumptions.
4. **Block reward, tail emission and transaction fees.** Distinguish emission from fees, note reward penalties and explain why a selected historical/assumed value is not a live constant.

These fill specific explanatory gaps found during this audit. Do not publish the pages in M10A or create thin pages before sourcing, editorial review and genuine reader value are established.

## Claims to avoid

- “Guaranteed,” “real,” “accurate future,” “passive income,” or unqualified “profit.”
- “Current/live” unless the field genuinely comes from a named source with observation time and visible stale/failure behavior.
- A single CPU hashrate, wattage, pool fee, block reward, XMR price or profitability conclusion framed as typical for all miners.
- Equating CPU package watts with whole-system bill impact.
- Calling a fixed 30-day multiplier a calendar month; conflating difficulty and H/s; showing expected fractions as promised payouts.
- Claims that mining is profitable, endorsed by Monero/XMRig, or integrated with Ember’s desktop application.
- Search-volume, rank, conversion or traffic promises without measured evidence.

## Prioritized organic growth opportunities

| Priority | Opportunity | Evidence / measure |
| --- | --- | --- |
| P1 | Ship a genuinely useful, transparent calculator with accessible blank assumptions, validated math, negative results and a visible method | Functional QA, accessibility review, page indexing and Search Console impressions/queries after publication |
| P1 | Connect it to the existing electricity, hashrate/troubleshooting and setup content where the next step is natural | Internal-link crawl and reader task completion; avoid exact-match-link repetition |
| P2 | Publish the difficulty/hashrate and realized-payout guides when technically reviewed | Search Console query patterns and support/questions that indicate real demand; no invented volume targets |
| P2 | Add source/date/freshness behavior only if a live-data version is separately justified | API uptime, stale/error states, citation quality, privacy and maintenance cost |
| P3 | Consider a reproducible public worked example after independent calculation review | Peer review and test vectors; label hypothetical values and never imply current economics |

## Research references and caveats

Monero technical facts and reward notes in this milestone are grounded in the [official Monero technical specification](https://docs.getmonero.org/technical-specs/), [tail-emission reference](https://www.getmonero.org/resources/moneropedia/tail-emission.html), [mining-mode guide](https://docs.getmonero.org/interacting/mining/) and [P2Pool implementation documentation](https://github.com/SChernykh/p2pool). Competitor observations link to the pages as reviewed on 9 October 2026. Search queries were qualitative; no keyword-volume service, Search Console property or deployed site analytics were consulted. The site strategy says `SITE_URL` falls back to `https://example.com`; no production origin was treated as confirmed for this planning task.

## Bounded M10B proposal

M10B should implement only the reviewed economics-tool increment:

1. Repair the two confirmed electricity-tool defects from `m10a-electricity-calculator-audit.md`: enforce the stated 1-day minimum and fix the results section’s missing accessible-name target. Add focused regression checks; avoid a rewrite.
2. Add `/tools/monero-mining-profitability-calculator/` as a static Astro page with blank manual assumptions, one pure tested calculation module and one small route-only client script. Keep it local-only with no external API, storage, desktop-code imports, new dependencies or articles.
3. Implement difficulty **or** network-hashrate input using one documented target-time constant and test their equivalence. Use an editable full-reward-per-block assumption; no fabricated live defaults.
4. Display expected XMR before/after fee, gross revenue, fee value, electricity expense, operating balance and break-even tariff for day/30/365 days. Make loss and zero-energy cases explicit.
5. Link from the Tools hub and existing electricity page only after the route works. Include concise limitations, units, source notes and relevant existing education links.
6. Complete pure math tests, UI validation/accessibility checks, static build/link checks and rendered responsive QA before expanding content or considering any opt-in data source.

This proposal excludes live APIs, solo/P2Pool simulation, hardware ROI/depreciation/tax, presets/benchmarks, account features, new educational articles and changes to the desktop application.
