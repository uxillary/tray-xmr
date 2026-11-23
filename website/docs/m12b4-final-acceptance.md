# M12B.4 — Final website acceptance

Reviewed 22–23 November 2026. Scope: `website/` only.

**Implementation and available browser checks: PASS. Production acceptance: OWNER ACTION REQUIRED.** Two confirmed defects were fixed. Real browser zoom, native assistive technology, independent engines and physical-device acceptance remain open. This report does not assert complete WCAG compliance or authorize deployment.

## Baseline and build identity

- Branch: `main`; HEAD: `5a95fa3e0a11ba6c87744f76664997ca6f70763a`.
- Starting working tree: clean. M12B.1–M12B.3 were already committed at inspection; no assumption or reset was needed.
- Starting source SHA-256: `d1c9d903c10d18f38a88199ea3dda2820043ebbe74430a4c72c86d6a1fdf7dab`.
- Accepted source SHA-256: `1347e3b968a861951eca7d4a5341376af6606865864829380ae434bdef7afe1f`.
- Accepted output SHA-256: `ef5cf64fe0f76f4a562a874e4daf8dffc7357ea53ce32314dfc46305ca09a5ad`.
- Host-execution Astro preview: `http://127.0.0.1:4354/`, strict loopback binding. All **31/31 output files**, including 17 HTML routes, independently fetched with HTTP 200 and matching byte hashes. The final rebuild produced the identical accepted hashes.
- Browser observed current `/_astro/SiteLayout.u5IyGVAB.css`; article CSS `/_astro/ArticleLayout.BG7Gkfwk.css`. See [build identity](evidence/m12b4/build-identity.json), [HTTP identity](evidence/m12b4/http-identity.json) and [browser identity](evidence/m12b4/browser-identity.json).
- Release-style verification used **`https://ember-m12b0-audit.invalid`**, an explicitly synthetic origin. It is not a production domain or deployment artifact.
- Node 24.21.0; npm 11.19.0; Astro 7.3.5. No dependency changes.

[Preservation evidence](evidence/m12b4/preservation.json) records all 57 build inputs: 55 unchanged, two intended changes. All eight tracked `.astro` files were restored byte-for-byte to their starting state. This run's owned preview metadata was removed. Desktop files, articles, citations, calculator models, parser rules, homepage hero and availability disclosures are unchanged. No branch, commit, push or deployment was made.

## Confirmed findings and targeted fixes

| Finding | Evidence before | Fix and current result |
| --- | --- | --- |
| B4-01: document overflow at a 320 CSS pixel viewport | All 17 routes had root client width 305 but scroll width 320. The vertical scrollbar exposed `body { min-width:320px }`. [Measurements](evidence/m12b4/reflow-before.json); [before image](evidence/m12b4/guides-before-320x800.jpg). | Set body minimum width to zero. All 17 now measure 305/305. The seven requested sizes also pass. This is a reflow fix, not proof of 400% browser zoom. |
| B4-02: article/tool navigation called a parent hub the current page | On Huge Pages, `/troubleshoot/` had `aria-current="page"`. [Before record](evidence/m12b4/navigation-before.json). | Exact routes retain `page`; the active ancestor section uses `location`. Existing active appearance is preserved. Generated-output regression assertions check the main navigation on every route. |

No confirmed contrast failure required a palette change. Graphite surfaces, orange links, type hierarchy, hero, source notes, warning language and diagrams remain intact. The four hubs consistently prioritize published resources; technical pages retain an optional, disclosed product handoff. Article reading width, contents rail/disclosure, form groups, daily result hierarchy, caption treatment and footer align with the existing components. No new visual component or speculative redesign was introduced.

## Measured contrast

**PASS for sampled rendered combinations.** [Raw computed samples](evidence/m12b4/contrast-rendered.json) and [numeric results](evidence/m12b4/contrast-results.json) contain **4,460 sample groups across 63 captures**: 4,223 text, 202 authored boundaries, two radio accent samples and 33 focus samples. These include all 17 routes at desktop/mobile sizes plus 29 additional state/pattern captures. Repeated state samples are not unique colors or independent tests.

