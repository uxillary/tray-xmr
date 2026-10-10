---
title: XMRig Huge Pages Not Working on Windows? What to Check
description: Understand XMRig Huge Pages status on Windows, the Lock Pages in Memory privilege, partial allocation and safe next steps.
publishedDate: 2026-10-06
updatedDate: 2026-10-10
section: troubleshoot
visual: huge-pages
callout:
  label: Check this first
  state: check
  body: Compare the permission line with the allocation percentage. They report separate outcomes; a granted permission does not guarantee full allocation.
summary: Read the exact Huge Pages lines in XMRig first. Permission granted and successful allocation are separate states, and either can be affected by Windows memory conditions.
draft: false
related: [randomx-memory-cache, xmrig-cpu-threads, xmrig-low-hashrate, xmrig-windows-setup]
sources:
  - organization: XMRig
    title: Huge Pages
    url: https://xmrig.com/docs/miner/hugepages
    accessed: 2026-10-10
  - organization: Microsoft Learn
    title: Privilege Constants — SeLockMemoryPrivilege
    url: https://learn.microsoft.com/en-us/windows/win32/secauthz/privilege-constants
    accessed: 2026-10-10
  - organization: Microsoft Learn
    title: Lock pages in memory
    url: https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/security-policy-settings/lock-pages-in-memory
    accessed: 2026-10-10
---

## Quick diagnosis

Check the permission message and each allocation percentage separately. XMRig's [current Huge Pages documentation](https://xmrig.com/docs/miner/hugepages) shows the permission message `* HUGE PAGES   permission granted` and an allocation example `huge pages 100%`. The first establishes that the process has Windows' `SeLockMemoryPrivilege`; it does **not** establish that the requested memory was allocated. A percentage describes the allocation XMRig reports, not the reason for any shortfall.

The table below is a signal guide, not a promise that every XMRig version prints identical surrounding lines. Use the exact wording and allocation labels in your own startup output. **Technical review: 10 October 2026.** XMRig 6.26.0 was the latest release on the official project pages at that review; the privilege and allocation advice follows the current documentation and should be checked against your own XMRig/Windows version before a system-policy change. On narrow screens, scroll the table region horizontally; the rest of the article reflows to the viewport.

<div class="signal-table-wrap" role="region" aria-label="Huge Pages signal and next-check table" aria-describedby="signal-table-help" tabindex="0">
<p id="signal-table-help" class="signal-table-help">Scrollable table: use Shift and the mouse wheel, touch, or arrow keys while this region is focused.</p>
<table class="signal-table">
  <caption>Interpret each signal on its own; none identifies every cause.</caption>
  <thead><tr><th scope="col">Observed XMRig signal</th><th scope="col">What it establishes</th><th scope="col">What it does not establish</th><th scope="col">Safe next check</th></tr></thead>
  <tbody>
    <tr><th scope="row"><code>* HUGE PAGES   permission granted</code> is absent, or XMRig reports the privilege unavailable</th><td>The running process has not reported the required privilege as available.</td><td>It does not tell you why the right is absent, whether policy allows it, or whether allocation would succeed once available.</td><td>Check XMRig's current Windows instructions. If the device is managed, ask its administrator before changing user-right policy. Do not leave the miner set to always run elevated.</td></tr>
    <tr><th scope="row">Permission is granted; a reported allocation is 0%</th><td>The right is available to the process, while that requested allocation was not reported as successful.</td><td>It does not prove that the privilege setting is wrong or identify the allocation failure's cause.</td><td>Record which allocation line is affected. Close memory-heavy work if practical, restart Windows, then inspect a fresh startup log as XMRig recommends for less than full allocation.</td></tr>
    <tr><th scope="row">Permission is granted; one or more reported allocations are below 100%</th><td>Allocation is partial for the specific dataset/thread item shown.</td><td>It does not identify a single cause, and one item does not describe every allocation. Memory pressure and system layout can matter.</td><td>Read the dataset and thread lines separately; note RandomX mode, NUMA/node information and available memory. Retry after a restart before changing configuration.</td></tr>
    <tr><th scope="row">A reported allocation is <code>huge pages 100%</code></th><td>XMRig reports full Huge Pages allocation for that item.</td><td>It does not prove every other item is full, that the setup is optimally configured, or that hashrate/temperature/responsiveness will meet a target.</td><td>No Huge Pages change is indicated for that item. If performance is still a concern, use the <a href="/troubleshoot/xmrig-low-hashrate/">low-hashrate checklist</a> and compare like-for-like runs.</td></tr>
    <tr><th scope="row">The excerpt is incomplete or contains no interpretable permission/allocation line</th><td>Nothing reliable about Huge Pages status can be concluded from that excerpt.</td><td>Silence or a missing line does not prove support, privilege, allocation, or failure.</td><td>Use the complete startup section for your XMRig version. The <a href="/tools/xmrig-log-decoder/">local XMRig Log Decoder</a> recognizes only a bounded set of explicit signals; unknown output stays unknown.</td></tr>
  </tbody>
</table>
</div>

This is why “permission granted” and “allocation succeeded” are separate outcomes: Windows grants a user right to the process, while XMRig still has to obtain the requested memory when it initializes. Windows does not reserve the pages in advance for XMRig; other use of memory can affect allocation. Full allocation for one line does not explain the rest of the system.

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
