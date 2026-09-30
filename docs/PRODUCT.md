# Ember Product Direction

**Status:** Product direction for the reboot, recorded 2026-09-29. This document distinguishes current decisions from future and exploratory ideas; it is not a release commitment.

## Vision

Ember aims to make cryptocurrency mining approachable for people with no mining experience while retaining a path to capable controls for experienced users. The working proposition is **“Put idle power to work.”** Ember should normally be available from the Windows system tray and make mining activity, resource use, earnings estimates, electricity estimates, and the Ember Contribution understandable.

The brand direction is premium, modern, dark, restrained, trustworthy, technically capable, and approachable, with subtle crypto/cyberpunk influence. Full visual design is out of scope for this documentation milestone.

## Audiences and experience

- **Beginners:** guided explanations, sensible defaults, clear cost and resource implications, and no need to edit miner configuration by hand.
- **Experienced users:** a later path to pool, miner, resource, and diagnostic controls without making the default experience intimidating.

The eventual onboarding should explain what Ember and mining do, hardware and electricity implications, profitability uncertainty, wallet choices, public address entry, the initial profile, the 5% Ember Contribution, and what starting mining means. Mining should start only after the user has made an informed choice.

## Product principles

The intended beginner setup is **Wallet → Pool → Power → Review → Ready**, presented on one calm Mining page with progressive disclosure. The page asks where rewards go, offers a future recommended-pool path when reviewed provider details exist and keeps manual custom-pool fields behind an explicit choice, then asks how many CPU threads to use and presents the disclosures. Rust retains all authoritative validation/readiness; successful engine and technical checks stay under Setup details, while repair and configuration errors are shown beside an action.

The Mining page offers verified engine status/repair, public wallet change/removal, explicit manual pool host/port/TLS, static Quiet/Balanced/Performance profiles, disclosure review and Rust-owned readiness. Settings links to the same editor. Complete setup may show Ready in Overview, with mining metrics unavailable and Start disabled. A review acknowledgement is not a start action; app launch never mines. Changes require a fresh review. The planned 5% Ember Contribution is visibly inactive, distinct from XMRig's separate 1% donation. A future controlled development session may run without Ember's contribution only when explicitly authorized and labeled; user-facing release policy remains pending.

1. **Understandable by default:** use profiles and explanations rather than requiring users to understand threads or miner flags.
2. **Visible and controllable:** show mining state and provide straightforward pause, stop, and quit actions.
3. **Honest about money and resources:** label estimates, state assumptions, and distinguish measurements from estimates.
4. **Non-custodial:** accept a public receiving address when needed; never request or store seed phrases or private keys.
5. **Local-first:** basic mining and local statistics should not require an Ember account or cloud service.
6. **Trust over growth mechanics:** engagement features must not obscure costs or pressure users to mine.
7. **Extensible without premature platforms:** begin with Windows, Monero, and the expected XMRig engine while keeping product boundaries open to future engines and assets.

## Initial product boundary

**MVP direction, subject to refinement:** Windows desktop application; Monero as the first asset; XMRig as the expected initial engine; local configuration and statistics; beginner-oriented setup; visible mining controls and state; a Windows tray experience; transparent operating/resource information; and no account requirement for core use.

The precise MVP feature set and release acceptance criteria remain pending. Feature concepts described below are not promises that they will all ship in the first release.

## Smart Mining

Smart Mining is a core product direction. Candidate profiles are **Quiet**, **Balanced**, and **Performance**. Potential controls include CPU/resource limits, idle-only operation, schedules, response to active use or games, laptop/battery safeguards, and temperature-aware behavior where reliable telemetry is available. Changes of state should have plain explanations (for example, “Mining paused — running on battery”). Detection algorithms, supported signals, override rules, and profile defaults remain future design work.

## Tray, dashboard, and information

The tray is a primary interface, not an afterthought. Later design should consider concise state/hashrate/profile information, pause/resume, open, and quit actions, and clarify the difference between closing a window and quitting Ember. Exact lifecycle behavior remains an architecture decision.

The dashboard may eventually show current and average hashrate, accepted/rejected shares when available, uptime, mining state, profile, estimated earnings and fiat value, electricity and net estimates, reliable temperature readings, lifetime data, history, and contribution statistics. None of these figures may imply guaranteed earnings or profitability.

## Transparency and Ember Contribution

The current business-model decision is a **5% Ember Contribution** from mining activity. It must be disclosed during onboarding before mining, understandable, accurately represented, and visible in relevant settings/statistics. It must never be hidden, disguised, or described misleadingly. How the contribution is implemented and independently audited is **pending architecture and licensing/security research**; M00B does not choose a mechanism.

Electricity estimates should use a user-configured electricity rate. The conceptual calculation is gross mining value minus estimated electricity cost equals estimated net result. Power draw may be estimated rather than measured; the interface must say which. Exchange rate, pool data, tariff, measurement quality, and other assumptions must be visible enough to interpret the result.

## Feature horizons

### MVP direction

- Windows-first, local-first desktop experience.
- Monero and expected XMRig integration behind a mining-engine boundary.
- Guided, non-custodial wallet address setup; no key custody.
- Explicit mining consent, visible state, accessible pause/stop, and sensible resource controls.
- Clear disclosure of the 5% Ember Contribution.

### Later

- Smart Mining profiles and activity/battery/schedule responses.
- Rich statistics and history, configurable notifications, milestones, and optional Expert Mode.
- Optional accounts/profiles and cloud enhancements that do not gate basic local mining.
- Multi-device monitoring, with explicit enrollment, before any remote management.

### Exploratory

- Community features, rankings, and progression systems.
- Ember Pool evaluation and additional assets/engines.
- Any transferable token or financial instrument. No token is part of initial architecture; future progression should first be considered as non-transferable XP, achievements, contribution metrics, or reputation.

## Explicit initial non-goals

- A cryptocurrency wallet or custody of keys/seeds.
- Requiring an Ember account or cloud connection for core mining.
- Ember-owned pool dependency, a token, or a financial instrument.
- Remote control or backend infrastructure in the initial foundation.
- A general plugin system or broad cross-platform MVP.
- Hidden mining, deceptive persistence, security-tool evasion, or concealed resource use.
- Guaranteed profitability claims.

See [Architecture](ARCHITECTURE.md), [Security](SECURITY.md), [Roadmap](ROADMAP.md), and [Decisions](DECISIONS.md) for boundaries and open questions.
