# Living Core implementation and visual acceptance

**Updated 2026-11-17 for D03.** The owner accepted the D02B prototype as the reference for Mining integration. D03 now uses that same v2 world in Mining. D03 owner visual acceptance, packaged Windows/high-DPI and actual 200% zoom checks remain open. No Rust, XMRig, mining lifecycle, telemetry/event contracts, contribution logic, wallet/pool setup fields or website behavior is changed.

## D03C — current implementation

The unified Home workspace and miniature v3 workshop supersede D03 below. See the [D03C implementation/verification/acceptance record](D03C_WORKSPACE.md). Home contains the original setup/command owner, sticky lifecycle/action strip, a 32px character with deterministic walking/working/return behaviour, genuine telemetry and prominent chronological Stream. Settings retains diagnostics/device information. Dedicated asset generation/normalization, 43 frontend tests, production build, three asset versions and browser/native lifecycle/scroll checks are verified. The art set is interim; owner visual acceptance and the explicitly listed packaged/zoom/accessibility checks remain pending. D03 below is preserved as a historical record.

## D03 — Mining integration

### Composition and controls

`MiningSessionTelemetry.tsx` now renders the existing `LivingCore` on the left and an operational console on the right. The console groups authoritative status, short support text, a large rate with separate unit, freshness and a full-width 48px Stop control. The lower rail retains pool connection, configured power/thread allocation, duration and accepted/rejected results. Details retains all previous measurements and provenance, with engine version added from existing normalized data. Stream stays below the session as the existing quieter timeline; no event history or share reactions are invented.

`MiningTelemetry.css` scopes the new composition to `.mining-operation--living`. Wide layouts give the world at least 480px (2× sprites). Under an 820px content container the console precedes the stacked world, keeping Stop close to status. Under 480px the Stop group precedes rate; the facts and Details groups reflow to a single column. The existing 1×/2× scene sizing and central crop are reused unchanged. Narrow Mining sidebar sizing leaves room for the crop under zoom pressure. No fractional sprite scaling is introduced.

`MiningSetup.tsx` keeps its Start/Stop handlers, IPC calls, setup forms, diagnostics and recovery actions. Its active branch still owns Stop. During Stopping the button remains visible and disabled, instead of disappearing. Stopped/error-without-process/unavailable sessions show a passive shared scene above the existing setup/recovery UI; unavailable status with no cached session preserves its Check session status action. There is no second character implementation, adapter or scheduler.

### State, freshness and accessibility

The shared pure `livingCoreState` adapter drives both Mining's headline and the scene. A failed poll or unknown status overrides cached Mining, including a cached startup stage. Stale/unavailable/missing/zero rates suppress tending. Cached numeric data remains accessible with explicit last-reported provenance; missing data stays unavailable. Failed-poll status does not remove Stop for a cached active session. Starting and Stopping use distinct canonical one-shots; Paused/Stopped are static.

The scene remains `aria-hidden`; status, rate, freshness and controls are separate text/HTML. Stop uses a native button, visible focus and a 48px minimum height. Keyboard Tab from Stop reached Details with a solid focus outline; Enter expanded and collapsed the disclosure. All four detail groups remained accessible. Forced-colors rules preserve a visible Stop border. System reduced motion and scene visibility handling are unchanged.

### Development preview and lifecycle tests

Run `npm run dev` and open `http://127.0.0.1:1420/__living-core?page=mining`. The development-only Page selector/sidebar switches the real Overview and Mining components, unmounting the inactive scene. State fixtures, reduced motion, held frames, transition replay and rendered dimensions remain available. Hide preview controls provides a cleaner composition review. The preview Stop button only displays a notice; it sends no mining command. Stream is empty rather than fabricated.

**Run lifecycle checks** executes `src/dev/checkLivingCoreLifecycle.tsx` in the visible browser using actual React roots, Strict Mode, the real components, image loading and intersection observers. It temporarily counts only authored frame-rate timeouts, then restores the browser clock in `finally`; test waits use the original clock. The normal preview scene is unmounted first. The harness verifies repeated Overview/Mining mount switches, real frame advancement, reduced motion/frame zero, stale/failed status, Paused/Stopped, hidden-scene pause/resume, unmount cleanup and absence of later callbacks. It requires a visible preview with normal system motion enabled. It is excluded from production alongside all fixture controls.

