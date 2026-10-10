---
title: "Windows Security Warnings When Downloading XMRig: Safe Checks"
description: "What to check when Windows or Defender warns about an XMRig download: verify the official source and available release evidence, and know when to stop."
publishedDate: 2026-10-10
section: guides
visual: security
summary: Stop before running a flagged miner. Verify where the file came from and what the release checks establish; a matching checksum or an official-looking filename is not proof that a binary is safe.
draft: false
related: [xmrig-windows-setup, xmrig-huge-pages]
sources:
  - organization: XMRig
    title: Official download page
    url: https://xmrig.com/download
    accessed: 2026-10-10
  - organization: XMRig
    title: Official GitHub releases and release assets
    url: https://github.com/xmrig/xmrig/releases
    accessed: 2026-10-10
  - organization: XMRig
    title: GPG signing key and fingerprint
    url: https://xmrig.com/docs/gpg-key
    accessed: 2026-10-10
  - organization: Microsoft Learn
    title: Microsoft Defender SmartScreen overview
    url: https://learn.microsoft.com/en-us/windows/security/operating-system-security/virus-and-threat-protection/microsoft-defender-smartscreen/
    accessed: 2026-10-10
  - organization: Microsoft Learn
    title: Microsoft Defender Antivirus in Windows Security
    url: https://learn.microsoft.com/en-us/defender-endpoint/microsoft-defender-security-center-antivirus
    accessed: 2026-10-10
  - organization: Microsoft Learn
    title: Exclusions in Microsoft Defender Antivirus
    url: https://learn.microsoft.com/en-us/microsoft-365/security/defender-endpoint/configure-contextual-file-folder-exclusions-microsoft-defender-antivirus?view=o365-worldwide
    accessed: 2026-10-10
---

<h2 id="short-answer">Short answer: stop and verify first</h2>

If Microsoft Defender, SmartScreen, or another security product warns about an XMRig download, do not run it yet. Check the source, exact release asset, and available verification evidence. If the warning remains unexplained or the checks do not match, do not run the file. A miner can be legitimate software and still be misused or bundled with something unsafe; a warning should not be dismissed just because the filename says XMRig.

This guide covers the official XMRig release path as reviewed on **10 October 2026**. The official download and GitHub release pages showed XMRig **v6.26.0** as the latest release at that review. This is a dated version observation, not a permanent version recommendation. Windows Security screens and managed-device policy vary by Windows version and organisation.

<h2 id="why-warning">Why Windows may show a warning</h2>

Microsoft says SmartScreen uses reputation signals for websites and downloaded apps. A warning can appear when a file or publisher has an established unsafe reputation, or when an item is unfamiliar and lacks a known reputation. An unfamiliar warning does not prove that the file is malicious, and it does not prove that the file is safe. Antivirus detections are separate signals that also deserve investigation.

XMRig is a publicly available mining program, and miners can be placed on computers without the owner's consent. That context helps explain why security products may treat mining software cautiously; it is not evidence that a particular alert is a false positive. Do not bypass a warning based on general claims about miners.

<h2 id="check-source">Check the source, not just the filename</h2>