Measurements use actual rendered `getComputedStyle` colors, font sizes/weights, ancestor surfaces and the body glow; sRGB linearization, relative luminance and alpha compositing determine ratios. Gradients use a conservative envelope of their rendered color stops: a PASS requires the worst combination to pass. The displayed background below is the worst rounded sRGB value; full precision and the maximum ratio remain in JSON. Exact solid pairs are identified in the data. This is not anti-aliased glyph-pixel sampling or a check of token names alone.

Normal text requires 4.5:1; large text requires 3:1 (24 CSS pixels, or at least 18.67 pixels and bold weight 700). Required authored component indicators use 3:1 against adjacent backgrounds. Offset focus outlines are compared with their surrounding painted background, not the filled element underneath: the skip link has an observed four-pixel outline offset, so its orange fill is not adjacent to its orange outline. [Focus context](evidence/m12b4/focus-boundary-context.json). Native unmodified radio outlines and purely decorative card/table separators are not asserted to require authored boundary contrast. A distinguishable identifying fill can satisfy a button's boundary requirement.

| Rendered sample | Foreground / worst background | Minimum ratio | Criterion / minimum | Status |
| --- | --- | ---: | --- | --- |
| Article body, 17px | `#d8d8d1` / `#1d1c17` | 11.89 | 1.4.3 / 4.5 | PASS |
| Small footer disclaimer, 12px; lowest normal text | `#8e9486` / `#1d1c17` | 5.46 | 1.4.3 / 4.5 | PASS |
| Muted main-navigation label, 13px | `#a1a69a` / `#131411` | 7.42 | 1.4.3 / 4.5 | PASS |
| Article date metadata, 13.6px | `#a1a69a` / `#1d1c17` | 6.84 | 1.4.3 / 4.5 | PASS |
| Projection caption, 14px | `#a1a69a` / `#1a1d17` | 6.85 | 1.4.3 / 4.5 | PASS |
| Orange article link, 17px | `#ffb47e` / `#1d1c17` | 9.80 | 1.4.3 / 4.5 | PASS |
| Calculate button label, 14px | `#111310` / `#ef8a4a` | 7.47 | 1.4.3 / 4.5 | PASS |
| Profitability input label, 15px | `#eeefe9` / `#141612` | 15.75 | 1.4.3 / 4.5 | PASS |
| Profitability price helper, 13px | `#a1a69a` / `#141612` | 7.32 | 1.4.3 / 4.5 | PASS |
| Secondary daily-result label, 15px | `#c3c7bc` / `#1a1d17` | 9.92 | 1.4.3 / 4.5 | PASS |
| Invalid field message, 13px | `#ffad91` / `#141612` | 10.09 | 1.4.3 / 4.5 | PASS |
| Negative / positive synthetic daily balance, 28px | `#ffb47e` / `#1a1d17` | 9.81 | 1.4.3 / 3 | PASS |
| Calculation diagram explanation, 14px | `#a1a69a` / `#11130f` | 7.51 | 1.4.3 / 4.5 | PASS |
| Decoder identifying border; lowest boundary | `#686b61` / `#1b1d19` | 3.13 | 1.4.11 / 3 | PASS |
| Decoder focus outline; lowest sampled focus | `#ef8a4a` / `#1b1d19` | 6.80 | 1.4.11 / 3 | PASS |
| Radio authored accent | `#ef8a4a` / `#141612` | 7.29 | 1.4.11 / 3 | PASS |

Ratios are rounded for presentation, never to decide a threshold. [Reproducible calculation](evidence/m12b4/measure-contrast.mjs) includes four reference-vector assertions; run `node docs/evidence/m12b4/measure-contrast.mjs` from `website/`. Method references: W3C [text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) and [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html). This sampled audit does not cover every native popup, OS color mode, hover state or assistive-technology presentation. AAA Focus Appearance is not being substituted for AA acceptance.

