# Ember Product Direction

**Status:** Durable product direction, consolidated 2026-10-05. Planned concepts are not claims of currently shipped features; see [Roadmap](ROADMAP.md) for sequencing.

## Vision

Ember aims to make cryptocurrency mining approachable for people with no mining experience while retaining a path to capable controls for experienced users. The working proposition is **“Put idle power to work.”** Ember should normally be available from the Windows system tray and make mining activity, resource use, earnings estimates, electricity estimates, and the Ember Contribution understandable.

The brand direction is premium, dark graphite with a warm Ember accent, confident, calm and technical, with a subtle cyber/crypto influence. Avoid neon cliché and casino-like presentation.

## Audiences and experience

- **Beginners:** guided explanations, sensible defaults, clear cost and resource implications, and no need to edit miner configuration by hand.
- **Experienced users:** a later path to pool, miner, resource, and diagnostic controls without making the default experience intimidating.

The eventual onboarding should explain what Ember and mining do, hardware and electricity implications, profitability uncertainty, wallet choices, public address entry, the initial profile, the 5% Ember Contribution, and what starting mining means. Mining should start only after the user has made an informed choice.

## Product principles

The intended beginner setup is **Wallet → Pool → Power → Review → Ready**, presented with progressive disclosure. Prefer a simple primary surface, then useful details, then advanced/raw information. Experienced users should retain access to technical detail without imposing mining jargon on beginners. Rust retains authoritative validation/readiness; actionable errors belong beside the relevant action.

The current Mining setup offers verified engine status/repair, public wallet management, explicit manual pool host/port/TLS, static Quiet/Balanced/Performance profiles, disclosure review and Rust-owned readiness. A review acknowledgement is not a start action; app launch never mines. Changes require a fresh review. The planned 5% Ember Contribution is inactive and distinct from XMRig's separate 1% donation. A controlled development session may run without Ember contribution only when specifically authorized and labeled; public-release policy remains pending.

1. **Beginner first, advanced always available:** explain simply by default and progressively disclose details, advanced controls and raw diagnostics.
2. **Visual before verbose:** use status objects, meters, compact diagrams, visual flows, activity states, progress and meaningful icons before long explanations. Text clarifies the interface rather than dominating it. Provide accessible text alternatives.
3. **Mining should feel alive, honestly:** let genuine state and events make the experience responsive and rewarding. Never invent shares, earnings, work, hashrate, pool events, profitability, contribution or progress as mining output.
4. **Explain automatic behavior:** users should understand why Ember starts, pauses, resumes, reduces resources, changes profile or responds to battery, activity or workload.
5. **XMRig is the engine, not the experience:** ordinary users should not need to edit XMRig JSON, launch it, understand its CLI, configure its API, manage its process or inspect raw logs. Advanced diagnostics may expose redacted raw information.
6. **Trust over extraction:** never obscure poor profitability, electricity/resource use, contribution, upstream donation, errors, pauses or rejected shares.
7. **Visible and controllable:** state and controls are explicit; Start, Stop, Pause, autostart and future remote control remain user-controlled.
8. **Non-custodial and local-first:** use only public receiving information; never request/store seeds or private keys. Core local use should not require an Ember account or cloud.
9. **Extensible without premature platforms:** begin with Windows, Monero and XMRig behind clear boundaries.

## Ember Stream

Ember Stream is a planned live operational feed, not a terminal emulator or raw XMRig stdout window. It translates genuine observable mining and Smart Mining events into concise human-readable activity. Candidate categories include Engine, Connect, Work, Share, CPU, Smart, Earnings, Contribution, Warning, Error and System. Entries should support timestamps, hierarchy/severity, meaningful icons/status markers, restrained animation, bounded history and accessible non-colour indicators. Example wording is deliberately left to design work. Advanced users may inspect **Raw XMRig** output separately. Neither view may expose secrets, and every Stream event must derive from genuine observable state or an event.

## Progression and rewards

