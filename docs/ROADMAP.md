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

Extend the basic tray/window lifecycle with safe local system monitoring. Decide opt-in autostart and define which activity, battery, or hardware signals are dependable before relying on them.

## M03 — Mining-engine integration

Implement a controlled engine lifecycle behind an abstraction, beginning with XMRig only after acquisition, licensing, integrity, API, and process-safety decisions are resolved.

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