### Verification and remaining acceptance

- TypeScript/production build, 22 focused adapter/player/component tests, all 33 frontend tests, both asset validators and `git diff --check` pass. The recurring Vite SSR `EPERM` did not recur. Mining SSR tests use the established style-module stub because the component now imports the shared scene CSS.
- The browser lifecycle harness passed **15 checks**, with a maximum of **one** pending frame timer and **zero** after unmount. No production animation code or sprite assets were changed in D03.
- Actual Windows browser layout inspection covers 1440 × 900, 1200 × 800, 1024 × 768, 820 × 680, 1024 × 480 and 410 × 340 reflow. Checks found no document, workspace or hero horizontal overflow. Stop measured 48px high. Starting and Mining each measured 449.09px hero height in the desktop fixture, so that transition preserved the composition. The character/crystal relationship uses 2× at desktop/820px and 1× in the narrow crop. Synthetic preview screenshots are saved in the current chat's visualization artifacts as `mining-d03-1440.jpg`, `mining-d03-1200.jpg`, `mining-d03-1024.jpg`, `mining-d03-820.jpg`, `mining-d03-final.jpg` and additional state/compact captures; geometry observations are in `mining-d03-layout-checks.json`.
- The native Tauri/WebView2 development preview compiled and exposed the Mining interface in its accessibility tree. Desktop automation could not obtain usable native window geometry (first minimized, then coordinate geometry unavailable), so D03 native visual/high-DPI acceptance is **not claimed**. An external temporary preview config enabled zoom hotkeys for an attempted check; repository window/security configuration was unchanged. Actual 200% zoom remains unverified; the 410px viewport is reflow evidence only.
- No real mining was started. Wallet/pool setup, contribution behavior and backend contracts are unchanged. Final owner visual acceptance is pending; the historical D02B record below describes earlier work and its then-open checks.

Owner D03 acceptance checklist:

- [ ] Approve workshop prominence, hashrate/Stop balance and the lower facts rail in the native app.
- [ ] Confirm native 1440/1200/1024/820px, short heights, actual 200% zoom and supported Windows DPI settings.
- [ ] Confirm Starting → Mining stability, stale/failed-poll clarity, keyboard/screen-reader and forced-colors legibility.
- [ ] Confirm packaged hidden/minimized/offscreen suspension and idle CPU expectations.
- [ ] Keep share reactions deferred until reliable event/session association exists.

## D02B historical record

## Audit findings before editing

- The implementation really used horizontal RGBA frame sheets, not CSS-only movement. In the live Windows Opera preview, Mining's image offset advanced from −1600px to −320px while assets reported ready. The recording did not establish an animation bug, and the existing cancellable scheduler was retained.
- D02's Mining sheet reused one source pose with only 1px height/position changes; most frames were identical. Ready's breath was similarly subtle at a 76 × 80px displayed size. Transitions existed as one-shots.
- The 320px scene slot, large empty space between Ember and the crystal, and a separate rounded illustration frame made the workshop feel isolated. The 640px slot was available only at a large container breakpoint.
- The source character sheet, supplied sprite sheets, runtime sprites and manifest were inspected visually. Existing sprites were binary-alpha, nearest-neighbour and bottom-anchored; no general blur/fringe or clipping defect was found. Sleepy/concerned poses derive from the canonical sheet. Source art remains intact.
- The pure adapter already gave failed/unknown status priority, distinguished Starting/Stopping and suppressed tending for stale, missing and zero rates. Visibility, intersection and reduced-motion gates existed. Preview had synthetic fixtures but lacked held-frame inspection and size readouts.

## Artwork and reproducibility

