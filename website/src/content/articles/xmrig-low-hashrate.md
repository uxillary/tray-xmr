---
title: Why Is My XMRig Hashrate Low? A Windows Checklist
description: Diagnose a low XMRig RandomX hashrate by checking allocation, threads, memory, system load, thermals and benchmark conditions in order.
publishedDate: 2026-10-06
section: troubleshoot
visual: hashrate
callout:
  label: Check this first
  state: check
  body: Compare the same machine, algorithm, version and run conditions. A short pool estimate is not a dependable benchmark target.
summary: A hashrate number is useful only beside a comparable baseline. Check XMRig's own startup status and change one variable at a time before tuning Windows or firmware.
draft: false
related: [xmrig-huge-pages, xmrig-msr-error, xmrig-cpu-threads, randomx-memory-cache]
sources:
  - organization: XMRig
    title: RandomX Optimization Guide
    url: https://xmrig.com/docs/miner/randomx-optimization-guide
    accessed: 2026-10-06
  - organization: XMRig
    title: Benchmark
    url: https://xmrig.com/docs/miner/benchmark
    accessed: 2026-10-06
  - organization: XMRig
    title: CPU configuration
    url: https://xmrig.com/docs/miner/config/cpu
    accessed: 2026-10-06
---

## Quick diagnosis

There is no single “correct” RandomX hashrate for every CPU of the same model. XMRig version, algorithm variant, thread profile, memory channels, NUMA layout, power limits, cooling and background work all affect the result. First compare the same machine against a repeatable, appropriate baseline; do not use an unexplained number from a different setup as a target.

## Check in this order

<ol class="diagnostic-flow">
  <li>Confirm the algorithm, XMRig version and workload are the ones you intend to measure.</li>
  <li>Read startup status for RandomX allocation, Huge Pages and MSR; investigate only statuses that differ from your baseline.</li>
  <li>Check how many mining threads XMRig selected and whether CPU cache can support them.</li>
  <li>Repeat a benchmark under comparable conditions, then inspect background CPU use, power and thermal behaviour.</li>
  <li>Change one setting, repeat the measurement, and keep the change only if improvement is repeatable and the system remains stable.</li>
</ol>

## 1. Confirm you are comparing the same work

Pool hashrate estimates fluctuate with the window and pool-side accounting. For a controlled comparison, use XMRig's documented benchmark mode and record the exact command, version, algorithm and configuration. XMRig says its benchmark run may perform between one and ten million hashes depending on the selected option; submitting an online result requires a network connection. A benchmark is a comparison tool, not a prediction of pool earnings.

Do not compare a short startup reading with a longer average, or different RandomX variants as if they were interchangeable. Keep benchmark settings consistent and repeat runs to understand ordinary variation.

## 2. Read allocation and optimisation status

Check the XMRig startup lines for RandomX memory allocation and Huge Pages percentages for the dataset and threads. Permission granted is not the same as full allocation. See [XMRig Huge Pages on Windows](/troubleshoot/xmrig-huge-pages/) for that distinction.

If MSR reports a failure, it may mean the CPU preset was not applied; it does not itself explain an exact hashrate difference. See [MSR errors on Windows](/troubleshoot/xmrig-msr-error/). Avoid trying unrelated privilege changes or firmware settings before confirming the warning is relevant to your machine. The [local XMRig Log Decoder](/tools/xmrig-log-decoder/) can summarize its supported startup, Huge Pages, MSR, pool and share signals; it does not analyze hashrate or diagnose root causes.

## 3. Check useful thread count and cache

RandomX thread count is constrained by cache as well as logical processor count. XMRig's optimization guide gives general cache requirements per mining thread and explains that this is why some CPUs do not use every logical thread. More workers can compete for cache and system resources without increasing total throughput.

Review the [CPU thread explanation](/learn/xmrig-cpu-threads/) and [RandomX memory and cache guide](/learn/randomx-memory-cache/). Treat auto-configuration as a starting point. If testing alternatives, change only the thread profile and benchmark again.

## 4. Check memory, background load and cooling

RandomX's fast mode needs substantial RAM, while the mining workload also competes with Windows and other applications. Close a heavy task for a controlled run; do not disable Windows services just to improve a benchmark. Check Task Manager for obvious competing CPU or memory use.

Watch whether performance changes as the CPU warms up. Check the system's temperature and power-limit reporting with the computer or processor manufacturer's supported tools. If the system becomes unstable, uncomfortably hot, or difficult to use, stop the run and return to default settings. Do not assume a particular temperature or hashrate without the CPU manufacturer's limits and a comparable baseline.

If you are also estimating household energy use, use whole-system power measured at the wall and your own electricity tariff in the [mining electricity cost calculator](/tools/electricity-cost-calculator/). CPU package power alone does not include the rest of the computer.

## Keep a small measurement record

Record the XMRig version, algorithm, thread count, Huge Pages status, MSR status, run duration and benchmark result. Change one thing per run. If the measured difference is not repeatable beyond normal run-to-run variation, it is not evidence that the setting helped.
