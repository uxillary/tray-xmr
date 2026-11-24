# M13A — Organic growth and M13B research framework

24 November 2026. This is a measurement/research plan, not external keyword research or content production. No traffic forecast, query-volume estimate, ranking difficulty, search-console access or public launch date is asserted.

## Recommendation and privacy boundary

Start with **no client analytics**. Use owner-verified Google Search Console and optional Bing Webmaster Tools for search discovery, plus hosting operational metrics for delivery/failures. Revisit aggregate traffic measurement only if a specific question cannot be answered. No script, cookie, pixel, tracking account, market API or event endpoint was added.

The source/output has no analytics or external client script: the only functional JavaScript is the three local tool modules. Calculator values and pasted logs are processed locally; no upload, browser-storage persistence or URL-state change was introduced. This promise concerns tool input processing. A future host still receives ordinary HTTP requests and may retain IP/URL/referrer/access logs; “local processing” is not a claim that hosting never processes personal data. Never send raw logs, wallet/pool identifiers or calculator inputs to a measurement service.

| Consideration | No client analytics (recommended initially) | Optional Cloudflare Web Analytics |
| --- | --- | --- |
| Collection | Search consoles' aggregate search reporting and host operational requests; no new client collection | A client beacon supplies page/visitor and performance measurements; audit collected dimensions/payload before adoption |
| Privacy | Fewer third-party browser requests; host and console access/retention still require review | Cloudflare describes no cross-site user tracking and privacy-first collection; this does not itself establish Ember's UK compliance |
| Script cost | Zero additional client JavaScript or beacon requests | Additional script, execution and outgoing beacon requests; measure actual bytes/overhead if enabled, rather than inventing a size |
| What it answers | Search queries, impressions, clicks, canonical landing pages, indexing problems; delivery errors from host | Broader aggregate page discovery/referrers and real-user performance beyond search clicks |
| What it does not answer | All traffic, tool completion, engagement, cross-page journeys or conversions | No automatic proof that a user completed a calculator/decoder task; custom events would need a separate privacy/scope decision |
| Maintenance | Verify property access and retain comparable exports; review host metrics availability/retention | Vendor configuration, payload/privacy review, retention and regional settings, notices/objection or consent as applicable, plus regression checks |