Planned progression may recognize truthful accepted shares, successful/lifetime mining time, Smart Mining time, session/lifetime milestones, personal hashrate records, reliability/uptime and efficient idle mining. Presentation could include achievements, records, an Ember level/XP system or visual Ember Core progression. XP and levels mean application progression only; they are not cryptocurrency, financial value or transferable assets. Prefer consistency, efficiency and Smart Mining. Never reward unsafe temperatures, wasteful electricity use, maximum load for its own sake or unsuitable uptime. Progression must not obscure real mining/economic state or pressure users to continue.

## Ember Core and visual language

The Ember Core should become a meaningful visual object representing real app/mining state, with possible dormant/stopped, ready, starting, mining, accepted-share pulse, Smart Mining adjustment, paused/cooling, attention/warning and error states. It is not a game dashboard. Motion stays restrained and respects reduced-motion preferences; labels/text alternatives communicate state without colour alone.

Vary the GUI where a visual model explains state more quickly than another text card: CPU/profile lanes, Smart Mining state flow, a truthful PC → Ember → Pool relationship, understandable energy meters, and compact earnings hierarchy are possible directions. These are examples, not mandatory literal designs. Keep accessibility and text alternatives.

## Initial product boundary

**MVP direction, subject to refinement:** Windows desktop application; Monero as the first asset; XMRig as the expected initial engine; local configuration and statistics; beginner-oriented setup; visible mining controls and state; a Windows tray experience; transparent operating/resource information; and no account requirement for core use.

The precise MVP feature set and release acceptance criteria remain pending. Feature concepts described below are not promises that they will all ship in the first release.

## Smart Mining

Smart Mining is a core product direction. Candidate profiles are **Quiet**, **Balanced**, and **Performance**. Potential controls include CPU/resource limits, idle-only operation, schedules, response to active use or games, laptop/battery safeguards, and temperature-aware behavior where reliable telemetry is available. Changes of state should have plain explanations (for example, “Mining paused — running on battery”). Detection algorithms, supported signals, override rules, and profile defaults remain future design work.

## Tray, dashboard, and information

The tray is a primary interface, not an afterthought. Later design should consider concise state/hashrate/profile information, pause/resume, open, and quit actions, and clarify the difference between closing a window and quitting Ember. Exact lifecycle behavior remains an architecture decision.

The dashboard may eventually show current and average hashrate, accepted/rejected shares when available, uptime, mining state, profile, estimated earnings and fiat value, electricity and net estimates, reliable temperature readings, lifetime data, history, and contribution statistics. None of these figures may imply guaranteed earnings or profitability.

## Transparency and Ember Contribution

The current working baseline is a **5% Ember Contribution**. Do not silently increase it; a higher percentage is an open product/business decision. The final rate and model require explicit approval. Before mining, the rate must be visible, represented in Settings and truthful statistics, and clearly distinguished from XMRig's upstream 1% donation. The mechanism and audit model remain undecided. Never describe contribution as unavoidable or impossible to modify on a user-owned computer.

Electricity estimates should use a user-configured electricity rate. The conceptual calculation is gross mining value minus estimated electricity cost equals estimated net result. Power draw may be estimated rather than measured; the interface must say which. Exchange rate, pool data, tariff, measurement quality, and other assumptions must be visible enough to interpret the result.

## Feature horizons

### MVP direction

- Windows-first, local-first desktop experience.
- Monero and expected XMRig integration behind a mining-engine boundary.
- Guided, non-custodial wallet address setup; no key custody.
- Explicit mining consent, visible state, accessible pause/stop, and sensible resource controls.
- Clear disclosure of the 5% Ember Contribution.

### Planned direction

See [Roadmap](ROADMAP.md) for M04 onward: telemetry/control, Ember Stream, Smart Mining, economics, progression, contribution, visual experience, history, public-beta hardening and only later an explicitly enrolled Ember Network.

### Exploratory

- Community features, Ember Pool evaluation, and additional assets/engines.
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
