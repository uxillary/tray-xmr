# XMRig Integration Research and Contract

**Status:** M03A research plus M03B test-only Rust groundwork, recorded 2026-09-29. No XMRig binary was downloaded, bundled, or run. Real execution remains disabled; this is not legal advice or release approval. Upstream facts were checked against official XMRig sources and the GNU GPLv3 text on the date above; recheck them against the exact version before implementation or distribution.

## Decision summary

- Prefer **Ember-managed download of an unmodified, pinned official XMRig release** for the first implementation, after licensing review. Download the official Windows archive directly from the official XMRig GitHub release, verify its detached signature and signed SHA-256 manifest against an independently pinned upstream key, then verify the selected archive hash before extraction. Fail closed on any mismatch. Do not silently update or launch a changed binary.
- Keep a user-supplied executable as a possible later advanced path; it offers weaker provenance/version consistency and less beginner-friendly support. Do not bundle binaries in Ember's installer initially.
- Generate deterministic JSON configuration for normal operation. Keep only launch-level controls in argv; never put the wallet address or API token in command-line arguments.
- Use XMRig's local HTTP API for structured telemetry where the exact pinned version confirms the fields. Treat stdout/stderr as bounded diagnostics, not the telemetry contract.
- Rust owns the internal engine contract, lifecycle state, config validation, supervised child, fixture-injected readiness, normalized telemetry, and bounded diagnostics. Tray Quit invokes cleanup. React has no mining start controls. M03B does not implement artifact verification or a concrete HTTP transport, and consent/product policy remains future work.
- Keep local system telemetry, engine telemetry, and later pool/economic data as separate domains.
- Do not implement Ember's 5% contribution mechanism in the adapter or UI. Its policy belongs in a distinct Rust contribution/accounting boundary once an auditable mechanism is selected.

## Current authoritative upstream findings

### License and distribution

