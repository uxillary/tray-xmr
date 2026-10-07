# M05C — Ember UI Cohesion Audit

**Status:** Audit and proposal only. No runtime behavior or backend contract changes are part of this document.

## A. Current-state assessment

Ember already has a recognizable foundation: graphite surfaces, a restrained warm accent, a custom Ember Core, a stable desktop sidebar, real mining telemetry and a clear Stop action. Mining is substantially more coherent than the older utility-style surfaces: its hashrate leads, related session facts sit together, and advanced measurements are disclosed under Details. The M05A/M05B boundary also gives the Stream a truthful source and concise language.

The app still reads as several individually framed screens. Overview combines a large promotional hero, a live telemetry strip, a six-item system panel made of nested mini-cards, and a setup/attention panel. Settings and setup repeat bordered sections and rows. Repeated borders, fills and radii make secondary information compete with primary state. The Ember Core is a strong brand object, but its large Overview treatment and small Mining treatment do not yet feel like a consistent state language.

There are also concrete cohesion and fit issues: the Stream’s green glowing dot and “Live activity” label are unconditional, including empty or unavailable states; several Settings rows describe features that cannot currently be changed; and both Tauri and CSS enforce a 900px minimum despite the requested 820px review width. At 200% zoom, that minimum can force horizontal overflow instead of letting the desktop composition compress.

## B. Screen-by-screen findings

### Shell and sidebar

- **KEEP:** Stable four-section navigation, clear selected state, Ember wordmark, independently scrolling sidebar/workspace, and the compact local device readout.
- **REFINE:** Tighten the large gap below the brand on short windows. Map known `error`/attention states to a visible text treatment in the device readout; it currently falls through to “Not mining.” Keep the state label explicit so the LED is never the only cue.
- **REMOVE / MERGE:** None required. Do not add more persistent sidebar metrics or controls.
- **DEFER:** Account, machine fleet, notification center and other navigation for unbuilt capabilities.

### Overview

- **KEEP:** One clear state badge, Ember Core, a compact mining snapshot, local system awareness and a next-step message when setup is incomplete. Keep unavailable values explicit.
- **REFINE:** Make the current machine/mining state and any needed action the first read. Reduce the hero’s generic brand copy and visual height so the live state has more room. Bring system awareness into a quieter, flatter section; its six inset cards currently sit inside a bordered panel and repeat the same visual treatment as the hero and setup panel. Use a compact glanceable subset and leave secondary device facts available without duplicating Mining.
- **REMOVE / MERGE:** Merge the separate setup-ready/attention panel into the hero’s status/action area where practical. Avoid presenting the same “ready” state as both hero badge and another equally framed panel.
- **DEFER:** Earnings, trends, charts, and a second copy of the Mining Stream/session details.

### Mining

- **KEEP:** The single operational session composition; high-contrast hashrate; visible Stop; pool route; configured profile/thread allocation; duration; accepted/rejected results; and progressive Details disclosure. These support the approved hierarchy and preserve important caveats.
- **REFINE:** Treat Core, lifecycle label and hashrate as one coordinated state composition. Keep the rate dominant while aligning its baseline and support copy with the state object. At narrower widths, validate that Stop remains prominent and session facts remain scannable without cramped columns. Use a quieter divider/spacing hierarchy inside the session surface.
- **REMOVE / MERGE:** Do not add standalone cards for facts already grouped in the session composition. Retain the single outer session surface and avoid adding another enclosing panel around it.
- **DEFER:** Pause/Resume, automatic profile behavior, worker claims, additional telemetry and session history.

### Ember Stream

- **KEEP:** Placement directly below the active operational composition, newest-first short list, supplied local-time timestamps, human wording, category labels, icons and separate raw diagnostics.
- **REFINE:** The unconditional green glow reads as a live/healthy signal even when the Stream is empty, unavailable or the session has ended. Make the indicator neutral by default or bind its appearance and supporting label to a known state; do not create a new activity signal. Increase the 9px category and 10px timestamp legibility slightly at desktop zoom while keeping them subordinate. Preserve the continuous rows and separators rather than boxing each event.
- **REMOVE / MERGE:** Do not add toolbar controls, a second timeline container, or extra event-count chrome unless it helps a real decision. The current “recent events” count is optional visual weight.
- **DEFER:** Persistent history, filters, export, fabricated sample entries, telemetry-sample events and new event kinds.

