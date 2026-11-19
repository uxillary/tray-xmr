# D04A — Live performance workspace

## Baseline audit (before chart implementation, 2026-11-19)

- `App.tsx` serially requests `mining_status`, waiting 1 second after each response. Rust independently polls the authenticated XMRig local API. There is no historical-series API.
- `shortHashrate` is `/2/summary`'s **10-second average**, normalized by Rust. Medium/long readings are 60-second/15-minute averages. Null is missing; zero is a genuine reading.
- `sampleTimeUnixMs` is Rust's wall-clock timestamp taken just before an API request and included only on successful normalization, not a frontend render timestamp or individual-hash timestamp. Repeated status responses can contain the same observation. Freshness is Rust-owned: unavailable before evidence, stale after 5 seconds. The D03E frontend also expires evidence after 5 seconds when IPC stalls.
- `mining_status` includes lifecycle, startup stage, process ID and elapsed time, but **no session identifier**. Events have an opaque session ID; separate event/status responses provide no authoritative join. Do not infer that join. Elapsed session seconds can represent contribution-schedule accumulated active time, so they are not a reliable session identity.
- Use conservative lifecycle/process segments: clear on entering Starting, returning from a terminal state into active ownership, or a changed known process ID. Pause/unavailable/stale readings interrupt the line. Stop retains memory-only observations as historical. A restart entirely missed by polling with PID reuse cannot be attributed exactly; no backend contract change is justified for this chart.
- Reuse Start/Stop/setup ownership in `MiningSetup`, D03E's unchanged 320×144 workshop/32px character and intensity adapter, its five-second expiry, operational facts, Details, Diagnostics and ordered/scroll-preserving Activity/Verbose stream.
- Baseline Home puts a broad workshop left of a small rate column, followed by a deep facts rail, Details and console. D04A will place rate and miniature workshop in a shared compact masthead, give real performance a full-width central plot, compress facts into one instrument rail and bring Activity into the initial desktop viewport.

## Composition and preserved behavior

Home now leads with lifecycle, a short status and its existing Start/Stop action. The large rate is on the left, the tiny workshop on the right. A full-width amber performance instrument replaces the old narrow rate-column emphasis. Pool routing, configured thread lanes, backend-reported session time and accepted/rejected results share one flat instrument rail. Details and the Activity/Verbose journal remain directly below. Graphite/amber styling, large readable numbers, fewer dividers and a zero-based plot distinguish the composition without adding dashboard cards.

The workshop artwork, scale, animation logic and intensity reducer are unchanged. All D03E walking/tending/return, crystal/conduit/flywheel effects, baseline calibration, stale/zero guards, visibility/reduced-motion gates and timer cleanup remain intact. Its caption describes activity. Configured lanes never claim measured CPU utilization. Pool nodes use authoritative reported evidence; cached Connected becomes “Last connected · unconfirmed” with a neutral route. Missing rate is labelled separately from missing telemetry. Results are submission counters, not earnings or blocks. Session time comes from the existing backend field, including its accumulated contribution-schedule semantics; no frontend elapsed-time estimate was added.

Start/Stop/setup/consent ownership stays in `MiningSetup`. No Rust, XMRig, telemetry/event contract, contribution, licensing, dependency or `website/` changes exist. Session errors appear **above the plot**, including an explicit last-reported prefix after failed polling; recovery actions and both developer/upstream donation disclosures remain available. No mining or integration diagnostic was started for this milestone.

Activity and Verbose reuse the same D03E component and real backend-ordered 256-event buffer. Independent scrolling, mode selection, safe technical expansion/copying, visible Return to latest, unread counts and Home/End navigation remain intact. No heartbeat or synthetic production event exists. Details/Diagnostics retain their existing progressive disclosure and safe copy behavior.

## Observation contract

`App` owns `useHashrateHistory`; Home/Settings navigation does not reset it. The pure `observeHashrate` reducer accepts existing status snapshots. No additional polling, backend history request, disk persistence or analytics is introduced.

