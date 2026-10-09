# Ember Roadmap

**Status:** Directional roadmap, updated 2026-10-07. Outcomes are intended scope, not dates or release commitments.

## M00 — Project foundation

- **M00A — Legacy audit:** complete. Evidence-based review of historical repository.
- **M00B — Product and architecture documentation:** complete; now extended by this consolidation.
- **M00C — Repository reorganisation and application foundation:** complete. Historical source is under `legacy/`; active tree contains the Tauri 2/React/TypeScript application shell.

## M01 — Desktop shell and design foundation

- **Complete:** established the visual system, four primary sections, state-aware Ember Core and honest unconfigured states. No mining behavior was added.
- **M01.1 — Native UI polish:** complete. Improved readability, page chrome, device status and Activity empty state.

## M02 — Windows tray and local monitoring

- **Complete:** typed Rust-owned local snapshots for CPU, memory, device/OS, uptime, power/battery and coarse session idle state; visible Overview/device presentation and disabled **Not mining** tray state. Sampling is local, in-memory and limited to the visible app. No resource control is applied. Generic temperature, fan and CPU/GPU power telemetry remain deferred.

## M03 — Mining-engine foundation

**Functional foundation complete; public-release hardening remains.** M03 established verified XMRig v6.26.0 Windows x64 provisioning and provenance, artifact integrity checks, deterministic generated configuration, public-wallet and explicit pool/profile setup, revision-bound consent, a supervised Windows process path, kill-on-close Job Object ownership, no-console launch, authenticated loopback API, lifecycle control, Stop/Quit cleanup, bounded sanitized diagnostics, native integration diagnostics and a controlled real-mining path. A subsequent current-release owner session passed native acceptance; the earlier owner-machine API startup failure is no longer reproducing, with no root cause claimed.

- **M03A — Research and engine contract:** complete. Licensing and distribution approval remain open.
- **M03B — Safe engine groundwork and process ownership:** complete. Includes deterministic validation, bounded/redacted diagnostics, suspended creation before Job Object assignment, descendant cleanup, tray-Quit cleanup and packaged host checks.
- **M03B.2 — Native startup diagnosis:** complete. The earlier sandbox-specific WebView2 failure was isolated; no app workaround was needed.
- **M03C.1 — Verified provisioning:** complete. Pinned release signature and archive hash are verified before safe extraction/promotion, with local provenance metadata.
- **M03C.2A — Setup and consent:** complete. Mainnet public address, manual pool/TLS, static CPU profiles, generated candidate config and backend-owned readiness/disclosure.
- **M03C.2A.1 — Beginner setup UX:** complete. Wallet → Pool → Power → Review → Ready with progressive disclosure.
- **M03C.2B — Controlled mining session:** implementation and native owner-machine Start → Mining verification complete. The owner rebuilt the current release and observed authenticated local API telemetry, Connected pool, approximately 873 H/s, Quiet configured at 4 of 16 threads and an advancing session timer. Earlier reports of a live XMRig process without its loopback API remain historical; the issue is no longer reproducing and no root cause is claimed. See [XMRig integration notes](XMRIG_INTEGRATION.md).

## M04 — Mining telemetry and control

- **M04A — Telemetry contract and source audit:** complete. Verified pinned v6.26.0 `/2/summary` and `/2/backends` semantics, documented provenance and missing-versus-zero behavior, normalized summary rates/results/pool/CPU huge-page fields, and added freshness state. No Pause/Resume control.
- **M04B — Live mining session telemetry:** implementation complete and natively exercised. Overview and Mining consume Rust-normalized status via bounded, serial Tauri requests; display hashrate, pool state, results, session duration, configured profile/thread capacity and freshness. Stop remains the only session control.
- **M04C — Session reliability and control:** implementation and native startup/live telemetry acceptance passed. The owner has now also visually reviewed the stable live experience. The explicit Stop/Quit checklist remains for owner confirmation. Keep pool/API connectivity separate from process lifecycle; retain restricted API mode and defer Pause/Resume absent a safe verified mechanism. Backend worker evidence, helper-window prevention, stable sidebar and concise startup state are documented/implemented.
- **M04D — Mining experience polish:** implementation and owner native visual review complete. Review confirmed Starting → Mining, authenticated telemetry, Connected pool, real hashrate, Quiet configured allocation, advancing session time and a stable live UI. M04 is functionally complete; only M04C Stop/Quit owner acceptance remains before closure.

## M05 — Ember Stream

Create a bounded, timestamped operational feed from genuine Ember and mining events. Keep it human-readable, accessible, locally focused and distinct from advanced **Raw XMRig** diagnostics; redact secrets in both.

