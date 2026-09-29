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
- **M03B — Safe engine groundwork: complete.** Added an internal Rust MiningEngine contract, deterministic configuration validation, fixture-only XMRig summary parsing, a verified-artifact gate, supervised child lifecycle, bounded/redacted diagnostics, and tray-Quit cleanup. Tests use only local fixtures and the Rust test executable; no XMRig was acquired or run. Start remains disabled.
- **M03B.1 — Process ownership hardening: complete.** Windows creates suspended, assigns to a kill-on-close Job Object, then resumes. Windows tests and the feature-gated packaged host verified four graceful parent/descendant cleanup cycles; external termination of the packaged Ember owner also removed its live fixture parent and descendant. The user manually verified normal Ember launch, tray experience, and tray **Quit** exit. Real XMRig remains disabled.
- **M03B.2 — Native startup diagnosis: complete.** The `0xC0000409` result was specific to launching the release executable from Codex’s restricted sandbox identity: WebView2 returned `0x800700AA` before Tauri setup, and release panic-abort surfaced the status. The same normal release executable remained running with its Ember window when launched as the logged-in Windows user; no application code change was warranted for startup.
- **M03C.1 — Verified XMRig provisioning: complete.** Pins XMRig v6.26.0 Windows x64, verifies the official detached manifest signature against the independently confirmed key and the archive SHA-256, extracts safely, atomically promotes to per-user app data, and records integrity metadata. Deterministic fixtures pass; the one controlled real provisioning run succeeded. `xmrig.exe` was never executed. GPL/dependency legal review remains open before public release.
- **M03C.2A — Local launch readiness and consent setup: implemented.** Startup/readiness integrity checks, mainnet public-wallet validation/storage, explicit manual pool/TLS, static CPU profiles, ephemeral loopback candidate config, revision-bound consent and readiness UI. Start is disabled; XMRig has never executed. See [integration contract](XMRIG_INTEGRATION.md).
- **M03C.2B — First controlled mining session: next, separately authorized.** Requires production verified-artifact/launch bridge, immediate pre-spawn gate, private runtime file/ACL/crash cleanup, port handoff/retry, concrete restricted authenticated telemetry/identity checks, graceful stop and packaged cleanup/recovery verification. Select real wallet/pool/profile and fresh consent; visibly label this development session as without Ember contribution. No Smart Mining or contribution mechanism is authorized by C.2A.

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
