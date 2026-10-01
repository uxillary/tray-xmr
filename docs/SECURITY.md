# Ember Security and Trust Model

**Status:** Required product constraints for future implementation and review, recorded 2026-09-29. This is a high-level model, not a completed threat assessment or security certification.

## Trust boundaries and assets

Ember coordinates a resource-intensive external executable and may handle a user’s public wallet address, local usage/statistics, configuration, downloaded binaries, and (only if later needed) service credentials or device identity. Treat the frontend, local files, miner output, external APIs, downloaded artifacts, and any future cloud service as separate trust boundaries. Validate data crossing each boundary.

The user and owner/operator of a machine must knowingly enroll that machine and explicitly authorize mining behavior. Ember must not imply that software running locally is impossible to inspect or modify.

## Consent and control requirements

- Mining starts only after informed user action and configuration; no mining may be hidden or silently enabled by installation, update, or autostart.
- Onboarding explains mining/resource implications and the 5% Ember Contribution before mining begins.
- Current mining state and resource controls are visible; pause/stop and application quit are straightforward.
- Autostart is opt-in, clearly described, and easy to disable. Installation, updates, and uninstall behave normally.
- No deceptive persistence, disguised processes/installers, hidden resource use, or security-tool evasion.
- Least privilege is the default. Elevation may be considered only for a specific proven need, with an understandable explanation and narrow scope.
- A miner never starts on installation, app launch, tray restore, update, or recovery. Before any start, require completed setup, valid wallet/pool configuration, disclosed contribution and resource behavior, and explicit user action. Autostart mining needs a separate later opt-in.

## Wallet and configuration

Ember may need a public receiving address. Explain that it is public receiving information, validate its format/network where practical, and avoid including it in logs, diagnostics, crash reports, or URLs beyond what a chosen provider endpoint requires. Treat it as user-specific privacy-sensitive data even though it is not a signing secret.

Never request, collect, or store wallet seed phrases or private keys. Ember is not a wallet. Validate configuration inputs and provider selection; do not construct executable arguments or paths from untrusted strings without strict handling. Protect configuration files using appropriate user-level filesystem permissions and avoid storing future secrets in ordinary JSON or SQLite.

## Miner binary and process execution

Before distributing or downloading XMRig, establish licensing and distribution obligations through authoritative research. Define trusted release provenance, signature/hash verification, version policy, and failure behavior before implementation. Do not execute an unverified or unexpected binary.

M03A prefers direct download of a pinned, unmodified official release after legal approval. Upstream currently publishes a detached GPG signature for its checksum manifest. Verify the manifest with an independently pinned key, then verify the exact selected archive hash; HTTPS alone or an unsigned hash is insufficient provenance. Never silently replace a binary or launch one whose digest changes. See [XMRig Integration](XMRIG_INTEGRATION.md) for GPLv3 findings, verification sequence, source links and unresolved legal review. No license conclusion here is legal advice.

M03B.1 uses absolute executable paths, direct process creation without a shell, an empty child environment, bounded/redacted stdout and stderr, and owned-child cleanup. Windows creates the child suspended, assigns its process handle to a kill-on-close Job Object, then resumes it. Failures before resume terminate and reap the suspended process. Kernel handle ownership is RAII-managed. Nested-job assignment failures are fatal; there is no unsafe fallback. When the direct child exits, the Job Object closes before pipe readers are joined, which terminates descendants that could otherwise keep redirected pipes open. Windows tests and a feature-gated packaged run verified four graceful parent/descendant cleanup cycles and confirmed that forced termination of the Ember owner removes its live fixture parent and descendant. The user manually verified normal Ember launch, tray availability, and exit through tray **Quit Ember**; M03B.1 is recorded complete.

M03B.2 diagnosed the prior release exit status. Under the Codex sandbox identity, Tauri’s event loop received WebView2 `HRESULT 0x800700AA` while creating the WebView, before Ember’s setup closure; debug emitted a Rust panic and release panic-abort surfaced as `0xC0000409`. No matching Application Error/WER record was present. The normal release executable launched under the logged-in Windows user remained running with an `Ember` main-window title and WebView2 child processes. This was an execution-context limitation, not a process-supervisor or application startup defect; no startup code workaround was added.

The local API remains explicit loopback-only (`127.0.0.1`), authenticated with a Rust-held per-run token, never LAN or internet bound. Do not expose the token to React, argv, or logs. Restricted mode is used for telemetry, and user stop/quit terminate only the process tree Ember owns. Tray Quit and Tauri `ExitRequested` route through shutdown gating and child cleanup; the supervisor rejects new starts once shutdown begins. Ordinary mining must not elevate Ember; optional huge-page/MSR optimizations are separately reviewed, off by default, and not prerequisites. Do not auto-elevate.

