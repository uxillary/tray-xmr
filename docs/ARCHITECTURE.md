# Ember High-Level Architecture

**Status:** Conceptual target and implementation facts, recorded 2026-09-30. M03C.2B implements the controlled-session launch path for verified XMRig v6.26.0 Windows x64; the first actual mining start awaits the owner's click.

## Platform and responsibilities

The planned stack is Tauri 2, Rust, React, and TypeScript, initially Windows-first.

- **React/TypeScript frontend:** onboarding, dashboard, settings, tray-related user surfaces, presentation of status and estimates, and user actions. It should not own process-control or privileged operating-system logic.
- **Rust/Tauri backend:** operating-system integration, configuration and persistence access, mining-engine lifecycle, telemetry acquisition, policy enforcement at local boundaries, and narrowly scoped commands/events exposed to the frontend.
- **Tauri boundary:** define explicit command and event contracts. Validate inputs at the backend boundary; do not treat UI validation as a security boundary. Keep permissions and exposed capabilities narrow.

The initial Tauri capability grants only `core:default`. Reassess permissions as native features are added. Broader IPC schemas, module boundaries, and future capability needs remain pending design.

The repository root contains the React/Vite frontend in `src/` and the Tauri/Rust application in `src-tauri/`. Rust owns system observations, setup/consent, config, diagnostics, process supervision, runtime storage, and the XMRig API contract. Mining controls are implemented; the first actual XMRig session has not yet been started. Historical code is separated under `legacy/`.

### Local system observation (M02)

`src-tauri/src/system_observation.rs` owns a single `sysinfo::System` instance managed by Tauri. The `system_snapshot` command returns nullable, serializable fields for CPU model/logical processor count/overall usage, physical memory, hostname, OS version, uptime, power source/battery percentage, and session input idle duration. `sysinfo` refreshes only CPU and RAM; it does not enumerate processes. Windows power and idle details use `GetSystemPowerStatus` and `GetLastInputInfo` plus `GetTickCount` through `windows-sys`. Failed or unsupported queries remain unknown/null independently.

The visible shell requests one snapshot every five seconds, waits for each request before scheduling the next, and pauses while the WebView document is hidden. CPU utilization uses the native library’s inter-sample calculation; until a valid second sample exists, its value is null. The current Active/Idle label is a presentation hint using a five-minute threshold; the raw session idle duration is preserved. `GetLastInputInfo` is session-specific, and Ember does not collect input content. All data remains in memory and on-device; it is not persisted or transmitted. These observations are not Smart Mining decisions and do not change resource use. Temperature, fan speed, CPU package power, and GPU telemetry are deferred because there is no generic reliable low-privilege source across Windows hardware.

## Conceptual components

```mermaid
flowchart LR
  UI[React / TypeScript UI] <-->|validated commands and events| APP[Rust application services]
  APP --> CFG[Configuration and local storage]
  APP --> CTRL[Mining controller and policy]
  CTRL --> ENG[Mining engine interface]
  ENG --> XMRIG[XMRig adapter]
  XMRIG --> PROC[Managed local process]
  ENG --> TEL[Normalized telemetry]
  APP --> POOL[Pool / external data adapters]
  APP --> TRAY[Windows tray and notifications]
  CTRL --> SYS[Local system signals]
  CLOUD[Optional future Ember services] -. optional, not required for core use .-> APP
  DEVICE[Future enrolled devices] -. future monitoring boundary .-> CLOUD
```

This diagram describes responsibilities, not a settled deployment or code layout.

## Local-first boundary

The initial core should operate locally: application configuration, mining control, local statistics, and Smart Mining should not require accounts or cloud connectivity. External pool or market data may require network access for selected features; failures should not silently change mining consent or control behavior.

Future Ember services may support optional accounts, synchronization, community features, or multi-device monitoring. They must remain separate from the basic local mining path. Remote-device enrollment and control are out of scope now.

## Mining engine boundary

