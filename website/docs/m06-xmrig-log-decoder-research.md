# M06 research — XMRig log decoder

Reviewed 7 October 2026. Ember's repository identifies XMRig **6.26.0** as the Windows x64 version it supports. The decoder is deliberately a small reader for recognizable console lines, not a version-independent parser.

## Primary evidence

- [Ember XMRig integration contract](../../docs/XMRIG_INTEGRATION.md) records the pinned version.
- [XMRig 6.26.0 release](https://github.com/xmrig/xmrig/releases/tag/v6.26.0).
- [XMRig CPU backend at v6.26.0](https://github.com/xmrig/xmrig/blob/v6.26.0/src/backend/cpu/CpuBackend.cpp) emits the `cpu READY ... huge pages ...` startup summary and tracks worker startup status.
- [XMRig Huge Pages guide](https://xmrig.com/docs/miner/hugepages) documents `huge pages 100%`, Windows permission output, and the distinction between permission and successful allocation.
- [XMRig MSR guide](https://xmrig.com/docs/miner/randomx-optimization-guide/msr) documents the successful preset message and notes the platform privilege and CPU support conditions; it does not establish why an individual attempt fails.
- [XMRig Stratum client at v6.26.0](https://github.com/xmrig/xmrig/blob/v6.26.0/src/base/net/stratum/Client.cpp) is the version-specific connection implementation. The supported pool and share patterns are intentionally broad only around explicit status words; no endpoint or rejection reason is surfaced.

## Supported V1 signals and interpretation boundaries

| Signal | Meaning we report | We do not infer |
| --- | --- | --- |
| `CPU READY` | CPU workers report ready | Stable hashrate or a pool job |
| CPU `huge pages 100%` | Full allocation in that CPU backend summary | That permissions alone caused it, or any performance gain |
| CPU Huge Pages percentage below 100 | Partial allocation was reported | Why allocation was partial |
| MSR preset `... set successfully` | XMRig reports setting the preset values | Better hashrate or persistent register changes |
| Explicit `msr` error/failure wording | An MSR operation reported a problem | The cause; action is to inspect the full original message and guide |
| `use pool` | XMRig reports selecting/using a configured endpoint | Authentication success, a new job, or accepted shares |
| Explicit pool/stratum disconnect or retry wording | A connection issue or retry is reported | DNS vs TLS vs remote service root cause |
| Accepted / rejected share status | Submission outcome at that point | Pool-specific reject reason or long-term mining health |

DNS errors, authentication failures, RandomX dataset readiness/mode, hashrate lines, CPU topology, generic errors/warnings, thread configuration, and unknown text are not decoded in V1. They need exact pinned-tag evidence and safe interpretation contracts before inclusion. RandomX configuration/mode is not inferred from algorithm names or CPU readiness.

## Privacy, normalization, and chronology

The UI renders only fixed diagnostic copy, occurrence counts and the ordinal of recognized lines. It never includes a matched input line, substring, timestamp, hostname, IP, wallet, pool endpoint, username, worker name, or rejection text. Unknown content is counted, not echoed. Parser output contains no raw input. A 200,000-byte UTF-8 cap bounds work; input is held only in the page's memory and not sent to a service or persisted.

CRLF/LF, blank lines, leading/trailing whitespace, common bracketed timestamps, ISO-like timestamps, and ANSI CSI color/control sequences are normalized or ignored. Other text is retained only transiently for matching. No attempt is made to redact the input field itself; users should review logs before sharing them elsewhere.

Duplicate signal types collapse into one card with a count and first/last recognized ordinal. Accepted and rejected shares remain different cards, and connection loss/retry/success remain separate signal types. This is a compact summary, not a complete event timeline; interleaving between different groups is not reconstructed.

## Fixture provenance and next research

Automated inputs use the published XMRig Huge Pages/MSR wording and the pinned CPU backend wording. The fixtures are hand-authored test strings, not logs collected from Ember or benchmark sessions. Network/share signature expansion is deferred until it can be reviewed against the exact release source and safely validated without exposing captured identifiers. Future work could add version-aware signatures and explicitly sourced RandomX dataset lifecycle messages.