### Activity

- **KEEP:** Honest empty state; the screen must not imply M05A’s in-memory Stream is persistent history.
- **REFINE:** Establish the future timeline’s visual language with a restrained empty anchor/vertical guide and a clear statement that saved activity is not available yet. Keep the height and contrast lower than a populated timeline so the empty screen does not resemble a large dashboard card.
- **REMOVE / MERGE:** Avoid generic icon-in-a-card treatment if a simple timeline-shaped empty state can reuse the Stream’s typography and marker language.
- **DEFER:** Entries, dates, retention, export, deletion and any claim that current session events are saved here.

### Settings

- **KEEP:** Mining setup summary and edit path, diagnostics mode disclosure, explicit integration-test safety explanation, visible test Stop, and expandable sanitized details.
- **REFINE:** Group settings by purpose with consistent heading/row spacing and fewer nested surfaces. Keep destructive or session-ending controls visually distinct. Ensure result labels (“Passed,” “Failed,” etc.) remain understandable without their colors.
- **REMOVE / MERGE:** “Appearance — Using Ember’s default appearance” and “Notifications — No notifications configured” currently look like editable settings but expose no action. Present these as a compact “Defaults” note or omit them until they are configurable; do not style them as disabled controls.
- **DEFER:** New appearance choices, notification preferences, account controls and expanded diagnostics that lack a product decision.

### Mining setup

- **KEEP:** Wallet → Pool → Power → Review order, clear public-address/private-key safety copy, explicit TLS choice, complete risk disclosure, fresh acknowledgement behavior, visible Start, and advanced readiness details.
- **REFINE:** The numbered steps currently use similar bordered cards whether complete, current or upcoming. Use a single progressive stack with clearer current/completed emphasis and concise saved summaries, while retaining direct editing and all review disclosures. The ready banner and still-expanded configured steps repeat readiness/profile/thread information; reduce that repetition. Keep risk text readable and never hide it merely to shorten the page.
- **REMOVE / MERGE:** Merge redundant ready/profile summaries; do not remove required setup steps or disclosure language.
- **DEFER:** A generic signup wizard, setup automation, recommendations requiring unimplemented data, and Smart Mining policy UI.

## C. Cross-app visual system findings

Prefer refining the existing CSS variables and component styles over introducing a new design system.

- **Typography:** Keep the existing Segoe UI/Aptos body family and 25px page title / 15–16px section scale. Establish a consistent three-level hierarchy: page or primary state, section/metric, then supporting metadata. Reserve 9px uppercase eyebrows for decoration; raise data-bearing Stream labels/timestamps from 9–10px toward 11px where space permits. Keep numeric values tabular and high contrast.
- **Spacing:** Reuse the existing 4/8/12/16/20/24/32/40px spacing variables. Standardize page-to-section gaps and inner panel padding instead of mixing nearby hard-coded values. Preserve generous separation between major state groups and tighter spacing within a group.
- **Card/surface hierarchy:** Use three clear levels: workspace background, one raised primary composition per screen, and flat/inset secondary content. Prefer dividers and whitespace for peer facts. Avoid an outer card containing several equally bordered cards. Reduce use of gradients to a few identity/primary surfaces.
- **Accent and borders:** Keep warm Ember color for brand, focus, primary actions and meaningful emphasis. Reserve green/amber/red for known success, caution and error states, with text or icon shape alongside color. Use subtle borders for grouping and stronger borders only for the primary surface or actionable state.
- **Radii and shadows:** Retain the existing 6/9/13px progression. Apply the larger radius and panel shadow to the principal composition, not every section. Keep secondary rows flatter.
- **Icons:** Continue Phosphor at consistent 16–18px sizes. Use icons as a category/state aid with a text label; avoid adding an icon to every row or using icons as the only status signal.
- **Status treatment:** Reuse known Rust/frontend state labels. Pair LEDs with text, show errors distinctly from idle/not-mining, and do not render a green “live” indicator when the event source is unavailable or quiet. Keep “configured” distinct from “active.”
- **Motion:** The global `prefers-reduced-motion` override already suppresses animation and transitions. Preserve it. Any later transition should clarify a real known state change, remain brief, and have a static equivalent; avoid continuous decoration.
- **Empty states:** Share heading, supporting-copy and icon/timeline alignment. Use a small quiet visual cue and one direct sentence. Never show sample cards, fabricated timestamps, simulated counts or fake history.
- **Desktop fit:** `src-tauri/tauri.conf.json` and `body` CSS both specify a 900px minimum, while the audit target is 820px. Resolve this deliberate product constraint before claiming 820px support. Validate at 1440px, 1024px, the chosen minimum, short heights and 200% zoom; check horizontal overflow, Stop visibility, sidebar navigation and details access.

