---
title: Why XMRig Isn't Using All Your CPU Threads
description: Understand logical processors, RandomX mining threads and cache limits so you can interpret XMRig auto-configuration without blindly forcing more threads.
publishedDate: 2026-10-06
section: learn
visual: threads
callout:
  label: What this means
  state: info
  body: Windows' logical processor count is not a recommended RandomX worker count. Cache and memory bandwidth also constrain useful threads.
summary: Windows can expose more logical processors than RandomX can use efficiently. XMRig's selected mining-thread count reflects cache and algorithm settings, not necessarily a fault.
draft: false
related: [randomx-memory-cache, xmrig-low-hashrate, xmrig-huge-pages]
sources:
  - organization: XMRig
    title: RandomX Optimization Guide
    url: https://xmrig.com/docs/miner/randomx-optimization-guide
    accessed: 2026-10-06
  - organization: XMRig
    title: CPU configuration
    url: https://xmrig.com/docs/miner/config/cpu
    accessed: 2026-10-06
---

## The short answer

XMRig does not need to mine on every logical processor to use the CPU well. RandomX performance depends on each mining thread getting enough CPU cache and memory bandwidth. If cache is the limiting resource, adding threads can leave the total hashrate unchanged or make it lower.

## Three different counts

- **Cores** are physical processing units in the CPU.
- **Logical processors** are the execution contexts the operating system schedules. Simultaneous multithreading can expose more than one per core.
- **Mining threads** are XMRig workers doing RandomX work. A worker may be pinned to a logical processor, but the numbers do not have to match.

The operating system's 100% CPU reading and XMRig's mining-thread count therefore answer different questions. A miner can intentionally leave capacity unused to preserve responsiveness or avoid competing for cache.

## Why cache limits the useful count

RandomX keeps working data close to the CPU. XMRig's guide lists general requirements of 256 KB L2 and 2 MB L3 cache per mining thread for the Monero RandomX profile. Those are algorithm guidance figures, not a guarantee that every processor exposes cache in the same way or will reach a particular speed. Cache may be shared among cores, and other processes can use it too.

That is why XMRig's automatic thread configuration can select fewer workers than Windows reports logical processors. Read its selected profile and compare the resulting benchmark before forcing additional threads. The [RandomX memory and cache explainer](/learn/randomx-memory-cache/) covers the dataset, cache and NUMA terms.

## How to test a different thread count

Use XMRig's CPU configuration options rather than editing CPU affinity or firmware at random. Keep a copy of the known-good configuration. Test one alternative profile at a time with the same XMRig version, algorithm and benchmark conditions. Record hashrate and whether the machine stays responsive; restore the original profile if the change makes either worse.

Do not add threads solely to make Task Manager reach 100%. A useful profile is the one that performs consistently under your intended workload, not the one that occupies every scheduler slot.

If XMRig reports fewer workers than expected and hashrate is also low, check the [low-hashrate checklist](/troubleshoot/xmrig-low-hashrate/) for Huge Pages, MSR, memory pressure and thermal conditions. A lower worker count alone is not proof of a configuration error.
