# Ember Decision Log

This lightweight log records decisions and unresolved questions. Dates use the current milestone context (2026-09-29). A recorded direction is not automatically a release commitment.

## Decided direction

| ID | Date | Decision | Notes |
|---|---|---|---|
| D-001 | 2026-09-29 | The reboot product is named **Ember**. | Tray-XMR is historical project naming. |
| D-002 | 2026-09-29 | Keep the GitHub repository named `tray-xmr` for now. | Repository rename is not part of M00B. |
| D-003 | 2026-09-29 | Build a clean application rather than mechanically porting Python. | Preserve useful product concepts and historical context. |
| D-004 | 2026-09-29 | Start Windows-first and desktop-first. | Cross-platform support is not an MVP requirement. |
| D-005 | 2026-09-29 | Target Tauri 2, Rust, React, and TypeScript. | Application scaffold is not part of M00B. |
| D-006 | 2026-09-29 | Core experience is local-first. | Core mining should not require an Ember account or cloud connection. |
| D-007 | 2026-09-29 | Monero/XMR is the first expected supported asset. | Further assets are later possibilities. |
| D-008 | 2026-09-29 | XMRig is the expected initial mining engine. | Distribution/acquisition is not decided. |
| D-009 | 2026-09-29 | Keep a mining-engine abstraction boundary. | Do not build a general plugin system prematurely. |
| D-010 | 2026-09-29 | Ember is non-custodial and may use a public receiving address. | Never request/store seeds or private keys. |
| D-011 | 2026-09-29 | The default experience is beginner-first. | Advanced controls may be added later. |
| D-012 | 2026-09-29 | Smart Mining is a core product direction. | Detection methods and behavior remain future design work. |
| D-013 | 2026-09-29 | The Ember Contribution is 5%. | Disclose before mining; implementation and audit design remain pending. |
| D-014 | 2026-09-29 | Use least privilege. | Do not elevate the whole application by default. |
| D-015 | 2026-09-29 | Autostart, if offered, must be opt-in and easy to disable. | No silent persistence. |
| D-016 | 2026-09-29 | Accounts/cloud are optional future enhancements. | Not needed for basic local mining. |
| D-017 | 2026-09-29 | Multi-device monitoring should precede remote control. | Remote control requires separate security design. |
| D-018 | 2026-09-29 | No cryptocurrency token is part of the initial launch architecture. | Future transferable instruments require separate review. |
| D-019 | 2026-09-29 | Earnings and electricity outputs must be clearly identified as estimates. | Show inputs/assumptions and distinguish measured from estimated values. |
| D-020 | 2026-09-29 | M00C places Ember at repository root and historical source under `legacy/`. | Generated PyInstaller build outputs/executables and exact duplicate PNG copies are removed; Git history retains tracked removals. |
| D-021 | 2026-09-29 | Initial main-window close hides Ember to the tray; tray Open restores the existing window and tray Quit exits. | Future behavior when mining is active remains pending. |
| D-022 | 2026-09-29 | Rust owns the initial high-level shell status. | `shell_status` reports `notConfigured`; no mining engine or frontend-only mining lifecycle is implemented. |
| D-023 | 2026-09-29 | The M00C lockfile records Tauri API/CLI/crate 2.12.0, React 19.3.0, TypeScript 6.0.3, and Vite 6.4.3. | Vite 6 was selected for compatibility with the available Node 20.13 toolchain. Reassess framework versions during planned upgrades. |
| D-024 | 2026-09-29 | The initial Ember desktop uses a graphite interface with warm Ember accents, semantic state labels, and a state-aware core visual. | Unavailable values remain visibly unavailable. The core visual reflects only shell status; it does not imply mining activity. |
| D-025 | 2026-09-29 | Use Phosphor icons for the desktop navigation and supporting interface icons. | Import only used icon modules; the library is an icon set, not a product feature dependency. |
| D-026 | 2026-09-29 | Retain the M01 visual direction after native review. | M01.1 keeps the graphite palette, warm accent, sidebar, Phosphor icons, Ember core, and surface treatment while simplifying page chrome and product language. |
| D-027 | 2026-09-29 | M02 observes local CPU, memory, device/OS, uptime, power, and coarse session idle state only. | Use `sysinfo` for general system data and documented Windows APIs for power/idle. Poll the visible UI every five seconds; keep all readings in memory, expose unavailable values as null/unknown, and do not use observations to control resources. Five minutes is a provisional UI idle label threshold. Defer temperature, fan, and CPU/GPU power pending generic trustworthy APIs. |
| D-028 | 2026-09-29 | M03A prefers an Ember-managed download of an unmodified, pinned official XMRig release, pending GPL/legal approval. | Do not bundle the miner initially. Verify the upstream signed SHA-256 manifest with an independently pinned key and then the exact archive hash; fail closed. A user-supplied executable may be a later advanced option. See `docs/XMRIG_INTEGRATION.md`; this is not legal advice or distribution approval. |
| D-029 | 2026-09-29 | Rust owns a single internal MiningEngine lifecycle and telemetry boundary; XMRig is its first adapter. | UI renders authoritative backend state. Keep local system, mining-engine, and pool/economic telemetry separate. Prefer structured API telemetry, bounded diagnostics, loopback-only authenticated API; verify exact API fields and stop semantics against the pinned release before implementation. |
| D-030 | 2026-09-29 | XMRig configuration should be generated as deterministic JSON by Ember. | JSON is the upstream preferred flexible configuration form. The public wallet address is configuration data, never a private key; secrets stay out of argv/logs. The native XMRig 1% donation is separate from Ember's proposed 5% contribution; no contribution mechanism was selected. |
| D-031 | 2026-09-29 | M03B implements a test-only internal MiningEngine boundary and deterministic config validation. | No start command/UI or real XMRig launch is exposed; artifact verification and concrete HTTP transport are absent. |
| D-032 | 2026-09-29 | M03B process supervision uses direct child ownership, bounded/redacted diagnostics and a kill-on-close Windows Job Object. | M03B.1 creates the child suspended, assigns it, then resumes. Assignment failure is fatal; no unsafe fallback is allowed. |
| D-033 | 2026-09-29 | Windows process ownership is established before child execution using `CREATE_SUSPENDED`, Job Object assignment, then `ResumeThread`. | Handle ownership is RAII-based, descendants inherit job membership, and tray/Tauri exit paths gate new starts and clean up before exit. Packaged Tauri host verification remains required; nested-job incompatibility fails closed. |