## Responsive matrix

**PASS:** all 17 routes rendered at every requested CSS viewport on the verified current build. [Full 136-record matrix](evidence/m12b4/render-matrix.json). The extra 320px probe is separate from the requested 119 cases.

| Browser-reported CSS viewport | Routes | Root client / scroll width | Sticky header height | Status |
| --- | ---: | --- | ---: | --- |
| 1440 × 900 | 17 | 1425 / 1425 | 79 | PASS |
| 1280 × 800 | 17 | 1265 / 1265 | 79 | PASS |
| 1024 × 768 | 17 | 1009 / 1009 | 79 | PASS |
| 768 × 900 | 17 | 753 / 753 | 117 | PASS |
| 600 × 800 | 17 | 585 / 585 | 117 | PASS |
| 390 × 844 | 17 | 375 / 375 | 116 | PASS |
| 360 × 800 | 17 | 345 / 345 | 116 | PASS |
| 320 × 800, additional reflow probe | 17 | 305 / 305 | 116 | PASS |

The 15px difference is the vertical scrollbar. There is no document-level horizontal overflow, duplicate ID, missing contents target or out-of-bounds footer in these records; every route has one H1. Automatic clipping probes found no unintended text clipping. Eight intentionally hidden “Hours per day preset” labels are explicitly recorded as screen-reader labels, not defects. Closed disclosures intentionally have zero-width hidden contents.

At 320px the header navigation scrolls locally. Tab reached Trust, scrolled the navigation by 35px, kept the link visibly inside the header and activated `/trust/`; root horizontal scroll remained zero. No additional header row or arbitrary anchor offset was added.

Forty screenshots include 34 desktop/mobile route views, the before/after reflow comparison, synthetic tool results and a fragment target. [Screenshot inventory with hashes and CSS dimensions](evidence/m12b4/screenshots.json). Bitmap dimensions can differ from browser CSS dimensions and are not used as viewport proof.

## Anchors, keyboard and scroll regions

**PASS for controlled direct/clicked navigation:** 40 checks—each of seven articles at 1440 and 390, plus Huge Pages at 1280, 1024, 768, 600, 360 and 320. Direct fresh arrivals and clicked contents links were measured after a 1,600ms smooth-scroll settling interval. Target clearances range from **15.58 to 16.45 CSS pixels** below the actual header. [Anchor records](evidence/m12b4/anchors.json).

| Huge Pages viewport | Header bottom | Fresh direct target top | Clearance |
| --- | ---: | ---: | ---: |
| 1280 × 800 | 79 | 95.13 | 16.13 |
| 1024 × 768 | 79 | 95.00 | 16.00 |
| 768 × 900 | 117 | 133.38 | 16.38 |
| 600 × 800 | 117 | 133.27 | 16.27 |
| 360 × 800 | 116 | 132.42 | 16.42 |
| 320 × 800 | 116 | 131.80 | 15.80 |

Six additional exploratory viewport-change/reload records are retained but excluded from those 40. Browser scroll restoration after changing the override produced different positions at 600 and 360 (the latter target was below the viewport). Fresh-document fragment navigation at those sizes passed, as did clicked contents. Actual zoom/orientation with an existing fragment remains an owner check; these restoration probes are not presented as successful direct-arrival tests.

[Keyboard evidence](evidence/m12b4/keyboard.json) contains 340 recorded Tab focus stops, with a visible focus cue on every recorded stop. Nine complete forward traversals reached the footer's GitHub link without activating the external destination: homepage, four hubs, Huge Pages and three tools. Windows setup has a bounded 65-stop traversal through contents, inline/source links, code and related resources; shared footer acceptance comes from the other nine pages. Forward/reverse footer samples and settled representative geometry are recorded. Intermediate positions during rapid Tab sequences are not used as settled visibility measurements.

