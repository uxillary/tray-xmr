# M09A — Website evidence map

## Basis

Audited `main` at `5bc830688b6d94967762b0522667eefef70793aa` on 2026-10-09. See [desktop capability audit](m09a-desktop-capability-audit.md) for implementation paths, tests and limits. No website wording was changed in M09A.

## Claim accuracy

| Route / exact current wording | Classification | Evidence and recommendation |
|---|---|---|
| `/ember/`: “There is no public release or download yet.” | Accurate | Keep. Release hardening, distribution/legal review and clean-machine checks are open (`docs/ROADMAP.md`, `docs/SECURITY.md`). |
| `/ember/`: “Production mining verification and release hardening remain in progress.” | Accurate but needs qualification | Start → Mining on the current release is recorded as owner-tested, with authenticated API telemetry and real hashrate. Qualify this line as “A controlled owner-machine Start → Mining session has been observed; Stop/Quit acceptance and release hardening remain open.” Do not imply full lifecycle acceptance. |
| `/ember/` status tile: “Owner-machine Start → Mining → Stop verification remains unresolved.” | Accurate but stale/inexact | Start → Mining is no longer unresolved in current milestone evidence; Stop/Quit acceptance is. Replace status concept in M09B with separate states: “Start → Mining owner-tested” and “Stop/Quit owner acceptance open.” |
| `/trust/` open item A: “Production session verification” and “Owner-machine Start → Mining → Stop remains unresolved after XMRig failed to open the expected loopback API.” | Premature/historically stale | The reported API startup failure is historical and no longer reproduces; current release owner evidence reached authenticated API and real hashrate. Reword to preserve remaining Stop/Quit acceptance and explicitly say no independent release acceptance. |
| `/ember/`: “Ember prepares and supervises its own XMRig process; the selected pool remains an external service.” | Accurate but needs qualification | Rust owns the child lifecycle and typed external pool config; Stop is immediate Job Object termination. “Supervises” is supported; do not imply graceful miner shutdown. |
| `/ember/`: “Quiet, Balanced and Performance set configured thread counts; they are not wattage or temperature controls.” | Accurate | Static thread fractions are implemented. Smart Mining remains planned. |
| `/ember/`: Setup review and local process control are “IMPLEMENTED.” | Accurate | UI, Rust readiness/consent and supervisor paths are connected and tested. Scope wording to current Windows x64 path and avoid implying public-release readiness. |
| `/trust/`: “Pinned XMRig provisioning,” signature/hash/executable verification | Accurate but needs qualification | Supported by provisioner and security model. State version/platform scope and note clean-machine/security-product checks remain. |
| `/trust/`: loopback authenticated local status; token stays in Rust | Accurate | Source keeps per-run token on native side and restricts API to loopback. No external telemetry server is required for core operation; mining pool and provisioning still use network. |
| `/trust/`: “Local setup, no Ember account” / local-first | Accurate but needs qualification | Core setup/session is local, but this is not offline or tamper-proof. Public wallet address is personal data and not an encrypted secret. |
| `/trust/`: 5% developer time share with schedule, destination, limitations and separate upstream donation | Accurate | Rust applies the 19:1 active-time schedule and UI exposes current slot and per-session active-time counters. Do not claim exact pool reward allocation or lifetime accounting. |
| `/trust/`: does not hold keys, run hidden mining, offer Ember pool, promise profitability or submit telemetry to a server | Accurate within audited implementation | Keep carefully scoped to current source and avoid broad security guarantee. |
| Shared article footer: “in-development Windows desktop interface… no public release” | Accurate | Keep; it appropriately avoids suggesting article examples depend on the app. |

## Verified benefits to communicate

1. **Choices are explicit before compute begins.** Public receiving address, user-selected pool, static thread choice and disclosure acknowledgement are locally reviewed; edits revoke acknowledgement and app launch does not start mining.
2. **Observed state is separated from setup intent.** Ready is not Mining. A controlled current-release owner session has reached authenticated XMRig telemetry, Connected pool and real hashrate; the interface represents starting, stale and unavailable data distinctly.
3. **The engine boundary is explainable.** Ember coordinates its own verified XMRig child and keeps the restricted API local/authenticated; the user’s pool remains external. Stop/Quit owner acceptance remains open.

These benefits differentiate Ember through clarity and explicit control, not through generic cards, a “core” animation, or ordinary settings UI.

## Suggested narrative and M09B scope

Lead with a concrete sequence: **Choose the destination → choose the pool and configured CPU threads → review the tradeoffs → explicitly start → see what XMRig reports.** Explain that Ember manages the local XMRig session while the pool is external. Pair every status with its evidence boundary: owner-tested Start → Mining, Stop/Quit acceptance open, no public release, Smart Mining planned, and 5% developer active-time routing with approximate rewards and session-only counters.

Bound M09B to a product-story update on `/ember/` and trust copy: correct stale Start/Mining/Stop status; add a concise setup-to-observation narrative; explain static profiles and telemetry freshness; add a small static architecture/lifecycle diagram only if it maps directly to current code; link relevant setup/troubleshooting/tool resources. Use existing site components and graphite/orange identity. No wholesale redesign, hero or hero animation changes, dependency changes, or empty screenshot placeholders. Keep static-first architecture, knowledge platform, existing tools and technical diagrams.

## Product storytelling opportunities

| Opportunity | Benefit / evidence | Format and readiness | Misrepresentation risk |
|---|---|---|---|
| Setup → reviewed Start | Shows user agency; readiness, revision-bound consent and explicit button exist. | Static 4-step diagram or concise narrative can ship now without product screenshot. | Don’t imply pool recommendations or automatic setup; suggestions are future work. |
| Ember / XMRig / pool boundary | Makes local process ownership and external pool legible. | Simple static diagram can ship now. | Do not depict remote control, Ember pool, server telemetry, or graceful-stop behavior. |
| Mining signal with freshness | Explains observed rate/pool/result counters and stale/unavailable states. | Conceptual diagram now; genuine screenshot after owner provides current app capture. | Never fabricate rate/share results; fixtures are test data. |

## Deliberate non-changes

Do not present Smart Mining, adaptive power, lifetime history, profitability, contribution collection, public download, security certification, or complete Stop/Quit acceptance as current. Keep the existing homepage hero and animation, brand palette, static-first architecture, knowledge platform, tool pages and M07 cohesion work intact.
