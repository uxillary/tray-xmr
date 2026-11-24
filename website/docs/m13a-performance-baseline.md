# M13A — Reproducible performance baseline

24 November 2026. **Laboratory observations only.** No production deployment, real-user field data, Search Console CWV data, field INP or Lighthouse score is available. No performance code/style change was justified by these observations.

## Method and identity

[Raw observations](evidence/m13a/performance.json) contain 36 navigations: six routes × two profiles × three fresh browser contexts. [Reproducible harness](../scripts/measure-performance.mjs) uses the installed Chromium, Node built-ins and Chrome DevTools Protocol; no browser dependency was installed or added to the website.

- Windows host; Node 24.21.0; headless Chromium **158.0.8127.18**, protocol 1.3. This is desktop Chromium, not Safari/Firefox or a physical phone.
- Release-style build uses **`https://ember-m12b0-audit.invalid`**, explicit noindex. Served via Astro 7.3.5 preview at **`http://127.0.0.1:4364/`**, strict port and loopback binding. Canonical origin and HTTP serving origin intentionally differ for local QA.
- Before timing, fetched every measured HTML document and compared its SHA-256 to the on-disk build. All six were HTTP 200 and byte-identical. Final-output identity/preservation is recorded in [verification evidence](evidence/m13a/verification.json).
- Desktop: 1440×900 CSS pixels, DPR 1, no CPU/network throttling. Mobile lab: 390×844, DPR 1, mobile viewport emulation, CPU slowdown 4×, network latency 150 ms, download 204,800 B/s and upload 98,304 B/s. Desktop user agent is retained. This profile is a repeatable lab stress condition, not a named-device performance claim.
- Each run uses a new isolated context and disabled browser cache. Browser/process/OS/JIT caches may warm across runs. The same workstation can have other activity; the first desktop homepage run was a clear slow outlier and is retained. No statistically representative hardware sample or cross-run improvement claim is made.
- Observers are installed before navigation. Record LCP candidates and layout shifts until **five seconds after load**, with no user interactions. CLS uses session windows (one-second gap/five-second maximum), excluding shifts with recent input. This bounded load observation cannot cover later interaction/lifetime shifts.
- Main-thread values are CDP TaskDuration/ScriptDuration/LayoutDuration/RecalcStyleDuration deltas, in milliseconds, from before navigation to the observation endpoint. They include rendering, finite startup animation and the audit instrumentation; they are not exclusively product JavaScript costs or a trace-based root-cause profile.
- Request bytes are `Network.loadingFinished.encodedDataLength`, including response overhead. Raw HTML/CSS/JS sizes are decoded bytes. Astro preview served HTML/CSS/JS with gzip; this is not Cloudflare Brotli, CDN cache, public TLS/DNS or network evidence. Resource Timing's standardized header allowance may differ slightly from CDP's actual counts.

From `website/`, reproduce after installing the locked dependencies and using an already installed Chromium executable:

```powershell
$env:SITE_URL = 'https://ember-m12b0-audit.invalid'
$env:SITE_INDEXING = 'noindex'
npm run check:links
npm run preview -- --host 127.0.0.1 --port 4364 --strictPort
```

In a second terminal in `website/`:

```powershell
node scripts/measure-performance.mjs '<absolute-path-to-installed-chromium.exe>' 'http://127.0.0.1:4364/' 'docs/evidence/m13a/performance.json'
```

The harness accepts only localhost/127.0.0.1 HTTP targets, creates/removes its own temporary browser profile and rejects failed/external requests or runtime errors. It does not use a personal browser profile. If a sandbox blocks loopback with EACCES, allow the same bounded local audit outside that sandbox; do not substitute an unrelated listener. This run required that host-execution allowance. Stop the owned preview after the audit.

## Measured loading and main-thread baseline

Medians of three runs; bracketed LCP values show min–max, preserving the outlier. All **36 observed CLS values were 0**. Main-thread task totals include the full observation window, not just the time before LCP.

| Route | Desktop LCP ms [range] | Mobile-lab LCP ms [range] | Desktop task / script ms | Mobile-lab task / script ms |
| --- | ---: | ---: | ---: | ---: |
| `/` | 216 [192–1,632] | 1,144 [1,104–1,220] | 189.9 / 0.8 | 1,745.9 / 2.3 |
| `/tools/` | 128 [120–316] | 900 [896–1,012] | 108.1 / 0.8 | 550.6 / 2.4 |
| `/tools/monero-mining-profitability-calculator/` | 152 [152–496] | 1,136 [1,108–1,140] | 146.4 / 2.4 | 781.9 / 12.7 |
| `/tools/xmrig-log-decoder/` | 156 [124–288] | 896 [884–940] | 107.5 / 1.1 | 526.8 / 4.7 |
| `/troubleshoot/xmrig-huge-pages/` | 164 [148–180] | 1,024 [1,008–1,032] | 132.6 / 0.8 | 658.4 / 2.4 |
| `/guides/xmrig-windows-setup/` | 152 [144–180] | 1,032 [1,004–1,068] | 129.0 / 0.8 | 668.2 / 2.3 |