| Pattern | Actual interaction and finding | Status |
| --- | --- | --- |
| Skip navigation | Tab then Enter focuses `main`; tested at 1440, 390 and 320. Mobile/narrow main top equals header bottom, with visible outline. | PASS |
| Header / hub cards / inline links | Forward Tab order and cues checked; Guides card Enter opens Windows setup; narrow Trust Enter works. | PASS |
| Mobile article contents | Enter expands/collapses native summary; Tab enters its links; Enter focuses the section. Setup keyboard target clearance 15.52px. | PASS |
| Desktop contents rail | Enter reaches and visibly focuses the Huge Pages heading below the header. | PASS |
| Huge Pages diagnostic table | Named region is focusable; Left changes local scroll from 627 to 587px; 333px client / 960px content, root X=0. The tall table can exceed the viewport vertically; no nested vertical scroll trap. | PASS |
| Code | Named Windows setup code region focuses with a visible outline; Right moves local scroll 40px; 307px client / 539px content, root X=0, selection remains `auto`. | PASS |
| Projection disclosure/table | Enter opens native disclosure, Tab reaches named region, Right scrolls 40px; 301px client / 660px content, root X=0. | PASS |
| Calculator controls / radios | Tab traverses controls; arrow keys switch native network-basis radios. Calculate Enter focuses the first invalid input or valid results heading. | PASS |
| Error recovery / reset / decoder | Keyboard Calculate, Reset, Analyze and Clear exercised with state changes and expected focus. | PASS |

All five semantic tables retain captions and scoped headers; the two-column hypothetical calculation uses row headers. Every wide region stays within its page. Code and diagnostic input use valid monospace fonts; decoder resolves to `Consolas, "Courier New", monospace`, 15px. No fixed sidebar, JavaScript scroll tracker, keyboard trap or content-obscuring overlay was introduced. This review is not an exhaustive focus-obscuration proof for every intermediate scroll position.

## Tools and known-defect regression

[State records](evidence/m12b4/tool-states.json) contain 29 additional captures, including focus/contrast patterns; 26 cover tool states. Initial layouts at all seven sizes are in the responsive matrix. Representative valid/invalid/empty interactions were exercised at 390; each tool also has a valid desktop state. Values below are **synthetic teaching inputs**, not measurements or current market/network data.

| Regression | Current observation | Status |
| --- | --- | --- |
| UI-01 Guides card overflow | All requested widths and the additional 320px probe contained. | PASS |
| UI-02 article anchors / contents | Controlled direct/clicked cases clear the header; all rendered targets exist. | PASS |
| Article table/code containment | Named keyboard-scroll regions, local scrolling and zero root overflow. | PASS |
| UI-03 profitability touched fields | One entered field leaves untouched fields quiet and headlines unavailable. Explicit Calculate exposes seven missing values and focuses wall power. Malformed touched input suppresses results. | PASS |
| Profitability daily result hierarchy | Fixture: 1000 H/s, 100W, 24h, tariff 0.20, fee 1%, price 150, difficulty 86,400,000,000, reward 0.6 → £0.09 revenue, £0.48 cost, −£0.39 balance. Price 10000 → £5.46 balance. All displayed assumptions remain manual. | PASS |
| Profitability currency / reset | USD retains numeric assumptions and warns that no conversion occurred. Currency, invalid and reset announcements update after the existing 450ms debounce; settled checks waited 700ms. Earlier immediate captures retain transient old announcement text and are not treated as settled failures. | PASS |
| UI-04 electricity stale readouts | 200W with an incompatible USD/pence rate shows current 4.8kWh/day and withheld costs. At 12h/7 days it recovers in GBP to 2.4kWh/day, 16.8kWh/period, £0.48/day, £3.36/period. Invalid power and keyboard Reset also recover. | PASS |
| UI-05 decoder typography | 15px valid monospace at mobile/desktop. | PASS |
| Decoder bounds / recovery | Empty Analyze focuses an invalid textarea. Unknown-only input stays inconclusive. A synthetic 251-line log groups 225 recognized lines into 10 signals, leaving 26 uninterpreted; results do not echo the synthetic endpoint. Editing clears old results; 200001 ASCII characters hit the limit; Clear focuses the empty textarea. | PASS |
| Profitability mobile results | Three daily outcomes, 13px helpers and locally scrollable 14px projection detail remain readable. | PASS |

