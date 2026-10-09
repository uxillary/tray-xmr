# XMRig Integration Research and Contract

**Status:** M03 functional foundation is complete: verified provisioning, setup/consent, supervised controlled launch, authenticated loopback summary telemetry, lifecycle control, cleanup and diagnostics are implemented. A later current-release native owner session successfully reached Mining and authenticated loopback telemetry; the earlier report of XMRig staying alive without opening its API is historical and no longer reproducing, with no root cause claimed. Owner Stop/Quit acceptance and public-release legal/distribution review remain open. Diagnostics Mode also has a focused non-mining same-machine integration test. See [Roadmap](ROADMAP.md).

## Decision summary

- Prefer **Ember-managed download of an unmodified, pinned official XMRig release** for the first implementation, after licensing review. Download the official Windows archive directly from the official XMRig GitHub release, verify its detached signature and signed SHA-256 manifest against an independently pinned upstream key, then verify the selected archive hash before extraction. Fail closed on any mismatch. Do not silently update or launch a changed binary.
- Keep a user-supplied executable as a possible later advanced path; it offers weaker provenance/version consistency and less beginner-friendly support. Do not bundle binaries in Ember's installer initially.
- Generate deterministic JSON configuration for normal operation. Keep only launch-level controls in argv; never put the wallet address or API token in command-line arguments.
- Use XMRig's local HTTP API for structured telemetry where the exact pinned version confirms the fields. Treat stdout/stderr as bounded diagnostics, not the telemetry contract.
- Rust owns the internal engine contract, lifecycle state, config validation, supervised child, authenticated readiness, normalized telemetry, and bounded diagnostics. Tray Stop and Quit clean up the owned process and runtime session. React exposes only readiness-gated start and stop actions; the backend independently rechecks consent and artifact integrity.
- Keep local system telemetry, engine telemetry, pool/economic data, progression and UI state as separate domains; use the provenance model in [Architecture](ARCHITECTURE.md).
- Implement Ember's selected 5% contribution schedule in a distinct Rust policy boundary above the engine adapter. The UI may disclose and report the current destination and active-time counters; it does not control payout routing.

## Current authoritative upstream findings

### M03C.2A setup contract

Rust re-verifies at Ember startup, every readiness refresh and candidate generation. The fixed location is `%LOCALAPPDATA%\Ember\miners\xmrig\6.26.0`. Checks cover reparse locations/files, bounded metadata, engine/version/architecture/source/archive/signing metadata, timestamp/digest shape, native Windows AMD64 support, executable existence and digest against the recorded verified digest. Missing or changed data fails closed. The Ember availability DTO has NotInstalled, Verifying, Ready, Modified, Unsupported and Error; current commands resolve after verification (Verifying is reserved). Explicit repair quarantines a failed installation, restores it if replacement fails, and removes it after a verified replacement succeeds. Frontend supplies no executable path. Local metadata is not a defense against a malicious same-user actor changing both executable and record.

Tauri's `local_data_dir()` returns the OS base directory; commands now explicitly append `Ember`, matching the controlled M03C.1 install. Setup uses that same subtree.

