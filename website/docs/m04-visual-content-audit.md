# M04 visual and content audit

## Scope

Reviewed the 12 rendered site routes: `/`, `/ember/`, `/learn/`, `/learn/randomx-memory-cache/`, `/learn/xmrig-cpu-threads/`, `/guides/`, `/troubleshoot/`, `/troubleshoot/xmrig-huge-pages/`, `/troubleshoot/xmrig-low-hashrate/`, `/troubleshoot/xmrig-msr-error/`, `/tools/`, and `/trust/`. Also reviewed generated `robots.txt`, `sitemap.xml`, shared header/footer, and site-wide navigation.

## Findings and changes

| Route | Finding | M04 treatment |
| --- | --- | --- |
| `/` | Strong hero, but principles were text-led and the mining flow could blur Ember with XMRig. | Kept the hero animation and product preview; added icon-led principles and a labelled flow separating pool coordination, Ember supervision, XMRig, and CPU work. |
| `/ember/` | Product feature and status sections were mostly text; release state must remain clear. | Preserved the product explanation and explicit in-development status; reused the static icon language in the product preview. |
| `/learn/` | Published and planned resources needed clearer distinction and a visual relationship map. | Added the memory → CPU cache → threads map, article identity icons, readable category metadata, and explicit non-linked Planned states. |
| `/learn/randomx-memory-cache/` | Three different memory layers were easy to conflate in prose. | Added a labelled hierarchy visual and “Keep these separate” callout; the figure states that it is conceptual and not to scale. |
| `/learn/xmrig-cpu-threads/` | Logical processor count could be mistaken for a useful worker target. | Added a finite shared-cache workspace diagram and a “What this means” callout; the illustration labels its processor count as an example. |
| `/guides/` | Planned topics could read like available walkthroughs; the card group had little sequence. | Added prepare → configure → review landmarks and non-interactive cards labelled Planned. |
| `/troubleshoot/` | Diagnostic order and future versus published topics were not immediately visible. | Added observe → narrow → verify landmarks; published articles link normally and future topics show Planned without hrefs. |
| `/troubleshoot/xmrig-huge-pages/` | Permission and allocation states needed stronger separation; long guidance needed landmarks. | Added fragmented-versus-large mapping and permission → allocation → work diagrams, a quick check callout, and a numbered diagnostic path. |
| `/troubleshoot/xmrig-low-hashrate/` | Several possible causes needed a scannable overview before the longer checklist. | Added an explicitly non-diagnostic cause map, a baseline-comparison callout, and a numbered check order. |
| `/troubleshoot/xmrig-msr-error/` | The CPU preset and Windows access boundary needed a clear visual; security caveats matter. | Added a guarded-access diagram and “Safe to ignore?” callout; no manual register values or guaranteed performance claims are shown. |
| `/tools/` | Planned utilities risked looking like active calculators. | Added an input → measurement → output instrument motif, explanatory “not active calculators” language, and non-linked Planned cards. |
| `/trust/` | Evidence ledger intentionally repeats a text-first format; diagrams could imply unsupported guarantees. | Kept evidence entries plain and scannable; no decorative diagram was added. |

## Link and status review

The static output checker now scans every generated HTML page for empty, fragment-only, `javascript:`, and `data:` links; resolves same-site paths and fragments; checks unique titles/descriptions/canonicals and valid JSON-LD; and confirms the sitemap only references built canonical routes. Planned cards intentionally have no destination until their content exists. The shared footer links to the third-party notices for Phosphor.

The guides/tools “planned” resources are not broken links: they are non-interactive cards with explicit status. Published cards link to their static article routes. Generated route/link verification is run with `npm run check:links`.

## Responsive and accessibility review

Added narrow-screen layouts for hub visuals and article diagrams, single-column resource cards, and stacked status/diagram paths. The global reduced-motion rule remains in place. Decorative icons use `aria-hidden`; explanatory figures have labels and captions; published cards are keyboard-focusable links; planned cards are not presented as links.

Reviewed every rendered route at 1440, 1280, 1024, 768, 600, and 390 CSS pixels in the local browser. A document/body and descendant-right-edge sweep found no horizontal overflow at those widths. Also inspected the 390px Huge Pages article view: the comparison, process path, and callout stack instead of shrinking into unreadable columns. The site uses 900px, 680px, and 420px layout breakpoints. The browser viewport sweep checks layout geometry; it does not replace manual review on physical devices.

## Deferred

- The site remains a static editorial site; no active mining controls, calculators, or downloads were introduced.
- No new product claims or unverified performance figures were added.
- Add routes to the published-resource cards only when the corresponding content is actually built.