No mathematics, recognition rules, log size limits, citations, dates, upstream version boundaries or product claims changed.

## Zoom, text scaling and screen readers

| Acceptance | Status | Evidence / limitation |
| --- | --- | --- |
| Native browser zoom 100% | ENVIRONMENT BLOCKED | The browser surface does not expose a verifiable native zoom percentage; default rendering is not asserted to be 100%. |
| Native browser zoom 200% | ENVIRONMENT BLOCKED | Native Opera UI control timed out. Internal settings navigation was rejected by the browser security policy; no indirect workaround was used. |
| Native browser zoom 400% | ENVIRONMENT BLOCKED | Same restriction. The CSS320 reflow checks are not substituted for native 400% zoom. |
| Text-only scaling | NOT VERIFIED | No supported control available through the permitted surface. |
| Native screen-reader interaction | ENVIRONMENT BLOCKED | Native UI control unavailable; no NVDA/Narrator process observed, and no standard NVDA installation found. |
| Actual speech, reading order, table navigation, live announcement behavior | NOT VERIFIED | No named browser/AT pairing was successfully exercised. No speech outcomes or version pairing is invented. |
| DOM/semantic accessibility | PASS within checked contracts | All 17 have language, one main and H1; no skipped heading levels or broken ARIA references; all controls have associated names. Scoped table headers and figure captions/labels remain. |

[Semantic evidence](evidence/m12b4/semantics.json) checks structure, names/references, headings, tables and figures. Dynamic browser observations verify intended focus, `aria-invalid`, alerts and polite announcement text. They do not establish how a screen reader speaks or queues those updates. In particular, multiple error regions on explicit calculation and delayed daily summaries need actual NVDA acceptance. See W3C [resize text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html) and [focus not obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html).

## Browser and device coverage

| Environment | Coverage | Status |
| --- | --- | --- |
| ChatGPT in-app browser, Windows, Chromium family | 136 responsive records, keyboard and tool states. Exact browser engine/version not exposed. | PASS within recorded scope |
| Opera GX 139.0.6053.63, Windows | Homepage, Guides, Huge Pages and three tools at 1440×900 and 390×844: 12 smoke records, matching current CSS, one H1, zero root overflow. Product/file version read from installed executable; precise Chromium version unavailable. [Evidence](evidence/m12b4/opera-smoke.json). | PASS within smoke scope |
| Firefox | No available browser surface or standard installation found. | NOT VERIFIED |
| WebKit / Safari | No available surface. Chromium overrides are not equivalent. | NOT VERIFIED |
| Physical mobile device | No available device surface; touch/rotation/virtual-keyboard behavior untested. | NOT VERIFIED |

[Environment limitations](evidence/m12b4/environment.json) contain only sanitized task information, not private browser inventory. No browser framework was installed for this audit.

## SEO, discovery and automated verification

**PASS:** all 17 routes remain; unique titles, descriptions and canonicals; article TechArticle/BreadcrumbList JSON-LD; sitemap/robots origin and route consistency; draft exclusions; local links and fragments; exact rendered contents/heading matches and unique IDs. Published cards, contextual Huge Pages/decoder/low-hashrate handoffs, Windows security checkpoints and optional development-status handoffs are preserved. The website still makes no public-download claim. External citation destinations were preserved, not exhaustively availability-tested. No indexing, ranking or traffic improvement is claimed.

