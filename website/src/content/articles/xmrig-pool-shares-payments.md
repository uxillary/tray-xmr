---
title: "XMRig Pool Connections, Rejected Shares and Missing Payments"
description: "Separate XMRig connection, job, submission and payout states. Check rejected shares safely and understand why accepted submissions may not be P2Pool shares."
publishedDate: 2026-11-25
updatedDate: 2026-11-25
section: troubleshoot
visual: pool-payments
summary: "Find the last stage you can actually verify: connection, work, submission response or payment eligibility. An accepted XMRig submission is not a wallet payment."
draft: false
related: [xmrig-windows-setup, xmrig-low-hashrate]
sources:
  - organization: XMRig
    title: v6.26.0 network connection, job and submission output
    url: https://github.com/xmrig/xmrig/blob/v6.26.0/src/net/Network.cpp
    accessed: 2026-11-25
  - organization: XMRig
    title: Pool configuration
    url: https://xmrig.com/docs/miner/config/pool
    accessed: 2026-11-25
  - organization: P2Pool
    title: Official payout explanation
    url: https://github.com/SChernykh/p2pool#how-payouts-work-in-p2pool
    accessed: 2026-11-25
  - organization: P2Pool
    title: Getting started, progress and FAQ
    url: https://p2pool.io/
    accessed: 2026-11-25
---

<h2 id="no-connection">1. No connection or repeated reconnects</h2>

