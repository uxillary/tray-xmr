# M13A — Owner Search Console onboarding

24 November 2026. No Google/Bing property, DNS token, indexing state, impressions or clicks were accessible or claimed. No verification token was added and no indexing request was made.

## Hosting and public-origin prerequisites

Use the [owner-ready Cloudflare Pages table](m13a-production-search-readiness.md#owner-ready-cloudflare-pages-configuration). It derives `main`, `website/`, locked `npm ci`, static `dist/` and Node 24.21.0 from the inspected checkout. No public domain is yet confirmed. Do not start project connection, DNS changes or deployment without owner authorization; a Git connection can trigger an immediate build/deployment.

Choose the canonical HTTPS hostname before building. Set Production `SITE_URL` to that origin and `SITE_INDEXING=index` only for the intended public release. Preview must remain `noindex`, preferably with production-referencing canonicals once that origin is confirmed. Enable access restrictions if previews should be private. Do not submit any synthetic audit URL, `localhost`, branch/hash alias or prelaunch noindex deployment.

After separately authorized deployment, record the deployment URL/ID, source SHA, UTC verification time and effective environment. Verify from outside the local machine:

1. DNS resolves to the intended hosting project and HTTPS has a valid certificate. HTTP, alternate www/apex and the production provider alias redirect to the chosen origin without loops, preserving path/query.
2. Home, all four hubs, the three tools, Huge Pages, Windows setup and the remaining published pages return 200 at their canonical trailing-slash URLs. Slashless and `/index.html` variants converge appropriately. A genuinely unknown URL returns **404**, not the homepage with 200. The error document remains noindex and outside the sitemap.
3. Page source has the intended canonical/OG/schema URLs, PNG sharing asset and **no noindex** on the 17 production pages; responses have no restrictive `X-Robots-Tag`. Fetch `/robots.txt` and `/sitemap.xml`; the sitemap contains exactly the 17 intended production URLs and no drafts/error page.
4. Preview pages still have HTML noindex and live `X-Robots-Tag: noindex`, including hash and branch aliases. The local `_headers` artifact alone is not evidence of an effective live header. Production-host aliases are a redirect concern distinct from Pages' preview-header default.
5. Record social PNG HTTP 200, `image/png`, dimensions, public fetchability and a representative actual share if desired. Ensure the host has not injected an analytics beacon.

These live checks are currently **owner actions**, not completed tests. Retain the native zoom, screen-reader, Firefox/Safari and physical-device acceptance gates in [M12B.4](m12b4-final-acceptance.md#remaining-gates-and-owner-checklist).

## Select and verify the Google property

| Property | Scope / verification | Recommendation |
| --- | --- | --- |
| Domain | Includes protocols/subdomains for the owned domain; DNS verification required | Prefer when the owner controls DNS and wants whole-domain oversight. No protocol or path in the property name. |
| URL-prefix | Covers the exact prefix, including scheme/hostname/path; several verification methods | Use the exact canonical HTTPS prefix for focused reporting, or when whole-domain DNS verification is unavailable. www/apex and HTTP/HTTPS are different prefixes. |

The owner signs into [Search Console](https://search.google.com/search-console), adds the chosen property and follows the displayed instructions. For a Domain property, copy the **owner's actual** DNS TXT verification value to the authoritative DNS zone, wait for propagation, then Verify. Do not replace existing unrelated TXT records. Keep the record for continued verification. If a URL-prefix file/meta method is chosen, supply its exact token/file for a later scoped implementation; no placeholder token should ship. No analytics account is needed for DNS verification. [Google property types](https://support.google.com/webmasters/answer/34592), [ownership verification](https://support.google.com/webmasters/answer/9008080).

## Submit the sitemap and inspect key URLs

Only after the live prerequisites and ownership verification pass:

1. Select the correct property. In **Sitemaps**, submit `sitemap.xml` under the confirmed origin. Check that Google fetches/parses it successfully and records the intended submitted URL count. Submission helps discovery; it does not guarantee indexing. [Sitemaps report](https://support.google.com/webmasters/answer/7451001).
2. Inspect the homepage, tools hub, profitability calculator, decoder, Huge Pages and Windows setup, then any problematic URL. Compare indexed data with **Test live URL**; inspect fetchability, robots/noindex, rendered content and declared canonical. Google's selected canonical is an indexed-data observation, not predicted by a live test. Request indexing only for intended verified public pages after checking them. Do not repeatedly submit unchanged pages. [URL Inspection](https://support.google.com/webmasters/answer/9012289).
3. Inspect **Page indexing** reasons such as noindex, robots blocking, duplicates, discovered/crawled-but-not-indexed, redirects, soft 404 and server errors. Exclusion of previews, drafts and the error page is expected; exclusion of a desired canonical page warrants investigation. Reconcile desired URLs against the 17-location sitemap rather than treating every discovered URL as one that should be indexed. [Page indexing report](https://support.google.com/webmasters/answer/7440203).

## Read the reports without inventing a baseline

**Search results performance:** preserve date range, search type, country/device/page/query filters and export date. Start with Web search. Export clicks, impressions, CTR, queries and landing pages; inspect brand and non-brand tasks separately. Filter `/tools/` and each tool URL to evaluate tool discovery. CTR = clicks ÷ impressions; no impressions means CTR is undefined, not a meaningful 0% result. Queries can be withheld/anonymized; row sums need not equal totals. Average position depends on the query/result mix and is not a fixed keyword rank. [Performance report](https://support.google.com/webmasters/answer/7576553).

**Core Web Vitals:** this report uses real-user data grouped by URL/device and covers LCP, CLS and INP. A new/small site may have insufficient data; report “unavailable/insufficient field data,” not “passed.” The [local performance baseline](m13a-performance-baseline.md) is laboratory evidence and does not supply field INP or a production CWV pass. [Core Web Vitals report](https://support.google.com/webmasters/answer/9205520).

New properties and new URLs may take time to accumulate processed reports and crawl/indexing decisions. A successful sitemap submission, rich-results validation or live inspection does not guarantee inclusion or rankings. Do not promise an indexing date. Check security/manual-action reports if the console indicates a problem. Follow the Day 0 / 30 / 60 / 90 schedule in the [growth framework](m13a-organic-growth-framework.md).

## Optional Bing Webmaster Tools

After the same public-site checks, sign into [Bing Webmaster Tools](https://www.bing.com/webmasters/). Either manually add the canonical site and use the supplied DNS/file/meta verification instructions, or import the already verified Google property if the owner accepts the requested Search Console access. Review and retain the verification method; no Bing token was supplied here. Submit the production sitemap, inspect representative URLs and watch indexing/search reports separately from Google. Import permission is optional; do not enable Clarity/session replay or other analytics as a side effect. [Bing add/verify documentation](https://www.bing.com/webmasters/help/add-and-verify-site-12184f8b), [Bing sitemaps](https://www.bing.com/webmasters/help/sitemaps-3b5cf6ed).

## Owner handoff record

Record: canonical origin, deployment/source identity, live checks, property type, verifier/verification date (without exposing secret account credentials), sitemap submission date/status, representative URL-inspection results, first available reporting period and missing-data limitations. All current live/search baseline values remain **unavailable** until that evidence exists.
