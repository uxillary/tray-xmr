# M07 — Site cohesion and integration

## Changes implemented

- Removed “Broader XMRig log coverage” from the Tools catalogue. It was decoder expansion, not a separate planned tool; further signatures remain an evidence-led decoder enhancement documented under M06.
- Added a small, unboxed link from the homepage's Learn/Guides/Troubleshoot discovery area to Tools, completing discovery of the four reader functions without adding another card.
- Added a concise relationship note on the Ember page connecting product decisions to the site's concept, troubleshooting and tool resources.
- Linked the local XMRig Log Decoder contextually from Huge Pages, MSR and low-hashrate troubleshooting articles. Each link names the supported scope and limits; no claim suggests it diagnoses root causes or analyzes hashrate.
- Added an optional Ember product-status link in the calculator's mining-cost context. The calculator's methodology and RandomX concept link remain primary.
- Updated the current strategy/roadmap descriptions so Tools is represented as two available tools and the electricity calculator/decoder are not still described as future work.

## Reasoning and audit outcomes

The M07 audit found no P0 correctness, trust or accessibility issue. The two P1 improvements were catalogue duplication and missing contextual article-to-decoder paths. The smaller P2 improvements improve discovery and product/resource understanding without adding a new grid, route, banner, script or tool. The other P2 observation (the compact, wrapped mobile nav) was resolved by inspection: all six links remain labeled and visible/scrollable, with no document overflow, so it was left in place.

The site contains 14 public routes: homepage; Ember; Trust; four hubs; five published technical resources; and two tools. Hub purposes remain distinct: Learn explains, Guides plans reproducible tasks, Troubleshoot starts from a symptom, and Tools calculates or inspects. Planned guide topics remain clearly labeled because no verified walkthrough is ready.

## Navigation, internal links and product relationship

The six-item global navigation and stable URLs were retained. The homepage now surfaces Tools in a plain sentence/link below the three learning/journey cards, keeping visual hierarchy and card count intact. The product page now explicitly connects the desktop project's decisions to independent learning, troubleshooting and tool resources. Search-entry article context is retained.

The decoder is linked only where its supported startup, Huge Pages, MSR, pool and share signal contract helps interpret an excerpt. Its articles continue to link to explanatory guides and do not imply that the tool understands unknown lines. The calculator receives a product-status link because electricity estimates are a decision people may make while considering a mining manager; its measured-input methodology remains the focus.

## Catalogue, visual hierarchy and calls to action

The available calculator and decoder remain first-class tools. Hashrate conversion and CPU scenario estimates remain planned; broadening decoder signatures is no longer shown as a separate tool. The catalogue now represents two available and two planned concepts. No planned card links to a nonexistent route.

The M07 additions use text links in existing sections and add no new bordered surface, visual diagram, card grid or global/client-side script. The homepage hero, animation, product preview, existing story diagrams, navigation wording, repeated article product context, and article endings remain unchanged. Existing Explore Ember, Trust, tool and guide actions match current release state; no download, signup, benchmark or user-count CTA was introduced.

## Product truth, privacy, accessibility and SEO

Product and Trust release claims remain unchanged: no public download; owner-machine mining verification and release readiness remain open; contribution is inactive. Tool-specific privacy remains stated at each tool, where the implementation proves it. No site-wide analytics, backend, client framework, or tool-data persistence was added. The generic local-tool relationship note does not broaden the app's telemetry claims.

Existing canonical, sitemap, robots, titles, descriptions, schema, landmarks, focus behavior, reduced-motion rules and keyboard controls were reviewed. Internal links added here use meaningful anchor text and resolve to existing stable routes. No metadata/schema rewrite or keyword-driven page was justified.

## Deliberate non-changes and deferred opportunities

- No P0 issues or release-status inaccuracies were found, so no Trust or product-status copy was changed.
- No URL, global navigation item, or hub purpose was changed.
- The mobile nav wraps into a second row and can scroll horizontally; it remains usable and did not cause overflow, so no replacement menu was warranted.
- The repeated “About Ember” context on technical articles supports direct search arrivals; the meaningful related-article links remain. Tool links were added selectively rather than as a generic related-content grid.
- No current real desktop screenshots are in the website assets. Keep the labeled interface illustration until stable, scrubbed product screenshots can be approved in a future media milestone.
- No new article batch, tool, route, framework, analytics, backend, screenshot or broader XMRig parser contract was added.

## Verification and recommended next milestone

Verification completed after implementation: 12 tests passed; `npm run check` reported 0 errors, 0 warnings and 0 hints; `npm run build` generated all 14 pages; and `npm run check:links` verified canonical URLs, JSON-LD, local links, published article content and sitemap entries. `git diff --check` passed. Browser QA covered all 14 routes at 1440, 1280, 1024, 768, 600 and 390 pixels (84 route/width combinations) with no document overflow; shared navigation and representative desktop/mobile pages were inspected. The decoder and calculator interactions were exercised in-browser. No physical-device testing was performed. The decoder client bundle remains 6,420 bytes; M07 adds no client-side script. All source/document changes are limited to `website/`.

**Primary M08 recommendation: publish one carefully sourced Windows XMRig setup guide**, clearly separating general miner instructions from Ember-specific behavior and explicitly noting that Ember has no public release. The Guides hub currently contains only planned themes; a single reproducible, safe guide is a concrete reader gap already identified by the roadmap and better supported than speculative traffic-driven expansion.

Secondary options, ranked:

1. **Real product media pass**, after the desktop UI and Start → Mining → Stop behavior are stable and genuine scrubbed captures exist. No suitable current assets are present now.
2. **Decoder evidence/coverage review**, using exact v6.26.0 source signatures and suitably redacted examples before expanding beyond its current narrow contract.
3. **A focused search/content cluster**, only after reader evidence or an editorial gap identifies a useful next concept; current sources do not justify keyword-led expansion.
