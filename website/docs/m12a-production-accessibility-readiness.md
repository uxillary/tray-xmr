# M12A — Production, accessibility and release readiness

## Scope and audit baseline

- Track: Ember public website only. Desktop application source was read-only and was not edited.
- Audited branch/commit: `main` / `040a3ca02363549694cfca677db781d83b710707`.
- The initial working tree already contained M11A/M11B edits, untracked M11A/M11B documents and source changes. Those were preserved. M12A files and changes are under `website/`.
- Site commands: `npm run dev`, `npm run build`, `npm run preview`, `npm run check`, `npm run check:links`, `npm test`.
- Static build has 17 routes. Local origin defaults to `http://localhost:4321`; previously release URLs fell back to `https://example.com`.

## Verified pass

### Origin contract and deployment setup

`src/lib/site-origin.mjs` centralizes URL validation. Development uses the configured URL or localhost. A release build requires explicit `SITE_URL`, HTTPS, and an origin only (no credentials/path/query/fragment); example.com and subdomains are rejected. `astro.config.mjs` reads the standard `.env` files and process environment, with the environment taking precedence. No production domain was documented as confirmed, so none was invented.

For the existing Cloudflare Pages static hosting assumption, configure `SITE_URL` in the Pages Production environment to the confirmed canonical HTTPS origin. Configure a distinct confirmed Preview origin if preview deployments need accurate metadata. The project root is `website/`, build command `npm run build`, output `dist/`. These settings have not been applied in Cloudflare and no deployment or DNS change was made. See `README.md` for PowerShell commands to build and verify before release.

### Generated metadata

`npm run verify:production-origin` passed against synthetic `https://ember-m12a.invalid`: 17 static routes checked for canonical and Open Graph URLs, social image URLs, Article/Breadcrumb JSON-LD URLs, sitemap locations, robots sitemap reference, slash consistency and absence of example.com/localhost absolute URLs. The synthetic origin verifies generation only; it says nothing about live DNS, TLS, redirects or indexing.

The release build with `SITE_URL` unset failed as intended and printed configuration guidance. The synthetic-origin build succeeded. Existing static route count remained 17.

### Accessibility methods and changes

Methods: source/semantic contract tests, inspection of shared layouts and tool markup/styles, and WCAG relative-luminance contrast calculations for specified CSS color pairs. This was not a full conformance audit or certification.

Confirmed defects fixed:

- Form/input/textarea boundaries were below 3:1 on their adjacent surfaces. `--line-bright` is now `#686b61`; measured ratios are 3.52:1 on `#0e100d`, 3.46:1 on `#10120f`, and 3.23:1 on `#171a16`.
- Decoder placeholder `#77796f` measured 4.26:1 against `#10120f`; placeholders now use `--subtle` (`#8e9486`), measured 5.99:1 on `#101310` and 4.98:1 on the lighter `#22251f` surface.
- Inline content links lacked a persistent visual distinction; article/tool links are underlined.
- Calculator labels included long help/unit copy in their accessible names. Explicit concise labels now target each input; descriptions remain separately associated. Validation messages are polite live regions, and the decoder retains its input/error/status semantics and result focus target.

Measured specified foreground/background pairs (WCAG contrast ratio):

| Pair | Ratio |
| --- | ---: |
| Primary text `#eeefe9` / `#111310` | 16.15:1 |
| Body text `#c3c7bc` / `#111310` | 10.86:1 |
| Muted text `#a1a69a` / `#22251f` (lowest measured surface) | 6.24:1 |
| Subtle text/placeholder `#8e9486` / `#22251f` | 4.98:1 |
| Ember orange `#ef8a4a` / `#111310` | 7.47:1 |
| Article link `#e76d3a` / `#111310` | 5.91:1 |
| Error `#ffad91` / `#0e100d` | 10.59:1 |
| Decoder error `#f0a078` / `#10120f` | 8.97:1 |
| Positive output `#a4c995` / `#121410` | 10.03:1 |
| Warning output `#e4a267` / `#121410` | 8.53:1 |
| Focus ring `#ffb47e` / `#0e100d` | 11.00:1 |
| Primary button text `#16130f` / orange button `#ef8a4a` | 7.41:1 |