| Rule | Behavior |
| --- | --- |
| Metric | Rust-normalized `shortHashrate`: XMRig's 10-second average, in H/s; display scales to kH/s/MH/s as needed. |
| Ordering | Strictly increasing positive safe-integer `sampleTimeUnixMs`; equal timestamps never add a point, even if another field changes. Equal values with new timestamps are genuine separate observations. |
| Clock safety | Reject backwards, future and expired sample timestamps. Keep the chart end nondecreasing on wall-clock rollback, break continuity and wait for authoritative timestamps to exceed the watermark. This can delay recovery after a large clock correction. |
| Freshness | Require confirmed Mining, no startup stage, fresh status, an observation no older than 5 seconds, and a finite nonnegative rate. Rust's monotonic receipt-age freshness remains authoritative; frontend timestamp checks are an additional conservative guard. |
| Gaps | Stale/missing/invalid telemetry, failed status requests, pause, evidence expiry and intervals over 5 seconds break the next path. No zeros or intermediate points fill them. |
| Retention | Keep observations within **120,000ms**, including the boundary, and at most **128 samples**, including at unusually fast update rates. Both constants are exported/tested. |
| Boundaries | Clear on entry to Starting, terminal-to-active lifecycle transition or change of known PID. Keep the previous timestamp watermark so cached telemetry cannot be attributed to the new segment. |
| Stop | Retain the bounded recent observations in memory, freeze their time window and label them **Recent session · historical**. Clear on the next confirmed boundary. |
| Lifetime | App run only; no persistence. Effect timeout and chart ResizeObserver disconnect on unmount. |

No exact session attribution is claimed. Events expose IDs, but status has no authoritative join to them. Missed transitions plus PID reuse remain ambiguous; conservative resets can also discard continuity during contribution process switches. Missing PID alone never proves a new session. Process/lifecycle evidence, rather than averaged-rate changes or accumulated session seconds, determines boundaries.

## Chart and accessibility

`LivePerformance` uses dependency-free SVG. A restrained amber polyline connects only real observations within an uninterrupted stretch; individual points preserve single readings and numeric zero. Separate paths leave clear gaps. The y-axis includes zero, uses explicit rate units and follows the observed range. The two-minute local-time axis and **10-second average** heading describe the measurement. Empty plots do not show invented rate-axis values. Starting, warming, interrupted, quiet and historical states have text.

The visible summary gives observation count/range and names separate stretches. Focus the plot and use Left/Right to inspect actual readings, Home/End for first/latest and Escape to clear. Pointer inspection selects the nearest real observation and always shows its actual timestamp/value in a wrapping footer, avoiding floating tooltips on narrow screens. Keyboard inspection uses a polite output; regular polling does not announce each reading. Focus styling and forced-colors chart strokes are explicit. The graph has no animations; reduced motion continues to stop workshop effects. ResizeObserver updates SVG geometry so axis typography does not shrink horizontally with viewport width.

## Development preview

`npm run dev` → `/__living-core`. The fixture route explicitly says **Simulated preview data** and uses injected mock commands, never native Start/Stop. Production tree shaking removes that route, shaped series and test harnesses.

Additional choices: simulated shaped series, missing-data gaps, stopped with retained observations and a new session with empty history. Existing Ready/Starting/stale/zero/missing/error/unavailable choices remain. Reduced motion is available through the toggle or `?reduced=1`. Seeded observations are built only inside the development fixture using the same reducer at simulated observation times; production history always starts empty. Preview Stop retains readings; a subsequent Start clears them through the normal lifecycle transition.

## Verification and evidence (2026-11-19)

Before/after browser captures at widths **1440, 1200, 1024, 820px**, **820×520** short height and **600×400** reflow are in [d04a-screenshots](d04a-screenshots/). There is also a **410×400** extreme-reflow capture. These show explicitly labelled simulated data, not real mining evidence. Baseline 1440px capture is 883px high due to browser viewport capture clipping; the final full-page viewport capture is 900px high. The 1200×800 pair has matching dimensions. The narrower full-page captures can include document background outside the visible, independently scrolling workspace; measured viewport geometry is recorded separately.

