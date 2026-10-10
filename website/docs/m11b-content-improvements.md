# M11B — High-value content improvements

**Implemented:** 10 October 2026  
**Scope:** `website/` only  
**Branch / base commit:** `main` / `040a3ca02363549694cfca677db781d83b710707`

M11A's three prioritized content improvements are implemented. No Search Console property, verification token, or support evidence was available in the checked repository locations, so no first-party demand claims were added. The original M11A research and priorities remain preserved in its planning documents.

## Pages and editorial changes

- `/troubleshoot/xmrig-huge-pages/` retains its route. The guide now has a dated, version-scoped technical review and a semantic four-column signal table. It separates unavailable privilege, granted privilege with 0% allocation, partial allocation, full allocation, and inconclusive output. Each branch states what the signal establishes, what it cannot establish, and a safe next check. It uses XMRig's documented examples, not invented log output. The existing memory-allocation visual remains and is paired with explanatory text.
- `/tools/monero-mining-profitability-calculator/` retains its route and calculation behavior. It now explains how to source all eight inputs and labels them as measured, externally sourced, or hypothetical. A five-step formula figure provides a text equivalent. A clearly synthetic example shows the assumptions, expected block equivalents, gross and after-fee XMR, fee value, electricity use/cost, and net operating result. It explains payout variability, constant assumptions, exclusions, local-only calculation and non-converting currency labels.
- `/guides/xmrig-windows-security-warnings/` is the new static guide. Its text-first five-step flow links to page sections. The guide distinguishes checksum integrity, signature/key provenance, publisher identity, malware detection and binary safety; it tells readers to stop when warnings remain unresolved and not to disable protection, add broad exclusions, restore unknown quarantined files, or mine without authorization.

## Example arithmetic

The hypothetical daily scenario uses 1,000 H/s, 24 hours, 100 W at the wall, £0.20/kWh, a 1% pool fee, £150/XMR, network difficulty of 86,400,000,000 hashes/block, and a 0.6 XMR total block reward. Independently calculated from the existing M10B model:

- `1,000 × 86,400 = 86,400,000` expected hashes; divided by difficulty gives `0.001` expected block equivalents.
- `0.001 × 0.6 = 0.0006 XMR` gross; the 1% fee is `0.000006 XMR`, leaving `0.000594 XMR`.
- At the hypothetical price, gross revenue is £0.09, fee value £0.0009, and revenue after pool fee £0.0891.
- Energy is `0.1 kW × 24 h = 2.4 kWh`, costing £0.48; estimated net operating result is `£0.0891 − £0.48 = −£0.3909/day`.

The values are teaching assumptions, not current network, market, pool, hardware or earnings data. A regression test compares the written example with the unchanged calculation function.

## Sources and scope

Technical guidance was checked against official [XMRig Huge Pages documentation](https://xmrig.com/docs/miner/hugepages), [XMRig benchmark documentation](https://xmrig.com/docs/miner/benchmark), [XMRig download page](https://xmrig.com/download), [XMRig GitHub releases](https://github.com/xmrig/xmrig/releases), [XMRig GPG key page](https://xmrig.com/docs/gpg-key), and [Monero's block reference](https://web.getmonero.org/resources/moneropedia/block.html), plus Microsoft Learn pages for [SeLockMemoryPrivilege](https://learn.microsoft.com/en-us/windows/win32/secauthz/privilege-constants), [Lock pages in memory](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/security-policy-settings/lock-pages-in-memory), [SmartScreen](https://learn.microsoft.com/en-us/windows/security/operating-system-security/virus-and-threat-protection/microsoft-defender-smartscreen/), [Defender Protection History](https://learn.microsoft.com/en-us/defender-endpoint/microsoft-defender-security-center-antivirus), and [Defender exclusions](https://learn.microsoft.com/en-us/microsoft-365/security/defender-endpoint/configure-contextual-file-folder-exclusions-microsoft-defender-antivirus?view=o365-worldwide). Article source lists record access date 10 October 2026.

At that review, the official XMRig download/release pages showed v6.26.0 as latest; this is a dated observation, not a permanent recommendation. Windows security surfaces and managed-device policy vary. The Huge Pages page asks readers to check current XMRig/Windows guidance for their own version before system-policy changes. No fixed checksum, Authenticode signature, or claim that a hash establishes safety was invented.

## Site integration, metadata, and accessibility

The new guide appears in the Guides hub and the Troubleshoot discovery path, and is linked from the Windows setup guide. The Huge Pages article links contextually to RandomX memory/cache, CPU threads, low-hashrate guidance, the local Log Decoder, and Windows setup. The existing electricity calculator remains linked from the profitability tool. The new route is included in the static content regression expectations; sitemap generation continues through the existing route mechanism.

Titles, descriptions, static article metadata and existing canonical routes were retained or updated using existing conventions. No FAQ/rating schema, public Ember download CTA, new dependency, live API, or desktop claim was added. Tables use semantic captions and scoped headers; horizontally overflowing table regions are keyboard-focusable with an instruction. The formula and security decision figures have text equivalents and preserve logical reading order. No full accessibility certification is claimed.

## Browser QA

- The preferred preview command was `npm run dev -- --host localhost --port 4321 --strictPort` from `website/`. Astro reported 4321 was already in use and selected port **4322**. The in-app browser timed out at `http://localhost:4322/`.
- Browser navigation to `http://localhost:4321/` succeeded, and the new guide rendered at `http://localhost:4321/guides/xmrig-windows-security-warnings/`. This establishes successful browser rendering at 4321, but the identity of the pre-existing listener could not be confirmed.
- Separate PowerShell HTTP probes to `localhost` and `127.0.0.1` were blocked by local socket permissions, so no independent shell HTTP status is claimed. Browser access and shell HTTP access are recorded separately.
- Rendered at the available browser viewport screenshot size **1260 × 713 px**: the calculator, new security guide, Huge Pages guide, and Guides hub. The calculator was exercised using the synthetic assumptions above; the browser displayed the expected negative daily result and projections.
- The in-app browser API exposed no numeric viewport override. Exact 1440, 1280, 1024, 768, 600, 390, and 360 px renders, mobile navigation, and mobile table scrolling therefore remain unverified. No measured contrast or assistive-technology audit was performed.

## Verification

Final command results after the last source change:

- `npm test` — passed, 21/21 tests.
- `npm run check` — passed, 42 Astro files, 0 errors/warnings/hints.
- `npm run build` — passed, 17 static pages generated, including the new guide and sitemap.
- `npm run check:links` — passed, 17 pages; canonical uniqueness, JSON-LD, local links, article output and sitemap verified.
- `git diff --check` — passed; Git emitted only working-copy LF-to-CRLF notices.

## Remaining dependencies and recommended next milestone

At M11B completion, the production canonical origin was unverified and `SITE_URL` still fell back to `https://example.com`. M12A removes that fallback: release builds now require an explicit confirmed HTTPS `SITE_URL`. The actual production origin remains unverified until the deployment owner configures and checks it. The precise version of the pre-existing preview listener, independent shell HTTP connectivity, specified mobile viewport renders, dedicated keyboard/mobile table interaction, measured contrast, and screen-reader testing remain unverified.

Recommended next milestone: a focused accessibility and responsive-browser QA pass after the app/browser exposes controllable viewport sizes, followed by production-origin verification before deployment. M11B is complete; no later milestone is started here.

