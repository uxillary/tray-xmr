# Ember website strategy

**Evidence reviewed:** repository README, `docs/PRODUCT.md`, `docs/SECURITY.md`, `docs/ARCHITECTURE.md`, `docs/XMRIG_INTEGRATION.md`, current React setup/telemetry components and Rust wallet/provisioning implementation. Reviewed 5 October 2026. Product facts below describe the repository foundation; they do not imply a public release.

## Verified product facts

- Ember is a Windows-first desktop application built with Tauri 2, Rust, React, TypeScript and Vite. Its purpose is to make Monero CPU mining more approachable.
- The current foundation supports XMRig 6.26.0 on Windows x64. It downloads the official upstream archive, verifies the detached signature on the checksum manifest against a pinned signer and checks the selected archive and installed executable digests.
- Setup accepts a Monero mainnet public receiving address, an explicitly entered Stratum host/port/TLS choice and Quiet, Balanced or Performance profiles. The profiles select configured CPU thread counts; they are not power or temperature limits.
- Wallet parsing validates supported address forms. Ember stores the public address locally, masks it in the frontend and does not request seeds/private keys. Ember is not a wallet.
- Rust owns readiness validation, fresh consent checks, private session configuration, a loopback-only authenticated API and the XMRig process lifecycle. On Windows, process supervision uses a Job Object. This is a documented implementation contract, not a security certification.
- A current-build owner session reached Start → Mining with authenticated XMRig telemetry, a connected pool and real hashrate. Owner acceptance of Stop/Quit remains open; no public release is available. Pool/share status is session telemetry, not earnings or persistent history.
- Ember applies a 5% developer time-share target using 19:1 active mining time. Pool reward share can differ and session counters are not lifetime accounting. XMRig's upstream donation is separate. Public release is not ready; release/legal review and clean-machine security checks remain open.
- No public release/download flow is confirmed in the repository. This site therefore uses “Explore Ember” and makes development status explicit.
- **M08 review (8 October 2026):** the Windows setup guide uses standalone XMRig v6.26.0, which is both Ember's current pin and the latest official upstream release checked on that date. This is a dated research result, not a permanent version recommendation; see `docs/m08-xmrig-windows-setup-research.md`.

## Audience and positioning

Serve curious Windows users who want to understand Monero CPU mining, and existing miners who want focused setup or troubleshooting context. Position Ember as **Monero mining for normal humans**: a guided desktop product at the centre of an independent, technically careful knowledge platform. Explain costs, uncertainty, setup and control without hype.

## Website goals

1. Present Ember accurately and establish release status.
2. Teach useful Monero, RandomX and XMRig concepts with authoritative sourcing.
3. Give readers a useful next step for setup and troubleshooting.
4. Build trust through visible scope, provenance, limitations and corrections.
5. Leave room for calculators and original hardware data only when the underlying inputs exist.

## Content pillars

- **Learn:** core concepts, measurements, network mechanisms and mining terminology.
- **Guides:** careful, reproducible setup and operational workflows.
- **Troubleshooting:** symptom-led diagnosis, safe Windows guidance and clear uncertainty.
- **Tools:** transparent calculators and local helpers with explicit inputs and assumptions.
- **Hardware:** eventual opt-in, reproducible CPU profiles and benchmark methodology; no generated hardware claims.
- **Ember trust:** implementation status, data boundaries, XMRig provenance, contribution policy and release notes.

## Information architecture

| Route | Purpose |
| --- | --- |
| `/` | Product story, conceptual flow and knowledge-platform entry |
| `/ember/` | Product overview and development/release status |
| `/learn/` | Monero mining concepts |
| `/guides/` | Practical walkthroughs |
| `/troubleshoot/` | Evidence-led issue diagnosis |
| `/tools/` | Available transparent calculators and local helpers, with future concepts clearly labelled |
| `/trust/` | Current safeguards, boundaries and open work |
| `/features/`, `/download/`, `/how-it-works/`, `/hardware/`, `/glossary/` | Later routes when enough verified content exists; do not ship thin placeholders |

## Stack decision

Use Astro 7 static output with TypeScript. The repo has no website framework to reuse; its existing React/Vite configuration belongs to the desktop app and stays untouched. Astro keeps ordinary pages static, supports content collections/Markdown as the site grows, and allows React integration later only for genuinely interactive tools. This foundation uses no React hydration. The site has an isolated `website/package.json`; Cloudflare Pages can deploy the static `dist/` output. Current Astro installation requirements and version were checked against [official Astro docs](https://docs.astro.build/en/install-and-setup/) and [upgrade docs](https://docs.astro.build/en/upgrade-astro/) on 5 October 2026.

## Design principles

- Graphite surfaces, warm ember accents, restrained glow, editorial typography and precise instrumentation details.
- Product UI is an original CSS composition based on repository terminology and is labelled as an illustrative preview, never live data.
- Clear hierarchy and generous readable type; a restrained component/token vocabulary; no crypto clichés, stock dashboards or fabricated numbers.
- Semantic landmarks, keyboard focus, reduced-motion support, visible labels and responsive layouts.
- Static HTML first; minimal assets and no client-side runtime for the initial routes.

## Trust requirements

- Distinguish implemented behaviour, product direction and open work in wording and visual treatment.
- Never imply public downloads, verified production mining, profitability, live user telemetry, wallet custody, pool endorsement or independent security certification without evidence.
- State whether examples and estimates are illustrative. Future tools must expose assumptions and uncertainty.
- Link claims to repository/source evidence; date material security/status claims and maintain a correction path.
- Do not imply that local software is tamper-proof or that a public receiving address is a signing secret.

## SEO principles

- One intent per page, descriptive titles, original descriptions, readable stable paths and useful internal links.
- Static semantic HTML, canonical URLs and social metadata; sitemap/robots use configurable `SITE_URL` (example fallback is `https://example.com`). Configure the confirmed production origin before deployment.
- No keyword stuffing, thin generated pages, fake reviews, ratings, FAQs or benchmark pages. Add Article schema only alongside real sourced articles; no software ratings or review markup.
- Build useful topic coverage and source notes before pursuing volume. Measure crawl/index quality and accessibility/performance before expansion.

## Claims needing future verification

- Owner acceptance of Stop/Quit across current release candidates, compatibility beyond the verified Windows x64 path and supported real-world telemetry boundaries.
- Public release availability, supported Windows baseline, distribution/license obligations and security-product behaviour on clean machines.
- Final contribution rate/mechanism/auditability, any net-revenue or profitability claims, measured wattage, earnings and pool/share support.
- Benchmarks across CPUs, power draw, temperatures, efficiency, security certification, contribution statistics or user testimonials.

