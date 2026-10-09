# M08 — XMRig Windows setup research

**Reviewed:** 8 October 2026. Sources below were reviewed before drafting the guide. Release checks are time-sensitive; this is not a promise that v6.26.0 will remain latest.

## Version comparison

- **Ember pin:** XMRig **6.26.0**, Windows x64. Verified in the desktop repository's `src-tauri/src/mining/provisioner.rs` (`VERSION`, archive name and pinned GitHub release URL), plus `docs/XMRIG_INTEGRATION.md`. These desktop files were read only.
- **Latest official upstream release checked:** **v6.26.0**, release dated **28 March 2026**. GitHub's `/releases/latest` resolved to `/releases/tag/v6.26.0` on the review date. The release page says `Latest`, publishes the Windows x64 archive, Windows ARM64 archive, a separate Windows GCC x64 archive, `SHA256SUMS` and `SHA256SUMS.sig`.
- **Relevant difference:** none in version number as of the review date. The article still points to the moving official latest-release page and tells readers to select an architecture-compatible asset and recheck the version-specific manifest. It does not imply Ember is needed or that readers should install an Ember-pinned archive.
- The v6.26.0 standard Windows x64 archive is `xmrig-6.26.0-windows-x64.zip`; its release-manifest SHA-256 is `bba8097cb37d9b458a1cb1137876b27cde6740d17fe4ccbc086ba07d87d9e147`. The release page displayed a signed commit and a detached manifest signature. The XMRig GPG documentation gives fingerprint `9AC4 CEA8 E66E 35A5 C7CD DC1B 446A 5363 8BE9 4409` and says its published key must match the repository copy.

## Sources reviewed

All sources accessed 8 October 2026.

### XMRig primary sources