Start at [xmrig.com/download](https://xmrig.com/download) or navigate to the `xmrig/xmrig` project and its releases on GitHub from a known project page. Check the address bar and repository owner carefully. Search ads, file-sharing sites, repackaged “boosted” builds, direct-message links, and look-alike domains are not official provenance. A filename such as `xmrig-…-windows-x64.zip` can be copied and proves nothing about who supplied the file.

Choose an asset matching your device architecture and read that release's notes. Do not use an archive from another party just because its name or version appears right. The [Windows setup guide](/guides/xmrig-windows-setup/) describes the standalone first-run path and links to the official release checks.

<h2 id="release-checks">What the release checks can establish</h2>

The reviewed XMRig GitHub release page provided `SHA256SUMS` and a detached `SHA256SUMS.sig`; the official XMRig site also listed the Windows archive's SHA-256. Check the current release page for its actual assets and values instead of copying a checksum from an older article or message.

| Check | What a match supports | What it cannot prove |
|---|---|---|
| Compare the downloaded archive's SHA-256 with the matching release-manifest entry | The archive bytes match that checksum value. It can reveal a damaged download or a mismatch. | If the checksum came from an unauthenticated or substituted manifest, it does not establish who published the archive. It does not establish that the program is free of malware. |
| Verify the detached signature on the release manifest after checking the XMRig GPG key fingerprint from the official XMRig key page and its linked project copy | The manifest's signature validates under the public key you checked, subject to your trust in that key identity and source. | It does not scan the archive or prove the software is harmless. You must still compare the archive digest to the signed manifest entry. |
| Check a Windows publisher signature, if one is present | Windows can identify the signing publisher and detect post-signing changes according to the signature chain. | It does not guarantee benign behavior. The XMRig release material reviewed here provides a GPG-signed checksum manifest; this guide does not claim the Windows archive has an Authenticode signature. |

The [XMRig GPG page](https://xmrig.com/docs/gpg-key) publishes the signing-key fingerprint and says its key should match the copy in the official GitHub project. A fingerprint comparison is meaningful only if you obtain the reference through an independently trusted route. The detailed commands and caveats are in the [standalone Windows setup guide](/guides/xmrig-windows-setup/); do not improvise signature commands from an untrusted post.

<h2 id="if-warning">If Defender or SmartScreen still warns</h2>

If Microsoft Defender flags or quarantines the file, leave it blocked while you investigate. You can open Windows Security and review **Virus & threat protection → Protection history**; the exact labels may vary by Windows version or policy. Read the detection name and affected path, check your release source and verification results, and keep the security intelligence current. Microsoft documents the [Protection history steps](https://learn.microsoft.com/en-us/defender-endpoint/microsoft-defender-security-center-antivirus#review-threat-detection-history-in-the-windows-security-app).

If the evidence does not resolve the warning, **do not run the file**. Ask your organisation's security team on a managed computer. On a personal computer, use Microsoft's official submission/review channels or seek help from a trusted security professional; do not restore a quarantined copy or add an exclusion to make it run. If you cannot establish a trustworthy source and verification path, discard the download.

SmartScreen's unfamiliar-file reputation and a Defender malware detection are not interchangeable outcomes. A reputation warning may reflect a low-prevalence file, but the correct response is still to verify and decide cautiously. A malware detection or unresolved block is not permission to override protection.

<h2 id="use-only-authorized-devices">Use only a computer you are allowed to mine on</h2>

Mining uses another person's computing resources if you run it on their device. Get clear permission before installing or running a miner on a workplace, school, shared, or other person's computer. Managed devices may have security policy that prohibits mining or restricts downloads; ask the administrator or security team rather than trying to work around that policy.

<h2 id="what-not-to-do">What not to do</h2>

- Do not disable Microsoft Defender, real-time protection, SmartScreen, or other security controls to install a miner.
- Do not add a folder-wide, process-wide, or other blanket Defender exclusion. Microsoft warns exclusions reduce protection.
- Do not restore an unknown quarantined executable or run an unverified file, even from an archive with a familiar name.
- Do not mine on a workplace, school, shared, or other person's computer without clear authorization.
- Do not treat a matching checksum, a “good signature,” or a download from an official-looking page as proof that the binary is safe.

<h2 id="related-resources">Related resources</h2>

Continue with the [Windows XMRig setup guide](/guides/xmrig-windows-setup/) only after the source and verification checks are satisfactory. If XMRig starts but reports a Huge Pages issue, see [Huge Pages on Windows](/troubleshoot/xmrig-huge-pages/) for the separate privilege/allocation diagnosis. Ember is in development and has no public download; this article is about standalone XMRig and does not recommend bypassing a security warning to use Ember.