Cloudflare documents a JavaScript Performance API beacon and its reporting endpoints. “Cookie-free” must not be equated automatically with “no device access” or “no privacy obligation.” The deployed host can inject a beacon even when repository source contains none; keep Pages Web Analytics/automatic injection disabled and inspect the live page/network after launch. [Web Analytics overview](https://developers.cloudflare.com/web-analytics/about/), [data collection](https://developers.cloudflare.com/web-analytics/data-metrics/data-origin-and-collection/), [automatic injection](https://developers.cloudflare.com/web-analytics/faq/).

UK assessment must use current PECR/UK GDPR rules and the actual implementation. The ICO's final guidance now describes a **statistical purposes exception** with conditions, including sole-purpose service improvement, clear information, a simple free means to object, limits on third-party use and necessary processing. It is not blanket permission for any product labelled analytics; personal-data processing still requires its own assessment. If conditions are not met, determine applicable consent requirements before collection. No compliance conclusion or automatic exemption for Cloudflare is asserted here. [ICO current exceptions guidance, checked 24 November 2026](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-the-exceptions/).

## Measurement register

All **public baselines are unavailable**, rather than invented zeros. Only the local inventory of 17 published routes and the separate laboratory performance baseline are known.

| Metric / question | Direct source once verified | Baseline / limitations and additional instrumentation |
| --- | --- | --- |
| Indexed published pages | GSC Page indexing, sitemap view and representative URL Inspection; Bing separately | Unavailable. Desired denominator is 17 canonicals. Distinguish unknown/discovered/crawled/indexed; reports have delays and incomplete example lists. Exclude preview/draft/404 URLs. |
| Search impressions | GSC Search results; Bing search performance separately | Unavailable. Save full date/filter context; do not combine engines as one comparable exposure metric. |
| Organic search clicks | Same reports | Unavailable. Search clicks are not all-site sessions/visitors or proof of a completed task. |
| CTR | Clicks ÷ impressions for the same scope/window | Unavailable; undefined if no impressions. Small counts and changing query/device mix can dominate. Aggregate from counts, not an average of row CTRs. |
| Queries / reader needs | GSC query export and Bing keywords | Unavailable. Anonymized/omitted queries and low sample size limit completeness; query observations are not keyword volumes. |
| Landing-page performance | Page-filtered console impressions/clicks/CTR and query breakdown | Unavailable. Use canonical URLs; group Learn, Guides, Troubleshoot and Tools without hiding page-level failures. |
| Tool discovery | `/tools/` and each of the three tool URLs in console page/query exports | Unavailable. Measures search entry only. Main-content tool links exist locally; their actual click-through/completion requires separate instrumentation or task testing. |
| Relevant referring domains | GSC Links/Bing backlink reports plus manual review of linking page context | Unavailable. Samples are incomplete/delayed; deduplicate domains, record relevant destination and editorial context. No exhaustive backlink count or authority-score claim. |
| Technical indexing issues | GSC Page indexing/sitemap/inspection; host errors and local verifiers | Live baseline unavailable. Local 17-route checks pass. Record reason, affected canonical, discovery date, fix and live recheck evidence. |
| Broad traffic / non-search discovery | Hosting aggregate metrics if available; optional aggregate analytics later | Unavailable. Edge requests include bots/assets/cache effects and are not human visits; provider/plan capabilities must be checked. |
| User outcomes / tool completion | Bounded task-based user testing; later explicitly approved aggregate events if needed | Unavailable and not measured by console clicks. No event instrumentation is implemented. Never collect tool inputs/logs. |
| Real-user CWV | Search Console/CrUX when sufficient data exists; optional future approved RUM | Unavailable. Local LCP/CLS/CDP observations cannot supply field INP. |

Maintain dated exports in an owner-controlled location with property, interval, timezone, filters, source freshness and extraction date. Retain the original counts and note missing data. Record deploys/metadata edits alongside the timeline to interpret changes, without asserting causation. Separate branded product discovery from non-brand resource tasks. Diagnose indexing/delivery before expanding content. Console report definitions: [Google search performance](https://support.google.com/webmasters/answer/7576553).

## Review schedule anchored to verified public deployment

**Day 0 is not set.** It begins when the intended production site is publicly deployed, its canonical origin and live indexing configuration have been verified, and the owner records that evidence. Derive actual calendar dates from that event; none can be assigned now.

| Review | Work and decision |
| --- | --- |
| Day 0 | Record origin/deployment/source SHA, 17 desired URLs, TLS/redirect/status/header checks, accepted accessibility gaps, property verification, sitemap submission and initial inspections. Set unavailable reporting fields explicitly. |
| First week | Confirm sitemap fetch and obvious deployment errors; inspect representative resource/tool URLs. Do not repeatedly request indexing or interpret missing data as failure. |
| Day 30 | Export the first available period and indexed-page evidence. Review query/page/device mix, tool discovery and technical exclusions. If data is insufficient, document that limit and prioritize crawl/access correctness. Do not claim growth from a partial first month. |
| Day 60 | Compare days 31–60 with days 1–30 where processed data is comparable; document partial windows/filter differences. Identify real reader questions, meaningful referring contexts and metadata mismatches. Prefer a focused improvement to an existing page when it answers the observed need. |
| Day 90 | Compare consistent windows and the full trend, revisit index coverage/landing pages/tool discovery and available field performance. Review maintenance load/privacy needs. Decide which M13B hypotheses have enough evidence for later editorial work; do not create articles automatically. |

No numeric traffic targets or speculative projections are assigned. Success for this foundation is trustworthy crawl/configuration evidence and a repeatable record, not an invented minimum number of clicks.

## Preliminary M13B research scope

The mapping below is based on current published content and M11A/M12A planning, **not newly conducted demand research**. Existing source-bound calculation and parser behavior is fixed for this milestone. M13B must recheck official technical sources and actual external evidence when separately authorized.

| Cluster / topic | Existing supporting routes | Gap or candidate research question |
| --- | --- | --- |
| Performance: RandomX | `/learn/randomx-memory-cache/`; `/troubleshoot/xmrig-low-hashrate/` | Is a beginner RandomX explanation distinct from the current memory-layer article, or would a clearer existing opening suffice? |
| Performance: CPU threads | `/learn/xmrig-cpu-threads/`; low-hashrate checklist | Which observed queries confuse logical processors, chosen workers and sustained throughput? Is a reproducible comparison example needed? |
| Performance: CPU cache | `/learn/randomx-memory-cache/`; CPU threads | Which questions remain about dataset RAM, RandomX cache, L3/cache-per-thread and NUMA? Avoid duplicating the existing article. |
| Performance: Huge Pages | `/troubleshoot/xmrig-huge-pages/`; `/tools/xmrig-log-decoder/`; Windows setup | Do readers still confuse privilege granted with actual allocation, partial allocation or unrelated low hashrate? Research exact signal/version context. |
| Performance: MSR | `/troubleshoot/xmrig-msr-error/`; decoder | Which exact error contexts remain unanswered while keeping security/firmware changes conservative? Parser expansion is not implied. |
| Performance: hashrate troubleshooting | `/troubleshoot/xmrig-low-hashrate/`; cache/threads/Huge Pages/MSR | What queries require a stable comparison method rather than a hardware-specific H/s promise? No benchmark dataset exists. |
| Economics: electricity consumption | `/tools/electricity-cost-calculator/`; low-hashrate page | Do readers need clearer units/runtime/tariff explanations or a distinct sourced concept resource? |
| Economics: mining profitability | `/tools/monero-mining-profitability-calculator/` | Which manual assumptions cause confusion: difficulty/network rate, reward, fee, XMR price, expected value versus actual payout? Preserve the existing model. |
| Economics: wall power | Electricity calculator `#power-note-title`; profitability input guidance | Is a measured whole-PC workflow useful beyond the current static guidance? Require real equipment/method evidence, not generated power data. |
| Economics: break-even tariffs | Profitability calculator already reports break-even tariff | Does an actual query expose a gap that needs explanation, rather than another calculator/page? Distinguish electricity-only balance from total ownership cost. |
| Economics: efficiency | Existing tools plus CPU-thread/low-hashrate explanations | Are H/s-per-watt and noise/thermal trade-offs a distinct need? Any comparison needs attributable measurements, repeatable conditions and limitations. |
| Setup: Windows XMRig | `/guides/xmrig-windows-setup/`; `/guides/` | Which first-session steps cause verified confusion? Recheck version-sensitive upstream instructions; do not imply Ember availability. |
| Setup: security warnings | `/guides/xmrig-windows-security-warnings/`; setup guide; `/trust/` | Which warning/source-verification questions remain? Preserve stop/verify boundaries and protection settings. |
| Diagnostics: log interpretation | `/tools/xmrig-log-decoder/`; three troubleshooting articles | Are supported/unknown signals and limited excerpt scope understood? Research documentation needs independently of recognition-rule changes. |
| Diagnostics: pool connectivity | Setup guide, decoder's existing bounded pool signals, planned Troubleshoot card | No dedicated published connection guide. Which endpoint/DNS/port/TLS/authentication symptoms justify a distinct safe checklist? Separate failed connection, rejected share and payout policy. |
| Diagnostics: configuration | Setup, threads, cache and three troubleshooting articles | Are recurring wallet/pool/unit/config-file questions covered at point of need? Do not request or publish identifying logs. |

For each M13B candidate, record: exact reader question and audience; current route/section coverage; dated external search sample with engine/context; community question as an anecdote rather than prevalence; official technical corroboration; any actual console/support evidence and its limits; competing primary/secondary resources; distinct value and safe scope; internal entry/next links; maintenance/version burden; and whether to improve, consolidate, defer or propose a new resource. Label observation, inference and hypothesis separately. No fabricated volume, difficulty, ranking or traffic potential.

Research priority is to validate the existing three clusters and tool-support journeys before proposing gaps for publication. M13B research, article drafting, new routes/tools and promotion remain unstarted.
