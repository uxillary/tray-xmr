# M12A — Responsive, accessibility and production readiness

## Scope and baseline

- Website track only; desktop application is read-only and was not modified.
- Branch/HEAD: `main` / `040a3ca02363549694cfca677db781d83b710707`.
- The starting working tree contained existing M11A/M11B website changes and untracked milestone documents. These were preserved.
- Astro uses static output and currently generates 17 routes. No confirmed production domain is recorded.

## Preview process and evidence

**PASS — strict current-build server startup.** The static output was built with `SITE_URL=https://ember-m12a.invalid`. Started `npm run preview -- --host 127.0.0.1 --port 4327 --strictPort`; Astro 7.3.5 reported ready at `http://127.0.0.1:4327/`. Strict port selection means this run would fail rather than move to a different port.

**ENVIRONMENT BLOCKED — HTTP/browser reachability and listener identity.** `Get-NetTCPConnection -LocalPort 4327 -State Listen` exposed no listener; PowerShell `Invoke-WebRequest` to the same loopback URL failed with Windows socket permission error (“An attempt was made to access a socket in a way forbidden by its access permissions”). The in-app browser timed out at `http://127.0.0.1:4327/`. Therefore startup output is not proof that HTTP was served to an independent client, and no rendered current-build browser inspection is claimed. The preview process was stopped after this one controlled attempt.

**Earlier observations kept distinct:** M11B noted port 4321 was occupied, Astro selected 4322, and the browser could render the pre-existing 4321 listener but its identity/build was not confirmed. During M12A, a dev attempt reported `require is not defined` from Vite's module runner while loading Astro config. Exporting the plain config object instead of wrapping it with `defineConfig` removed that startup error; Astro check then passed. A static preview still timed out in the browser, so that separate network issue remains. Available process/socket permissions do not establish IPv4/IPv6 listener ownership or prove whether browser sandbox isolation is the cause. No website runtime defect is established by the timeouts.

### Owner-side preview procedure

From `website/`, build the desired output with the correct origin (`$env:SITE_URL='https://your-confirmed-domain.tld'; npm run build` in PowerShell). Start `npm run preview -- --host 127.0.0.1 --port 4327 --strictPort`. Confirm the displayed URL and port, then use a browser on the same machine. If the browser cannot connect, check local firewall/endpoint policy and whether the preview process is listening on that address/port. Do not treat an unrelated listener as the current build; stop the preview process after testing.

## Responsive test matrix

No viewport below was rendered in this M12A environment. CSS/source inspection is not counted as visual QA.

| Width | Status | Rendered pages / result |
| ---: | --- | --- |
| 1440px | NOT VERIFIED | Browser could not reach preview |
| 1280px | NOT VERIFIED | Browser could not reach preview |
| 1024px | NOT VERIFIED | Browser could not reach preview |
| 768px | NOT VERIFIED | Browser could not reach preview |
| 600px | NOT VERIFIED | Browser could not reach preview |
| 390px | NOT VERIFIED | Browser could not reach preview |
| 360px | NOT VERIFIED | Browser could not reach preview |

Homepage, Ember product page, Guides/Troubleshoot/Tools hubs, all three tools, Huge Pages guide, Windows security-warning guide and Trust page were not visually inspected in this pass. Horizontal overflow, navigation/footer wrapping, text clipping, touch targets, tables/code, SVG diagrams, result panels and actual focus visibility remain NOT VERIFIED. No intentional table overflow was visually assessed.

**Zoom:** 200% and 400% are NOT VERIFIED because rendered browser access was unavailable.

## Accessibility QA

### Keyboard — NOT VERIFIED manually

No complete manual keyboard session was possible. Tab order, focus visibility in the rendered page, skip-link activation, navigation, select/radio controls, error recovery and results interaction remain owner QA items. Source-level checks and CSS inspection do not establish keyboard behavior.

Automated semantic contract tests PASS for the shared skip link, named navigation landmarks and main target; concise tool labels and help/error associations; live validation announcements; and decoder status/results focus target.

### Screen readers — NOT VERIFIED

No real screen reader was available/operated, so no assistive technology, browser or version can be reported. Automated markup checks do not substitute for testing page titles, heading hierarchy, landmarks, labels, descriptions, error/result announcements, tables or diagram alternatives with a screen reader.

### Measured contrast

Ratios were calculated from the specified solid CSS foreground/background colors using the WCAG relative-luminance contrast formula. These values do not describe every gradient, overlay, image or interaction-state pixel.

