# Ember Roadmap

**Status:** Directional roadmap recorded 2026-09-29. Milestone outcomes are intended scope, not commitments to dates or final feature sets.

## M00 — Project foundation

- **M00A — Legacy audit:** complete. Read-only evidence-based review of historical repository.
- **M00B — Product and architecture documentation:** complete. Source-of-truth product, architecture, security, roadmap, decision, and legacy documentation established.
- **M00C — Repository reorganisation and application foundation:** complete. Historical source is separated under `legacy/`, generated packaging output is removed from the active tree, and the root contains a buildable Tauri 2/React/TypeScript shell with a basic tray/window lifecycle. Mining is not implemented.

## M01 — Desktop shell and design foundation

- **Complete:** Established a consistent desktop visual system and state-aware Ember core, preserved the four primary sections, and made each page clearly reflect the unconfigured product state. Metrics and activity remain empty/unavailable; settings and mining controls are non-interactive. No mining behavior was added.
- **M01.1 — Native UI polish: complete.** Retained the manually reviewed visual direction while improving supporting-text readability, simplifying page chrome and product copy, adding a reusable truthful device-status area, and tightening Activity’s empty state. No system or mining functionality was introduced.

## M02 — Windows tray and local monitoring

- **Complete:** Added a typed, Rust-owned local snapshot for CPU, memory, device/OS, uptime, power/battery, and session idle state; integrated it into Overview and This device; and added a disabled **Not mining** tray status with an honest tooltip. Sampling is limited to the visible app and remains in memory. No mining/resource-control behavior was added. Temperature, fan speed, and CPU/GPU power remain deferred because generic low-privilege sources are not dependable across Windows hardware. Autostart remains undecided and out of scope.

## M03 — Mining-engine integration

- **M03A — XMRig research and engine contract: complete.** Verified current upstream license/release/API sources; recorded a preferred verified official-release download strategy subject to legal review; defined process, API, lifecycle, telemetry, consent, contribution and trust boundaries. No miner was acquired or executed.
- **M03B — Controlled engine implementation: next.** Resolve legal and signing-key prerequisites; implement the Rust-owned MiningEngine/XMRig boundary, deterministic config validation, provenance verification and supervised child lifecycle. Start with fake-process/API fixtures and dry-run validation; no autostart, contribution mechanism, onboarding, or earnings. Do not ship acquisition until legal approval.
- **M03C — First end-to-end mining setup: later.** Add guided wallet/pool setup, explicit resource and contribution disclosure, consent-gated start/pause/stop, live structured telemetry, and user-visible failure/recovery behavior after M03B's process and distribution controls are proven.

## M04 — Beginner onboarding and wallet configuration

Guide users through mining implications, public address setup, initial profile, contribution disclosure, and informed start. Keep key custody out of scope.

## M05 — Smart Mining

Add understandable profiles and resource/activity policies with visible reasons, user limits, and safe overrides based on supported signals.

## M06 — Statistics, pool data, earnings, and electricity estimates

Present normalized mining/pool statistics and transparent estimates with stated data sources and assumptions, distinguishing measurements from estimates.

## M07 — History, milestones, and notifications

Add useful local history, configurable notifications, and optional engagement features that preserve cost and profitability transparency.

## M08 — Contribution, release hardening, and distribution review

Implement the disclosed 5% contribution only after an auditable design is approved; complete installer, update, licensing, integrity, privacy, and Windows distribution reviews before release.

## M09+ — Optional services foundation

Evaluate optional accounts/profiles and cloud capabilities without making them prerequisites for local mining. Define privacy and security boundaries before service implementation.

## Later possibilities

Multi-device monitoring; remote management after a separate security decision; Expert Mode; additional engines/assets; community systems; Ember Pool evaluation; and rewards/economy research. These are exploratory and are not MVP commitments. No token is in the initial architecture.
