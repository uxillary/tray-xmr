---
title: "XMRig MSR Errors on Windows: What They Mean"
description: Learn what XMRig's RandomX MSR setup does, why it can fail on Windows, and what to check before changing system security settings.
publishedDate: 2026-10-06
section: troubleshoot
visual: msr
callout:
  label: Safe to ignore?
  state: limited
  body: If XMRig reaches its normal mining state, an MSR failure may mean an optimisation was unavailable. The warning alone does not justify changing firmware protections.
summary: An MSR warning usually means XMRig could not apply its supported CPU optimisation. It does not automatically mean mining cannot run, and the message alone does not justify editing registers by hand.
draft: false
related: [xmrig-low-hashrate, xmrig-huge-pages, xmrig-cpu-threads]
sources:
  - organization: XMRig
    title: MSR
    url: https://xmrig.com/docs/miner/randomx-optimization-guide/msr
    accessed: 2026-10-06
  - organization: XMRig
    title: RandomX Optimization Guide
    url: https://xmrig.com/docs/miner/randomx-optimization-guide
    accessed: 2026-10-06
---

## Quick diagnosis

MSR means **model-specific register**: CPU control registers used for hardware-specific settings. XMRig's RandomX optimisation can adjust supported prefetcher settings through these registers. On Windows, its automatic method requires administrator privileges and compatible hardware/software access.

If the log says MSR setup failed, check that XMRig is a current, trusted build, note whether it is running elevated, and look for the complete error context. Mining may still proceed without the MSR change, but performance can differ. Do not paste custom register values from a forum into `config.json` as a first response.

## What a successful status looks like

XMRig's MSR page gives an example success message similar to “register values for … preset has been set successfully.” Exact text varies by version and CPU. The important point is that the automatic preset was applied; it is not a guaranteed hashrate target.

The same documentation lists supported Intel generations and Zen-based AMD processors. “Supported” does not guarantee success on every computer: virtualisation, policy, security software or platform configuration can affect access. Use XMRig's own documentation for the exact build you run.

## Checks on Windows

1. **Verify the source and version.** Use XMRig's official distribution and verify its published provenance. Mining software is commonly scrutinised by security products; do not disable protection or create a broad exclusion to force a driver to load.
2. **Read the full startup log.** Keep the exact MSR warning, CPU identification and XMRig version. A one-line summary may omit the reason.
3. **Check elevation only for diagnosis.** XMRig documents that its automatic MSR configuration on Windows uses administrator privileges. If you choose to test elevated once, launch a trusted binary yourself and close unrelated apps first. Do not make permanent elevation a default habit.
4. **If Secure Boot is implicated, pause.** XMRig notes that some hardware/software combinations may require Secure Boot to be disabled and points to an issue for context. This is not a routine fix: Secure Boot is a security control. Check your exact platform and threat model before considering any firmware change, and leave it enabled if you cannot establish a specific need.

## Can mining continue without the MSR change?

Usually, an MSR failure is an optimisation issue rather than proof the miner cannot perform work. Confirm that XMRig reaches its normal mining state and that shares or benchmark work behave as expected. Compare results using the same version, algorithm, thread profile and run conditions; do not infer a precise loss from the warning alone.

XMRig restores initial MSR values on exit by default, according to its documentation. Changes are not persistent across a computer reboot. Avoid custom register arrays and instructions to disable firmware protections unless you understand the hardware-specific effect and can recover the original settings.

For performance diagnosis, check [Huge Pages status](/troubleshoot/xmrig-huge-pages/) and the [structured low-hashrate checklist](/troubleshoot/xmrig-low-hashrate/). They separate status indicators from causes rather than treating every warning as the same problem. You can also paste an excerpt into the [local XMRig Log Decoder](/tools/xmrig-log-decoder/); it recognizes a limited set of explicit MSR messages and does not repeat the matched text.
