# Living Core design foundation (D01)

## Purpose and existing integration

The Living Core is an illustrative status surface for Ember's Windows desktop app. It makes the device's mining state easier to recognize without becoming a mining control, a telemetry gauge, or an earnings claim. The approved concept art is a direction for character and atmosphere, not a pixel-perfect specification. Artwork requires owner approval before implementation.

The current `src/components/EmberCore.tsx` is a decorative CSS disc, orbit and halo around `public/ember-mark.svg`; its state class is selected by `src/App.tsx` on Overview and by `src/components/MiningTelemetry.tsx` on the active Mining view. `src/App.css` owns current palette, sizing, responsive rules and `prefers-reduced-motion` behavior. The new scene's first integration point is the Overview `.hero-core-wrap` beside the state headline. Keep the existing Mining Core and Mining screen composition during D02. A later, separately reviewed milestone can decide whether to reuse the scene there. The flame mark remains the app/sidebar brand; the character expresses that brand rather than replacing its logo.

`App.tsx` requests Rust `mining_status` roughly every second and `mining_events` only while Mining is open, roughly every 1.2 seconds. The Rust supervisor owns lifecycle and normalized telemetry. `MiningSessionStatus` in `src/components/MiningSetup.tsx` mirrors the serialized `EngineLifecycleState` and `TelemetryFreshness` enums in `src-tauri/src/mining/domain.rs`. `src/miningTelemetry.mjs` currently formats values and freshness for readouts; the scene should receive a small, pure visual-state adapter based on the same status inputs. The Stream in `src/components/EmberStream.tsx` presents structured, process-local events from `src-tauri/src/mining/events.rs`; it does not create them. The current status response has no session ID, so a visual reaction must not assume it can pair a status sample with a Stream event until a reliable session boundary is available from existing frontend observations. D02 does not need result reactions.

## Visual language

- **Character:** one round, slightly asymmetrical ember with a low, soft silhouette, tiny limbs and large expressive eyes. It should feel attentive, patient and capable, never frantic, triumphant or distressed for routine states. The eyes and posture carry emotion even when hue is unavailable. No mining helmet, coins, pickaxe, price symbols or gambling cues.
- **Core crystal:** one faceted amber crystal set into a small workshop cradle. Its outline and facets are pixel art; a subtle smooth glow outside the silhouette suggests warmth. The crystal is a metaphor for Ember's supervised session, not a literal block, share, balance or hash meter. It must never burst, fill like a progress bar, or count up without corresponding data.
- **Workshop:** a miniature tabletop/workbench, a few dark tools or shelves, and restrained depth planes. Compose character and crystal as the unmistakable foreground focus, with the creature facing or tending the crystal. Keep negative space around both; background details are quiet and must remain readable at reduced size.
- **Scene framing:** master art at **320 × 180 logical pixels (16:9)**, with a center safe area of about 256 × 144 for the character and crystal. Treat this as an art-production target for owner review, not a requirement to stretch the existing 154 px Core slot. D02 should negotiate Overview space deliberately. At narrow app widths, reduce decorative background first; keep character, crystal, headline and primary action visible. If the scene cannot fit at an integer scale, use a smaller approved crop or static composition rather than fractional pixel scaling. Preserve a useful text-first Overview at 820 px window width and 200% zoom.
- **Palette:** the app's graphite surfaces (`--app-bg`, `--surface-panel`) remain dominant. Use a bounded amber family based on `--ember`, `--ember-bright` and `--ember-muted` for the character/crystal focus. Existing green, warning and danger tokens can qualify states, but never rely on hue alone. Avoid RGB/neon lighting, spark showers and crypto trading aesthetics.
- **Division of labor:** transparent sprites provide character, crystal facets, workshop and discrete poses. CSS supplies a clipped, low-opacity ambient halo, shadow and short state transitions. Smooth effects must not blur sprite edges. SVG remains appropriate for the existing mark and non-pixel UI ornaments, not for redrawing the pixel character. Surrounding typography, cards, buttons, readouts and navigation stay crisp modern desktop UI, not pixel fonts or game controls.

## Motion and accessibility