The XMRig repository currently identifies its license as **GNU GPL version 3 or (at the recipient's option) any later version**. Its official release page publishes Windows x64, Windows ARM64, and Windows GCC x64 ZIP archives. The checked current release was v6.26.0; its Windows x64 archive is about 3.7 MB and its release includes a `SHA256SUMS` file and detached `SHA256SUMS.sig`, with the page identifying GPG keys published through xmrig.com and GitHub.

GPLv3 permits redistribution, but conveying an object-code copy carries license conditions. These include keeping copyright/license/warranty notices, providing the GPL text, and providing Corresponding Source using one of the license's permitted methods. A hosted download offer must keep equivalent source access available. Redistribution is not made compliant by attribution alone. If Ember modifies XMRig, it must mark modifications and dates and convey the derivative covered work under GPLv3-compatible terms, including Corresponding Source and required notices. Whether the separately licensed Ember application and miner form an aggregate or a combined work in the planned packaging/integration is a legal question for review; do not infer the answer from process separation alone.

The least-complex initial approach is to have the user's Ember installation fetch an unmodified upstream release directly from the official release location, rather than Ember redistributing the executable inside its own installer. That lowers bundled artifact and installer-maintenance obligations but does not itself settle every legal issue. Before shipping the download feature, legal review must approve the exact distribution flow, attribution/notices, user-facing license presentation, source link/availability, and treatment of bundled dependencies. Do not patch the upstream donation behavior or remove its notices.

### Release provenance and integrity

The official release page publishes per-archive SHA-256 values and a detached GPG signature for the checksum manifest. This is better than HTTPS alone: HTTPS authenticates the connection to the server, while signature verification can authenticate the manifest against a trusted signing key. A hash copied from the same unauthenticated channel only detects accidental mismatch; it does not independently authenticate origin.

Future Ember provisioning should:

1. Pin a specific XMRig version, expected official release URL, archive name, and upstream signing-key fingerprint in reviewed Ember release metadata.
2. Fetch only over HTTPS from the official release endpoint; verify the detached signature over `SHA256SUMS` with a key whose fingerprint Ember has pinned through an independent trusted channel.
3. Parse the signed manifest strictly and compare the exact expected archive SHA-256; reject missing, duplicate, malformed, unexpected, or mismatching entries.
4. Extract to a fresh versioned staging directory with path-traversal checks; verify the expected executable is present, then atomically promote it to the managed version directory.
5. Record version and verified digest locally. Re-verify before every launch and fail closed if the file changes. Updates install side-by-side, verify before activation, preserve the previous verified version for rollback, and never start mining or change consent automatically.

The release metadata establishes what upstream published, not that the source is free of defects or that a binary behaves benignly. A signed checksum manifest does not appear to be an Authenticode signature on `xmrig.exe`. Do not claim Windows publisher identity from the checksum signature. Exact current upstream key fingerprints, signature algorithms/key rotation and verification tooling must be pinned/reviewed during implementation. M03A did not download artifacts or execute cryptographic verification.

### Acquisition trade-offs

| Approach | Beginner experience | License/maintenance | Provenance and integrity | Trust/reputation | Decision |
|---|---|---|---|---|---|
| Bundle with Ember | Smooth setup; works offline | Ember conveys object code and must maintain GPL source/notices compliance; larger installer and release coupling | Ember must verify at build and publish time; reproducibility burden | Mining executable inside Ember installer may increase scrutiny; signed Ember installer helps identify Ember publisher, not XMRig authorship | Defer; not preferred initially |
| Download official release | Nearly guided UX, with clear download/verification progress and source | User receives the official artifact; still obtain counsel on Ember's role, notice UX and distribution flow; upstream version drift requires deliberate pin/update policy | Strongest presently evidenced path: official archive plus signed manifest and SHA-256; verify before launch | Transparent upstream link and user consent; SmartScreen/Defender outcomes require release testing | **Preferred initial strategy, subject to legal review** |
| User supplies binary | Poor beginner setup and version variance | Avoids Ember provisioning/redistribution, but Ember still needs a clear supported-version policy | Weak unless Ember independently hashes and checks version against official metadata; user may supply a replaced/modified executable | Users may trust their copy; debugging and reputation are least consistent | Possible later advanced/fallback option |

These options do not eliminate antivirus detections. No approach may bypass scanners, obfuscate/pack XMRig to evade them, disable protections, or add exclusions automatically.

### Miner storage

Keep immutable, versioned verified executables outside the source tree and outside the Ember installation directory. On Windows, use a dedicated per-user application-data subtree (for example `%LOCALAPPDATA%\\Ember\\miners\\xmrig\\<version>`), with separate sibling directories for generated configuration, bounded logs, and temporary downloads/staging. Restrict configuration ACLs to the current user because it can contain the API token; binaries should not be casually writable by unrelated users. Do not use a shared writable Program Files location or store downloads/configuration beside the repository. Exact directory and cleanup/rollback policy belongs to provisioning implementation.

### Configuration

Official documentation describes JSON configuration as the preferred, more flexible and human-friendly interface; CLI options do not cover every feature. `--config=FILE` loads JSON and `--dry-run` tests a configuration and exits. Pools are explicit JSON entries; the documented pool `user` field is commonly a public wallet address. XMRig's pool array uses a primary plus backups (first enabled pool then backups), not a proportional share split.

Generate JSON deterministically from validated Ember domain configuration: explicit algorithm, pool host/port/TLS choice, public receiving address, worker identifier where applicable, and conservative CPU policy. Keep user-facing setup in Ember; never require manual JSON editing. Do not serialize wallet private keys (Ember must never collect them). Keep the public address separate in Ember's domain model and exclude it from diagnostics. Avoid environment-variable interpolation, autosave, and inherited adjacent config files unless a reviewed requirement needs them. Pass only a controlled config path and minimal non-secret flags in argv; use a private user-scoped config file with restrictive ACLs if it contains the API token. Validate with the pinned XMRig `--dry-run` in a later milestone; do not construct or launch a real mining configuration in M03A.

The official binary's default built-in XMRig donation is 1%; official docs state it cannot be lowered below 1% without editing/recompiling source. This is distinct from Ember's proposed 5% contribution and must be disclosed accurately. Do not modify or mask upstream donation behavior. The interaction and user-facing representation of both fees require product/legal review.

### Local HTTP API

XMRig includes a built-in HTTP server. Official docs list `GET /2/summary`, `GET /2/backends`, configuration routes under `/2/config`, and JSON-RPC at `/json_rpc`. The public API endpoint pages are explicitly marked unfinished. Current upstream source dispatches summary and backends requests; its summary construction exposes miner version, CPU info, paused status, supported algorithms, and hashrate windows (short/medium/large, represented as normalized values). `/2/backends` returns backend-specific JSON. These are the initial credible candidates for normalized engine version, paused/health-ish state, algorithm availability, backend information, and hashrate.

Do not yet promise average hashrate, shares accepted/rejected, pool connection state, worker identity, or precise miner uptime in Ember's stable contract solely from the public API docs: current endpoint docs do not specify complete response schemas or versioning guarantees for these fields. Inspect the pinned release's API source and fixture responses and test pool states in M03B before adopting each field. Treat missing fields as unknown. API failure makes engine telemetry unavailable; it must not be inferred from text output. Console output remains useful for bounded failure diagnostics.

The API is not read-only by design: upstream describes live config/state changes, `/2/config` has write verbs, and JSON-RPC supports pause, resume, and stop. XMRig API config documents host default `127.0.0.1`, port default `0` (random port), an optional access token, and `restricted: true` (available only when a token is configured) versus full access. CLI equivalents exist. The upstream docs say `0.0.0.0` and `::` bind broadly. This makes configuration and default choices security-critical.

Initial Ember stance: explicitly enable the API; bind **only** to `127.0.0.1`; never accept arbitrary bind hosts; use a randomly generated per-run high-entropy token held only by the Rust supervisor; persist it nowhere beyond a user-private short-lived config if XMRig requires config-file provisioning; never expose it to React/logs/diagnostics. Select a local port and retry safely on collision (the documented random port cannot be discovered through a documented handshake). Use restricted mode for normal telemetry. Validate response size, schema, numeric bounds, and API identity. If stop control requires full API access, prefer a separately reviewed authenticated loopback control path; do not quietly enable unrestricted API features. No LAN bind, internet exposure, firewall rule, or inbound connectivity is needed. Confirm exact access semantics and a safe stop path against the pinned XMRig release before implementation.

### Process and privilege model

On Windows, M03B.1 uses `CreateProcessW` and owned process/thread/pipe handles because `std::process::Child` does not expose the primary thread handle needed for suspended assignment. Other targets retain `std::process::Command`/`Child`. Dropping a child wrapper alone is not cleanup; the Windows Job Object is the kernel-owned process-tree boundary. Drain stdout and stderr concurrently; impose byte/line bounds and redact before retaining diagnostics. Use an absolute verified executable path, no shell, fixed working directory, empty environment, and one Rust-owned supervisor that serializes start/stop and rejects duplicate starts.

Track the child handle and PID, monitor process exit and API readiness, and publish lifecycle changes from Rust. A stop request first uses a verified graceful XMRig mechanism; if it does not exit within a bounded timeout, terminate the owned process/job and wait/reap. Do not attempt to find and kill arbitrary `xmrig.exe` processes by name. Ensure quit, Rust panic/error paths, Windows logoff/shutdown, startup failure, timeout, and unexpected exit all converge on cleanup. A stale external process is never adopted automatically; report it for user resolution. Quit semantics while active must be an explicit user-visible choice before M03C.

M03B.1 now creates the Job Object, calls `CreateProcessW` with `CREATE_SUSPENDED` and redirected standard handles, assigns the process handle, and calls `ResumeThread` only after successful assignment. Job Object configuration is limited to `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE`. Every pre-resume failure terminates and waits for the suspended process; process, thread, job, and pipe handles use RAII ownership. The Windows test suite verifies the parent and a descendant are in the job and both disappear when the owning job handle closes, which also simulates abrupt owner-handle loss. Nested-job assignment failures are fail-closed; behavior under CI/development parent jobs depends on Windows nested-job support. The feature-gated release executable and the clean normal release executable both exited before Tauri setup with Windows status `0xC0000409`. No packaged fixture was started, and packaged tray Quit or forced Ember termination was not verified, so process ownership is not yet cleared for real execution.

To complete packaged verification, first diagnose the release executable's early exit (`0xC0000409`), which also occurs in the normal no-bundle release build. Then build with `npm run tauri build`, install/run the resulting packaged Ember app under the intended user account, and use a local developer-only fixture harness that calls `SupervisedChild::spawn` with a harmless fixture executable (never XMRig). Confirm it reports its PID only after spawn returns, close Ember through tray **Quit**, and verify both the fixture and a fixture-created descendant exit in Task Manager or with `WaitForSingleObject`. Repeat with forced app termination to check kernel kill-on-close. Remove the local harness after the check; do not ship a fixture-start command. This workspace could not perform the packaged GUI check.

Basic XMRig operation does not have a documented requirement for Ember to run elevated. Keep Ember and XMRig at the normal user's privilege. Optional performance features are separate: Windows large/huge pages require `SeLockMemoryPrivilege` and XMRig docs describe administrative configuration to obtain it; MSR modification may require administrator rights. These are optimization features, not prerequisites for ordinary launch. Exclude them from initial setup; never elevate Ember automatically. If a later opt-in optimization is considered, isolate it, explain effects/privileges, and test it independently.

### Lifecycle state and transitions

Rust owns this state machine; React displays it. Keep engine availability/configuration distinct from active process state:

```text
Unavailable | NotConfigured | Ready | Starting | Mining | Paused | Stopping | Stopped | Error
```

Expected transitions:

- `Unavailable` -> `Ready` only after verified executable and compatible version; otherwise remain unavailable with reason.
- `NotConfigured` -> `Ready` only after validated Ember configuration and consent prerequisites.
- `Ready` or `Stopped` -> `Starting` only after an explicit allowed start request.
- `Starting` -> `Mining` only after child is alive and authenticated API reports expected miner identity/state before timeout.
- `Starting` -> `Error` on spawn failure, early exit, invalid config, wrong API identity, or API readiness timeout; always reap child.
- `Mining` <-> `Paused` only after confirmed native state/API response; telemetry loss alone must not imply paused.
- Any running state -> `Stopping` on user stop or app shutdown; graceful request, bounded wait, then forced process/job termination and reap -> `Stopped`.
- Unexpected child exit from any active state -> `Error` with sanitized exit reason; no automatic restart.
- `Error` -> `Ready` only after explicit retry/revalidation; never auto-start on app launch or recovery.

Prevent duplicate owned miners with a single Rust supervisor lock/state and an OS process handle/job as source of truth, not PID-file guesses. Do not auto-attach to existing processes. `Unavailable` refers to engine binary/environment; `NotConfigured` to Ember's valid local setup; neither is a mining-session state.

### Diagnostics and data domains

Retain only a bounded in-memory ring of sanitized recent diagnostic lines while running; persist logs only after a separate user-visible retention/export decision. Keep raw output out of the frontend and telemetry. Redact public wallet addresses, API tokens, generated paths with usernames, and other user-specific strings before any retention. Summarize failure category, exit code, timestamp, and sanitized detail instead of keeping unbounded output. API tokens are secrets: never put them in argv, status DTOs, frontend state, or logs.

Keep three separate data domains:

1. **Local system telemetry (M02):** CPU, RAM, device/OS, uptime, power, and idle. It describes the host; it is not miner telemetry or an earnings source.
2. **Mining-engine telemetry:** XMRig version, miner-reported hashrate/window, supported/current algorithm when confirmed, pause/health state, and backend information when confirmed. Shares, worker, connection, and uptime remain pending endpoint verification.
3. **Pool/economic telemetry (later):** pool-side accepted/rejected accounting, balances, payouts, estimated rewards, exchange rates, electricity costs, and net estimates. This belongs to pool/economic providers and later estimates, not the local engine adapter.

No profitability/earnings fields belong in the MiningEngine contract.

### MiningEngine contract

One internal Rust boundary, not a public plugin ABI. Illustrative contract (types are conceptual and should be adapted to the existing async/runtime model in M03B):

```rust
trait MiningEngine: Send {
    fn availability(&self) -> EngineAvailability;
    fn validate(&self, config: &MiningConfig) -> Result<ValidatedConfig, EngineError>;
    async fn start(&mut self, config: ValidatedConfig) -> Result<EngineStatus, EngineError>;
    async fn stop(&mut self, reason: StopReason) -> Result<(), EngineError>;
    fn status(&self) -> EngineStatus;
    fn telemetry(&self) -> Option<MiningTelemetry>;
    fn diagnostics(&self) -> Vec<DiagnosticSummary>;
}
```

Use Ember-owned enums/DTOs for generic lifecycle, availability, error categories, telemetry and diagnostics. XMRig-specific paths, API schemas and raw output stay in `XMRigEngine`. Avoid making the generic contract promise features an engine cannot supply. Availability/version should be probed from the verified executable without starting a mining process (exact probe must be tested); validation should be deterministic and side-effect free in Ember before any child starts.

Initial normalized telemetry candidates: current/short-window hashrate (numeric rate plus unit/window), medium and long-window rates when present, engine version, current algorithm only if reported unambiguously, pause/running state, and backend list/health where response schema is confirmed. Do not infer accepted/rejected shares, pool health, or earnings from console strings. Preserve unknown/unavailable and sample timestamp.

### Contribution and consent boundary

The Rust application policy layer (a future contribution/accounting service above the engine adapter) owns the 5% Ember Contribution. UI explains and displays the policy; adapter only receives explicitly approved mining configuration. Process code, screen components, and pool-data code must not independently implement contribution behavior. XMRig config must be capable of representing a transparent approved destination/policy if selected, but XMRig's ordinary pool failover list is not a split and its built-in 1% donation is separate. Do not choose wallet switching, destination rotation, developer mining, or another mechanism until a technically honest, auditable model and legal review are complete. Future transparent accounting needs engine/session duration or hashrate work by destination, pool-side share/reward records, clear denominators/fees, policy/version history, and user-visible gross/contribution/net accounting; the precise required source depends on the approved mechanism.

Before a future start, require setup complete, valid public wallet and explicit pool/configuration, visible disclosure and acknowledgement of the 5% contribution and XMRig's own donation behavior, explanation of resource use and mining uncertainty, and a fresh explicit user start action. Installation, update, app launch, tray restoration, or recovery never starts mining. Autostart mining is out of scope until a separate opt-in setting and consent UX exists. M03B may build the engine boundary and safe, non-mining validation tests; M03C owns first end-to-end setup/consent/mining flow.

### Windows security-product and reputation notes

Mining executables are likely to receive security-product scrutiny, but outcomes vary by engine build, reputation, distribution channel, and security definitions. This research did not test Defender or SmartScreen; require later release-candidate testing on clean Windows installations. Do not evade detection, obfuscate or encrypt XMRig against scanners, turn protections off, or add exclusions. Legitimate mitigations are unmodified official artifacts, verified provenance, transparent setup and process visibility, code signing for Ember's own installer where feasible, clear notices/source links, normal install/uninstall behavior, and a clear user explanation if protection blocks execution. Ember code signing cannot claim to make the XMRig binary signed by Ember or erase its upstream reputation.

## Unresolved before release

1. Legal review of GPLv3 distribution/aggregation, Ember process/API integration, exact notices, and Corresponding Source delivery for Ember's chosen download/bundle flow.
2. Independently confirmed GPG key fingerprint and key-rotation/revocation policy; exact release download and verification toolchain.
3. Pin supported Windows architectures/version and define update cadence, rollback, end-of-support and download consent.
4. Confirm current API schema and semantics, especially shares, pool connection, uptime, worker, and API restricted-mode/read/control behavior, against the exact release.
5. Confirm a safe, authenticated graceful-stop path while preserving least API privilege; select port allocation/discovery and token lifecycle.
6. Determine whether XMRig creates descendants and validate Job Object assignment/cleanup in packaged Tauri and Windows shutdown conditions.
7. Decide whether API config includes an access token and how to protect/clean the generated config, including ACLs and crash cleanup.
8. Decide Ember Quit behavior while active and later opt-in autostart policy.
9. Approve contribution mechanism and its accounting/source evidence independently from XMRig's 1% donation.
10. Test actual Defender/SmartScreen behavior, installer reputation/signing, and user-facing remediation without exclusions.

## Primary sources

- [XMRig repository and license](https://github.com/xmrig/xmrig)
- [XMRig v6.26.0 releases and signed SHA256SUMS](https://github.com/xmrig/xmrig/releases)
- [XMRig command-line options](https://xmrig.com/docs/miner/command-line-options)
- [XMRig HTTP API overview](https://xmrig.com/docs/miner/api)
- [XMRig API configuration](https://xmrig.com/docs/miner/config/api)
- [XMRig API summary endpoint](https://xmrig.com/docs/miner/api/summary) (marked unfinished upstream)
- [XMRig API backends endpoint](https://xmrig.com/docs/miner/api/backends) (marked unfinished upstream)
- [XMRig API config endpoint](https://xmrig.com/docs/miner/api/config) (marked unfinished upstream)
- [XMRig pool configuration](https://xmrig.com/docs/miner/config/pool)
- [XMRig network configuration and donation level](https://xmrig.com/docs/miner/config/network)
- [XMRig huge pages documentation](https://xmrig.com/docs/miner/hugepages)
- [XMRig upstream API implementation (`Miner.cpp`)](https://github.com/xmrig/xmrig/blob/master/src/core/Miner.cpp)
- [GNU GPLv3 full text](https://www.gnu.org/licenses/gpl-3.0.html)
- [Rust `std::process::Child`](https://doc.rust-lang.org/std/process/struct.Child.html)
- [Microsoft Job Objects](https://learn.microsoft.com/en-us/windows/win32/procthread/job-objects)
- [Microsoft `AssignProcessToJobObject`](https://learn.microsoft.com/en-us/windows/win32/api/jobapi2/nf-jobapi2-assignprocesstojobobject)
- [Microsoft process termination](https://learn.microsoft.com/en-us/windows/win32/procthread/terminating-a-process)
