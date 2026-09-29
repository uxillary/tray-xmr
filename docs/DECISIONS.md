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

## Pending decisions

| ID | Question | Needed before |
|---|---|---|
| P-001 | Should Ember bundle XMRig, download a verified official release, or require a user-supplied copy? What license/attribution/source obligations apply? | Miner distribution implementation. Requires authoritative current licensing and security research. |
| P-002 | What binary provenance, integrity verification, version pinning, and update policy will be used? | Any miner download or distribution. |
| P-003 | Which XMRig API/control and telemetry mechanisms are supported, and how will local access be secured? | XMRig adapter implementation. |
| P-004 | What are start confirmation, stop timeout, escalation, process-tree, and crash-recovery semantics? | Mining lifecycle implementation. |
| P-005 | How will the 5% contribution be implemented and accounted for in an accurate, auditable, disclosed way? | Contribution implementation. |
| P-006 | Which pool and market data providers, schemas, currencies, and outage/rate-limit behavior are supported? | Statistics and estimate implementation. |
| P-007 | What is the local storage/database choice, retention, migration, export, and deletion policy? | Persistent history implementation. |
| P-008 | Which system signals support Smart Mining, and what are profile defaults, limits, priorities, and overrides? | Smart Mining implementation. |
| P-009 | What should tray Quit do while future mining is active, and is any autostart mechanism appropriate? | Mining lifecycle/autostart design. Initial shell behavior is recorded in D-021. |
| P-010 | What exact features and acceptance criteria define MVP? | Release scope. |
| P-011 | Which signing, installer, updater, and Windows reputation approach is feasible? | Public distribution. |

Decisions should be updated when evidence or product direction changes. See [Product](PRODUCT.md), [Architecture](ARCHITECTURE.md), and [Security](SECURITY.md).
