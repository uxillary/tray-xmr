---
title: Why Is My XMRig Hashrate Low? A Windows Checklist
description: Diagnose a low XMRig RandomX hashrate by checking allocation, threads, memory, system load, thermals and benchmark conditions in order.
publishedDate: 2026-10-06
updatedDate: 2026-11-25
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
    accessed: 2026-11-25
  - organization: XMRig
    title: Benchmark
    url: https://xmrig.com/docs/miner/benchmark
    accessed: 2026-11-25
  - organization: XMRig
    title: CPU configuration
    url: https://xmrig.com/docs/miner/config/cpu
    accessed: 2026-11-25
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

A fixed-work benchmark measures a particular amount of computation; sustained mining also experiences warming, changing jobs, donation periods and ordinary system activity. Keep those modes separate in your record. The [official XMRig benchmark documentation](https://xmrig.com/docs/miner/benchmark) distinguishes offline tests from online submissions; this page does not retrieve or redistribute benchmark records. A short maximum is not a sustained target for every machine with that CPU name.

If work is not arriving or submissions are being rejected, first separate [connection, job and share-response states](/troubleshoot/xmrig-pool-shares-payments/) from local CPU performance. An accepted submission does not establish a payment.

## 2. Read allocation and optimisation status

Check the XMRig startup lines for RandomX memory allocation and Huge Pages percentages for the dataset and threads. Permission granted is not the same as full allocation. See [XMRig Huge Pages on Windows](/troubleshoot/xmrig-huge-pages/) for that distinction.

If MSR reports a failure, it may mean the CPU preset was not applied; it does not itself explain an exact hashrate difference. See [MSR errors on Windows](/troubleshoot/xmrig-msr-error/). Avoid trying unrelated privilege changes or firmware settings before confirming the warning is relevant to your machine. The [local XMRig Log Decoder](/tools/xmrig-log-decoder/) can summarize its supported startup, Huge Pages, MSR, pool and share signals; it does not analyze hashrate or diagnose root causes.

## 3. Check useful thread count and cache

RandomX thread count is constrained by cache as well as logical processor count. XMRig's optimization guide gives general cache requirements per mining thread and explains that this is why some CPUs do not use every logical thread. More workers can compete for cache and system resources without increasing total throughput.

Review the [CPU thread explanation](/learn/xmrig-cpu-threads/) and [RandomX memory and cache guide](/learn/randomx-memory-cache/). Treat auto-configuration as a starting point. If testing alternatives, change only the thread profile and benchmark again.

## 4. Check memory, background load and cooling

RandomX's fast mode needs substantial RAM, while the mining workload also competes with Windows and other applications. Close a heavy task for a controlled run; do not disable Windows services just to improve a benchmark. Check Task Manager for obvious competing CPU or memory use.

Watch whether performance changes as the CPU warms up. Check the system's temperature and power-limit reporting with the computer or processor manufacturer's supported tools. If the system becomes unstable, uncomfortably hot, or difficult to use, stop the run and return to default settings. Do not assume a particular temperature or hashrate without the CPU manufacturer's limits and a comparable baseline.

If you are also estimating household energy use, use whole-system power measured at the wall and your own electricity tariff in the [mining electricity cost calculator](/tools/electricity-cost-calculator/#power-note-title). CPU package power alone does not include the rest of the computer. For an assumption-based reward and electricity scenario, use the [Monero mining profitability calculator](/tools/monero-mining-profitability-calculator/#input-sources); its results are expected values, not pool payout predictions.

## Keep a small measurement record

Make an A/B record before changing settings. Copy or print the worksheet below; write **unknown** where evidence is missing. It is a static sheet, with no account, upload or browser storage. If a comparison changes several conditions, it cannot isolate the effect of one setting.

<div class="record-sheet run-worksheet">
<table class="worksheet-table">
<caption>Comparable-run worksheet — fill in A and B in your own notes; mark missing information unknown.</caption>
<thead><tr><th scope="col">Record the same detail for both runs</th><th scope="col">Run A / baseline</th><th scope="col">Run B / one change</th></tr></thead>
<tbody>
<tr><th scope="row">CPU, sockets/NUMA topology and logical processors</th><td>Record / unknown</td><td>Record / unknown</td></tr>
<tr><th scope="row">XMRig version and build</th><td>Record / unknown</td><td>Record / unknown</td></tr>
<tr><th scope="row">Exact algorithm variant</th><td>Record / unknown</td><td>Record / unknown</td></tr>
<tr><th scope="row">Workers and relevant affinity/profile</th><td>Record / unknown</td><td>Record / unknown</td></tr>
<tr><th scope="row">RAM capacity, channels, speed and timings</th><td>Record / unknown</td><td>Record / unknown</td></tr>
<tr><th scope="row">Huge Pages: each dataset/thread allocation</th><td>Record / unknown</td><td>Record / unknown</td></tr>
<tr><th scope="row">MSR / optimization state and power settings</th><td>Record / unknown</td><td>Record / unknown</td></tr>
<tr><th scope="row">Workload / benchmark mode and work size</th><td>Record / unknown</td><td>Record / unknown</td></tr>
<tr><th scope="row">Warm-up and observation start/end/duration</th><td>Record / unknown</td><td>Record / unknown</td></tr>
<tr><th scope="row">Sustained H/s; averaging window and repeated-run range</th><td>Record / unknown</td><td>Record / unknown</td></tr>
<tr><th scope="row">Whole-system wall W / interval kWh, if measured</th><td>Record / unknown</td><td>Record / unknown</td></tr>
<tr><th scope="row">Thermals, clocks, ambient and background work</th><td>Record / unknown</td><td>Record / unknown</td></tr>
<tr><th scope="row">Changed variable, stability and responsiveness notes</th><td>Record / unknown</td><td>Record / unknown</td></tr>
</tbody></table>
</div>

Measure hashrate and wall energy over matching intervals. Use the [whole-PC measurement workflow and record](/tools/electricity-cost-calculator/#measure-workflow); CPU package telemetry and TDP cannot supply missing wall watts. Keep total active and incremental active-minus-idle measurements distinct. Without comparable power measurements you can discuss throughput, but cannot establish whole-PC efficiency.

### Read a hypothetical A/B comparison

<section class="run-example" aria-label="Hypothetical performance comparison">
<span class="eyebrow">SYNTHETIC ARITHMETIC · NO ACTUAL CPU OR BENCHMARK</span>
<p>Assume the same unnamed system, software, algorithm, workload and observation method; only one declared configuration setting differs. These invented values illustrate a trade-off, not a recommended profile.</p>
<div class="run-values"><div><h4>Run A</h4><dl><div><dt>Sustained throughput</dt><dd>8,000 H/s</dd></div><div><dt>Average whole-PC power</dt><dd>160 W</dd></div><div><dt>Throughput per wall watt</dt><dd>50 H/s/W</dd></div></dl></div><div><h4>Run B</h4><dl><div><dt>Sustained throughput</dt><dd>7,600 H/s</dd></div><div><dt>Average whole-PC power</dt><dd>140 W</dd></div><div><dt>Throughput per wall watt</dt><dd>≈54.3 H/s/W</dd></div></dl></div></div>
<p>B has 5% less throughput and 12.5% less power use; its ratio is about 8.6% higher. It is more efficient under these assumptions, while A completes more hashes per second. Neither ratio establishes earnings, payback or a better experience for every user.</p>
</section>

Repeat comparable runs and retain their spread, including slower valid results. If a difference does not exceed normal variation and measurement uncertainty, report **inconclusive**. Change one thing per run, retain a known-good configuration, and stop if stability, temperatures or responsiveness become unacceptable. This is a recording method, not an instruction to change firmware, security protections or custom MSR values.