| Element and colors | Ratio | Result against applicable threshold |
| --- | ---: | --- |
| Primary text `#eeefe9` / `#111310` | 16.15:1 | PASS, normal text ≥4.5:1 |
| Body text `#c3c7bc` / `#111310` | 10.86:1 | PASS |
| Muted text `#a1a69a` / `#22251f` (lowest measured surface) | 6.24:1 | PASS |
| Subtle text/placeholder `#8e9486` / `#22251f` | 4.98:1 | PASS |
| Ember orange `#ef8a4a` / `#111310` | 7.47:1 | PASS |
| Article link `#e76d3a` / `#111310` | 5.91:1 | PASS |
| Error `#ffad91` / `#0e100d` | 10.59:1 | PASS |
| Decoder error `#f0a078` / `#10120f` | 8.97:1 | PASS |
| Positive result `#a4c995` / `#121410` | 10.03:1 | PASS |
| Warning result `#e4a267` / `#121410` | 8.53:1 | PASS |
| Focus indicator `#ffb47e` / `#0e100d` | 11.00:1 | PASS |
| Input boundary `#686b61` / `#0e100d` | 3.52:1 | PASS, UI indicator ≥3:1 |
| Input boundary `#686b61` / `#10120f` | 3.46:1 | PASS, UI indicator ≥3:1 |
| Secondary button boundary `#686b61` / `#171a16` | 3.23:1 | PASS, UI indicator ≥3:1 |
| Button text `#16130f` / orange `#ef8a4a` | 7.41:1 | PASS |

Disabled controls were not separately measured; do not interpret their omission as a failure where the WCAG exception applies. This focused color-pair audit is not full WCAG conformance certification.

## Defects found and fixed

- **PASS — contrast:** form and textarea borders were below 3:1 against adjacent surfaces; the brighter line token now measures 3.23–3.52:1 on measured surfaces. Decoder placeholder contrast was 4.26:1 and now uses the subtle token (4.98:1 on the lighter measured surface).
- **PASS — non-color link cue:** article/tool inline links are underlined.
- **PASS — form names and errors:** calculator fields have concise explicit labels, separately associated help/error descriptions and polite live error regions. The decoder retains explicit label/error/status semantics.
- **PASS — focus styling in source:** the shared focus ring is specified as 2px `#ffb47e`; rendered keyboard visibility remains NOT VERIFIED.

No design redesign or calculator formula change was made. Existing calculator reference-model tests remain part of the test suite.

## Production origin and generated metadata

`src/lib/site-origin.mjs` centralizes validation. Local development defaults to `http://localhost:4321`. Release builds require explicit `SITE_URL`, HTTPS and an origin-only URL; credentials, path, query, fragment and example.com placeholders fail with a diagnostic. No production origin was invented.

For the existing Cloudflare Pages assumption, the owner must set Production `SITE_URL` to the confirmed canonical HTTPS origin (and a distinct Preview origin if preview metadata needs it). Root is `website/`, build command `npm run build`, output `dist/`. No hosting settings, DNS or Search Console were changed.

**PASS — generated output:** build with `https://ember-m12a.invalid` produced 17 routes. `npm run verify:production-origin` checked actual generated canonical URLs, Open Graph URLs, social-image URLs, Article/Breadcrumb JSON-LD URLs, sitemap entries, robots sitemap, slash conventions and absence of example.com/localhost URLs. Missing-origin production build fails as intended. `npm run check:links` preserved and passed existing content/link checks. Synthetic output does not confirm public DNS, TLS, redirects, robots reachability or indexing.

## Verification results

- `npm test` — PASS, 29/29.
- `npm run check` — PASS, 46 Astro files; 0 errors, 0 warnings, 0 hints.
- `npm run build` — PASS with synthetic HTTPS `SITE_URL`; 17 static routes.
- `npm run verify:production-origin` — PASS, 17 generated routes.
- `npm run check:links` — PASS, 17 static pages plus content/link/metadata checks.
- `git diff --check` — PASS.
- Desktop isolation — PASS; no changed path outside `website/`.

## Remaining limitations and owner actions

**OWNER ACTION REQUIRED:** Set the real confirmed production origin; run build and generated-output verification with it; then verify deployed TLS, redirects, sitemap and robots, and independently check indexing.

**ENVIRONMENT BLOCKED:** Complete visual reflow testing at all seven widths, 200%/400% zoom, and manual browser interaction/keyboard checks after preview is reachable from a local browser. Test screen-reader behavior with a named assistive technology/browser/version and record findings. Review disabled controls and visual states during that pass.

**Deployment blocker:** Do not release canonical metadata until the owner supplies the confirmed origin and verifies the generated output. No live deployment or indexing claims are made.

## Recommended next milestone

After M12A, complete owner-enabled rendered responsive, keyboard, zoom and screen-reader QA, then verify the configured production origin on the deployed site. This report does not start M12B.