- `public/living-core/v2/manifest.json` records all 15 runtime RGBA assets, source references, 320 × 180 cells, shared `[0, 0]` anchors, sprite dimensions, frame counts, speeds, loops and state usage. Its `contact-sheet.png` shows the ten visual poses. D02's v1 assets remain intact and are the reproducible input to v2.
- The authoring script also writes an identical `src/livingCoreManifest.json` for typed build-time imports. Vite serves `public/` by URL, so importing that public file directly caused development-server warnings. Validation requires both manifest copies to match.
- Character identity comes from the owner's `Ember the Squish Character Sheet.png`. Ready/blink poses reuse `Three-Frame Chibi Flame Sprite Sheet.png`; tending uses the first usable pose from `Six-Frame Pixel Flame Mascot Sprite Sheet.png`; sleepy and concerned expressions are extracted from the character sheet. Source materials are unchanged.
- Built-in imagegen produced the empty workshop and the crystal/pedestal plate, using the supplied dashboard concept as atmosphere reference and the workshop as prop reference. The exact prompts are recorded below. No new character identity was generated.
- The original pipeline removes detached alpha noise, extracts enclosed eyes/mouth, thresholds alpha, applies nearest-neighbour sampling and a shared 24-color character palette. D02B's `--refine` mode reuses these exact pixels, articulates a tiny right hand with palette-matched connecting limb, and resizes only the upper body for breathing. Animated foot pixels at y=144–149 are identical in every frame. Base sprite size is 76 × 80px, with maximum animated bounds 82 × 82px.
- The cradle moves 22 logical pixels toward Ember; the shard moves with it and sits 5px lower in the socket. Dormant brightness is reduced to 36%. Ground shadows follow the cradle. The restrained workshop depth and palette are retained; there are no particles or independent crystal motion loops.
- The generated plates remain in the creating session's `.codex/generated_images/01a1e21c-8a82-7062-bf96-f8616cbd384a/`: `exec-4f81c907-e9ac-4367-848f-8329f85ad886.png` (workshop) and `exec-c51af381-8ee2-495d-b716-5e49782cfd23.png` (prop). All runtime assets are saved in the repository; runtime does not depend on those source paths.

Rebuild D02B directly from the delivered v1 assets using Python with Pillow:

```powershell
python scripts/prepare-living-core.py --refine
npm run assets:check
```

The authoring tool is optional for ordinary frontend development. Validation checks both versions: RGBA mode, exact dimensions, binary alpha, non-clipping bounds, foot anchors, clip references, all poses and frame rates. V2 additionally requires identical animated foot pixels and at least four distinct frames in each ambient loop. The old `--background <plate> --prop <plate>` invocation still rebuilds v1; run `--refine` afterward to rebuild v2.

## Implemented states and motion

| Rust lifecycle / qualifier | Character and crystal | Motion |
| --- | --- | --- |
| Not configured | Patient waiting, dormant crystal | Static |
| Ready | Relaxed front pose, dormant crystal | 16 cells, 4 fps: 2px upper-body breath and a brief blink every 4 seconds |
| Starting | Small squash, then prepare a reach; dormant crystal | 6 cells, 6 fps, one-shot |
| Mining, fresh positive rate | Tending toward lit crystal | 12 cells, 6 fps: hand reaches 5px outward / 10px upward, holds, withdraws and rests |
| Mining, stale/unavailable/missing/zero rate | Neutral `miningQuiet` pose, dormant crystal | Static |
| Paused | Closed-eye rest, dormant crystal | Static |
| Stopping | Withdraws and settles toward sleepy pose | 6 cells, 6 fps, one-shot |
| Stopped | Sleepy rest, dormant crystal | Static |
| Error | Concerned eyes, dormant crystal | Static |
| Unavailable | Neutral front pose, dormant crystal | Static |

Repeated hold cells space out the ambient gestures without extra timers. Starting/stopping settle within one second and do not replay continuously. The tiny hand, expressive eyes and curling flame remain from the supplied artwork. These are limited articulated sprite edits, not a newly hand-drawn full animation set; the expression changes still use the existing canonical poses.

## State and rendering contract

`src/livingCoreState.mjs` is pure and has no fetching or mining controls. It preserves all nine Rust lifecycle states. A failed status request takes priority over cached Mining, startup stages and readiness. Readiness is only a no-session fallback; unknown lifecycle inputs stay unavailable. Startup stages select preparation without overwriting explicit stopping, paused, error, stopped or unavailable states.