## D. Proposed M05C implementation scope

### P0 — Cohesion and fit

1. Establish the shared page/section/metadata type and spacing rhythm using existing variables; reduce nested borders and competing panels on Overview, Settings and setup.
2. Make lifecycle/status accents truthful and consistent across sidebar, Ember Core, Mining and Stream. In particular, distinguish known attention from idle and remove the Stream’s unconditional healthy/live cue.
3. Reconcile the app’s minimum-width requirement with the 820px target, then preserve independent scroll and access to Stop, navigation and setup details at that width and at 200% zoom.

### P1 — Screen-level polish

1. Flatten Overview system awareness and consolidate its readiness/attention message with the primary state.
2. Refine Mining’s inner alignment and Stream typography/spacing without changing the operational hierarchy or event contract.
3. Make setup progression/completion clearer with concise saved summaries; retain all safety/review text.
4. Replace inactive-looking Appearance/Notifications rows with a truthful compact defaults presentation. Align Activity’s empty state with the future timeline language without showing entries.

### P2 — Optional refinement

1. Tune subtle Core states for Ready, stopped and known attention using existing motion/contrast patterns; no new state may be inferred.
2. Add small transition/hover refinements only where they improve orientation and remain useful with reduced motion.
3. Consolidate obsolete CSS selectors discovered during implementation, but only after confirming they are unused; avoid broad cleanup in the audit pass.

Keep M05C to shared CSS/component-level cohesion and shallow screen refinements. It should not need new dependencies or backend work. Verify TypeScript, targeted frontend tests, the project build where available, and visual review at the listed desktop sizes and zoom levels.

## E. Explicit non-goals

- **M06 Smart Mining:** no idle/activity policy, scheduling, adaptive profile, battery guard or pause/resume behavior.
- **M07 Economics:** no earnings, fiat conversion, profitability, electricity-cost or net-result UI.
- **M08 Progression:** no XP, levels, achievements, streaks or reward loops.
- **M10 broader visual evolution:** no new brand, large-scale Core redesign, decorative animation system or wholesale component framework.
- **M11 Activity/history:** no persistence, retention, export, deletion or claims that the process-local Stream is history.
- **M12 release hardening:** no installer, signing, licensing, clean-device, security-product or release-readiness work.

Do not change Rust mining ownership, event truth, telemetry semantics, Stop/Quit behavior or raw diagnostics boundaries.

## F. Recommended implementation order

1. Confirm the supported minimum window width and test setup at that size and 200% zoom.
2. Define the shared typography, spacing, surface and status rules by adjusting existing tokens/styles.
3. Update the shell/sidebar and shared state treatments, including accurate idle/attention labels.
4. Simplify Overview and Settings surface hierarchy using the shared rules.
5. Refine the Mining composition and Stream within the approved hierarchy.
6. Clarify setup completion and saved summaries without reducing disclosure.
7. Shape Activity’s empty state from the established Stream/timeline language.
8. Verify behavior and layout at 1440px, 1024px, the chosen minimum width, short viewport heights and 200% zoom; run targeted tests/build and review keyboard, focus, reduced-motion and non-color status cues.

### Roadmap cleanup item

`docs/ROADMAP.md` contains two separate `## M05 — Ember Stream` sections. Merge the milestone status and forward-looking description into one section during the later M05C implementation pass; this audit does not modify the roadmap.