At rest, prioritize a composed silhouette. Use slow breathing or a tiny posture shift for an active session; starting can show a short, calm preparation pose; stopping settles rather than reversing a flashy start sequence. Avoid constant particles, screen shake, strobes and reward-style celebrations. A state transition should finish promptly, then settle into a low-motion loop. CSS glow is ambient only and cannot be interpreted as discrete hashing, a share or earnings. Animation must pause when the scene is hidden and must clean up timers/listeners on unmount.

`prefers-reduced-motion: reduce` selects a static pose and fixed halo for every state, with no looping frames, shimmer, parallax or delayed meaning. If frames fail to load, use an approved static still; before art approval, retain the existing `EmberCore`. Keep status text outside the decorative scene as the accessible source of meaning. The scene should be `aria-hidden` when the adjacent headline states the same status; never put essential data only in an image. Maintain visible keyboard focus on nearby controls, readable contrast for labels on graphite, no color-only state distinction, and no rapid flashing. Inspect actual WebView2 rendering at normal scaling and 200% zoom.

## Lifecycle-to-visual contract

The **lifecycle** is the base pose. Telemetry freshness is a separate qualifier that can suppress activity. A Stream event, if supported later, is a brief overlay/reaction that never changes the base lifecycle. React must not infer a result from a pulse, timer, hashrate change, pool connection or count displayed without a verified event.

| Authoritative input | Base scene | Permitted motion and meaning |
| --- | --- | --- |
| `notConfigured` | Quiet workbench, character waiting | Static; setup is incomplete. |
| `ready` | Alert, relaxed character beside unlit crystal | Optional subtle idle breathing; ready to start, not mining. |
| `starting` or a non-null `startupStage` | Character turns toward crystal; low amber preparation light | Brief preparation loop only; no hashing or successful connection implied. |
| `mining` with fresh telemetry | Character tends softly lit crystal | Slow ambient loop means supervised session is active; no per-hash beat. |
| `paused` | Character resting; dim crystal | Static or near-static; do not show active work. The current UI exposes this lifecycle even though Pause/Resume is not a user control. |
| `stopping` | Character steps back; glow fades | Short settling motion, distinct from Starting. |
| `stopped` | Character resting, crystal dormant | Static, ended session. |
| `error` | Character attentive to a problem; crystal dim | Static caution pose; details and recovery stay in text. |
| `unavailable`, failed status request, or no confirmed status | Neutral/uncertain scene | Static; never portray current mining as confirmed. A failed poll can leave an old session object in React, so the unavailable flag takes priority over its last lifecycle. |
| `mining` with `stale` or `unavailable` telemetry | Keep the reported lifecycle label, remove active work cues | Dim/freeze activity; show “Updates delayed” or “Telemetry unavailable” in adjacent text. Freshness does not rewrite the Rust lifecycle. |

For `ready` on Overview, `mining_readiness` can provide a fallback when there is no active session, as `App.tsx` currently does. The scene adapter must retain distinct `stopping`, `unavailable`, and `notConfigured` poses even though the current `EmberCoreState` maps stopping to starting and unavailable to warning. When the session request fails, prefer an unknown pose regardless of cached status. Do not use telemetry `shortHashrate` to drive loop speed: it is a 10-second average, and zero, missing and stale have different meanings.

### Future event reactions

The backend emits `resultsAccepted` and `resultsRejected` only from positive deltas between authenticated XMRig summary counters after a session baseline; the first sample seeds the baseline. If a later milestone adds reactions, consume new event IDs exactly once from the `mining_events` snapshot, never replay the initial buffer after mount/reconnect, and clear the cursor on a reliable session boundary. An accepted result may cause one brief, modest acknowledgment; a rejected result may cause one subdued attention cue. Batched `count` is still one event, not `count` invented individual moments. Deduplicate by event ID, cap queued reactions, ignore old events, and suppress reactions during stale/unavailable status or reduced motion. Ensure event-to-session correspondence before connecting the feed to the Overview scene: the present status DTO lacks `sessionId`, and Stream polling is Mining-only. Neither event type proves a block, payout or earnings. Pool connection events may change textual context, but must not trigger a result celebration.

## Rendering choice