The [three difficulty thresholds](/learn/mining-difficulty-expected-rewards/#difficulty-thresholds) explain why an accepted submission need not be a sidechain share or Monero block. Browse the [console reference](/troubleshoot/xmrig-log-reference/#pool-work) for source-scoped examples.

**What the signal establishes:** a failed attempt or repeated retries show that XMRig has not maintained the intended endpoint connection during that excerpt. A disconnect after earlier work is a different event from never connecting.

**What it does not establish:** the cause could be local, network-related or upstream. A retry alone does not prove a bad wallet, failing CPU or offline pool.

**Safe next checks:** compare the configured hostname, port and TLS mode with that pool's official connection instructions. Check ordinary network availability and any published service status. Keep certificate verification and security protections enabled; do not replace a TLS endpoint with an unverified plain-text connection to suppress an error. On a managed network, ask its administrator about policy rather than opening or bypassing it yourself.

**Information needed:** exact miner version, connection error, timestamps/timezone, intended pool/mode and whether earlier connections worked. Consult the pool's documentation for endpoint changes, authentication formats and service incidents. Do not post an unredacted configuration or log publicly.

<h2 id="connected-no-work">2. Connected, but no mining jobs</h2>

**What the signal establishes:** XMRig's connection output reports an active endpoint at that point; a later job message is separate evidence that work arrived. In the reviewed source, these come from different network callbacks.

<div class="console-example">
<span class="eyebrow">SYNTHETIC, SHORTENED XMRIG 6.26.0-STYLE EXAMPLE</span>
<pre><code>net use pool pool.invalid:443 TLSv1.3
net new job from pool.invalid:443 diff 100000 algo rx/0</code></pre>
<p>The first line concerns the connection; the second concerns a job. The endpoint and numbers are invented. Wording and extra fields vary by version, build and pool.</p>
</div>

**What it does not establish:** a connection does not prove work arrived, workers are computing, or a share has been accepted. An incomplete excerpt can simply omit later activity.

**Safe next checks:** inspect subsequent output for a job or explicit login/authorization error. Confirm the intended algorithm/coin and endpoint against the provider's instructions. If this is your own P2Pool node, inspect its synchronization and error status using its official guidance; a miner's local connection does not prove the upstream node is ready.

**Information needed:** complete event order around connection/login/job, miner build and configured mining mode. Pool-specific protocol, maintenance and account requirements must be checked upstream. If jobs arrive but the rate seems unexpectedly low, use the [comparable-run performance worksheet](/troubleshoot/xmrig-low-hashrate/#keep-a-small-measurement-record).

<h2 id="rejected-submissions">3. Shares are being rejected</h2>

**What the signal establishes:** the endpoint returned a rejection for a submission. The reviewed XMRig source prints a supplied error separately from the accepted/rejected counters.

<div class="console-example">
<span class="eyebrow">SYNTHETIC XMRIG 6.26.0-STYLE RESPONSE EXAMPLES</span>
<pre><code>cpu accepted (12/0) diff 100000 (45 ms)
cpu rejected (12/1) diff 100000 "example pool reason" (46 ms)</code></pre>
<p>The invented reason is a placeholder, not a real diagnosis. Keep the actual reason from your own endpoint beside its event time; counters alone cannot explain it.</p>
</div>

**What it does not establish:** rejection does not automatically mean unstable hardware, a stale job or an incorrect difficulty. Those are possible investigative categories only when the pool reason and surrounding evidence support them. There is no universal acceptable rejection percentage or generic fix supplied here.

**Safe next checks:** read the exact reason in the original log and that pool's rejection documentation. Compare job changes, response timing and any computation/stability errors in the same interval. Keep a known-good configuration; do not tune clocks, change security settings or select an arbitrary difficulty merely to remove a warning.

**Information needed:** reason, version/mode, time window, accepted and rejected counts for that window, and recent configuration/network changes. If the reason is undocumented or ambiguous, ask the upstream operator or project using a redacted excerpt. The [local log decoder](/tools/xmrig-log-decoder/) summarizes supported signals; it does not interpret pool-specific rejection reasons.

<h2 id="accepted-no-payment">4. Submissions are accepted, but no payment arrived</h2>

**What the signal establishes:** an accepted response acknowledges a submitted result at that time. It is not evidence of a wallet transaction. First identify whether you use a conventional pool or P2Pool; their accounting paths differ.

**What it does not establish:** an accepted counter does not prove that payout conditions were met, which address will receive funds, or when a transaction should occur. The [profitability calculator's expected value](/tools/monero-mining-profitability-calculator/#input-sources) is not evidence that a payment is overdue.

**Safe next checks for a conventional pool:** use its official documentation to inspect reward scheme, credited work, fees, minimum payout, schedule and any required confirmations. Check the configured public receiving address against your intended wallet privately. If the pool reports a payment transaction, distinguish that transaction's state from whether your wallet is synchronized and displaying it. Never share a seed, private key or wallet file to “verify” a payout.

**Information needed:** pool/mode, relevant observation period, the pool's accounting/payment status and wallet synchronization context. Address/account formats and payment policy belong to the specific pool; no deadline or guaranteed payment amount can be inferred from this guide. For P2Pool, use the distinct eligibility checks below instead of looking for a conventional pending balance.

<h2 id="p2pool-shares">5. XMRig accepts work, but P2Pool shows no qualifying shares</h2>

**What the signal establishes:** the miner can submit work accepted by its P2Pool endpoint. Miner-level submissions and qualifying P2Pool sidechain shares are different observations: a candidate accepted at the miner's assigned difficulty may not meet the sidechain's share target.

**What it does not establish:** a growing XMRig counter is not proof of a qualifying sidechain share or payout eligibility. Absence from a public observer alone is not proof that the miner or network stopped; observers are third-party services with their own availability and update delays.

**Safe next checks:** read your P2Pool node's status/logs for synchronization, the selected main/mini/nano sidechain and actual share discoveries. Check the receiving-address configuration using the current official instructions, keeping identifying details private. If choosing to consult a public observer, use the matching sidechain and understand that entering your public address shares that identifier with the service; local node evidence comes first.

The [official P2Pool payout explanation](https://github.com/SChernykh/p2pool#how-payouts-work-in-p2pool) requires a qualifying share in the payout window when P2Pool discovers a Monero block. A share can leave that window without a payout. The [official progress/FAQ guidance](https://p2pool.io/) explains where to inspect status; an estimated share time is an average, not a payment deadline.

**Information needed:** P2Pool/Monero/XMRig versions, selected sidechain, synchronization state, local share status and relevant times. Window/address/version details must be checked against upstream guidance for your setup. This article explains standalone software; it does not establish that Ember supports P2Pool.

<h2 id="further-information">6. When more information is needed</h2>

Keep the exact version/build, intended pool or local-node mode, time range, event order and supplied error reason. Mark absent context **unknown**. Record changes one at a time and distinguish an incomplete excerpt from an actual absent event. A known CPU worker state, connection, job, submission response, accounting entry and transaction each establish something different.

Inspect excerpts locally with the [bounded XMRig log decoder](/tools/xmrig-log-decoder/#decoder-scope), then consult the named provider's current documentation when endpoint, rejection or payout policy is involved. Its recognition rules are not a comprehensive protocol trace. Redact addresses, endpoints, usernames, IPs and paths before seeking public help; share no credentials, seed or private keys, and do not expose a miner HTTP API for diagnosis.

If you did not intentionally install or start this miner, stop voluntary setup troubleshooting and follow your security provider's incident guidance or contact the device administrator. For a flagged download, [stop and verify the source and release evidence](/guides/xmrig-windows-security-warnings/). Do not disable antivirus, weaken TLS, bypass protections or run an unknown binary to make a connection succeed.

Technical review: **25 November 2026**. Console examples follow selected network-output patterns in the pinned XMRig **v6.26.0** source; they are synthetic and shortened, not real user logs or a claim to cover every version. P2Pool documentation is a dated review, not a frozen promise about future policies or timing. For first-time voluntary setup, return to the [standalone Windows XMRig guide](/guides/xmrig-windows-setup/).