## Pending decisions

| ID | Question | Needed before |
|---|---|---|
| P-001 | Legal approval of GPLv3 distribution/aggregation, exact notices, source obligations, and Ember's role in user-initiated official-release download. | Before shipping miner acquisition or bundling. |
| P-002 | Independently confirm upstream GPG key fingerprint/rotation policy, verification toolchain, supported architecture/version, and update cadence/rollback. | Before any acquisition implementation. |
| P-003 | Verify exact pinned XMRig API schemas, restricted-mode access semantics, authenticated graceful stop, and fields available for shares/pool/uptime. | Before XMRig adapter implementation. |
| P-004 | Test child/job ownership, Job Object feasibility in packaged Tauri, graceful stop, timeout escalation, shutdown/logoff, and crash recovery. | Before active mining integration. |
| P-005 | How will the 5% contribution be implemented and accounted for in an accurate, auditable, disclosed way? | Contribution implementation. |
| P-006 | Which pool and market data providers, schemas, currencies, and outage/rate-limit behavior are supported? | Statistics and estimate implementation. |
| P-007 | What is the local storage/database choice, retention, migration, export, and deletion policy? | Persistent history implementation. |
| P-008 | Which system signals support Smart Mining, and what are profile defaults, limits, priorities, and overrides? | Smart Mining implementation. |
| P-009 | What should tray Quit do while future mining is active, and is any autostart mechanism appropriate? | Mining lifecycle/autostart design. Initial shell behavior is recorded in D-021. |
| P-010 | What exact features and acceptance criteria define MVP? | Release scope. |
| P-011 | Which signing, installer, updater, and Windows reputation approach is feasible, and what do Defender/SmartScreen do with actual release artifacts? | Public distribution; requires later clean-system testing. |

Decisions should be updated when evidence or product direction changes. See [Product](PRODUCT.md), [Architecture](ARCHITECTURE.md), and [Security](SECURITY.md).
