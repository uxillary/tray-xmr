# Ember Roadmap

**Status:** Directional roadmap recorded 2026-09-29. Milestone outcomes are intended scope, not commitments to dates or final feature sets.

## M00 — Project foundation

- **M00A — Legacy audit:** complete. Read-only evidence-based review of historical repository.
- **M00B — Product and architecture documentation:** current. Establish source-of-truth product, architecture, security, roadmap, decision, and legacy documentation.
- **M00C — Repository reorganisation and application foundation:** next. Resolve treatment of historical/generated artifacts, establish a clean Ember application foundation, and preserve legacy context. Scope and acceptance criteria should be confirmed before execution; no implementation is part of M00B.

## M01 — Desktop shell and design foundation

Establish a Tauri 2, Rust, React, and TypeScript Windows-first shell with a restrained Ember visual foundation and explicit frontend/backend boundaries. No mining behavior until the required trust and process contracts are designed.

## M02 — Windows tray and local monitoring

Establish a user-visible tray/window lifecycle and safe local system-status foundation. Decide opt-in autostart and define which activity, battery, or hardware signals are dependable before relying on them.

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