| Command | Result | Evidence |
| --- | --- | --- |
| `npm test` | PASS — 44 tests, 0 failed/skipped | [Output](evidence/m12b4/npm-test.txt) |
| `npm run check` | PASS — 50 Astro files, 0 errors/warnings/hints | [Output](evidence/m12b4/npm-check.txt) |
| `npm run check:links` | PASS — 17 built pages, seven article contents, local fragments/metadata/IDs/sitemap and new per-route main-nav assertions | [Output](evidence/m12b4/npm-check-links.txt) |
| `npm run verify:production-origin` | PASS — 17 routes with explicit synthetic HTTPS origin | [Output](evidence/m12b4/npm-production-origin.txt) |
| `git diff --check` | PASS | [Output](evidence/m12b4/git-diff-check.txt) |

The origin contract and existing calculator/decoder/controller tests are unchanged. B4-02 has a generated-output regression check on all routes in the established verifier. B4-01 has before/after measurements and all-route CSS320 browser regression evidence; no test merely asserting a CSS literal was added.

## Exact changed files

Production/check implementation:

- `website/src/styles/site.css` — body minimum width and active-navigation selector.
- `website/src/components/SiteLayout.astro` — exact-page versus section-location semantics.
- `website/scripts/verify-content.mjs` — rendered main-navigation regression assertions.

Documentation:

- `website/docs/m12b4-final-acceptance.md` — this acceptance report.
- `website/docs/content-roadmap.md` — milestone status and owner gates.
- Files under `website/docs/evidence/m12b4/` — measurements, sanitized environment data, build/HTTP identities, command logs, reproducible contrast calculation, preservation audit and screenshots. **Every exact path and file hash is enumerated in [files-changed.json](evidence/m12b4/files-changed.json)**; the inventory's own hash is omitted to avoid self-reference.

No desktop or unrelated tracked/generated files remain changed. Temporary audit helpers were removed after preserving evidence.

## Remaining gates and owner checklist

**No unresolved confirmed source defect was found in the completed checks.** The following are acceptance gaps, not successful tests:

1. **OWNER ACTION REQUIRED — native zoom/text scaling:** in a named desktop browser, record its version and visible zoom readout at 100/200/400%. Cover homepage/header, one card hub, setup code, Huge Pages table/contents and all three tools in valid/invalid states. Keep the desktop window size recorded; separately record resulting CSS dimensions. Verify navigation including the locally scrolling narrow header, inputs/results/disclosures, keyboard focus and existing/direct/clicked fragments. Separately test 200% text-only scaling where supported. Recheck the retained viewport-change/scroll-restoration cases rather than assuming an existing fragment realigns after resize.
2. **OWNER ACTION REQUIRED — screen reader:** use an installed supported NVDA/browser pairing and record both versions. Read homepage landmarks/navigation; operate article contents and Huge Pages row/column headers; inspect profitability labels and touched/explicit errors; hear one settled daily result; recover electricity mismatch; Analyze/Clear decoder; read both diagram text alternatives. Confirm announcements are useful without stale or excessive queued speech. DOM evidence alone cannot close this gate.
3. **OWNER ACTION REQUIRED — independent engines/devices:** repeat representative homepage/hub/article/table/code and all tool state checks in Firefox and Safari/WebKit. On a physical phone record model, OS/browser version, portrait/landscape, touch scrolling and virtual-keyboard behavior. Verify fragment clearance and locally scrolling controls/tables.
4. **OWNER ACTION REQUIRED — production configuration:** after those results are accepted, supply the confirmed HTTPS origin, rebuild and rerun the safety verifier against it; recheck canonical/social/JSON-LD/sitemap/robots output. Do not publish the synthetic-origin build. Production DNS and deployment require separate authorization.

**Recommendation:** ready for owner acceptance of the M12 implementation, with the recorded local checks passing. It is **not unconditionally approved for production configuration/release** while the above manual gates remain open. Close or explicitly accept those gaps before defining M13. M13 has not begun; this milestone adds no feature roadmap or production infrastructure.