**Total Blocking Time: unavailable as a standard metric.** Lighthouse/TTI was not available in the installed tooling and was not installed. The harness records long-task counts and a separate `observedBlockingTimeMs = Σ max(duration − 50 ms, 0)` over the bounded observation window. That field is **not Lighthouse TBT and not INP**. Desktop values by run: home 174/100/87 ms; tools 32/31/29; profitability 63/0/0; decoder 0/24/0; Huge Pages 47/45/65; setup 36/45/45. The mobile lab observer recorded no long-task entries, despite higher aggregate rendering durations; zero observed entries do not prove absence of blocking on a real slow device. No interaction latency or calculator/decoder workload benchmark was conducted. Field CWV requires actual users and sufficient reporting data. [Google CWV reporting scope](https://support.google.com/webmasters/answer/9205520).

## Transfer and rendering inventory

All values below are **bytes**, not KB; representative second desktop run, with the same request counts/asset payloads across these runs. Total includes document, CSS, tool modules where present and the favicon. Decoded HTML includes inline SVG; **do not add SVG bytes again to total transfer**.

| Route | HTML raw / document transfer | CSS raw / transfer | JS raw / transfer | Inline SVG count / raw bytes | Requests / total transfer |
| --- | ---: | ---: | ---: | ---: | ---: |
| `/` | 21,770 / 6,084 | 53,524 / 11,588 | 0 / 0 | 16 / 9,752 | 3 / 18,147 |
| `/tools/` | 12,551 / 3,241 | 53,524 / 11,588 | 0 / 0 | 11 / 4,133 | 3 / 15,304 |
| `/tools/monero-mining-profitability-calculator/` | 25,804 / 7,609 | 67,415 / 14,963 | 10,312 / 4,593 | 0 / 0 | 6 / 27,640 |
| `/tools/xmrig-log-decoder/` | 7,033 / 2,890 | 59,326 / 13,466 | 6,895 / 3,008 | 0 / 0 | 5 / 19,839 |
| `/troubleshoot/xmrig-huge-pages/` | 22,365 / 6,844 | 62,309 / 13,798 | 0 / 0 | 3 / 1,757 | 4 / 21,117 |
| `/guides/xmrig-windows-setup/` | 34,593 / 10,052 | 62,309 / 13,798 | 0 / 0 | 0 / 0 | 4 / 24,325 |

- **Fonts:** system stacks, zero downloaded faces and zero font requests/bytes. `document.fonts` reported loaded with zero FontFace entries in every run; no external font-display/loading problem was observed.
- **Images:** the favicon SVG adds one request, 208 raw bytes / 475 transferred bytes per page. No other standalone image requests occurred; inline visuals are included above. Social-card metadata does **not** cause a normal page image fetch. The new 82,855-byte PNG is for social crawlers, not a page-load performance regression.
- **JavaScript:** no functional JS request on home/hubs/articles. The nonzero CDP ScriptDuration there includes the measurement observer. Profitability/decoder load only their existing small module graphs; parser/calculation/controller bytes are unchanged. The electricity tool remains covered by model/controller tests and was outside the six requested performance priorities.
- **Requests/errors:** all captured requests stayed on the local preview origin, no HTTP >=400 or failed requests, and no captured runtime errors during observation. This is not a full interaction test or live-host asset-availability check.

## Homepage animation and confirmed issues

Source uses four rendered animation instances on home, based on finite one-iteration transform/opacity keyframes; no requestAnimationFrame loop, timer, canvas engine or hydrated client component is involved. Every homepage run reported all four animations **finished**, with one iteration, at the five-second post-load checkpoint. Existing `prefers-reduced-motion` short-circuit CSS remains unchanged. The hero's H1 was the mobile LCP candidate.

The throttled homepage spends more cumulative rendering time than the simpler hub (for example, mobile run 2: layout 625.1 ms and style recalculation 282.7 ms), but aggregate totals cannot attribute that difference solely to animation versus SVG/layout. No continuing animation, accumulating request stream, layout shift or persistent script loop was confirmed. Preserve the visual identity; investigate with a controlled trace/animation-disabled comparison only if future field data or device observations show a problem.

**No confirmed performance defect required a source optimization.** Existing small transfers, limited scripts, finite animation and font strategy were retained. The SVG social-sharing format issue is corrected for compatibility, not presented as a page-speed improvement. Do not infer live CWV compliance, field INP, Safari behavior or physical-device acceptance from this report. Re-run against the authorized production origin with appropriate public-site tools after deployment; keep future laboratory and field results separate.
