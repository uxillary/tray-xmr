# M13E — Mining efficiency comparison

25 November 2026. **B06 implemented locally; ready for owner visual acceptance.** Scope is `website/` only. No commit, push, deployment, promotion or mining experiment.

## Verified preview and review captures

[Open the comparison](http://127.0.0.1:4375/tools/mining-efficiency-calculator/). The owned loopback Astro preview serves this checkout's built `dist`, with all **21** published HTML responses matched by SHA-256 to disk. All 20 existing routes remain. [Build identities and browser evidence](evidence/m13e/browser-acceptance.json) record the browser version and results. This is a local review URL, not a public production origin; it depends on the preview process remaining available.

To restart from `website/`, set `SITE_URL=https://ember-m12b0-audit.invalid` and `SITE_INDEXING=noindex`, run `npm run build`, then `npm run preview -- --host 127.0.0.1 --port 4375 --strictPort`. A restricted loopback listener was replaced with an authorized host-context listener; no firewall, security-policy or public-binding change was made.

| Capture | Evidence |
| --- | --- |
| Desktop, blank measurements, 1440 × 900 | [Blank workspace](evidence/m13e/desktop-blank.png) |
| Desktop, completed example, 1440 × 900 | [Comparison](evidence/m13e/desktop-comparison.png) |
| Mobile inputs, 390 × 844 | [Input sequence](evidence/m13e/mobile-inputs.png) |
| Mobile results, 390 × 844 | [Completed comparison](evidence/m13e/mobile-comparison.png) |
| Invalid tariff; efficiency and energy retained | [Invalid input](evidence/m13e/invalid-input.png) |
| Corrected tariff/runtime and EUR display | [Recovery](evidence/m13e/invalid-input-recovery.png) |
| Electricity table and deterministic interpretation | [Reading the comparison](evidence/m13e/comparison-interpretation.png) |
| JavaScript disabled | [Static fallback and methods](evidence/m13e/no-javascript.png) |

Additional result captures cover [1280](evidence/m13e/comparison-1280.png), [1024](evidence/m13e/comparison-1024.png), [768](evidence/m13e/comparison-768.png), [600](evidence/m13e/comparison-600.png), [360](evidence/m13e/comparison-360.png) and [320](evidence/m13e/comparison-320.png) CSS pixels. Screenshots show bounded viewport views, rather than full-page or physical-device acceptance.

## Baseline, architecture and scope

The starting working tree was clean. Verified the reported baseline: **52 passing tests and 20 published routes**, three interactive tools and 15 diagnostic-reference entries. Reviewed the eight requested M13A–D documents, calculator/controller/tests, numeric parser/formatters, layout/tokens, M13C measurement guide and comparable-run worksheet. The M13B proposal left the integration-versus-route decision open; the authorized M13E comparison-first workflow now owns one distinct Tools route, without crowding the existing cost-only calculator.

- `src/lib/mining-efficiency.mjs` isolates normalization, validation, efficiency/energy/cost/delta arithmetic, interpretation and display helpers. It reuses the existing `parseNumber` and `formatCost` exports without changing them.
- The Astro route renders the instrument, all educational content, formulas, limits and links statically. Existing SiteLayout supplies canonical, social metadata and safe-default noindex. Existing tools have no application schema; this route follows that convention without inventing offers, ratings or revenue claims.
- `src/scripts/mining-efficiency.js` reads native controls and renders with `textContent`. Names are optional text labels, limited to 60 characters, and cannot inject markup. There is no fetch, URL state, storage, account, backend, analytics or live data. No dependency was added.
- The route-specific CSS creates paired input columns beside efficiency results, followed by a compact cost table and interpretation. At tablet widths the input/result sequence stacks; the narrowest inputs stack A then B. No chart framework or animation is needed.
- The Tools hub lists four available tools. Contextual links were added to the electricity calculator, shared whole-PC measurement component, profitability calculator, low-hashrate comparison passage and CPU threads explanation. The existing models, decoder parser, top-level navigation and original article passages remain intact.

## Mathematical model and validation contract

Normalize kH/s by multiplying by 1,000. For each configuration:

```text
efficiency = hashrateHs / wallPowerW                 hashes/joule
dailyEnergyKWh = wallPowerW / 1000 × hoursPerDay
periodElectricityCost = dailyEnergyKWh × tariff × days
```

Periods are **1, 30 and 365 days**, not a calendar month/year forecast. B-relative-to-A changes are `(B / A − 1) × 100` for hashrate, watts and efficiency; signed absolute differences are **B − A**, including daily energy and each electricity-cost period. Negative cost difference means B costs less. Zero tariff and zero runtime remain valid; runtime zero means no projected energy/cost while the measured efficiency ratio is retained.

All arithmetic uses full internal floating-point precision, with no pre-comparison rounding. Ordinary numeric readouts use up to two decimals. Small non-zero values retain significant digits, with scientific notation at extremes; negative zero is normalized. Costs retain the existing currency formatter's handling of tiny non-zero values. Arithmetic equality in interpretation uses an absolute percentage tolerance below `1e-10` to avoid floating-point noise; it is not an experimental confidence interval.

| Input | Contract |
| --- | --- |
| Sustained hashrate | Positive finite **0.000001–1,000,000,000,000 H/s**, after normalization; H/s or kH/s only |
| Average total wall power | Positive finite **0.000001–1,000,000,000 W** |
| Tariff | Finite **0–1,000 currency units/kWh**; pounds/dollars/euros, not pence/cents |
| Runtime | Finite **0–24 hours/day**, fractional hours allowed |
| Currency | **GBP, USD or EUR**; label change retains numeric tariff, with a visible no-conversion reminder |
| Numeric entry | Existing decimal/group separator parser; blanks, malformed strings, non-finite and out-of-range values rejected. Strings over 80 characters rejected before parsing |

The broad positive measurement floors/ceilings keep denominators and projections finite without limiting plausible PC or aggregated measurements. They are arithmetic safeguards, not hardware specifications. No hardware selector or benchmark dataset is used.

Configuration validity, energy validity and cost validity are separated. Invalid/missing measurements remove their readouts and the dependent A/B comparison immediately; old comparisons never remain valid. Invalid tariff/currency suppresses costs while preserving efficiency and energy. Invalid runtime suppresses energy and costs while preserving efficiency. Blank inputs do not produce an error list on arrival; errors become visible for touched fields. Example loading clears old errors and labels its inputs hypothetical; reset restores blank measurements/tariff, H/s, GBP and 24 hours with no persistence.

## Independent example verification

The explicit example is invented arithmetic, not a measured CPU profile.

| Quantity | A | B | B relative to A |
| --- | ---: | ---: | ---: |
| Sustained hashrate | 8,500 H/s | 7,900 H/s | −600 H/s; −7.0588235% |
| Whole-PC watts | 145 W | 105 W | −40 W; −27.5862069% |
| Efficiency | 58.6206897 hashes/J | 75.2380952 hashes/J | +28.3473389% |
| Daily energy, 24 h/day | 3.48 kWh | 2.52 kWh | −0.96 kWh |
| Daily cost, GBP 0.25/kWh | £0.87 | £0.63 | −£0.24 |
| 30-day electricity cost | £26.10 | £18.90 | −£7.20 |
| 365-day electricity cost | £317.55 | £229.95 | −£87.60 |

Tests compare independently supplied expected values with floating-point tolerances. UI readouts agree: 58.62 and 75.24 hashes/J, +28.35% efficiency, −7.06% throughput and −27.59% power. The lower-throughput B is more efficient under these assumptions; this does not establish profitability or a universally preferable configuration.

## Measurement and visual decisions

Use the same algorithm variant, comparable workload/version, matching observation intervals and system boundaries, stable operating conditions and sustained rather than peak hashrate. Total whole-PC AC wall power includes power-supply losses and the rest of the PC. CPU package power/TDP cannot replace it. The tool does not subtract idle consumption or compare incremental power. Repeated-run variation, meter resolution/accuracy and uncertain conditions can make a numerical difference inconclusive.

Static links lead to the existing electricity measurement workflow, low-hashrate worksheet, CPU threads and RandomX memory/cache explanations. Revenue assumptions belong in the separate profitability calculator; supported log signals belong in the unchanged decoder. No educational article was duplicated beneath the new calculator.

Graphite surfaces, warm orange emphasis, tabular monospace readouts and minimal dividers make the comparison legible without nested dashboard cards. A/B letters, names and numbers identify each bar without relying on color. Bars share a true zero baseline and use `value / max(A, B)`; there is no minimum visible length or magnification. Their text equivalents expose hashes/J and B-relative-to-A percentages. A browser geometric check independently verifies the example's bar proportions.

Interpretation is deterministic and covers identical measurements, higher/lower throughput with higher/lower efficiency, equal power, equal hashrate, zero cost and the associated expenditure/throughput trade-off. It does not recommend selecting a configuration. Local result changes are announced after blur/change or explicit example/reset actions, debounced by 450 ms; typing does not announce every keystroke. Native controls, described errors and an accessible table region support keyboard use.

## Verification and acceptance limits

| Check | Observed result |
| --- | --- |
| `npm test` | **61 passed**: original 52 plus nine focused efficiency tests covering units, all periods/deltas, identical/zero values, missing/invalid/extreme inputs, rounding/currency, partial validity and interpretation cases |
| `npm run check` | **0 errors, warnings or hints** |
| `npm run build` | **21 published pages**; original 20 retained |
| `npm run check:links` | Passed; unique metadata, discovery, local paths/fragments, all ten article contents and sitemap parity |
| `npm run verify:production-origin` | Passed against the explicit synthetic HTTPS origin with noindex HTML and `_headers`, correct canonical/social/sitemap/robots and protected 404 |
| `git diff --check` | Passed |
| Browser identity | All **21** served HTML documents SHA-256 matched to current build |
| Responsive geometry | **48 cases**: new comparison, Tools hub, electricity, profitability, low-hashrate and CPU threads at 1440/1280/1024/768/600/390/360/320; no document horizontal overflow, exactly one H1 throughout |
| Interaction | Blank state, touched validation, example, both configurations, units, optional-name injection resistance, tariff, all currencies, runtime, partial validity, zero assumptions, recovery and reset checked against the actual built controller |
| Keyboard/accessibility | Real CDP Tab/Enter/ArrowRight events: input order, 2px visible focus, example activation and local table scrolling. Numeric bar equivalents/table labels present in Chromium accessibility tree. Debounced announcements and measurement anchors checked |
| Text contrast | **39 computed opaque foreground/background/font groups**; minimum **7.055:1**, all above applicable 4.5:1/3:1 thresholds |
| Rendering modes/privacy | Reduced-motion instrument has no animations. JavaScript-disabled fallback, formulas and methods visible; interactive workspace hidden. No runtime exceptions or external page requests observed |

Reproduce browser acceptance using the already installed browser, without a new dependency:

```powershell
node scripts/verify-mining-efficiency.mjs 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe' 'http://127.0.0.1:4375/'
```

These are headless **Edge 158.0.4370.33 / Chromium** observations with CSS viewport resizing, not native zoom/text scaling, an actual screen-reader session, Firefox/Safari, physical phone input/orientation or specialist accessibility certification. Accessibility-tree inspection does not close screen-reader acceptance. Hosting headers, real public origin, public indexing and field performance remain unverified. Safe-default noindex and existing origin validation are preserved; only the verifier's expected route count increased from 20 to 21.

During QA a broad label selector initially capped the bar fill widths. It was narrowed to the readout labels, then proportions were rechecked. The static-content verifier now explicitly permits the new module route and requires its methodology/privacy/no-JavaScript text, retaining the existing 12 KB module budget. Browser-harness fixes handled native Enter key text and same-document fragment navigation; those were harness issues, not product controls.

## Performance observations

[Before](evidence/m13e/performance-before.json) and [after](evidence/m13e/performance-after.json) record **12 + 18 local navigations** using the existing M13A CDP harness, temporarily selecting Tools/electricity and then adding the new comparison route. Each route/profile has three fresh contexts, disabled cache and a five-second post-load observation window. Desktop: 1440 × 900, unthrottled. Mobile lab: 390 × 844, 4× CPU slowdown, 150 ms latency, 204,800 B/s download and 98,304 B/s upload. All measured document hashes match their respective builds.

| Route | Desktop median LCP, before → after | Mobile-lab median LCP, before → after | Transfer bytes, before → after |
| --- | ---: | ---: | ---: |
| Tools hub | 120 → 196 ms | 852 → 880 ms | 15,304 → 15,755 |
| Electricity calculator | 172 → 168 ms | 992 → 992 ms | 27,568 → 27,677 |
| New efficiency comparison | 172 ms (new) | 1,060 ms (new) | 24,006 (six requests) |

New-route LCP ranges: desktop **152–264 ms**, mobile lab **1,020–1,136 ms**. Observed CLS was **0** on the new route and Tools in every sample. Electricity retained its small desktop CLS of **0.0000937622**, with mobile samples 0. New-route median main-thread task duration over the observation window was **139.4 ms desktop / 800.9 ms mobile lab**; script duration **2.57 / 14.24 ms**.

New HTML is **15,816 bytes** (4,867 locally gzipped); route CSS **8,202 bytes** (1,919 gzipped); tool module **7,282 bytes** (2,927 gzipped), plus the existing shared stylesheet/formatter chunk and favicon. The tool module remains below the existing 12,000-byte budget. Tools adds 2,502 decoded HTML bytes and 451 transfer bytes for its available card; electricity adds 440 decoded HTML bytes and 109 transfer bytes for contextual links. Neither existing route adds requests.

Transfer totals include preview response overhead, unlike local gzip sizes. Browser/process/OS warm-up and other local QA activity can affect timings; first-run outliers are retained. These small samples do not prove a causal performance change. They are laboratory observations, **not field Core Web Vitals, INP, Lighthouse scores or production CDN performance**. No performance rewrite was justified.

## Exact changed files

The inventory below includes this report and all retained evidence, and excludes ignored build output, restored generated Astro metadata and removed temporary audit files.

- `website/docs/content-roadmap.md`
- `website/docs/evidence/m13e/browser-acceptance.json`
- `website/docs/evidence/m13e/comparison-1024.png`
- `website/docs/evidence/m13e/comparison-1280.png`
- `website/docs/evidence/m13e/comparison-320.png`
- `website/docs/evidence/m13e/comparison-360.png`
- `website/docs/evidence/m13e/comparison-600.png`
- `website/docs/evidence/m13e/comparison-768.png`
- `website/docs/evidence/m13e/comparison-interpretation.png`
- `website/docs/evidence/m13e/desktop-blank.png`
- `website/docs/evidence/m13e/desktop-comparison.png`
- `website/docs/evidence/m13e/invalid-input-recovery.png`
- `website/docs/evidence/m13e/invalid-input.png`
- `website/docs/evidence/m13e/mobile-comparison.png`
- `website/docs/evidence/m13e/mobile-inputs.png`
- `website/docs/evidence/m13e/no-javascript.png`
- `website/docs/evidence/m13e/performance-after.json`
- `website/docs/evidence/m13e/performance-before.json`
- `website/docs/m13b-content-growth-roadmap.md`
- `website/docs/m13e-mining-efficiency-comparison.md`
- `website/scripts/verify-content.mjs`
- `website/scripts/verify-mining-efficiency.mjs`
- `website/scripts/verify-production-origin.mjs`
- `website/src/components/PowerMeasurement.astro`
- `website/src/content/articles/xmrig-cpu-threads.md`
- `website/src/content/articles/xmrig-low-hashrate.md`
- `website/src/lib/mining-efficiency.mjs`
- `website/src/pages/sitemap.xml.ts`
- `website/src/pages/tools/electricity-cost-calculator.astro`
- `website/src/pages/tools/index.astro`
- `website/src/pages/tools/mining-efficiency-calculator.astro`
- `website/src/pages/tools/monero-mining-profitability-calculator.astro`
- `website/src/scripts/mining-efficiency.js`
- `website/src/styles/mining-efficiency.css`
- `website/tests/mining-efficiency.test.mjs`

## Remaining owner actions and deferred observations

1. Review the preview and desktop/mobile captures for final visual acceptance. B06 is implemented; owner acceptance remains pending.
2. Complete or explicitly accept the inherited specialist accessibility gates: native zoom/text scaling, actual screen-reader use, other browser engines and physical devices.
3. Confirm the real public production origin and separately authorize deployment when ready; rebuild and verify live hosting/indexing before Search Console onboarding. No production deployment occurred here.

Record for later targeted refinement only: long visible article headings, muted secondary text, diagnostic-reference navigation and M13D's magnified relative-hashrate illustration. This milestone does not redesign those resources. The new efficiency bars are proportional.

B07 filtering, B12 reward controls, benchmark ingestion, configuration generation, hardware experiments, incremental-power modes, live data and profitability model changes remain outside scope.