| Option | Strengths | Costs and fit |
| --- | --- | --- |
| CSS layers + transparent PNG/WebP poses | Native DOM integration, simple static/reduced-motion fallback, low idle overhead, easy React and screenshot testing; `image-rendering: pixelated` at integer scale | Many individual frames can cost requests/memory; use only a few poses and layers. CSS cannot author convincing pixel character shapes. |
| Sprite sheets with frame stepping | Consistent pixel grid, compact requests, deterministic frame order | Requires an animation scheduler and careful cleanup; many sheets grow memory. Use for approved motion after the static scene works. |
| Canvas 2D | Flexible composition and tight frame control | More custom draw/input/visibility/accessibility/test code and ongoing render work; unnecessary for this small scene. |
| SVG for effects | Resolution independent halos, masks and ornaments | Scaled vectors can clash with nearest-neighbor sprites; keep it optional for non-pixel effects. |

**Primary D02 approach:** layered transparent PNG sprites for a static scene, rendered as DOM elements with integer nearest-neighbor scaling, plus restrained CSS glow. Add a small sprite-sheet frame stepper only when approved animation frames exist. No new dependency is needed. Avoid a `requestAnimationFrame` loop for a static scene; for future sheets, advance at the sheet's low authored frame rate and stop on hidden/unmounted/reduced-motion states. Validate CPU use and frame stability in the packaged Windows WebView2 app before widening use. This approach reuses React's lifecycle, the current CSS palette and existing screenshot-friendly markup, while leaving readouts and controls independent.

## Asset production contract for owner review

- Create a **320 × 180** transparent master scene canvas. Keep each exported layer on that same origin and dimensions so layers align without per-pose offsets. Character target bounding box: roughly 72 × 80 logical pixels; crystal target: roughly 48 × 64. These are art targets to evaluate, not instructions to enlarge tiny details mechanically. The approved still should be legible in the actual Overview slot before frames are commissioned.
- Export transparent **PNG (RGBA)** at 1× logical resolution as the canonical pixel source. WebP lossless may be evaluated after visual comparison; never use lossy compression on pixel edges. Keep an opaque graphite backdrop in CSS, not baked into the pose. No premultiplied-looking fringe, resampling, antialiased sprite pixels or off-grid accents.
- Use one consistent pixel grid, lighting direction (upper left), outline weight and limited palette across all poses. Favor a compact shared character/crystal palette (approximately 16–24 core colors plus limited state accents); keep amber tied to existing tokens. Eyes and limbs must survive downscaling/cropping. CSS glow may be smooth outside silhouettes, but never recolor pixels to suggest a different signal.
- Naming proposal under `public/living-core/v1/`: `scene-base.png`, `character-ready.png`, `character-starting.png`, `character-mining.png`, `character-stopping.png`, `character-stopped.png`, `character-attention.png`, `character-unavailable.png`, and corresponding `crystal-*.png` only where the silhouette genuinely changes. Use a reviewed `scene-fallback.png` still. Keep `notConfigured`/`paused` explicit if they differ from stopped. This directory is a future contract; no assets are added in D01.
- If motion is approved, a horizontal sheet uses equal **320 × 180** cells for whole-scene frames, or equal-size layer cells with a documented anchor. Name `character-mining-v1.png` and record frame count, cell size, frame duration and intended loop in a small asset manifest. Start with 4–8 frames per ambient loop at 4–8 fps; transitions use at most 6–10 frames and finish within about one second. No 60 fps art requirement. A static first frame must stand alone.
- Version changed silhouettes or frame geometry with a new `vN` directory and manifest rather than silently replacing approved files. Approve the static ready/mining/attention/unavailable compositions at native Windows sizes before animation. Review contact sheets for pose consistency and file dimensions, alpha channel, palette drift, crop/safe area and nearest-neighbor rendering. Automated asset validation in D02 should check file existence, expected dimensions, sheet divisibility, alpha presence and manifest references; native visual review decides actual quality.

## Open owner decisions

1. Approve the character silhouette, eye language, and workshop/crystal stills before animation production.
2. Choose whether the Overview scene should receive more horizontal space than today's 154 px Core slot after seeing a native static mockup at 820–1440 px and 200% zoom.
3. Approve the final cropped/static fallback and whether a later milestone should bring the scene to Mining; D02 keeps Mining unchanged.
4. Decide whether event reactions belong in a later milestone after a reliable frontend session identity or equivalent boundary exists.
