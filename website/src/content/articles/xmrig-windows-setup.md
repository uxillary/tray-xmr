---
title: How to Set Up XMRig on Windows
description: "Set up standalone XMRig for Monero on Windows: choose the official build, configure a pool and wallet address, start safely and read each first-run signal."
publishedDate: 2026-10-08
section: guides
visual: setup
summary: Follow one careful path from the official Windows release to a first foreground session. This guide covers pool configuration, safe provenance checks and what startup, connection and share messages do—and do not—confirm.
draft: false
related: [xmrig-cpu-threads, randomx-memory-cache, xmrig-huge-pages, xmrig-msr-error, xmrig-low-hashrate]
sources:
  - organization: XMRig
    title: Latest official release (v6.26.0 reviewed)
    url: https://github.com/xmrig/xmrig/releases/latest
    accessed: 2026-10-08
  - organization: XMRig
    title: Config file and search paths
    url: https://xmrig.com/docs/miner/config
    accessed: 2026-10-08
  - organization: XMRig
    title: Command-line options
    url: https://xmrig.com/docs/miner/command-line-options
    accessed: 2026-10-08
  - organization: XMRig
    title: Pool configuration
    url: https://xmrig.com/docs/miner/config/pool
    accessed: 2026-10-08
  - organization: XMRig
    title: Windows build and official binaries
    url: https://xmrig.com/docs/miner/build/windows
    accessed: 2026-10-08
  - organization: XMRig
    title: GPG signing key
    url: https://xmrig.com/docs/gpg-key
    accessed: 2026-10-08
  - organization: XMRig
    title: Huge Pages
    url: https://xmrig.com/docs/miner/hugepages
    accessed: 2026-10-08
  - organization: XMRig
    title: RandomX Optimization Guide
    url: https://xmrig.com/docs/miner/randomx-optimization-guide
    accessed: 2026-10-08
  - organization: XMRig
    title: MSR configuration
    url: https://xmrig.com/docs/miner/randomx-optimization-guide/msr
    accessed: 2026-10-08
  - organization: Monero Project
    title: Mining Monero
    url: https://www.getmonero.org/get-started/mining/
    accessed: 2026-10-08
  - organization: Microsoft Learn
    title: Review threat detection history in Windows Security
    url: https://learn.microsoft.com/en-us/defender-endpoint/microsoft-defender-security-center-antivirus
    accessed: 2026-10-08
  - organization: The GnuPG Project
    title: GPG examples — detached signature verification
    url: https://gnupg.org/documentation/manuals/gnupg-devel/GPG-Examples.html
    accessed: 2026-10-08
---

<h2 id="before-you-begin">1. Before you begin</h2>

XMRig is an open-source miner; RandomX is the proof-of-work algorithm Monero uses. RandomX is designed around general-purpose processors, and the Monero Project says CPUs are more efficient than GPUs for Monero mining. XMRig performs the CPU mining work and communicates with the mining service you configure. Ember is a separate, in-development Windows application intended to make XMRig easier to supervise and understand. **Ember is not required for this guide and has no public download.** This is a standalone XMRig walkthrough.

This path is for a 64-bit Windows PC with a compatible CPU, a Monero receiving address, and the pool connection details you chose. The official release also lists a Windows ARM64 build; do not choose x64 just because it is the first asset if your Windows device is ARM-based. The upstream pages reviewed here do not state a single minimum supported Windows version, so check the release notes and your device compatibility rather than assuming every Windows build is supported.

RandomX needs substantial memory: XMRig documents about 2,080 MiB of dataset memory per NUMA node plus a 256 MB cache on the first node. Windows and other applications need memory too; XMRig warns that 4 GB may not be enough on Windows. Leave room for normal system use, and expect performance to vary with CPU cache, memory channels, cooling, power limits and background load. Review [how RandomX uses memory and CPU cache](/learn/randomx-memory-cache/) and [how XMRig selects CPU threads](/learn/xmrig-cpu-threads/).

