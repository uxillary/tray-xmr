# M09B.2 — Browser Preview Reliability & Final Visual QA

## Scope

This pass covers the public website in `website/`. The desktop application was not changed. Existing working-tree edits were preserved.

## Preview access diagnosis

- Project scripts: `npm run dev` runs `astro dev`; `npm run preview` runs `astro preview` (port defaults to Astro's 4321 unless occupied).
- Startup command attempted: `npm run dev -- --host 127.0.0.1` from `website/`.
- Astro reported `http://127.0.0.1:4321/`, but its terminal output later included `Failed to create the dev server app: require is not defined`. HTTP to `127.0.0.1:4321` timed out; the sandboxed HTTP attempt was denied socket access.
- `http://localhost:4321/` returned HTTP 200 (108,808 bytes) when tested outside the sandbox. The listening endpoint was `[::1]:4321`, owned by an already-running `astro.mjs dev` process. `localhost` therefore reached the IPv6 loopback listener while `127.0.0.1` did not return a response.
- The in-app browser rendered the site at `http://localhost:4321/` and successfully opened all requested routes. This confirms the browser can reach the existing IPv6 localhost development server; HTTP success and browser rendering were both verified.
- The best-supported explanation for earlier preview timeouts is a loopback address/binding mismatch (or the local browser/server environment changing between attempts), not a broken website. The evidence does not establish why the pre-existing server was already running. The explicit IPv4 server started for this check was stopped; the pre-existing server was left alone.
- No production configuration or dependencies were changed. No confirmed website defect was found at the inspected viewport, so no source fix was warranted.

## Rendered inspection

The in-app browser content viewport was **506 × 833 CSS px**. Its controls did not expose viewport resizing or emulation, and another installed desktop browser was unavailable. Consequently, the requested widths **1440, 1280, 1024, 768, 600, 390 and 360 px were not individually inspected**. This one available width is not a substitute for that matrix.

At 506 px, the following pages were rendered and inspected:

- `/` — hero hierarchy, actions, product preview and animation rule (`signal-pass`, 3.8 seconds); no horizontal document overflow.
- `/ember/` — product journey and conceptual architecture diagram; the architecture stacks vertically and remains readable at this width.
- `/trust/` — trust framing and product-status copy.
- `/tools/electricity-cost-calculator/` — input layout, visible focus outline, and live result. With 100 W, 24 hours/day, 30 days and a rate of £0.30/kWh, the page updated to £0.72/day, £21.60/30 days and £262.80/365 days.
- `/tools/xmrig-log-decoder/` — pasted a sample accepted-share line and verified a “Share accepted” diagnostic, count summary and focus moving to the results heading.
- `/guides/` and `/guides/xmrig-windows-setup/` — hub and representative technical article typography and content hierarchy.
- The homepage footer was also inspected at the available width.

Across these routes, `document.documentElement.scrollWidth` was 491 px within the 506 px viewport (the remaining difference is the scrollbar); no horizontal overflow was observed. The navigation links remained visible at this width. A distinct collapsed mobile menu was not present in the inspected state. The homepage animation's CSS rule and duration were verified; the browser runtime did not expose `document.getAnimations()`, so frame-by-frame animation playback was not measured.

## Defects and fixes

- Confirmed visual defects: none at 506 px.
- Fixes made: none. The preview connectivity issue was environmental and did not justify a website code or production configuration change.

## Remaining unverified items and limitations

- Layouts at the seven requested viewport widths, including the exact 360–390 px mobile states and desktop widths, remain unverified.
- Mobile menu behavior at those widths, contrast measurements, keyboard-only navigation through every page, and calculator/decoder validation and reset cases were not exhaustively checked.
- No deployed site URL was configured and confirmed for this checkout, so no deployment was inspected.
- The `127.0.0.1` HTTP failure and the startup `require is not defined` message were specific to the attempted IPv4-bound dev process. The usable browser preview was the already-running `[::1]:4321` listener.

## Verification

- `npm test` — passed, 12 tests.
- `npm run check` — passed, 38 Astro files; 0 errors, 0 warnings, 0 hints.
- `npm run build` — passed, 15 static pages generated.
- `npm run check:links` — passed; verified 15 static pages, canonical URLs, JSON-LD, local links, article content and sitemap entries.
- `git diff --check` — passed with no whitespace errors. Git printed line-ending conversion warnings for existing modified working-tree files.