The local mainnet wallet parser supports standard (prefix 18, 95 characters), integrated (19, 106), and subaddresses (42, 95): block Base58 with overflow checks, four-byte Keccak-256 checksum, canonical Edwards public-key decompression and rejection of small-order keys. It rejects test/stagenet and OpenAlias, collects no seeds/private keys/passwords/files, and performs no lookup. Format validity is not ownership or pool compatibility. React gets only a six-character prefix/suffix summary after save; editing requires re-entry and removal is supported. Rules come from [Monero Base58](https://github.com/monero-project/monero/blob/master/src/common/base58.cpp), [network prefixes](https://github.com/monero-project/monero/blob/master/src/cryptonote_config.h), [address/key parsing](https://github.com/monero-project/monero/blob/master/src/cryptonote_basic/cryptonote_basic_impl.cpp), and an independent [published test address](https://github.com/monero-project/monero/blob/master/tests/unit_tests/address_from_url.cpp).

The initial pool UX is explicit manual Stratum host/port and visible TLS choice, with an optional worker. No pool is selected silently. Rust normalizes DNS case/outer whitespace, accepts DNS/IP including bare IPv6, rejects URLs/credentials/paths/shell fragments/zero ports, and bounds worker names to 64 ASCII letters/digits/`._-`. TCP without TLS is visibly unencrypted. Pool availability, certificates, address-format support and compatibility remain untested; no DNS resolution or pool connection occurs.

Quiet selects `max(1, floor(logical CPUs / 4))` threads, Balanced `max(1, floor(logical CPUs / 2))`, Performance all logical CPUs. Unknown/zero or counts above 4096 block readiness. Rust supplies all profile counts to React. JSON uses that many `cpu.rx` entries of `-1` (no affinity) and the same `randomx.init` count, following [official XMRig CPU configuration](https://xmrig.com/docs/miner/config/cpu). This controls threads, not a CPU-utilization/power/temperature limit; dataset memory and device performance vary. CPU huge pages/JIT, RandomX 1GB pages/MSR/cache QoS, OpenCL/CUDA, autosave/background/watch are disabled. Upstream donation is explicitly 1%.

M03C.2A generated disposable candidates in memory only. M03C.2B now creates a fresh candidate per attempt, holds its loopback port reservation until immediately before spawn, writes JSON into a private per-session runtime subtree with restrictive ACLs, and removes it on stop/failure or next-launch crash cleanup. Token and config never cross the frontend boundary.

`MiningReadiness` requires verified engine, valid wallet/pool/profile, candidate generation, current disclosures, no owned process, supported platform/CPU count and readable local setup. All checks must pass for Ready. M03C.2A kept `startAllowed` false; M03C.2B derives it from readiness and idle lifecycle state, while the Rust `start_mining` command repeats the setup/consent check before launch. The UI reads live lifecycle and supported telemetry from Rust; pool/share status and earnings remain unavailable.

### Install verification continuity

`provisioner::verify_installation` is the single verifier used by readiness, Start preflight, and the immediate pre-spawn check. It validates the non-reparse install root, the strict `ember-verification.json` field set (the format has no separate schema-version field), pinned v6.26.0 / Windows x64 metadata, archive digest, official release URL, signer fingerprint, nonzero persisted install time, and a fresh executable SHA-256. Failure is typed as missing, corrupt, outdated, unsafe, unreadable, or digest-mismatched metadata/install state and keeps Start disabled; owner messages request Repair where appropriate.

The persisted release identifier is deliberately lowercase `xmrig`. Only after the verifier returns `VerifiedInstallation` does its adapter conversion map that persisted ID to the canonical display/adapter identity `XMRig`, carrying the pinned archive digest and fresh verification timestamp. This fixes the M03C.2B first-start regression: the adapter previously compared the persisted lowercase ID directly to its title-case label and misleadingly reported unverified metadata, even though readiness and the fresh executable/provenance checks had passed. No installed binary or sidecar is trusted from that label conversion alone.

### Owner-machine integration diagnostic

Diagnostics Mode exposes an explicit **Test XMRig integration** action under Settings → Advanced / Diagnostics. It reuses the shared installation verifier, private runtime storage, reserve/drop port handoff, redirected handles and production `SupervisedChild::spawn` boundary. It sequentially runs a CPU-disabled minimal configuration and a production-shaped Quiet configuration capped at four threads. Both use a fresh restricted loopback API token, a fixed fake diagnostic identity, `does-not-exist.invalid`, disabled GPU backends and donation level zero. No persisted owner wallet, worker or pool enters either configuration, and no pool job can arrive.

The bounded result records listener, TCP, authenticated `/2/summary`, expected safe DNS, memory and cleanup evidence. Copied reports omit the token and private paths and retain only relevant sanitized XMRig events. Test cancellation and Ember Quit cancel the run, close Job Object ownership and remove the ephemeral runtime. Production Start and this diagnostic are mutually exclusive.

**Historical contribution decision A (superseded by D-059):** an early controlled development session was intended to omit the then-inactive contribution. The current owner-approved schedule applies to every explicit mining start. UI discloses CPU/electricity use, performance effects, uncertain rewards, wallet/pool/profile/XMRig selections, separate upstream 1% donation, the 5% time-based developer schedule and no automatic mining on launch. Consent is versioned; wallet/pool/profile edits invalidate acknowledgement, which can be withdrawn.

Persistence is `%LOCALAPPDATA%\Ember\setup-v1.json`, schema 1: revision, public address, normalized pool/worker, profile and acknowledgement (disclosure version 1 plus setup revision). Missing file becomes empty setup. Unknown schema, malformed/oversized or invalid saved data blocks readiness and offers explicit reset. Writes use create-new same-directory temporary files, sync/close, and Windows atomic replacement; failed saves retain prior state and remove temporary output. Storage inherits the current user's LocalAppData permissions. No API token/runtime port/candidate JSON/diagnostics/telemetry is persisted. Personal setup and candidates have no raw Debug representation; error messages are fixed and DTOs mask addresses.

**Dry-run decision: do not execute.** [Pinned App.cpp](https://github.com/xmrig/xmrig/blob/v6.26.0/src/App.cpp) exits before `Controller::start`, which creates Miner and connects the pool in [Controller.cpp](https://github.com/xmrig/xmrig/blob/v6.26.0/src/core/Controller.cpp). But `Controller::init` already constructs [Network](https://github.com/xmrig/xmrig/blob/v6.26.0/src/net/Network.cpp), pool strategies, donation state and timers via [DonateStrategy.cpp](https://github.com/xmrig/xmrig/blob/v6.26.0/src/net/strategies/DonateStrategy.cpp). A complete constructor/strategy side-effect review is needed to establish the stricter local-only boundary. Ember's native owner acceptance now includes a real session; this does not change the separate decision not to use XMRig dry-run as a local-only validation method.

Added direct dependencies `sha3` 0.10.9, `curve25519-dalek` 4.1.3 and `getrandom` 0.4.3 were already locked transitively; only direct lockfile edges change. Include their licenses/notices in release review.

**M03C.2B implementation record:** explicit development-session authorization, validated wallet/pool/profile and fresh consent, pre-spawn artifact re-verification, private runtime config/ACL and crash cleanup, port handoff/retry, bounded authenticated loopback transport, pinned restricted-summary readiness, Job Object escalation, visible stop/quit/error/recovery semantics and packaged cleanup coverage are implemented. The controlled session is explicitly labeled without Ember contribution. **Native acceptance (2026-10-06):** the owner rebuilt the current release and observed Starting → Mining, authenticated local API telemetry, Connected pool, approximately 873 H/s, Quiet configured at 4 of 16 threads and advancing session time. Earlier reports that XMRig stayed alive without opening its API are historical; the failure is no longer reproducing and no root cause is claimed. Stop/Quit owner acceptance, legal/distribution and clean-machine security-product checks remain open. Local Ready alone is not evidence of a successful mining session.

### License and distribution

The XMRig repository currently identifies its license as **GNU GPL version 3 or (at the recipient's option) any later version**. Its official release page publishes Windows x64, Windows ARM64, and Windows GCC x64 ZIP archives. The checked current release was v6.26.0; its Windows x64 archive is about 3.7 MB and its release includes a `SHA256SUMS` file and detached `SHA256SUMS.sig`, with the page identifying GPG keys published through xmrig.com and GitHub.

GPLv3 permits redistribution, but conveying an object-code copy carries license conditions. These include keeping copyright/license/warranty notices, providing the GPL text, and providing Corresponding Source using one of the license's permitted methods. A hosted download offer must keep equivalent source access available. Redistribution is not made compliant by attribution alone. If Ember modifies XMRig, it must mark modifications and dates and convey the derivative covered work under GPLv3-compatible terms, including Corresponding Source and required notices. Whether the separately licensed Ember application and miner form an aggregate or a combined work in the planned packaging/integration is a legal question for review; do not infer the answer from process separation alone.

The least-complex initial approach is to have the user's Ember installation fetch an unmodified upstream release directly from the official release location, rather than Ember redistributing the executable inside its own installer. That lowers bundled artifact and installer-maintenance obligations but does not itself settle every legal issue. The implementation adds `sequoia-openpgp` (LGPL-2.0-or-later), `reqwest` (MIT/Apache-2.0), `sha2` (MIT/Apache-2.0), `zip` (MIT), `hex` (MIT/Apache-2.0), and `anyhow` (MIT/Apache-2.0); review notices and dependency obligations before public release. Legal review must approve the exact acquisition flow, attribution/notices, user-facing license presentation, source link/availability, and dependency treatment. Do not patch upstream donation behavior or remove its notices.

### Release provenance and integrity

The official v6.26.0 release publishes per-archive SHA-256 values and a detached GPG signature for `SHA256SUMS`. The selected Windows x64 asset is `xmrig-6.26.0-windows-x64.zip` (3.7 MB); its published digest is `bba8097cb37d9b458a1cb1137876b27cde6740d17fe4ccbc086ba07d87d9e147`. The manifest and detached signature are separate official release assets. The signing key is `XMRig <support@xmrig.com>`, key ID `446A53638BE94409`, full fingerprint `9AC4 CEA8 E66E 35A5 C7CD DC1B 446A 5363 8BE9 4409`. The full fingerprint and public key are published at [xmrig.com/docs/gpg-key](https://xmrig.com/docs/gpg-key); the page explicitly says this key must equal the copy in the official [XMRig repository](https://github.com/xmrig/xmrig/blob/master/doc/gpg_keys/xmrig.asc). The public key blocks match byte-for-byte, and the v6.26.0 release signature issuer matches the full fingerprint's key ID. This supplies two official upstream-controlled publication locations; no public keyserver is used as a trust source. Pin the full fingerprint, accept no other key, and require a reviewed Ember source change for rotation. Upstream does not provide an independent key-transparency or revocation service in these sources, so rotation/revocation still requires a deliberate Ember update.

Ember provisioning should:

1. Pin a specific XMRig version, expected official release URL, archive name, and upstream signing-key fingerprint in reviewed Ember release metadata.
2. Fetch only over HTTPS from the official release endpoint; verify the detached signature over `SHA256SUMS` with a key whose fingerprint Ember has pinned through an independent trusted channel.
3. Parse the signed manifest strictly and compare the exact expected archive SHA-256; reject missing, duplicate, malformed, unexpected, or mismatching entries.
4. Extract to a fresh versioned staging directory with path-traversal checks; verify the expected executable is present, then atomically promote it to the managed version directory.
5. Record version and verified digest locally. Re-verify before every launch and fail closed if the file changes. Updates install side-by-side, verify before activation, preserve the previous verified version for rollback, and never start mining or change consent automatically.

The release metadata establishes what upstream published, not that the source is free of defects or that a binary behaves benignly. A signed checksum manifest is not an Authenticode signature on `xmrig.exe`; do not claim Windows publisher identity from it. The M03C.1 controlled development install verified the pinned signing identity and archive digest and atomically promoted the extracted release. Ember did not execute the binary.

### M03C.1 provisioning implementation

`src-tauri/src/mining/provisioner.rs` owns static v6.26.0 Windows x64 metadata, HTTPS-only downloads from the pinned GitHub release URL (redirects only to HTTPS `github.com` or `*.githubusercontent.com`), connection/request timeouts and artifact-size caps. It verifies `SHA256SUMS.sig` using Sequoia OpenPGP's Windows CNG backend and the embedded upstream public key, checks the full pinned fingerprint, strictly parses the signed manifest, and compares the archive SHA-256 with the reviewed digest. It does not invoke shell tools or accept frontend URLs/paths.

Provisioning requires the Mining-page **Set up engine** action. It downloads into a fresh sibling staging directory under `%LOCALAPPDATA%\\Ember\\miners\\xmrig`, rejects unsafe or out-of-root paths, Windows alternate data stream names, symlinks, unexpected root layout, duplicate paths, excessive file counts/expanded size, and missing `xmrig.exe`. It writes provenance metadata and promotes the completed directory by same-volume rename. Failed staging is removed. Existing installs are not overwritten; they are checked for metadata, pinned version/location fields, and executable digest. A modified executable fails verification. Ember does not automatically download on launch, replace versions, start XMRig, or configure mining.

The persisted record contains engine/version/architecture, signed archive digest, installed executable digest, signing fingerprint, upstream source and install time; no personal path is stored. The UI describes XMRig as separate GPLv3 software, links upstream notices/source, identifies v6.26.0 and the official source on error, and offers retry. Its setup action currently reports one combined download/verification/install activity state; it does not provide precise percentage progress or cancellation. M03C.2B re-verifies `read_and_verify_install` immediately before process creation and fails closed on any change.

The one controlled real provisioning run installed XMRig 6.26.0 from the official GitHub release. Detached manifest signature and archive SHA-256 both verified; resulting installation was `%LOCALAPPDATA%\\Ember\\miners\\xmrig\\6.26.0`. The installed executable SHA-256 recorded by the test was `6fa80698d7268f6e88aa88c06fb27ee99e1bcee747c2e76911e6206a5b1aeeb3`. No `xmrig` process was present afterward, and `xmrig.exe` was never executed.

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

The official binary's default built-in XMRig donation is 1%; official docs state it cannot be lowered below 1% without editing/recompiling source. This is distinct from Ember's working 5% contribution baseline. Any higher Ember rate is an open business decision. Disclose both accurately, do not modify or mask upstream donation behavior, and do not imply Ember contribution cannot be changed on a user-owned machine. The final contribution model requires product/legal review.

### Local HTTP API

XMRig includes a built-in HTTP server. Ember uses authenticated GET `/2/summary`; GET `/2/backends` is another restricted-safe read endpoint. `/2/config` and JSON-RPC can mutate miner state, and restricted mode rejects non-GET requests. The exact v6.26.0 source, not the unfinished upstream schema pages, is authoritative for this adapter.

`/2/summary` combines API metadata, miner state/hashrate, network result/connection state, and CPU huge-page status through XMRig API listeners. Ember now normalizes optional fields from that response: three total hashrate windows; XMRig result counts/current difficulty/accepted difficulty sum; current connection endpoint/state/uptime/failure count/ping/TLS version/job algorithm/difficulty; and CPU huge-page allocation. Missing optional data remains missing. Do not infer telemetry from console output. Pool result counters are XMRig's aggregation of pool submission responses, not a separate pool account API. See the normalized contract and precise semantics below.

The API is not read-only by design: upstream dispatches JSON-RPC `pause`, `resume` and `stop`, but restricted HTTP mode rejects the non-GET POST before API dispatch. Ember must not weaken restricted mode for these commands. Ember configures the restricted local API for the controlled session and uses authenticated GET summary; Stop remains owned Job Object termination.

Initial Ember stance: explicitly enable the API; bind **only** to `127.0.0.1`; never accept arbitrary bind hosts; use a randomly generated per-run high-entropy token held only by the Rust supervisor; persist it nowhere beyond a user-private short-lived config if XMRig requires config-file provisioning; never expose it to React/logs/diagnostics. Select a local port and retry safely on collision (the documented random port cannot be discovered through a documented handshake). Use restricted mode for normal telemetry. Validate response size, schema, numeric bounds, and API identity. If stop control requires full API access, prefer a separately reviewed authenticated loopback control path; do not quietly enable unrestricted API features. No LAN bind, internet exposure, firewall rule, or inbound connectivity is needed. Confirm exact access semantics and a safe stop path against the pinned XMRig release before implementation.

### Process and privilege model

On Windows, M03B.1 uses `CreateProcessW` and owned process/thread/pipe handles because `std::process::Child` does not expose the primary thread handle needed for suspended assignment. Other targets retain `std::process::Command`/`Child`. Dropping a child wrapper alone is not cleanup; the Windows Job Object is the kernel-owned process-tree boundary. Drain stdout and stderr concurrently; impose byte/line bounds and redact before retaining diagnostics. Use an absolute verified executable path, no shell, fixed working directory, empty environment, and one Rust-owned supervisor that serializes start/stop and rejects duplicate starts.

Track the child handle and PID, monitor process exit and API readiness, and publish lifecycle changes from Rust. A stop request first uses a verified graceful XMRig mechanism; if it does not exit within a bounded timeout, terminate the owned process/job and wait/reap. Do not attempt to find and kill arbitrary `xmrig.exe` processes by name. Ensure quit, Rust panic/error paths, Windows logoff/shutdown, startup failure, timeout, and unexpected exit all converge on cleanup. A stale external process is never adopted automatically; report it for user resolution. Quit semantics while active must be an explicit user-visible choice before M03C.

M03B.1 creates the Job Object, calls `CreateProcessW` with `CREATE_SUSPENDED` and redirected standard handles, assigns the process handle, and calls `ResumeThread` only after successful assignment. Production XMRig also uses `CREATE_NO_WINDOW` so a console-subsystem executable does not open a separate console. This flag does not detach the process: `STARTF_USESTDHANDLES` still supplies the explicitly inherited stdin/stdout/stderr pipes, and the suspended process remains in the same kill-on-close Job Object before its first instruction executes. `CREATE_NO_WINDOW` is compatible with the other selected creation flags; Ember does not use `DETACHED_PROCESS`, a shell, or a second launcher. A Windows regression checks that both no-window and suspended/extended-startup flags are present. Job Object configuration is limited to `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE`. Every pre-resume failure terminates and waits for the suspended process; process, thread, job, and pipe handles use RAII ownership. When a direct child exits, the Job Object closes before pipe readers are joined, which terminates descendants that might keep inherited pipe handles open. Nested-job assignment failures are fail-closed; behavior under CI/development parent jobs depends on Windows nested-job support.

The Rust-owned startup stage is polled through `mining_status`; React does not infer stages from timers. It reports engine verification, fresh session/config/ACL preparation, process launch, then `Waiting for miner…` until strong hashrate evidence arrives. In the pinned [v6.26.0 `Miner.cpp`](https://github.com/xmrig/xmrig/blob/v6.26.0/src/core/Miner.cpp), summary `algorithms` is built from enabled backend capabilities; it does not prove that a pool job has arrived or RandomX dataset/backend initialization has completed. `/2/backends` has a separate backend JSON contract, but Ember does not currently poll it; the [CPU backend JSON implementation](https://github.com/xmrig/xmrig/blob/v6.26.0/src/backend/cpu/CpuBackend.cpp) can omit thread/hashrate fields before startup completes. Ember therefore does not label `rx/0` support as actual RandomX initialization. Readiness still requires pinned v6.26.0 identity, miner kind, restricted API, unpaused state, `rx/0`, and positive short-window hashrate; no share is required. Monotonic bounded timings cover verification, candidate preparation, runtime ACL/config operations, process creation, Job Object assignment, resume, first authenticated summary, `rx/0` first advertised, first positive hashrate, and Mining transition. The summary transport cannot independently report the TCP connect instant; the first authenticated summary is the observable API-ready boundary. These timings contain stage names and elapsed milliseconds only, never tokens, wallet data, argv, config contents, or paths.

Windows error 2/3 from process creation is reported as an unavailable engine that may have been removed by Windows Security or another security product; error 5 is reported as Windows preventing launch. Ember preserves the bounded numeric OS code and does not claim a particular product caused it. Early exit and authenticated API timeout remain separate failures. Recovery offers retry, engine recheck, and the existing verified Repair action; Ember never disables protection, creates exclusions, elevates to bypass a block, or restores quarantine. First-run disclosure explains XMRig's role, verification, possible security review, and user Stop/Quit control. Public release still requires controlled clean-machine Defender and SmartScreen testing.

Packaged verification used a temporary compile-time-gated fixture and a full feature-enabled Tauri build; the `target/release/ember.exe` artifact was run directly, not installed. Four start/stop cycles removed each fixture parent and descendant. A fifth pair remained alive until the Ember owner process was forcibly terminated externally; PID-handle checks confirmed the owner, parent, and descendant exited. The user subsequently manually verified normal Ember launch, tray availability, **Quit Ember**, and application exit. The temporary feature, fixture source, executable, marker files, and feature-built MSI/NSIS artifacts were removed. M03B.1 is complete.

The earlier `0xC0000409` release exit reproduced only when launching from the Codex restricted sandbox identity. Debug output showed Tauri/Wry failing during WebView2 environment creation with `HRESULT 0x800700AA`, before the setup closure; release panic-abort surfaced as `0xC0000409`. No matching Application Error/WER event was recorded. The clean normal release executable launched under the logged-in Windows user and remained running with an Ember main-window title and WebView2 processes. No application startup code change was needed; the sandboxed launch was not a valid packaged-host test.

The manual normal-app tray Quit verification supplements automated parent/descendant and forced-owner-loss cleanup checks. It did not run or require XMRig.

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

Keep separate data domains:

1. **Local system telemetry (M02):** CPU, RAM, device/OS, uptime, power, and idle. It describes the host; it is not miner telemetry or an earnings source.
2. **Mining-engine telemetry:** XMRig version/API uptime, measured hashrate windows, pause flag, enabled-algorithm capability, and CPU huge-page allocation.
3. **Pool results relayed by engine:** accepted/rejected counts and current connection facts returned by XMRig from Stratum callbacks. These are not direct pool account data; balances and payouts still require a provider.
4. **Ember observed:** lifecycle/process ownership, session duration and selected profile, separate from XMRig measurements.
5. **Pool/economic telemetry (later):** authoritative account balances/payouts, exchange rates, electricity costs and estimates from verified providers.

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

### M04A normalized summary contract

Rust's `MiningTelemetry` snapshot preserves engine version, XMRig API uptime, pause flag, enabled-algorithm list, three total hashrate samples in H/s, pool result counters, current pool connection facts, CPU huge-page allocation and local sample timestamp. Optional numbers use `Option`; reported numeric zero remains zero, while JSON null or a missing field remains unavailable. Earnings, contribution, progression, cloud and UI animation state are excluded. Ember-observed lifecycle/process/session duration/profile remain separate supervisor/setup facts.

XMRig's `hashrate.total` positions are 10-second, 60-second and 15-minute rolling windows. They are work-count samples over a time interval, not instantaneous rates, and are raw H/s rounded to 0.01 or null until enough samples exist. A window can be unavailable if a backend has no sample. Pausing or disconnecting may result in zero or null depending on samples. Use the 10-second sample as beginner-facing **Current hashrate**, clarifying the window in details; expose 60-second and 15-minute values under Details.

`results.shares_good` is accepted and `shares_total` is accepted plus rejected callbacks recorded by `NetworkState`; Ember derives rejected as total minus accepted only when consistent. These counts are pool submission outcomes processed by XMRig, not a separate pool account API. Counters start with the per-process `NetworkState` and are not reset by reconnect (`stop()` clears connection timing/latency, not counters). Donation-strategy results are routed separately and excluded. API v2 omits rejection error strings and stale/rejected subcategories. Do not base progression on these counters yet. `diff_current` and connection `diff` are current job difficulty, not per-share difficulty. `hashes_total` accumulates accepted result difficulty; it is not direct CPU hash count or earnings.

The `connection` object reports active `host:port`, `uptime_ms`, failure count, median ping (ms), TLS version string, current job algorithm and difficulty. Ember omits IP, TLS fingerprint, API id/worker id and raw job details. Positive uptime supports Connected; failures with zero uptime supports Disconnected; otherwise state is Unknown. XMRig does not expose separate Connecting/Reconnecting states. A healthy authenticated API with a disconnected/unknown pool is distinct from API failure/process exit. Pool disconnect does not imply the process stopped.

Top-level `uptime` is XMRig API/base uptime in whole seconds, not Ember session duration. The supervisor should own process/session duration using monotonic time. `paused` is XMRig's enabled flag inverse; it does not indicate pool connectivity or recent work. `algorithms` lists enabled backend capabilities, not active pool job or RandomX readiness. API v2 summary `hugepages` is `[allocated,total]`; zero is meaningful. `/2/backends` exposes backend type/enabled/profile/hashrate, CPU huge-page and memory data, thread entries and per-thread rates. Ember does not currently poll or normalize this endpoint; v2 summary deliberately omits per-thread rates. Backend thread entries do not prove workers are active during startup, so do not call them active threads without further evidence.

`Mining` is a Rust lifecycle state, not a synonym for connected pool, received job, continuously nonzero hashrate or accepted shares. Current startup requires a positive short-window rate; after that each fact remains independent. Process existence is the owned process handle; API health/freshness comes from authenticated requests; backend state is separate; pool state comes from the connection object; hashing comes from rate samples; accepted work comes from result counters.

### Polling and freshness

The native monitor runs one serial loop, sleeping one second between iterations with a two-second request deadline. It cannot overlap its own requests; a slow request delays the next sample. It runs independently of window visibility. The frontend status invoke refreshes every second but does not query XMRig. Ember marks the last good sample **Fresh** for five seconds, then **Stale** while retaining it; before a good sample or after session cleanup it is **Unavailable**. One failed poll does not change lifecycle or erase data. The process monitor owns unexpected-exit detection and changes lifecycle to Error. A valid recovery sample refreshes the data. Stop clears telemetry and stops polling. Future Paused polling should continue more slowly to verify the pause flag; Stopped must not poll.

Keep one serial local poller with a two-second deadline and bounded interval (roughly 1–2 seconds while Starting/Mining, slower while Paused). Do not tie native monitoring to WebView visibility or infer process death from an API timeout.

### Pause/Resume research boundary

Pinned `Miner.cpp` implements JSON-RPC `pause`/`resume`; these toggle XMRig's enable flag and retain the process/API. They require POST `/json_rpc`, which pinned `Httpd.cpp` rejects with 403 in restricted mode before dispatch. Do not relax restricted mode for these commands. Console command handlers map `p`/`r` to that flag, but Ember intentionally starts XMRig without a console and has no stdin command writer; piped stdin has not been verified as a safe command channel. No Pause/Resume mechanism is established under Ember's current security model, so defer both controls. Reconsider only with a narrow authenticated mechanism compatible with restricted read-only telemetry and verification of the resulting paused state and resumed work. A command response alone does not prove hashing resumed.

### Contribution and consent boundary

The Rust application policy layer implements the selected 5% developer fee as 19:1 active mining time by wallet (D-059). A scheduled wallet change uses a supervised XMRig restart because the current restricted API boundary is read-only. XMRig's ordinary pool failover list is not a split and its built-in 1% donation is separate. The UI reports active time per destination and labels the resulting reward share as approximate; pool-side shares/reward records are still needed before claiming actual gross/contribution/net amounts. Preserve the user wallet as the normal destination, require explicit informed consent, and show the developer destination and current slot. Keep routing policy in Rust above the engine adapter; the UI only presents state.

Every start requires complete setup, a valid public wallet and explicit pool/configuration, visible disclosure and acknowledgement of the 5% active-time schedule and XMRig's own donation behavior, an explanation of resource use and mining uncertainty, and a fresh explicit user action. The schedule reports per-session active time, not actual payout accounting, and is not persisted as lifetime history. Installation, update, app launch, tray restoration, or recovery never starts mining. Autostart mining is out of scope until a separate opt-in setting and consent UX exists.

### Windows security-product and reputation notes

Mining executables are likely to receive security-product scrutiny, but outcomes vary by engine build, reputation, distribution channel, and security definitions. This research did not test Defender or SmartScreen; require later release-candidate testing on clean Windows installations. Do not evade detection, obfuscate or encrypt XMRig against scanners, turn protections off, or add exclusions. Legitimate mitigations are unmodified official artifacts, verified provenance, transparent setup and process visibility, code signing for Ember's own installer where feasible, clear notices/source links, normal install/uninstall behavior, and a clear user explanation if protection blocks execution. Ember code signing cannot claim to make the XMRig binary signed by Ember or erase its upstream reputation.

## Unresolved before release

1. Legal review of GPLv3 distribution/aggregation, Ember process/API integration, exact notices, and Corresponding Source delivery for Ember's chosen download/bundle flow.
2. Define key-rotation/revocation response for future upstream signing-key changes.
3. Define update cadence, rollback and end-of-support; provisioning has one reviewed static version and no updater.
4. XMRig-reported share counters and current pool connection fields are source-verified and normalized from `/2/summary`; authoritative pool account data still requires a provider.
5. The first owner-controlled live session must confirm real machine behavior and pool configuration. Stop uses the bounded two-second wait followed by termination of Ember's owned Job Object; no HTTP stop call is made.
6. Deterministic Windows process tests cover Job Object assignment and cleanup; the owner-controlled run confirms the packaged app's user-visible lifecycle.
7. Runtime config is created with a fresh token in a private per-session directory, protected by a restrictive ACL, and removed on normal stop, startup failure, unexpected exit, or next-launch stale cleanup.
8. Tray Quit stops the active owned process tree before exit. Mining remains strictly user initiated; autostart is a separate future policy decision.
9. Approve contribution mechanism and its accounting/source evidence independently from XMRig's 1% donation.
10. Test actual Defender/SmartScreen behavior, installer reputation/signing, and user-facing remediation without exclusions.

## Pinned v6.26.0 `/2/summary` contract review

The implementation was inspected at the immutable `v6.26.0` tag, rather than inferred from `master`:

- `src/base/api/requests/HttpApiRequest.cpp`: GET `/2/summary` is classified as `REQ_SUMMARY`; `/2/` selects API response version 2. POST `/json_rpc` is parsed as a JSON-RPC request.
- `src/base/api/Api.cpp`, `Api::exec`: adds API `id`, `worker_id`, `uptime` (integer seconds), `restricted`, and resource/build metadata to summary replies. Ember discards identifying/unneeded fields.
- `src/core/Miner.cpp`, `Miner::onRequest`: handles GET summary and invokes `getMiner` plus `getHashrate`; JSON-RPC also defines `pause`, `resume`, and `stop` operations.
- `src/core/Miner.cpp`, `MinerPrivate::getMiner`: emits `version` (string), `kind` (string; release miner identity is `miner`), `paused` (boolean), and `algorithms` (array of enabled algorithm names).
- `src/core/Miner.cpp`, `MinerPrivate::getHashrate`: emits `hashrate.total` as a three-element array: normalized short, medium, and large windows. Each element may be JSON `null` until a rate is available. For API v2, per-thread rates are deliberately omitted.
- `src/net/Network.cpp` and `src/base/net/stratum/NetworkState.cpp`: the Network API listener adds `results` and `connection` to the same summary. It exposes accepted/good and total counts, current difficulty, accumulated accepted-result difficulty, endpoint, connection uptime, failures, ping, TLS version, active algorithm and accepted/rejected connection counters. The API v2 result object does not expose rejection reason details.
- `src/backend/cpu/CpuBackend.cpp`: adds top-level `hugepages` `[allocated,total]` to summary. `/2/backends` exposes backend type/enabled/profile, current backend rates and CPU details including huge-page counts, memory and thread entries/rates; it does not establish that listed workers are active during startup.
- `src/base/api/Httpd.cpp` at the exact [`v6.26.0` tag](https://github.com/xmrig/xmrig/blob/v6.26.0/src/base/api/Httpd.cpp): verified contract is a lowercase `authorization` header with exact `Bearer <access-token>` formatting. Missing authorization is `401` when auth is required; malformed, short, wrong-scheme, or wrong-token values are `403`; a correct token is `200`. Restricted mode permits authenticated `GET /2/summary` and rejects authenticated non-GET requests with `403`. Ember's client is fixed to loopback GET and the session token.

Ember requires readiness fields `version`, `kind`, `paused`, and `restricted`; optional fields include enabled `algorithms`, `hashrate.total`, XMRig `uptime`, `results`, `connection`, and top-level `hugepages`. Missing optional values stay absent. Hashrates are finite bounded H/s values; null differs from `0.0`. `shares_good` means XMRig received a successful pool submission response; `shares_total` includes successful and rejected responses; rejected is derived only when counts are consistent. `NetworkState` counters reset with the process state, persist through reconnects, and exclude results routed to the donation strategy. The `connection` uptime is active connection duration, while top-level uptime is XMRig API/base uptime. Ember's normalized snapshot and source semantics are documented in [M04A telemetry contract](#m04a-normalized-summary-contract). Startup still needs no accepted share; its positive short-window-rate readiness gate is unchanged.

The JSON-RPC `stop` operation calls the miner core's `stop()`; source does not show this as process shutdown. Ember will use it only if its end-to-end behavior is demonstrated to exit the process; otherwise the first-version Stop remains bounded termination under the existing Windows Job Object supervisor. Console `Ctrl+C` is handled by `App::onConsoleCommand`, but the current suspended/job-owned launch does not establish a reliable console control event channel. Job-owned termination remains the conservative fallback.

### M04B live telemetry presentation

Overview and Mining consume only `mining_status`, which returns Ember lifecycle, the normalized `MiningTelemetry`, freshness and monotonic supervisor session duration. It does not expose raw XMRig JSON, the API token, wallet, worker identity, runtime paths or config. The frontend makes one serialized status request at a bounded one-second cadence and never calls the XMRig API itself. Rust remains the sole XMRig polling authority.

The beginner view emphasizes the 10-second rate, pool state, accepted/rejected result counts, session duration, active Ember profile and configured CPU thread capacity. Positive reported hashrate is described as observed hashing; the summary API does not establish active worker count, so Ember does not label configured threads as active workers. The Mining Details disclosure contains longer rate windows, algorithm/difficulty, and huge-page information. Stale samples remain visible with “Updates delayed”; missing fields remain unavailable and numeric zero stays visible as zero. Startup keeps lifecycle “Starting” with one shared wait state and em-dash placeholders. A pool disconnect remains separate from the Mining lifecycle. Stop remains available; Pause/Resume are deferred.

No hashrate chart/history model or Ember Stream is introduced.

### M04C reliability, workers and helper windows

Lifecycle remains supervisor/process-owned. `stop_mining_sync` serializes with Start/Stop, cancels Starting before joining the operation, delegates termination/reaping to the Job Object supervisor, then drops the per-session runtime owner and clears active telemetry on successful Stop. Repeated Stop is idempotent. Tray Quit uses the same owned stop path and only exits after successful cleanup; application exit also gates on supervisor cleanup. Unexpected child exit is detected by the serial monitor and clears the active session. The monitor polls API serially with a bounded request; a failed API poll preserves lifecycle and eventually marks the last sample stale, then fresh telemetry recovers without launching another child. Pool connection is reported from XMRig network telemetry, independently of lifecycle; a disconnect/reconnect does not restart XMRig or change session identity. Runtime directory deletion occurs on Stop/drop; next launch also cleans valid stale session directories after a crash. Normal Stop clears telemetry; an OS cleanup failure is surfaced as a stop error rather than silently reporting Stopped.

Pause/Resume remain deferred. Pool and API failure behavior is deterministic in the adapter/monitor design; no controlled owner network-disruption test is required.

**Backend worker evidence (pinned v6.26.0):** [`/2/backends` CPU JSON](https://github.com/xmrig/xmrig/blob/v6.26.0/src/backend/cpu/CpuBackend.cpp#L380-L427) includes a `threads` array built from the backend's `CpuLaunchData` entries, with intensity, affinity, average per-thread value and three hashrate windows. This array is configured/launched thread metadata, not a per-entry running flag. The [worker manager](https://github.com/xmrig/xmrig/blob/v6.26.0/src/backend/common/Workers.cpp#L157-L202) creates thread handles and hash-rate storage before each worker reports ready; the backend tracks successful starts internally but does not export that count in its JSON. Per-thread rate windows come from [worker hash-count samples](https://github.com/xmrig/xmrig/blob/v6.26.0/src/backend/common/Workers.cpp#L73-L106) and [Hashrate window calculation](https://github.com/xmrig/xmrig/blob/v6.26.0/src/backend/common/Hashrate.cpp#L114-L167); they may be null until enough samples span a window. A positive per-thread sample is evidence of hashing in that window, not a persistent thread-running state. Keep Ember's normalized contract/UI at configured capacity plus total observed hashrate for now. Revisit per-thread normalization only when a UI need and semantics are defined; do not infer active workers from listed entries.

**Console/helper audit:** production XMRig uses `CREATE_NO_WINDOW` before resume. The regular Start path's runtime ACL applies `whoami.exe` and `icacls.exe` from System32 multiple times (runtime root, per-session directory and config); diagnostics use the same private runtime setup, and stale-runtime cleanup may invoke the ACL helper at launch. These helpers are bounded and do not use a shell; Stop itself does not launch them. They now receive Windows `CREATE_NO_WINDOW` in the common bounded helper wrapper. Provisioning's separate process path is not part of every Start. No native re-run was performed for this patch, so owner visual confirmation is still requested below.

### M04C owner acceptance checklist

- **Start:** launch Ember normally and Start Quiet. Confirm Starting then Mining, Connected when pool/network are healthy, a real rate, advancing session time and the expected Quiet configured allocation (4 of 16 on the recorded machine). Values must remain absent/— until observed; do not infer progress.
- **Work:** check accepted/rejected values remain truthful; accepted may require waiting and is not required for readiness.
- **Navigation:** switch Overview ↔ Mining while mining; confirm coherent telemetry and accessible sidebar.
- **Stop:** Stop mining; confirm lifecycle settles, active-session telemetry clears appropriately and the owned XMRig process exits.
- **Quit:** run a short session, choose tray Quit while mining, then confirm XMRig does not remain running.
- **Visual:** report any CMD/helper flash, repeated/flickering telemetry, stale values, awkward scrolling or confusing layout. No API token or private configuration should be shared.

Do not intentionally disrupt firewall, DNS or security settings to test pool-loss behavior.

### M04D product feedback

Original owner feedback: the UI was somewhat card/text heavy despite the approved direction. M04D addressed that feedback with stronger visual hierarchy, a compact operational composition, concise primary copy and progressive Details while preserving independent sidebar/workspace scrolling. The owner has since reviewed the native Mining experience; see the acceptance result below.

Exact-tag sources: [Miner.cpp](https://github.com/xmrig/xmrig/blob/v6.26.0/src/core/Miner.cpp), [Api.cpp](https://github.com/xmrig/xmrig/blob/v6.26.0/src/base/api/Api.cpp), and [HttpApiRequest.cpp](https://github.com/xmrig/xmrig/blob/v6.26.0/src/base/api/requests/HttpApiRequest.cpp). Public docs: [HTTP API](https://xmrig.com/docs/miner/api), [API configuration](https://xmrig.com/docs/miner/config/api), [summary endpoint](https://xmrig.com/docs/miner/api/summary).

The owner has completed the M04D native visual review and confirmed Starting → Mining, authenticated telemetry, a connected pool, real hashrate, Quiet configured allocation, an advancing session timer and a stable live UI. The Stop/Quit acceptance checklist above remains a separate open item.

### M05A event source audit

The exact-tag [`/2/summary` API contract](https://github.com/xmrig/xmrig/blob/v6.26.0/doc/API.md) and Ember's pinned-version parser establish a current pool connection state plus cumulative accepted/rejected submission-response counters. Ember can therefore report state transitions and aggregate counter deltas after establishing a first-sample baseline. API loss is not a sample and does not reset the baseline; the counters are process-scoped and survive pool reconnects, while a new Ember runtime session gets a fresh opaque session ID and baseline. A decrease in either counter resets only that counter's baseline.

The summary contract has no discrete pool-job ID or event sequence. Its current difficulty and algorithm fields are snapshots; difficulty changes alone cannot prove that new work arrived. Ember therefore does not emit WORK events. XMRig stdout/stderr remain bounded, sanitized diagnostics for troubleshooting and are not promoted into Stream by parsing English log text. The M05A event domain uses an allowlisted structured payload, excludes endpoint/identity/secrets/path/config, and retains at most 256 events in memory for the lifetime of the app process. Retrieval is through `mining_events`; nothing is persisted and the frontend does not produce events.

## Primary sources

- [XMRig repository and license](https://github.com/xmrig/xmrig)
- [XMRig v6.26.0 release and signed SHA256SUMS](https://github.com/xmrig/xmrig/releases/tag/v6.26.0)
- [XMRig published GPG fingerprint](https://xmrig.com/docs/gpg-key)
- [Matching XMRig repository public key](https://github.com/xmrig/xmrig/blob/master/doc/gpg_keys/xmrig.asc)
- [XMRig command-line options](https://xmrig.com/docs/miner/command-line-options)
- [XMRig HTTP API overview](https://xmrig.com/docs/miner/api)
- [XMRig API configuration](https://xmrig.com/docs/miner/config/api)
- [XMRig API summary endpoint](https://xmrig.com/docs/miner/api/summary) (marked unfinished upstream)
- [XMRig API backends endpoint](https://xmrig.com/docs/miner/api/backends) (marked unfinished upstream)
- [XMRig API config endpoint](https://xmrig.com/docs/miner/api/config) (marked unfinished upstream)
- [XMRig pool configuration](https://xmrig.com/docs/miner/config/pool)
- [XMRig network configuration and donation level](https://xmrig.com/docs/miner/config/network)
- [XMRig huge pages documentation](https://xmrig.com/docs/miner/hugepages)
- [XMRig v6.26.0 upstream API implementation (`Miner.cpp`)](https://github.com/xmrig/xmrig/blob/v6.26.0/src/core/Miner.cpp)
- [GNU GPLv3 full text](https://www.gnu.org/licenses/gpl-3.0.html)
- [Rust `std::process::Child`](https://doc.rust-lang.org/std/process/struct.Child.html)
- [Microsoft Job Objects](https://learn.microsoft.com/en-us/windows/win32/procthread/job-objects)
- [Microsoft `AssignProcessToJobObject`](https://learn.microsoft.com/en-us/windows/win32/api/jobapi2/nf-jobapi2-assignprocesstojobobject)
- [Microsoft process termination](https://learn.microsoft.com/en-us/windows/win32/procthread/terminating-a-process)