The 1200×800 product composition puts status, Stop, workshop, rate, graph, facts and the beginning of Activity in the viewport. The development banner consumes additional height; collapsed controls keep its simulation label visible. At 820px the facts wrap into two rows; at short heights, narrow reflow and zoom equivalents the workspace scrolls. Readability and safety take priority over fitting all sections. Start/Stop stays sticky in the workspace. The stream retains its own bounded scroll area.

Exact browser check output and measured viewport geometry are retained beside the screenshots. Browser tests exercise actual React effects, StrictMode duplicate suppression, zero/missing/stale data, split paths, keyboard inspection, failed polling with retained Stop, stopped history, process reset, reduced motion and container fit, plus all existing workshop/Stream/Diagnostics checks.

| Verification | Result |
| --- | --- |
| TypeScript / production build | `npx tsc --noEmit` and `npm run build` pass. |
| Full frontend suite | `npm test`: **69/69 pass**. Includes 11 pure history tests, chart markup/units and session-error priority plus existing setup/control/Stream/workshop tests. |
| Browser workshop lifecycle | **20 checks pass**, maximum one pending frame timer, zero after unmount. |
| Browser performance | **15 DOM/effect checks pass**: actual StrictMode effects, sampling, gaps, zero, stale/unavailable, keyboard, historical/reset behavior, retained Stop, reduced motion and fit. |
| Browser Stream / Diagnostics | Follow/reading-position/mode/unread/return/Home/End/readable Verbose checks pass. Modal focus/section navigation/cancel/focus return/containment/raw scrolling/copy/unmount checks pass. |
| Direct preview checks | Settings → Home retains 55 observations; fixture Start clears 57 retained observations to zero before new-session samples. Zero adds a point; missing/stale do not. Reduced motion reports `data-playing=false` and `animation-name:none` on all five inspected effects. |
| Responsive geometry | No horizontal document overflow at checked sizes; normal-size workshop remains 144px high, Squish 32px, Stop at least 44px. Plot SVG width follows container width. |
| Assets / whitespace | `npm run assets:check` validates unchanged v1/v2/v3 assets; `git diff --check` passes. |
| Production isolation / scope | Production output excludes preview route/fixture/test markers. No Rust, website, lockfile or asset diff. No real mining. |

**Native limitation:** a Tauri development build successfully launched WebView2 at the isolated fixture URL. Its accessibility document exposed the new plot, rate, Stop, thread allocation, time/results and Activity. Native click automation failed with unavailable coordinate geometry; native capture returned an unrelated surface. No native screenshot or native lifecycle-suite pass is claimed. Actual 200% browser/app zoom was attempted, but the target preview's measured DPR stayed 1. Narrow-width screenshots demonstrate reflow only, not verified zoom. Full screen-reader/High Contrast use, native DPI/performance and owner artistic acceptance remain open.

## Owner acceptance steps

1. Review the before/after pair and development preview at native scale. Confirm the graph is balanced, the rate and Stop are obvious, Squish stays tiny and the workspace feels materially different.
2. Review Ready/Starting/live/gaps/stale/zero/Stopped/new-session/Error/unavailable. Use only the fixture Start/Stop during visual acceptance; verify history clears and separate sessions never join.
3. Tab to the plot; inspect with arrows/Home/End/Escape. Compare Activity/Verbose, expand/copy a safe event, read older rows and return to latest. Review Details and Diagnostics/errors/disclosures.
4. Verify actual 200% zoom and Windows display scaling, short-window scrolling, keyboard/screen-reader/High Contrast behavior and native motion/performance. Accept the composition and motion or request refinements.

**Owner acceptance is pending.** No commit, push, merge, deployment or release package was created.
