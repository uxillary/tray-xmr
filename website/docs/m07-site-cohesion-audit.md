# M07 site cohesion audit

Reviewed 7 October 2026 before implementation changes. The review covered all 14 public routes, page and hub components, all five published technical resources, both tools, shared and route-level styles, content schema/loader, site metadata, robots, sitemap, static verification, and M02–M06 design/content decisions. Rendered page checks covered all route types and responsive widths; the detailed browser sweep is recorded in the M07 integration report.

## Route inventory and journeys

| Route | Actual purpose |
| --- | --- |
| `/` | Product positioning and entry to the knowledge platform |
| `/ember/` | Product role, current foundation, release status |
| `/trust/` | Product safeguards and unresolved release work |
| `/learn/` | Published concept explanations plus clearly planned topics |
| `/learn/randomx-memory-cache/` | RandomX memory and cache concept guide |
| `/learn/xmrig-cpu-threads/` | CPU thread selection explanation |
| `/guides/` | Planned task-oriented walkthroughs; no guide is misrepresented as published |
| `/troubleshoot/` | Symptom-led diagnostics and published troubleshooting resources |
| `/troubleshoot/xmrig-huge-pages/` | Windows Huge Pages status and checks |
| `/troubleshoot/xmrig-msr-error/` | MSR meaning and safe checks |
| `/troubleshoot/xmrig-low-hashrate/` | Ordered performance investigation |
| `/tools/` | Available tools and honestly marked planned concepts |
| `/tools/electricity-cost-calculator/` | Locally calculated energy/cost estimate |
| `/tools/xmrig-log-decoder/` | Local, bounded XMRig 6.26.0 signal interpretation |

The product journey is clear from the homepage to Ember and Trust. Learning and troubleshooting journeys work through article body links and related reading. The calculator has a transparent methodology and links to the RandomX memory guide. Decoder-to-guide links work, and the Troubleshoot hub exposes the decoder, but individual diagnostic articles do not yet offer that tool at the point where a reader has a log excerpt. Search arrivals receive breadcrumbs, a product-status context note and article-specific follow-on links.

## Strongest existing strengths

- Ember is named and explained in the homepage hero, with “in development / no public release yet” visible before the primary action.
- The conceptual flow correctly separates Monero, a pool, XMRig's mining work and Ember's process supervision. The product preview is explicitly illustrative and says it contains no live data.
- Product and Trust pages distinguish implementation from unresolved production mining and release verification. XMRig, public-address handling, inactive contribution and unsupported claims have careful boundaries.
- Learn articles teach concepts; troubleshooting articles start with a symptom and ordered checks; the guide hub labels its pathways as planned; tools expose assumptions and bounded behavior.
- Technical diagrams explain memory layers, permissions, threads and diagnostic paths. Long-form pages include source notes, related links, breadcrumbs and a restrained “About Ember” context for search arrivals.
- Static metadata, canonical URLs, sitemap, robots, local assets, semantic landmarks, visible focus, reduced-motion handling and route-specific lightweight scripts are already present.
- The homepage hero, product preview and hero motion form a distinctive entry point. They remain effective and should be preserved.

## Findings by priority

### P0 — None found

No broken public routes, false download CTA, server-side tool processing, broken in-scope internal link, or severe shared accessibility regression was found in the audit.

### P1 — Fix in M07

1. **The Tools catalogue counts future decoder coverage as a separate planned tool.** “Broader XMRig log coverage” is an enhancement to the existing decoder and inflates the catalogue. Keep future expansion in decoder documentation and remove the card.
2. **The decoder is not linked from the troubleshooting articles where its supported signals are useful.** The hub link is discoverable, but readers who land directly on Huge Pages, MSR or low-hashrate guidance have no contextual path from the article to the bounded local decoder. Add only relevant, scope-qualified links.

### P2 — Worthwhile polish

1. The homepage's discovery area links Learn, Guides and Troubleshoot but omits the existing Tools hub. A compact text link can surface the two useful instruments without adding a fourth card or another bordered panel.
2. The calculator explains its method and links to a RandomX concept, but has no discreet path to Ember's current product/release context. A short, optional “About Ember” link is relevant to visitors evaluating the software around which the estimate is intended to help.
3. The six primary navigation items are all useful; at narrow widths the navigation wraps into a horizontally scrollable second row. Browser checks showed no page overflow and visible labels. Preserve this rather than adding a menu or collapsing a small, complete hierarchy.

### Deferred

- The Guides hub has no published walkthroughs yet. This is clearly stated and matches current unverified product behavior; publish a reproducible guide when its general XMRig steps and Ember-specific steps can be separated.
- Article endings use a fixed product context note plus meaningful related articles. Although the product note repeats, it helps search visitors identify the publisher and accurately states release status. Keep the pattern; add tool links only where the diagnostic relationship is real.
- No real desktop screenshots are present in `website/public/`. The hand-built product preview is accurately labeled and remains useful while the desktop UI and production flow are still being verified. Do not replace it with fabricated media.
- No evidence supports adding new search-intent routes, schema types, analytics, broader privacy claims, a new tool, or a new article cluster.

## Things not to change

- Preserve the homepage hero and its existing motion; audit inspection found no concrete defect.
- Preserve the established route hierarchy and URLs, shared navigation/footer, technical visual vocabulary, contextual article diagrams, and honest non-interactive Planned states.
- Preserve the static-first architecture, local-only tool behavior, XMRig version boundary, and distinction between desktop product privacy and browser-tool privacy.
- Do not add release/download CTAs, testimonials, benchmark claims, product screenshots, signup flows or blanket product ads to educational pages.

## SEO, trust and accessibility review

Public titles/descriptions are distinct and descriptive. Every route uses shared canonical/Open Graph metadata; the five published technical resources have source/date metadata and TechArticle/BreadcrumbList data; sitemap includes the static pages and non-draft articles; robots points to that sitemap. Internal article relationships resolve through the schema and static checker. Planned hub topics are not links to nonexistent destinations.

The tools' privacy claims are local to their implementations: the calculator does not call a backend, and the decoder processes text in memory without upload, URL state or browser-storage persistence. The website has no analytics or remote script in its implementation. Keep these claims specific rather than implying the website and desktop app have identical data flows. Keyboard focus, native inputs/buttons, headings, accessible labels, text severity states, reduced-motion CSS and responsive diagrams are established. This was not a formal WCAG conformance audit.