Mining can use a CPU heavily for long periods. It creates heat, fan noise and electricity use; it may reduce responsiveness. Check that the computer can ventilate, monitor temperatures with the system or CPU maker's tools, and stop if the machine becomes unstable or uncomfortably hot. To estimate electricity cost, measure whole-system power and use your tariff in the [Mining Electricity Cost Calculator](/tools/electricity-cost-calculator/). A calculation is not a profitability estimate.

You need:

- A Monero **public receiving address** from a wallet you control. XMRig does not need your seed phrase, private spend key or wallet password. Never enter or share those secrets here or with a pool.
- Either a pool's documented host and port, or the details for a different supported mining mode. This guide uses the usual pool configuration because its exact address, TLS requirements, worker naming and payout rules depend on the service. We do not endorse a pool.
- Time to inspect the official source and Windows security alerts before starting. Do not assume a detection is harmless.

Pool mining is different from solo mining: pool operators set their own fees, payout thresholds and rules. Read those terms and consider the trust and centralisation trade-offs before sending work to one. The [Monero Project's mining overview](https://www.getmonero.org/get-started/mining/) explains pool, solo and P2Pool approaches.

<h2 id="download-xmrig-safely">2. Download XMRig safely</h2>

1. Open the [official XMRig GitHub releases](https://github.com/xmrig/xmrig/releases/latest) and verify that the repository owner is `xmrig` and the project is `xmrig/xmrig`. The latest release checked for this guide is **v6.26.0**. Choose the Windows archive matching your device architecture. For 64-bit Intel/AMD Windows, the asset reviewed was `xmrig-6.26.0-windows-x64.zip`; the release also lists Windows ARM64 and a separate GCC x64 build. Do not download a “patched” build or use a third-party mirror.
2. On the release page, review the release notes and asset names. Download the archive and extract it with File Explorer to a folder you control. The archive's root contains `xmrig.exe`; keep the other files that came with the official archive alongside it.
3. Download `SHA256SUMS` and the detached `SHA256SUMS.sig` from that same release page if you plan to check integrity or provenance. A SHA-256 comparison can detect a damaged or mismatched archive, but a checksum copied from the same unverified source does not by itself authenticate who made the file. For v6.26.0, the published SHA-256 for `xmrig-6.26.0-windows-x64.zip` is `bba8097cb37d9b458a1cb1137876b27cde6740d17fe4ccbc086ba07d87d9e147`. In PowerShell, run the next command from the folder containing the downloaded archive; it calculates a digest without running the file:

   ```powershell
   Get-FileHash .\xmrig-6.26.0-windows-x64.zip -Algorithm SHA256
   ```

   Compare the output with the matching line in the release's `SHA256SUMS` file. The digest above is specific to v6.26.0; for any later version, use that release's own manifest.

4. For an authenticity check, XMRig provides a detached GPG signature for the manifest and publishes its signing key at both [xmrig.com](https://xmrig.com/docs/gpg-key) and the official GitHub repository. If you already use GnuPG and know how to verify a signing key's identity, inspect the fingerprint of the XMRig key already in your keyring:

   ```powershell
   gpg --fingerprint 446A53638BE94409
   ```

   Compare the complete fingerprint with `9AC4 CEA8 E66E 35A5 C7CD DC1B 446A 5363 8BE9 4409` published by XMRig and the matching key copy in its official repository. Only after confirming the key identity, verify the manifest in PowerShell from the folder containing both release files:

   ```powershell
   gpg --verify .\SHA256SUMS.sig .\SHA256SUMS
   ```

   The command checks the signature over the manifest; it does not verify the archive until you also compare the archive's SHA-256 with the matching signed manifest entry. A “good signature” alone is not enough if you have not established that the key is the intended XMRig key. This review did not install a GPG client or verify downloaded bytes locally.

Microsoft Defender and other security tools may detect mining software because miners can be abused when installed without consent. That context does **not** make every alert a false positive or certify this binary as safe. If Windows blocks it, stop here. In Windows Security, open **Virus & threat protection → Protection history**, inspect the detection and affected file, and review the source/version and official XMRig documentation. Ask your organisation's administrator on a managed PC. Do not disable protection globally, add a blanket exclusion, bypass a warning, restore a quarantined file automatically, or run an unknown executable as administrator. Microsoft documents [how to review Protection history](https://learn.microsoft.com/en-us/defender-endpoint/microsoft-defender-security-center-antivirus#review-threat-detection-history-in-the-windows-security-app). For a clear stop/verify decision path and what each release check establishes, see [Windows security-warning checks for XMRig](/guides/xmrig-windows-security-warnings/).

<h2 id="configure-xmrig">3. Configure XMRig</h2>

For a first setup, use XMRig's documented JSON configuration file. Its search order includes an explicit `--config` / `-c` path, then `config.json` next to the executable. The short example below includes only the pool entry. Replace every placeholder with details from your chosen pool and your own public receiving address. It is deliberately non-runnable as written: `.invalid`, `PORT` and the wallet label are placeholders, not a real endpoint or address.

Create a plain text file named `config.json` in the extracted XMRig folder:

```json
{
  "pools": [
    {
      "url": "pool.example.invalid:PORT",
      "user": "YOUR_MONERO_PUBLIC_RECEIVING_ADDRESS",
      "pass": "x",
      "tls": true
    }
  ]
}
```

<dl class="config-anatomy">
  <div><dt>url</dt><dd>Replace with the exact address from the pool's setup page. It may include a scheme such as <code>stratum+ssl://</code>; use the provider's documented TLS endpoint and syntax.</dd></div>
  <div><dt>user</dt><dd>On most pools this is your Monero public wallet address. Confirm the pool's format; do not use wallet secrets.</dd></div>
  <div><dt>pass</dt><dd>XMRig's documented default is <code>x</code>; some pools use this field for a worker name or other pool-specific value.</dd></div>
  <div><dt>tls</dt><dd><code>true</code> assumes a TLS endpoint. Set this to match the pool's exact host and port instructions; do not assume TLS works on every port.</dd></div>
</dl>

JSON requires double quotes around names and string values, commas between items, and no trailing comma after the final item. XMRig documents pool fields `url`, `user`, `pass` and `tls`; when `url` uses the `stratum+ssl://` scheme, XMRig says the separate `tls` field is ignored. The endpoint and account formatting are set by the pool. Optional worker identifiers are pool-specific and are intentionally omitted. Some services negotiate the algorithm; if a pool's documentation requires an explicit coin or algorithm choice, follow the matching XMRig option for your version rather than adding a guess. The placeholders must be replaced before starting; the example must not be treated as a real pool recommendation.

Keep the config private to your Windows account because it reveals your public receiving address and pool choice. It must never contain a seed phrase or private spend key. XMRig can save or update configuration in some circumstances; review its `autosave` behavior in the official documentation before adding options or relying on a read-only original.

<h2 id="start-xmrig">4. Start XMRig</h2>

After replacing all placeholders, open PowerShell in the extracted folder. In File Explorer, open the folder, select the address bar, type `powershell`, and press Enter. Check that the prompt is in the folder containing both `xmrig.exe` and `config.json`. Then run this command:

```powershell
.\xmrig.exe --config .\config.json
```

This command starts XMRig in the foreground using that config; it begins trying to connect and mine immediately. It is not a dry run. Do not use administrator privileges for ordinary launch unless you have a specific, understood reason. Huge Pages and MSR are optional optimisations with distinct Windows privilege considerations; first establish that the basic session behaves as expected. Stop the foreground process with **Ctrl+C** in that PowerShell window. Do not close or leave it unattended until you understand how to stop the process.

You can also start XMRig by opening its executable and allowing it to find the adjacent `config.json`, but this guide uses the explicit PowerShell command so the selected configuration is visible. Avoid adding startup tasks or background execution until you understand the consequences.

<h2 id="verify-the-session">5. Verify the first session</h2>

Treat the first run as a sequence of observations. One green-looking line is not proof that every later stage succeeded:

<ol class="signal-map">
  <li><strong>Miner starts</strong><span>The process reads its config and identifies available backends. A running console alone does not mean the CPU backend is ready or that pool work arrived.</span></li>
  <li><strong>CPU backend is ready</strong><span>XMRig initializes the CPU mining backend and RandomX dataset. Initialization takes time; errors here are different from a pool connection error.</span></li>
  <li><strong>Huge Pages status</strong><span>Look separately for permission and allocation status, including the reported percentage for dataset/threads. Permission granted does not guarantee complete allocation. This optimisation is not the same as the miner being connected.</span></li>
  <li><strong>MSR status</strong><span>If the CPU supports the preset and Windows permits access, XMRig may report that MSR values were applied. A warning can mean an optimisation was unavailable; do not change Secure Boot or register values just to clear a line.</span></li>
  <li><strong>Pool connection and work</strong><span>A successful connection means XMRig reached the configured service. Receiving a job/work assignment is a later signal; neither proves a share has been accepted.</span></li>
  <li><strong>Accepted share</strong><span>An accepted share is a pool response for submitted work. It may take time, especially at low hashrate or depending on pool share difficulty. It is not a guaranteed payout: pool accounting, minimums, fees and payout rules still apply.</span></li>
</ol>

Exact console wording and formatting can change by version, CPU and pool. Use the labels and surrounding context in the log rather than treating a copied sample line as a universal success test. The [local XMRig Log Decoder](/tools/xmrig-log-decoder/) recognizes only a bounded set of XMRig 6.26.0 startup, Huge Pages, MSR, pool and share messages; it processes pasted text in your browser and does not diagnose root causes, verify files, or analyze hashrate. Do not paste a log publicly without checking it for wallet addresses, hostnames, usernames and other identifying details.

<h2 id="common-issues">6. Common first-run issues</h2>

- **Huge Pages are partial or unavailable.** XMRig reports permission separately from successful allocation. On Windows, obtaining `SeLockMemoryPrivilege` may require an administrator-managed step; available memory can still prevent full allocation. Read [Huge Pages on Windows](/troubleshoot/xmrig-huge-pages/) before changing local policy. Do not leave the miner permanently elevated as a shortcut.
- **MSR could not be applied.** This is separate from pool connectivity and may be an unavailable CPU optimisation. See [MSR errors on Windows](/troubleshoot/xmrig-msr-error/). Do not disable Secure Boot or use custom register values based only on a warning.
- **Pool connection fails.** Recheck the host, port, TLS setting, network access and any required pool-specific account format against that pool's own documentation. Do not copy a random endpoint from an old tutorial. Never put a private wallet key into the config.
- **No accepted share yet.** First establish that a job was received and XMRig is hashing. Share timing depends on hashrate and the pool's share difficulty; absence of an immediate accepted share is not enough to identify a fault. Check the pool's dashboard and help pages without assuming a payout.
- **Hashrate is lower than expected.** There is no universal target for a CPU model. Compare the same version, algorithm, thread profile, memory configuration, power and thermal conditions. Start with the [low-hashrate checklist](/troubleshoot/xmrig-low-hashrate/) and the [CPU thread guide](/learn/xmrig-cpu-threads/), changing one setting at a time.
- **Security software blocks the file.** Stop and review the detection and file provenance. Mining software can be misused, so a familiar-looking URL alone is not proof of safety. Do not disable protection, make broad exclusions or restore an item automatically; consult your administrator if the device is managed.

<h2 id="next-steps">7. Next steps</h2>

Keep the first session modest and supervised. Review CPU utilisation, total system memory, temperature, fan behavior and whether Windows remains responsive. Stop the miner before changing settings, and write down the XMRig version and the exact change so you can undo it. Check the vendor's operating limits; do not use someone else's temperature or hashrate as your safe target.

When you understand the base run, explore [RandomX memory and cache](/learn/randomx-memory-cache/), [Huge Pages](/troubleshoot/xmrig-huge-pages/) and [MSR status](/troubleshoot/xmrig-msr-error/) as separate topics. If measuring running cost, use a wall meter for whole-system watts and your actual tariff with the [electricity calculator](/tools/electricity-cost-calculator/). For log excerpts, the [decoder's coverage notes](/tools/xmrig-log-decoder/) explain which signals it can and cannot recognize.

For advanced pool, CPU and RandomX options, return to the [official XMRig documentation](https://xmrig.com/docs/miner) for the exact version you run. Ember remains a separate developing product and is not part of this standalone setup; [see its current status](/ember/).
