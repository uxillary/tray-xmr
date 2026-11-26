---
title: "XMRig Log Reference: Mining Messages, Warnings and Status Explained"
description: Browse 15 source-scoped XMRig 6.26.0 message families, synthetic console examples, decoder coverage and safe next checks.
publishedDate: 2026-11-25
updatedDate: 2026-11-26
section: troubleshoot
visual: log-reference
summary: "A console line establishes one event. Browse CPU, memory, MSR, connection and submission signals, then check what each can—and cannot—tell you."
related: [xmrig-pool-shares-payments]
sources:
  - organization: XMRig
    title: CPU startup reporting, v6.26.0
    url: https://github.com/xmrig/xmrig/blob/v6.26.0/src/backend/cpu/CpuBackend.cpp
    accessed: 2026-11-25
  - organization: XMRig
    title: MSR initialization, v6.26.0
    url: https://github.com/xmrig/xmrig/blob/v6.26.0/src/crypto/rx/RxMsr.cpp
    accessed: 2026-11-25
  - organization: XMRig
    title: Network and submission reporting, v6.26.0
    url: https://github.com/xmrig/xmrig/blob/v6.26.0/src/net/Network.cpp
    accessed: 2026-11-25
  - organization: XMRig
    title: Stratum client, v6.26.0
    url: https://github.com/xmrig/xmrig/blob/v6.26.0/src/base/net/stratum/Client.cpp
    accessed: 2026-11-25
---

## Reference scope

This edition covers **XMRig 6.26.0**, reviewed on **25 November 2026**. It is a finite selection, not a claim that this version is the newest or that every build, operating system, backend and pool prints identical output. Basic RandomX storage, CPU, MSR, miner-rate and Stratum paths are identified at each entry. No initialization banner or configuration-file error catalogue is implied.

**Recognized** means the displayed example matches the existing local decoder. **Reference-only** means it does not. **Wording-limited** identifies a supported family whose native example is not recognized. **Heuristic family** describes the decoder’s wording rule without inventing a native message. The seven recognized examples, one wording-limited entry, two heuristic families and five reference-only entries map all ten existing recognizer families.

Treat the labels as interpretation aids, not a verdict on the whole miner. The MSR failure entry retains the source message’s error context while explaining that mining may continue. Preserve timestamps and surrounding events in your own notes; redact wallet, worker, endpoint and IP details before sharing a log elsewhere. This static reference asks for no log input.

The [local decoder](/tools/xmrig-log-decoder/) keeps its existing 200 KB limit, ANSI handling and unknown-line behavior. It neither uploads nor stores pasted input. An unrecognized line can still describe an important event; consult the exact version’s source and official documentation when wording differs.
