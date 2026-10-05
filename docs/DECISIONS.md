# Ember Decision Log

This lightweight log records decisions and unresolved questions. Historical dates identify when a decision was recorded; a direction is not automatically a release commitment.

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
| D-034 | 2026-09-29 | M03B.2 attributes the `0xC0000409` startup report to launching from the Codex restricted sandbox identity. | Debug identified WebView2 `0x800700AA` before Ember setup; release panic-abort surfaced `0xC0000409`. The clean release executable remained running with a main window under the logged-in Windows user. No application startup workaround was justified. |
| D-035 | 2026-09-29 | Close the Windows kill-on-close Job Object after the direct child exits and before joining output readers. | A graceful parent can leave a descendant alive with inherited pipe handles; closing the job first terminates that descendant and prevents reader joins from waiting indefinitely. Covered by a Windows regression test. |
| D-036 | 2026-09-29 | M03C.1 pins XMRig v6.26.0 Windows x64 and upstream GPG fingerprint `9AC4 CEA8 E66E 35A5 C7CD DC1B 446A 5363 8BE9 4409`. | xmrig.com publishes the fingerprint and says its key must match the official repository copy; the public key blocks match byte-for-byte. See `docs/XMRIG_INTEGRATION.md`. |
| D-037 | 2026-09-29 | M03C.1 uses explicit user-approved upstream download, Sequoia OpenPGP with the Windows CNG backend, strict SHA-256 manifest verification, and bounded safe extraction. | A controlled v6.26.0 Windows x64 install completed in per-user app data. Mining launch remains disabled. Public release is subject to GPL/dependency review. |
| D-043 | 2026-09-30 | Beginner Mining setup follows Wallet → Pool → Power → Review → Ready with progressive disclosure. | Keep pool recommendations unavailable until provider details are reviewed. Keep Custom pool, technical checks, and healthy engine provenance secondary; put actionable problems beside the action. Readiness and consent stay Rust-owned. |
| D-044 | 2026-10-01 | Start Ember-managed XMRig with `CREATE_NO_WINDOW` and retain suspended Job Object supervision. | Redirected standard handles continue capturing output; assignment still precedes resume. Rust-owned startup stages/timings drive truthful UX. Report Windows launch errors without asserting a specific security product; never alter its settings or bypass quarantine. Clean-machine Defender/SmartScreen behavior remains public-release testing. |
| D-045 | 2026-10-05 | Make the default experience beginner-first with advanced detail progressively available. | Prefer visual state communication, concise labels and accessible alternatives; keep advanced/raw diagnostics available without making them the primary product experience. |
| D-046 | 2026-10-05 | Mining and progression displays must be grounded in observable truth. | Stream events, hashrate, work, shares, earnings, contribution and milestones must not be fabricated. Estimates carry explicit provenance; application XP/levels are not financial or transferable value. |
| D-047 | 2026-10-05 | Ember Stream is a planned human-readable operational feed; raw XMRig output is a separate advanced diagnostic. | Stream entries derive only from genuine events/state, are bounded and timestamped, support severity and accessible non-colour markers, and redact secrets. |
| D-048 | 2026-10-05 | Keep 5% as the working Ember Contribution baseline pending explicit final decision. | A proposed higher rate remains an open business decision. Disclose the chosen rate before mining and distinguish it from XMRig's upstream 1% donation; do not imply contribution is unavoidable or impossible to modify on a user-owned machine. |
| D-049 | 2026-10-05 | Require no visible console-window flashes during normal Ember operation by public beta. | Investigate the entire startup/helper chain if needed; this is desktop polish and must not use stealth or evasion. |
| D-050 | 2026-10-05 | Consolidate forward roadmap as M04 telemetry/control through M13+ Ember Network. | M03 functional foundation is complete; real owner-machine session verification and legal, distribution, security-product and other release-hardening work remain open. See [Roadmap](ROADMAP.md). |

M03C.2A decisions (2026-09-29):

- **D-038:** Manual explicit Stratum host/port/TLS/worker setup; mainnet-only public wallet parser with checksum/key validation; no wallet/pool network lookup.
- **D-039:** Static Quiet/Balanced/Performance profiles use quarter/half/all logical CPU threads, minimum one; explicit RandomX thread arrays and bounded dataset initialization; no Smart Mining or privileged optimizations.
- **D-040:** Rust owns startup/readiness verification, schema-1 private local setup and revision-bound disclosure acknowledgement. Runtime candidate token/port/JSON remain ephemeral in Rust memory. Start stays disabled.
- **D-041:** Contribution option A: a separately authorized first controlled development session may run without the inactive Ember 5% contribution, explicitly labeled. XMRig's upstream 1% donation remains separate. No public-release contribution implementation decision is implied.
- **D-042:** Do not execute dry-run until constructor/strategy side effects before its early exit are fully reviewed. Use Ember's local candidate validation in C.2A. See [pinned source evidence](XMRIG_INTEGRATION.md).

## Pending decisions

| ID | Question | Needed before |
|---|---|---|
| P-001 | Legal approval of GPLv3 acquisition/aggregation, exact notices, source obligations, Ember's role in user-initiated download, and dependency notices including Sequoia LGPL. | Before public release. |
| P-002 | Define key rotation/revocation response for future upstream signing-key changes. | Before changing the pinned key. |
| P-003 | Continue verifying pinned XMRig API behavior, including the owner-machine API startup failure, and determine authoritative sources for shares/pool/uptime. | M04 telemetry/control. |
| P-004 | Complete owner-controlled real-session Start/Mining/Stop verification and retain lifecycle/crash-recovery checks across release candidates. | Before public beta. |
| P-005 | What final Ember Contribution percentage and mechanism can be accurate, auditable and clearly disclosed? A higher rate than 5% has been raised but is not approved. | Before M09 implementation. |
| P-006 | Which pool and market data providers, schemas, currencies, and outage/rate-limit behavior are supported? | Statistics and estimate implementation. |
| P-007 | What is the local storage/database choice, retention, migration, export, and deletion policy? | Persistent history implementation. |
| P-008 | Which system signals support Smart Mining, and what are profile defaults, limits, priorities, and overrides? | M06 implementation. |
| P-009 | Which opt-in autostart mechanism, if any, is appropriate? Active tray Quit already stops the owned process tree. | Before any autostart implementation. |
| P-010 | What exact features and acceptance criteria define public-beta MVP? | Release scope. |
| P-011 | Which signing, installer, updater, and Windows reputation approach is feasible, and what do Defender/SmartScreen do with actual release artifacts? | M12 public beta. |
| P-012 | What event source/schema and retention policy support Ember Stream and separate Raw XMRig diagnostics safely? | M05 implementation. |
| P-013 | Which progression measures and reward rules remain truthful and avoid unsafe/wasteful incentives? | M08 implementation. |

Decisions should be updated when evidence or product direction changes. See [Product](PRODUCT.md), [Architecture](ARCHITECTURE.md), and [Security](SECURITY.md).