- [Miner documentation](https://xmrig.com/docs/miner) — official documentation entry point.
- [Latest GitHub release](https://github.com/xmrig/xmrig/releases/latest) — version, release notes, Windows assets, SHA256SUMS and signature. Resolved to v6.26.0 during review.
- [v6.26.0 source configuration example](https://github.com/xmrig/xmrig/blob/v6.26.0/src/config.json) — pinned-version config structure.
- [Config file search order](https://xmrig.com/docs/miner/config) — JSON is preferred; `--config` / `-c` is first search path; adjacent `config.json` is second.
- [Command-line options](https://xmrig.com/docs/miner/command-line-options) — `-c` / `--config=FILE` loads a JSON config; `--dry-run` exists, but is not used as the guide's startup path.
- [Pool options](https://xmrig.com/docs/miner/config/pool) — `url`, `user`, `pass`, `tls`, optional worker identifiers, and supported URL schemes.
- [Windows build page](https://xmrig.com/docs/miner/build/windows) — official Windows binaries and source-build paths.
- [XMRig GPG key](https://xmrig.com/docs/gpg-key) — full fingerprint and cross-publication note.
- [Huge Pages](https://xmrig.com/docs/miner/hugepages) — Windows `SeLockMemoryPrivilege`; permission versus allocation; allocation can remain incomplete.
- [RandomX optimization guide](https://xmrig.com/docs/miner/randomx-optimization-guide) — memory requirements: 2,080 MiB dataset per NUMA node, 256 MB cache on first node, CPU cache guidance, and note that 4 GB may not be enough on Windows.
- [MSR documentation](https://xmrig.com/docs/miner/randomx-optimization-guide/msr) — Windows admin privilege for automatic MSR configuration, supported CPU families, and Secure Boot caveat.

### Monero and Microsoft primary sources

- [Monero Project: Mining Monero](https://www.getmonero.org/get-started/mining/) — RandomX, CPU relevance, solo/pool/P2Pool distinctions, fee and centralisation considerations; explicitly does not endorse specific pools, software or hardware.
- [Microsoft Learn: Microsoft Defender Antivirus in Windows Security](https://learn.microsoft.com/en-us/defender-endpoint/microsoft-defender-security-center-antivirus) — Protection History navigation and security settings context.
- [GnuPG manual: detached signature verification](https://gnupg.org/documentation/manuals/gnupg-devel/GPG-Examples.html) — documented argument order for `gpg --verify sigfile datafile`.

## Verified setup details and decisions

- **Primary path:** official GitHub latest release → architecture-appropriate official ZIP → extract with File Explorer → edit a small adjacent `config.json` containing one `pools` entry → launch from PowerShell with `./xmrig.exe --config ./config.json` using Windows PowerShell's `.` backslash form (`.\xmrig.exe --config .\config.json`) → supervise the console and stop with Ctrl+C.
- The launch option is documented as `--config=FILE` / `-c`; JSON config is the upstream-preferred setup method. No alternate command-line credential path is taught.
- Configuration keys are from XMRig pool documentation and the v6.26.0 example: `pools` array; per-pool `url`, `user`, `pass`, `tls`. Example placeholders use `.invalid`, `PORT` and an unmistakable public-address label; no real endpoint, address, pool credentials or worker identifier is included. `tls` must be selected to match the actual provider endpoint; `pass` defaults to `x` upstream but pool instructions can override worker/password conventions.
- The guide explains `Get-FileHash ... -Algorithm SHA256` as a local digest calculation. It explicitly says a hash copied from an unauthenticated source does not establish provenance. XMRig's release has `SHA256SUMS.sig`; the article shows GnuPG's documented detached-signature command and requires checking the full fingerprint first. It does not claim this review performed a local cryptographic verification or downloaded the binary.
- Huge Pages permission, successful page allocation, MSR preset application, CPU backend readiness, pool connection/work and accepted shares are separate observations. No fabricated version-specific console transcript is presented.
- No XMRig process, binary, benchmark, pool connection, or real mining session was executed for this milestone.

## Windows assumptions and security

- Article audience is modern 64-bit Windows on Intel/AMD x64; official ARM64 assets are acknowledged. The reviewed official sources do not give one supported minimum Windows release, so the article does not invent one.
- RandomX's working set is substantial; RAM requirements vary by NUMA topology and competing applications. The upstream statement that 4 GB may not be enough is reported as a caveat, not a minimum requirement.
- Ordinary first launch is described without administrator elevation. Windows rights for Huge Pages/MSR optimization are explained as separate optional steps; the article does not direct a novice to run the miner elevated.
- Security detection is not treated as proof either of malware or safety. The article directs a blocked user to inspect Windows Security Protection History and provenance; it rejects global disablement, blanket exclusions, unreviewed quarantine restore, modified binaries and unknown elevated execution.
- Public receiving addresses are distinguished from seed phrases and private spend keys. No wallet secret is needed in XMRig's pool `user` field.

## Uncertainties and maintenance triggers

- The current latest tag and asset formats can change. Recheck the official release page, archive names, signed manifest, fingerprint/key rotation and config/CLI docs before editing versioned instructions or checksum examples.
- Pool operators define host, port, TLS, account/worker syntax, share difficulty, fees, payout thresholds and availability; no generic example can verify any individual pool's policy.
- Exact logs depend on version, backend, CPU and pool. The article uses observations, not promised literal output. The local decoder remains explicitly limited to XMRig 6.26.0 signals.
- Windows support baselines, Defender naming/UI and group policy can change. Confirm Microsoft instructions on future security guidance edits.
- No claim is made about profitability, expected hashrate, safety certification, smooth operation on a specific computer, or payout timing.

## Deliberately excluded

- No unofficial mirrors, direct third-party download links, custom/modified binaries, installer bundle or source compilation steps.
- No blanket antivirus exclusion, Defender shutdown, warning bypass, automatic quarantine restore, routine administrator launch, Secure Boot disablement, registry edits, custom MSR values or Huge Pages reservation commands.
- No pool endpoint recommendation, real wallet address, personal credentials, private key, profitability estimate, benchmark table, fabricated screenshot or Ember setup wizard.
- No actual mining or pool connection as a validation method.