These calculations apply to the listed solid colors, not every pixel on gradients, overlays, images or every state. Disabled controls were not independently measured. The 4.98:1 placeholder result exceeds the 4.5:1 normal-text threshold; the 3.23–3.52:1 control boundaries exceed the 3:1 non-text indicator threshold for the measured pairings.

Automated semantic tests cover the shared skip link, named nav landmarks/main target, tool labels/help/error references, live validation messages, decoder status and result focus target. They do not operate a keyboard or assistive technology.

## Verified failure

None in the final automated verification. A release build without `SITE_URL` intentionally fails, as required by the release contract.

## Not tested

- No real screen reader/browser combination was operated. Do not treat the semantic tests as manual screen-reader results.
- No manual keyboard session was completed: actual tab order, focus rendering, select/radio interaction, error recovery and focus after tool submission remain unverified.
- No 200% or 400% browser zoom test was completed.
- No rendered viewport was inspected in this M12A pass. Requested widths 1440, 1280, 1024, 768, 600, 390 and 360px are all unverified. Desktop and mobile reflow, nav behavior, tables/diagrams and tool output clipping need owner/browser QA.
- No production deployment, live robots response, redirect/TLS/DNS check or indexing status was tested.

## Preview diagnosis — blocked

Attempts used existing scripts, without changing production networking:

- `npm run dev -- --host 127.0.0.1 --port 4323 --strictPort`: Astro did not report a ready address during the attempt; browser navigation returned `net::ERR_CONNECTION_REFUSED`.
- `npm run dev -- --host localhost --port 4325 --strictPort`: Astro reported ready at `http://localhost:4325/`, then logged `Failed to create the dev server app: require is not defined`. The subsequent Astro check exposed the stack in `source-map-js/lib/source-map-generator.js` through Vite's module runner. Removing the `astro/config` `defineConfig` wrapper and exporting the plain config removed that startup error; `npm run check` then completed cleanly.
- `npm run preview -- --host localhost --port 4326 --strictPort` with the synthetic-origin static build reported ready, but the in-app browser timed out. Browser attempts to the fresh localhost/127.0.0.1 preview endpoints did not produce a rendered page. Earlier M11B history records port 4321 collision and a successful browser render at that pre-existing listener, whose identity/build could not be confirmed.

The best-supported explanation is two separate issues: a Vite/Astro config-loader `require` failure (addressed by the config export change), and a browser-to-fresh-local-process reachability limitation that remains. The available evidence does not distinguish browser sandbox isolation from IPv4/IPv6 routing, nor prove that any timeout means a website defect. No shell HTTP success is claimed for this pass. A static build succeeding is not successful HTTP or browser access.

## Blocked

Rendered visual QA and interactive browser verification remain blocked by local preview/browser connectivity. No repeat attempts against the same failed endpoint were made after the preview test.

## Owner action

1. Set the confirmed public HTTPS origin as Cloudflare Pages Production `SITE_URL`; set the approved Preview origin separately if needed.
2. Run `npm run build` and `npm run verify:production-origin` with the exact release variable, then review output before deployment.
3. After deployment, verify canonical host, HTTPS, redirect behavior, sitemap and robots over the public origin; check indexing separately in the search-console account.
4. Run visual QA at all seven requested widths, test horizontal overflow and interactions, then perform keyboard and 200%/400% zoom review.
5. Operate a named screen reader with a named browser/version and record results for landmarks, headings, forms, errors, results, tables and diagram equivalents.

## Verification results

- `npm test` — passed, 29/29.
- `npm run check` — passed, 46 Astro files, 0 errors, 0 warnings, 0 hints.
- `npm run build` — passed with `SITE_URL=https://ember-m12a.invalid`, 17 static routes.
- `npm run verify:production-origin` — passed, 17 static routes.
- `npm run check:links` — passed; build plus 17-page content/link/metadata verification.
- Build without `SITE_URL` — failed as expected with release-origin guidance.
- `git diff --check` — recorded after final cleanup below.

## Recommended next milestone

M12B should complete browser-rendered responsive, keyboard and assistive-technology QA, then verify the confirmed production origin after deployment. M12A stops here; it does not claim release, indexing or full accessibility certification.

