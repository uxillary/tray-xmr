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

## Wallet and configuration

Ember may need a public receiving address. Explain that it is public receiving information, validate its format/network where practical, and avoid including it in logs, diagnostics, crash reports, or URLs beyond what a chosen provider endpoint requires. Treat it as user-specific privacy-sensitive data even though it is not a signing secret.

Never request, collect, or store wallet seed phrases or private keys. Ember is not a wallet. Validate configuration inputs and provider selection; do not construct executable arguments or paths from untrusted strings without strict handling. Protect configuration files using appropriate user-level filesystem permissions and avoid storing future secrets in ordinary JSON or SQLite.

## Miner binary and process execution

Before distributing or downloading XMRig, establish licensing and distribution obligations through authoritative research. Define trusted release provenance, signature/hash verification, version policy, and failure behavior before implementation. Do not execute an unverified or unexpected binary.

Treat the miner as a separately managed process: use controlled executable paths and arguments, avoid shell interpretation, constrain local API exposure, validate API responses and miner output, bound output/log volume, detect exit/failure, and reliably stop/clean up the process tree. The exact controls depend on later XMRig integration research.

## Contribution transparency

The 5% Ember Contribution is a product decision and must be clearly disclosed before mining, accurately represented in settings/statistics, and never concealed or disguised. Its implementation, accounting, and auditability are pending decisions. Do not implement stealth mining, hidden contribution behavior, evasion, or deceptive persistence to protect it. Official builds may discourage casual tampering, but must not be represented as impossible to modify.

## Updates and downloads

Future application and miner updates need authenticated provenance and integrity validation, clear version/source information, safe failure/rollback behavior, and user-visible status. Updates must not silently change mining consent, contribution behavior, resource limits, or autostart preference. Research code signing, release publication, and Windows reputation considerations before distribution.

## Privacy, storage, and diagnostics

Store only information needed for the user-facing feature. Define retention, export, deletion, and migrations for local history. Distinguish public wallet data from secrets and from private behavioral/statistical data. Redact addresses, credentials, machine identifiers, and unnecessary paths from logs. Diagnostics should be bounded, user-controlled, and inspectable before sharing; no cloud upload is required for core use.

M02 system awareness is local-only and memory-only. It reads coarse CPU/memory/device/OS/uptime and documented session/power status APIs. It does not collect input content, enumerate processes, inspect windows/files, persist telemetry history, or send telemetry externally. Missing hardware/API values remain unavailable rather than being inferred.

## Future remote devices

Remote control is not in the initial scope. If introduced, require explicit per-device enrollment, strong device identity, authentication and authorization, encrypted transport, command allowlists/bounds, revocation, auditable actions, and safe behavior for offline/reconnected devices. Monitoring should precede control. Do not build backend or networking infrastructure before this review.

## Review checklist

Future changes that affect mining, binaries, wallet/configuration, startup, updates, contribution, or remote access should answer:

1. What user action authorizes this behavior, and where is it visible?
2. What data or executable crosses a trust boundary, and how is it validated?
3. Can the user pause, stop, disable, revoke, or remove it?
4. Does it require more privilege or collect more data than necessary?
5. Are contribution, costs, estimates, and uncertainty represented honestly?
6. Could failure leave mining running, start it unexpectedly, or expose local control?

See [Product](PRODUCT.md) and [Architecture](ARCHITECTURE.md) for intended experience and component boundaries.