- **M05A — Event model & translation layer:** event domain, baseline/delta translator, session identity, bounded process-local buffer and frontend retrieval command implemented. Deterministic Rust coverage is included; a clean build/test run remains required before milestone acceptance.
- **M05B — Stream presentation:** implemented. Mining reads the structured command and displays a compact, accessible recent-event stream with local-time timestamps, concise kind-based wording, category markers and severity icons. React creates no events. A clean build/test run remains required before milestone acceptance.
- **M05C — UI cohesion:** implementation complete. Flattens secondary surfaces, leads Overview with actual device state, distinguishes sidebar lifecycle/attention and stale readings, makes Stream status truthful, and aligns the normal minimum window width to 820px with zoom reflow. Production build and focused frontend tests pass; the existing full-test Vite SSR `EPERM` and owner visual review at target sizes remain open.
- **M05D — Live experience & visual UX refinement:** implementation complete. Gives the Mining session a roomier Core/rate composition, typographic emphasis to the rate unit and operational facts, and a stable startup-stage slot so telemetry arrival does not rebuild the layout. Improves Stream and setup-description readability without adding data or controls. Production build and pure frontend tests pass; Vite SSR `EPERM` and owner visual review at target sizes remain open.
- **M05E — Visual Composition Pass:** implementation complete; owner visual acceptance pending. Recasts the active Mining session as a spacious Core-and-hashrate hero with a lower operational facts rail and a quieter session-activity timeline. Gives Overview a more state-led Core presentation, flattens local system information, refines sidebar identity and Settings spacing, and compresses saved setup steps while retaining the full Review disclosure. Responsive layouts recompose the live hero and facts at narrower widths. No mining or backend contracts changed. TypeScript and production build pass; `npm test` reports 11 passing tests and one Vite SSR `EPERM` failure resolving `EmberCore.tsx`. Visual review at 1440px, 1200px, 1024px and 820px remains for the owner.
- **M05F — Readability & Usability Refinement:** frontend implementation complete; owner visual acceptance pending. Reduces unnecessary Mining hero height without reducing the Core, enlarges Stop to a 44px target, aligns and spaces technical Details rows with stronger headings, and raises frequently read Mining, Stream, Settings, safety and sidebar text sizes. Improves Settings control hit areas and gives diagnostics results more row spacing while keeping that section secondary. Preserves lifecycle, telemetry, event, setup and consent behavior. TypeScript/build and focused telemetry/Stream tests pass; full `npm test` remains affected by Vite SSR `EPERM` resolving `EmberCore.tsx`. Review at target sizes and 200% zoom remains for the owner.

### M03 public-release hardening still required

- Retain owner-controlled real-session verification across release candidates; the earlier API startup issue is no longer reproducing.
- Review GPLv3 acquisition/aggregation, notices, Corresponding Source and dependency licensing.
- Define signing-key rotation/revocation and XMRig update/rollback/support policy.
- Test packaged release behavior on clean Windows systems, including Defender and SmartScreen outcomes and user recovery.
- Confirm installer/update, diagnostics/support, accessibility, performance, clean uninstall and disclosure polish before public beta.
- Keep autostart mining opt-in only; no automatic mining is enabled.

## M06 — Smart Mining v1

Make Quiet/Balanced/Performance real, explainable policies using reliable idle/activity signals, resource adaptation, schedules, battery safeguards and foreground/demanding-workload response where reliably detectable. Keep Stop/Quit available. Promise thermal behavior only if trustworthy telemetry exists.

## M07 — Earnings & Economics

Show session/lifetime XMR and authoritative pool-reported earnings where available, fiat conversion, daily/monthly estimates, electricity-cost estimate and estimated net result. Label measured, pool-reported, observed and estimated values with their source and uncertainty.

## M08 — Progression & Rewards

Explore truthful milestones, achievements, records, lifetime progression and Ember visual feedback. Potential evidence includes accepted shares, mining time, Smart Mining time, session/lifetime milestones, personal hashrate records, reliability and efficient idle mining. Any XP/level is application progression, with no cryptocurrency, financial value or transferability. Reward consistency, efficiency and Smart Mining; do not pressure unsafe temperatures, wasteful power or unsuitable uptime.

## M09 — Ember Contribution

The selected transparent model is implemented: 19 parts user-wallet mining to 1 part developer-wallet mining, measured by active mining time (D-058, D-059). The scheduler restarts XMRig between slots, counts active mining time by destination across explicit starts during one app run, and exposes the current slot and totals after fresh consent. This targets 5% of active mining time and only approximates reward share; pool variance and restart/reconnect overhead affect results. Counters are in-memory, not lifetime or pool-accounting records. Keep the fee distinct from XMRig's upstream 1% donation and never imply it is unavoidable or impossible to modify on a user-owned computer.

## M10 — Experience & Visual Language

Continue product polish throughout earlier milestones; this is a dedicated broader refinement horizon, not a reason to defer usability work. Develop meaningful Ember Core states, visual state representations and GUI metaphors, reduced text density, progressive disclosure, beginner/advanced layers, accessible alternatives and restrained motion. Keep the premium graphite/warm Ember visual language calm and technical, not casino-like.

## M11 — Activity & History

Make Activity a useful local historical timeline for sessions, accepted/rejected work when verified, profile changes, Smart Mining decisions, connectivity, errors/recovery, milestones and contribution activity. Define retention, export and deletion before accumulating history.

## M12 — Release Hardening & Public Beta

Complete installer and update strategy, first-run polish, recovery and support diagnostics, Defender/SmartScreen testing, licensing/dependency review, accessibility/performance review, clean uninstall, and zero-console-flash verification. Normal Ember operation must not visibly flash command prompts or console windows. By public beta, Start → Ember Starting → Mining must remain within Ember's experience; inspect helper processes, ACL/security commands and setup/verification utilities if any flash remains. This is ordinary desktop polish, never stealth or evasion. Autostart remains opt-in.

## M13+ — Ember Network

Only after the local single-machine product is excellent: explicitly enrolled machines, multi-machine status and aggregate statistics, optional account/sync, and authenticated remote control only after separate design, enrollment and revocation. No covert deployment or remote control. Ember Pool/community remain later research, not commitments.

See [Product](PRODUCT.md), [Architecture](ARCHITECTURE.md), [Security](SECURITY.md), and [Decisions](DECISIONS.md) for durable principles and boundaries.
