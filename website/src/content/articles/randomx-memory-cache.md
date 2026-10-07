---
title: RandomX Memory and CPU Cache Explained
description: A practical guide to RandomX's dataset, cache, per-thread CPU cache needs, Huge Pages and NUMA for XMRig users.
publishedDate: 2026-10-06
section: learn
visual: memory
callout:
  label: Keep these separate
  state: info
  body: CPU cache, the RandomX cache and the dataset are distinct memory layers. Installed RAM alone does not describe all RandomX memory limits.
summary: "RandomX performance depends on several kinds of memory at once: system RAM for the dataset, CPU cache for active workers, and operating-system support for large-page allocation."
draft: false
related: [xmrig-cpu-threads, xmrig-huge-pages, xmrig-low-hashrate]
sources:
  - organization: XMRig
    title: RandomX Optimization Guide
    url: https://xmrig.com/docs/miner/randomx-optimization-guide
    accessed: 2026-10-06
  - organization: XMRig
    title: Huge Pages
    url: https://xmrig.com/docs/miner/hugepages
    accessed: 2026-10-06
  - organization: XMRig
    title: CPU configuration
    url: https://xmrig.com/docs/miner/config/cpu
    accessed: 2026-10-06
---

## Quick model

RandomX uses a large **dataset** held in system memory, a smaller **cache** used to build that dataset, and CPU cache close to the cores running mining threads. These are different resources. A computer can have plenty of installed RAM yet still be limited by CPU cache, memory bandwidth, available free RAM or how memory is placed across processor nodes.

## Dataset and cache

XMRig's current optimization guide describes fast-mode dataset requirements as about 2,080 MB per NUMA node, with a 256 MB cache on the first node. Its configuration reference describes RandomX modes as auto, fast (2 GB memory) and light (256 MB memory). These are rounded documentation figures; actual reported allocation includes implementation and system details. Light mode lowers memory use substantially but is much slower, according to XMRig.

Think of the cache as the source material used to initialize the dataset, not as a replacement for the full fast-mode dataset. XMRig's startup output names the allocations and can report Huge Pages for them separately. Read those exact labels when diagnosing allocation.

## CPU cache and mining threads

RandomX also relies on processor cache: XMRig lists 256 KB L2 and 2 MB L3 per mining thread for its Monero profile. These are CPU hardware caches, not the 256 MB RandomX cache allocation. The similar word “cache” describes different layers, which is why discussions can sound contradictory.

The CPU cache available per worker helps determine how many mining threads are useful. A processor may expose many logical processors but have limited shared L3 cache. Read [why XMRig may use fewer CPU threads](/learn/xmrig-cpu-threads/) before forcing all logical processors.

## Huge Pages and Windows

Huge Pages (called Large Pages by Windows) affect how XMRig allocates memory; they do not make physical RAM or CPU cache larger. XMRig documents a Windows privilege requirement and notes that allocation can still be incomplete if memory conditions prevent it. The [Windows Huge Pages troubleshooting guide](/troubleshoot/xmrig-huge-pages/) explains how to interpret permission and allocation statuses separately.

The system-level trade-off matters: memory locked for large pages is less available for Windows to reclaim under pressure. Check available memory and keep the PC responsive; do not assign the lock-memory right broadly.

## NUMA in one minute

NUMA means **Non-Uniform Memory Access**. On systems with multiple processor or memory nodes, each node has memory that is nearer to some CPUs than others. XMRig reports nodes and documents dataset memory per NUMA node. This is more common on multi-socket workstations and servers, but topology also matters on some desktop platforms.

Do not turn NUMA off just because the term is unfamiliar. XMRig notes that disabling its NUMA support can reduce hashrate significantly when multiple nodes are present; on a single-node system the option has no effect. Leave the default unless you have a measured reason to test another setting.

## What system RAM does not tell you

Installed RAM capacity alone cannot predict RandomX speed. It tells you whether the machine may have enough capacity for the allocation plus Windows and other applications, but not how many threads fit the CPU cache, how much bandwidth the memory channels provide, or whether power and temperature limits sustain the workload.

For a low result, compare matching XMRig benchmarks and inspect allocation, worker count, background load and thermals in order. The [low-hashrate checklist](/troubleshoot/xmrig-low-hashrate/) avoids unsupported per-CPU promises.