Freshness is an independent output. Mining with stale/unavailable telemetry keeps the Mining label and selects `miningQuiet`. The prototype conservatively also suppresses work cues for fresh zero, invalid or missing rates, using distinct text qualifiers; positive fresh hashrate only gates activity, never animation speed. No events, shares, earnings or blocks drive the scene.

`LivingCore.tsx` layers transparent PNGs in React, using 1×/2× integer transforms and `image-rendering: pixelated`. Slots at least 480px wide use 2× with a central crop (minimum logical width 240px); smaller slots use 1× down to a 192px central crop. Narrower slots use the existing small Core. Canvas centering is rounded to whole CSS pixels. Top/bottom decorative margin is cropped to 156 logical pixels without clipping the flame, feet or shard. The fixed halo is behind props and only enabled for confirmed work.

Overview uses a shared graphite hero surface and faded workshop edges instead of a separate rounded thumbnail. Wide layouts reserve at least 512px for the scene; below an 800px content container the status/action precede the scene. Existing status, primary action, telemetry, system information and navigation are preserved. Narrow Overview sidebar/readout rules avoid horizontal overflow under zoom pressure. Mining's component and controls are unchanged.

`livingCoreAnimation.mjs` uses at most one low-rate timeout per scene. The component suspends it for hidden documents, offscreen scenes, reduced motion, stale/unavailable readings and unmounting. Timers, media-query listeners and observers are cleaned up. No animation-frame loop or per-frame image requests are used. Reduced motion displays a static first pose. A failed layer uses the neutral `scene-fallback.png`; failure of that still uses the old Ember Core.

## Development preview

Run `npm run dev`, then open `http://127.0.0.1:1420/__living-core`. The preview mounts the real Overview without App's polling effects or Tauri commands. It offers all nine lifecycle states, stale/unavailable telemetry, zero/missing rate, failed poll with cached Mining, and unknown lifecycle. All positive rates are synthetic fixtures; results and earnings are not simulated.

- Leave **Animate** checked to inspect normal low-rate motion.
- Uncheck it to hold frame zero, then use the **Frame** slider to inspect any authored frame.
- **Replay transition** remounts the scene to replay Starting/Stopping once.
- **Reduced motion** takes precedence over held-frame inspection and shows the static first pose; the system media preference is also respected.
- The readout reports viewport size, logical/base rendered sprite size, maximum motion bounds, scale, frame count and fps. Controls have their own bounded scrolling area at short heights.
- Reload after rebuilding image files to avoid retaining cached sheets in an existing preview.

The preview is gated by `import.meta.env.DEV` and dynamically imported. Its route/control strings are absent from production JavaScript. There is no preview entry in production navigation.

## D02B verification and outstanding acceptance

- TypeScript, production build, focused Living Core tests (15), full frontend suite (29), both asset validators and `git diff --check` pass. The recurring Vite SSR `EPERM` did **not** recur. This revision adds a timer-disposal/replacement regression and strengthens unknown-status-with-startup coverage. Existing D02 Mining fixture changes are preserved.
- Actual Windows Opera fixtures were inspected at 1440 × 900, 1200 × 800, 1024 × 768, 820 × 680, 1024 × 480 and 410 × 340. Document/workspace/hero checks found no horizontal overflow. Final 820px layout uses 2× art; 410px reflow uses a 199px 1× central crop with vertical workspace scrolling. Preview toolbar scrolling leaves usable workspace height.
- All 15 fixture selections were checked against actual DOM headline, pose, active-work gate and crystal source. Paused/Stopped remain static. Stale/unavailable/zero/missing rates select quiet Mining; failed/unknown status wins over cached activity. Reduced motion held frame zero across observations. The held-frame slider selected frame three with playback suspended.
- The native Tauri **development** app was launched with an external, temporary config pointing directly to `/__living-core`. WebView2 rendered Ready and Mining with the same 2× workshop composition. This was synthetic preview data; no miner was started. This establishes native development appearance, not packaged acceptance at every requested size.
- Actual 200% zoom remains **unverified**: attempted native/browser keyboard zoom did not produce a confirmed scale change. The 410px check is reflow evidence only. Full native size/high-DPI coverage, screen reader/keyboard traversal, live hidden/offscreen suspension and measured idle CPU remain owner/manual checks. Timer suspension, cancellation, pose replacement and one-shot completion have deterministic unit coverage. D02's fallback implementation is retained; its historical missing-asset inspection was not repeated for v2.
- Preview controls/route strings are absent from production JavaScript. The scene is decorative (`aria-hidden`), status/freshness remain readable text, and motion is gated by both the preview override and system reduced-motion preference.
- Artifacts are in this chat's visualization directory (`01a1e74a-67c4-7462-9a4a-cf56c7ed70db`): `living-core-d02b-native.png`, `living-core-d02b-1440.jpg`, size-named browser captures and `tending-v2.gif` (an authored-frame illustration, not a screen recording).