Ember starts the console-subsystem XMRig executable with `CREATE_NO_WINDOW`, while still redirecting stdout/stderr and assigning the suspended process to its kill-on-close Job Object before resume. Mining remains explicit and visible in Ember's UI and tray. Startup progress comes from Rust supervisor state; monotonic diagnostic timings are bounded and include only stage labels and elapsed milliseconds. Missing/denied executable errors retain a bounded Windows error code and use non-attributing copy. Ember does not disable Defender/SmartScreen or other products, create exclusions, elevate to bypass blocks, or restore quarantined files. The owner can inspect Windows Security themselves, then retry or use Ember's verified Repair path. Clean-machine Defender/SmartScreen behavior is still required testing before public release.

## Contribution transparency

The 5% Ember Contribution is a product decision and must be clearly disclosed before mining, accurately represented in settings/statistics, and never concealed or disguised. Its implementation, accounting, and auditability are pending decisions. Do not implement stealth mining, hidden contribution behavior, evasion, or deceptive persistence to protect it. Official builds may discourage casual tampering, but must not be represented as impossible to modify.

## Updates and downloads

Future application and miner updates need authenticated provenance and integrity validation, clear version/source information, safe failure/rollback behavior, and user-visible status. Updates must not silently change mining consent, contribution behavior, resource limits, or autostart preference. M03C.1 pins XMRig v6.26.0 and fingerprint `9AC4 CEA8 E66E 35A5 C7CD DC1B 446A 5363 8BE9 4409`, verifies its signed manifest and archive hash, and installs only after an explicit Mining-page action. The one controlled provisioning test succeeded; no XMRig execution occurred. Installed metadata includes the executable digest and is checked for idempotent setup; future launch code must repeat integrity checks before process creation. Public release still requires GPL/dependency review, key-rotation response, clean-system security-product tests, and update policy.

Never evade Defender/SmartScreen, obfuscate/pack XMRig to avoid scanners, disable protections, or add exclusions. Prefer transparent disclosure, unmodified official artifacts, verifiable provenance, Ember publisher signing where appropriate, source/license notices, and normal installation/removal. Actual Defender and SmartScreen results remain release-testing work; Ember's signature does not make XMRig an Ember-signed executable.

## Privacy, storage, and diagnostics

Store only information needed for the user-facing feature. Define retention, export, deletion, and migrations for local history. Distinguish public wallet data from secrets and from private behavioral/statistical data. Redact addresses, credentials, machine identifiers, and unnecessary paths from logs. Diagnostics should be bounded, user-controlled, and inspectable before sharing; no cloud upload is required for core use.

M02 system awareness is local-only and memory-only. It reads coarse CPU/memory/device/OS/uptime and documented session/power status APIs. It does not collect input content, enumerate processes, inspect windows/files, persist telemetry history, or send telemetry externally. Missing hardware/API values remain unavailable rather than being inferred.

## Future remote devices

Remote control is not in the initial scope. If introduced, require explicit per-device enrollment, strong device identity, authentication and authorization, encrypted transport, command allowlists/bounds, revocation, auditable actions, and safe behavior for offline/reconnected devices. Monitoring should precede control. Do not build backend or networking infrastructure before this review.

## Review checklist

M03C.2B exposes explicit Rust-owned Start/Stop controls. Readiness and immediate pre-spawn verification share the same typed verifier, and the latter still freshly revalidates the pinned artifact. Wallet input accepts only a locally validated mainnet public receiving address; saved summaries are masked, domain Debug output redacts it, and diagnostics remain bounded/redacted. Neither candidates nor personal setup implement raw Debug logging. API tokens are 256 random bits generated in Rust, remain memory-only, and never cross IPC. The candidate binds only loopback in restricted mode.

Pool input becomes typed host/port/TLS/worker fields, with no command-line fragments or embedded credentials. Rust controls storage under the per-user Ember directory, rejects reparse installation/config files, and uses atomic setup replacement. This inherits the user's LocalAppData ACLs; public addresses are personal data, not encrypted secrets. Verification metadata is local: an attacker with the same user's filesystem access can change both recorded digest and binary. Immediate pre-spawn gating, explicit private runtime-file ACLs/crash cleanup and authenticated transport/stop review remain required before C.2B. No elevation, huge pages, MSR tuning or firewall rules are introduced. Consent reviews are versioned and invalidated by configuration edits; the 5% contribution is disclosed as planned and inactive.

Future changes that affect mining, binaries, wallet/configuration, startup, updates, contribution, or remote access should answer:

1. What user action authorizes this behavior, and where is it visible?
2. What data or executable crosses a trust boundary, and how is it validated?
3. Can the user pause, stop, disable, revoke, or remove it?
4. Does it require more privilege or collect more data than necessary?
5. Are contribution, costs, estimates, and uncertainty represented honestly?
6. Could failure leave mining running, start it unexpectedly, or expose local control?

See [Product](PRODUCT.md) and [Architecture](ARCHITECTURE.md) for intended experience and component boundaries.