Rust owns one internal `MiningEngine` boundary rather than XMRig-specific UI behavior. It covers availability/version, validation, start/stop, lifecycle status, normalized telemetry, and bounded diagnostics. XMRig is the initial adapter; this is not a plugin framework. The UI renders Rust-owned lifecycle state and cannot bypass the consent-checked backend path. M03C.2B connects the pinned summary parser, authenticated loopback client, private runtime session, verified artifact and suspended Job Object launch, readiness gate, telemetry monitor, stop/quit cleanup and active-session views. Shares and pool connection data are not exposed. Detailed contract and limits are in [XMRig Integration](XMRIG_INTEGRATION.md).

Keep the data domains separate: M02 local system telemetry describes host CPU/RAM/device/activity/power; mining-engine telemetry describes engine version/state/hashrate/backend; later pool/economic telemetry owns shares, balance, payout, market rates, and estimates. Do not derive economic claims from local system or engine readings.

### Process lifecycle responsibilities

M03B adds deterministic config validation, a verified-artifact gate, fixture-injected readiness, unexpected-exit handling, bounded diagnostics and stop escalation. On Windows, `process.rs` creates the Job Object first, creates the child suspended with redirected stdio, assigns the process handle to the kill-on-close job, and resumes its primary thread only after assignment succeeds. Any failure before resume terminates/reaps the suspended process; RAII-owned handles close on every path. When the direct child exits, the supervisor closes the Job Object before joining pipe readers so remaining descendants cannot keep redirected pipes open. Job assignment failure, including unsupported nested-job constraints, fails closed. M03C.2B uses this path for XMRig after immediate artifact and consent re-verification.

Prefer structured XMRig local API telemetry; stdout/stderr are bounded diagnostics only. Bind API to loopback and use a per-run secret. `ReqwestLocalApiTransport` uses a fixed loopback URL, verified Bearer authorization, no proxy, no redirects, bounded body and strict deadlines. Restricted mode permits only the authenticated GET summary request; Stop uses a bounded wait and then the owned Job Object rather than a control API route.

The future Ember policy/contribution layer owns the disclosed 5% Contribution and accounting; neither the UI nor process adapter contains contribution logic. The XMRig built-in 1% donation is separate and must be represented honestly.

## Miner acquisition and integrity

M03A prefers an Ember-managed, explicitly user-approved download of an unmodified official XMRig release, subject to legal review. M03C.1 provisions v6.26.0 Windows x64 (`xmrig-6.26.0-windows-x64.zip`). Its fingerprint `9AC4 CEA8 E66E 35A5 C7CD DC1B 446A 5363 8BE9 4409` was independently confirmed from xmrig.com and the byte-identical official repository key. Rust verifies the detached signature and signed archive hash, extracts into a bounded staging directory, atomically promotes, and stores provenance/integrity metadata under per-user local app data. The one controlled install succeeded; the binary was never executed. M03C.2A implements startup and readiness integrity gating; an immediate pre-spawn gate remains required before execution. Do not bundle initially; see [XMRig Integration](XMRIG_INTEGRATION.md).

Any future downloaded or bundled executable requires a documented provenance and integrity strategy, including release source, signature/hash verification, version pinning/update policy, failure behavior, and user-visible status. Research current XMRig licensing and redistribution obligations before selecting a strategy.

## Smart Mining and system signals

Keep profile/policy decisions in a controller boundary distinct from UI presentation and engine-specific controls. Inputs may eventually include user limits, system activity, battery state, workload/game signals, and temperature where dependable. The controller should expose current constraints and a user-readable reason for changes. Signal quality, precedence, overrides, thermal support, and safety behavior remain unresolved.

## Configuration and persistence

Use deliberate structured local storage, not ad hoc generated files or launcher scripts. Likely categories:

- preferences and notification settings;
- public wallet/pool/mining configuration;
- Smart Mining profiles and schedules;
- local mining events/statistics and history;
- cached external data;
- future device identity metadata.

