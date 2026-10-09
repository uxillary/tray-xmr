---
title: XMRig Huge Pages Not Working on Windows? What to Check
description: Understand XMRig Huge Pages status on Windows, the Lock Pages in Memory privilege, partial allocation and safe next steps.
publishedDate: 2026-10-06
section: troubleshoot
visual: huge-pages
callout:
  label: Check this first
  state: check
  body: Compare the permission line with the allocation percentage. They report separate outcomes; a granted permission does not guarantee full allocation.
summary: Read the exact Huge Pages lines in XMRig first. Permission granted and successful allocation are separate states, and either can be affected by Windows memory conditions.
draft: false
related: [xmrig-low-hashrate, randomx-memory-cache, xmrig-cpu-threads]
sources:
  - organization: XMRig
    title: Huge Pages
    url: https://xmrig.com/docs/miner/hugepages
    accessed: 2026-10-06
  - organization: Microsoft Learn
    title: Privilege Constants — SeLockMemoryPrivilege
    url: https://learn.microsoft.com/en-us/windows/win32/secauthz/privilege-constants
    accessed: 2026-10-06
  - organization: Microsoft Learn
    title: Lock pages in memory
    url: https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/security-policy-settings/lock-pages-in-memory
    accessed: 2026-10-06
---

## Quick diagnosis

XMRig's **permission** line and its **allocation percentage** answer different questions. `permission granted` means the process has the Windows right it needs; `huge pages 100%` means the reported allocation succeeded. A grant alone does not guarantee allocation.

Start with the startup log. This is a simplified illustration, not a verbatim log:

```text
HUGE PAGES permission granted
randomx dataset ... huge pages 100%
```

If the permission is missing, follow XMRig's Windows setup guidance. If permission is present but allocation is below 100%, first close memory-heavy applications and restart Windows, then check again. Do not reserve memory through undocumented registry changes.

<ol class="diagnostic-flow">
  <li>Check whether XMRig reports Huge Pages permission granted.</li>
  <li>If not, use XMRig's documented Windows method to establish the privilege.</li>
  <li>Restart Windows if you just changed how the right is assigned, then inspect a fresh startup log.</li>
  <li>If permission is granted but allocation is partial, reduce competing memory use and retry after a restart.</li>
  <li>If it remains partial, record the complete startup lines and review available RAM, RandomX mode and node count before changing settings.</li>
</ol>

## What the messages mean

XMRig calls the feature “Huge Pages” across operating systems. Windows documentation calls its corresponding memory pages **Large Pages**. XMRig says the required Windows user right is `SeLockMemoryPrivilege`, displayed in policy interfaces as **Lock pages in memory**.

The startup output can report permission separately from the amount allocated. A 0% or partial figure means XMRig did not allocate all the requested pages for that item; it does not by itself identify why. RandomX allocates a dataset and cache, and output can show them separately. Read the labels and denominators rather than treating one percentage as a diagnosis.

## Permission granted, but less than 100%

XMRig documents that Windows cannot reserve Huge Pages in advance for later use. Allocation can therefore fail when memory conditions do not permit it, even when the privilege is present. Other running applications can be using memory. Its recommended first step for less than full allocation is a reboot.

RandomX's fast mode has a sizeable memory footprint, with additional needs varying by NUMA node and the miner's allocations. Available system RAM is not the only factor: active applications and Windows itself also need memory. See [RandomX memory and cache explained](/learn/randomx-memory-cache/) for the distinctions.

Microsoft cautions that Lock Pages in Memory can reduce the RAM available for Windows to reclaim under pressure. Keep the right limited to the account that needs it; do not assign it broadly as a performance tweak.

## How to obtain the Windows right

XMRig documents two routes that require administrator rights: run the miner as Administrator once and reboot, or assign the Windows **Lock pages in memory** user right manually. XMRig notes that after the right is obtained, Windows 10 no longer requires administrator rights for Huge Pages allocation; its page separately calls out Windows 7 as different. Treat that as XMRig's documented version guidance, not as a claim that every managed Windows installation has the same policy.

If this is a work-managed computer, ask its administrator before changing local security policy. A policy set by an organisation may override a local change. Avoid leaving the miner set to always run elevated if you do not need that; elevation grants broader access than the memory right alone.

## When the setup is already working

If XMRig reports permission granted and full allocation for the RandomX dataset and threads, Huge Pages are enabled for those reported allocations. No additional “Huge Pages fix” is called for. If hashrate still looks low, compare like-for-like runs and inspect thread selection, MSR status, CPU cache, temperatures and competing load. The [low XMRig hashrate checklist](/troubleshoot/xmrig-low-hashrate/) walks through those checks.

Do not copy another machine's page counts or memory-pool settings blindly. NUMA layout, RandomX mode and available memory change what is requested. If the PC becomes less responsive under load, stop the miner and reassess; locked pages reduce memory Windows can reclaim. If you have a startup excerpt, the [XMRig Log Decoder](/tools/xmrig-log-decoder/) can recognize explicit CPU Huge Pages allocation lines locally. It does not determine why an allocation was partial.