Owner acceptance checklist (all remain pending until the owner signs off):

- [ ] Character identity, fixed feet, blink/breath and restrained tending read clearly at native window sizes.
- [ ] Ember, crystal, cradle and workshop feel connected; active/dormant contrast and glow are appropriate.
- [ ] Overview status/action and telemetry remain useful at 820px, short heights, actual 200% zoom and supported Windows DPI settings.
- [ ] Reduced-motion, keyboard/screen-reader, hidden/minimized/offscreen behavior and packaged idle CPU meet expectations.
- [ ] Accept D02B visually before beginning D03 Mining placement. Share/event reactions remain deferred until session association is reliable.

## Image generation prompts

Built-in imagegen was used (no API/CLI fallback). Reference roles and all constraints are included verbatim:

### Workshop plate

Use case: stylized-concept. Asset type: pixel-art background plate for Ember desktop Living Core, a 320x180 logical scene rendered with nearest-neighbour pixels.
Image 1 is atmosphere/composition reference ONLY, not an edit target. Generate JUST an empty miniature workshop environment, absolutely no character, no crystal, no pedestal, no lettering or UI. A restrained cosy graphite miniature mechanical workshop: dark stone back wall, a small recessed amber lamp at far upper left, a few delicate copper pipes at far right, one quiet shelf on upper left, a low horizontal stone workbench/floor extending across lower quarter. Frontal three-quarter tabletop perspective, not isometric. Warm upper-left lighting, limited graphite/brown palette, low contrast with a very quiet empty center for transparent character and crystal sprites to be added later. The scene has no central props. Center foreground from x70 to x260 is completely clear. Bench surface/floor at y150 of logical 180. Crisp actual pixel art on 320x180 grid, uniform small square pixels, simple intentional shapes, no dithering noise, no antialiasing, no blurs, no gradients, no baked glow, no particles. Wide 16:9 landscape composition filling frame, no border, no collage. Cozy crafted boutique desktop software illustration. Keep background much dimmer than the bright orange mascot reference.

### Crystal / pedestal plate

Use case: stylized-concept. Asset type: transparent pixel-art prop sprite for a 320x180 logical miniature workshop. Image 1 is workshop palette/perspective reference only. Generate ONE small mechanical stone-and-dark-bronze pedestal supporting ONE tall faceted amber crystal, isolated on genuine transparent background. Absolutely no character, scene, text, borders, particles, sparks, blur, glow or floor. Frontal view with a little visible top face: squat elliptical octagonal mechanical cradle base, tiered dark graphite rings, small bronze clamps, minimal industrial detailing. Crystal is a single simple upright hexagonal amber shard pointed at both ends, warm yellow upper-left facets, honey center, burnt orange right faces, dark brown one-pixel outline. Clear seam between the sharp crystal lower tip and the top of the base, nothing overlapping the crystal silhouette; crystal occupies upper 70% and base lower 25%, a small air gap between them. Crisp intentional actual pixel art with 1px edges on a logical 52px wide x80px high grid, few large flat facets, limited 16-color palette, no antialiasing. Keep silhouette compact. Match dim cosy graphite workshop reference, crystal is restrained golden amber. Center the prop, retain transparent margin.