SQLite is a candidate for historical/statistical data, not a decision. Public wallet addresses are not private keys, but remain user-specific and privacy-sensitive. Any future credentials/secrets require appropriate OS-backed secure storage rather than ordinary configuration. Define export, retention, and deletion behavior before accumulating history.

## Pool and external-service adapters

Pool/provider APIs and market/exchange data should be accessed through narrow adapters that normalize units, timestamps, and missing/stale/error states. Keep provider-specific schemas out of UI components. Reliability, rate limits, supported providers, caching, and calculation assumptions require later research and decisions. Ember must not depend on an Ember-owned pool.

Earnings, fiat value, power, and net-result views must identify estimates and their inputs. Distinguish direct measurements from estimates and stale external data.

## Tray and application lifecycle

The Windows tray provides **Open Ember** and **Quit Ember**, plus a disabled **Not mining** state item and the tooltip **Ember — Not mining**. Open shows, unminimizes, and focuses the existing main window. Closing the window hides it; it does not quit the application. Quit exits the application. The tray shows no telemetry. The production content security policy allows only local assets and Tauri IPC; the development policy additionally permits the local Vite server. This is the initial shell decision, not a final policy for future active mining: later work must decide whether quit prompts/stops a miner and how state remains visible. Autostart remains out of scope and must be opt-in if added.

## Diagnostics and logging

Use bounded, user-controllable diagnostics. Avoid logging wallet addresses, credentials, private paths, or unnecessary usage details. Define redaction, retention, export, and deletion before production logging. Miner output should not be forwarded wholesale to the frontend or persisted by default; handle it as untrusted input and parse into bounded, normalized events.

## Future boundaries

- **Cloud:** optional services for accounts/sync/community must not be a dependency for local mining.
- **Multi-device:** start with explicit enrollment and monitoring. Remote control, if ever pursued, requires device identity, authentication/authorization, encrypted transport, revocation, auditability, offline handling, and safe command boundaries.
- **Additional engines/assets:** add through the engine/domain boundary after requirements and support are established; do not bind all application concepts to XMRig or Monero.

## Pending architecture decisions

`mining::readiness::SetupService` owns normalized setup, consent revision and fresh validated candidates. `start_mining` rechecks setup and consent, verifies the pinned install immediately before the suspended-create/Job Object spawn, and holds a private ACL-protected runtime config for the process lifetime. The supervisor gates Mining on authenticated version/kind/restricted/paused/algorithm/positive-rate summary fields. A monitor refreshes normalized telemetry and reaps unexpected exits; `stop_mining`, tray Stop and tray Quit terminate only the owned process tree and clean its runtime session. Frontend inputs remain narrow and never include paths, argv, tokens or raw JSON. Overview, sidebar and Mining view consume state and telemetry IPC.

Schema 1 lives in `%LOCALAPPDATA%\Ember\setup-v1.json` with a revision and disclosure-version acknowledgement. No-config migrates to empty state; unsupported/corrupt files block setup and require explicit reset. Edits revoke acknowledgement; atomic same-directory replacement preserves the old config on write failure. Ephemeral API token and port remain Rust-owned; the generated JSON is stored only in a private per-session runtime directory and removed at session end or next startup after a crash.

1. Legal approval of XMRig GPLv3 acquisition/aggregation, notices and source obligations, including dependency notices.
2. Key-rotation/revocation response for future signing-key changes.
3. Pool shares and connection fields are not established by `/2/summary` and remain unavailable until separately sourced and verified.
4. First owner-controlled run remains necessary to confirm real machine and pool behavior; runtime failure remains bounded to Ember's owned Job Object.
5. Local database choice, schema ownership, migration, retention, export, and deletion.
6. Supported pool/market data sources and estimate methodology.
7. Smart Mining signals, limits, precedence, overrides, and laptop/thermal behavior.
8. Any opt-in autostart mechanism remains a separate future decision; current launch is user initiated only.
9. Contribution implementation and auditable accounting.

See [Security](SECURITY.md) for trust constraints and [Decisions](DECISIONS.md) for the decision log.
