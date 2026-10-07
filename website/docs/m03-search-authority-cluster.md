# M03 search authority cluster

## Final pages

This milestone publishes five pages selected from qualitative search research. The strategy favors symptom-led answers and one shared concept page over query variants or generic cryptocurrency content.

| URL | Why it exists |
|---|---|
| `/troubleshoot/xmrig-huge-pages/` | The clearest Windows-specific symptom: explains the difference between a granted privilege and successful allocation, including partial allocation and memory pressure. |
| `/troubleshoot/xmrig-msr-error/` | Interprets XMRig's MSR optimization status, explains when mining can continue, and contextualizes elevation and Secure Boot without a register-edit recipe. |
| `/troubleshoot/xmrig-low-hashrate/` | Provides an ordered, comparable-measurement workflow spanning allocation, threads, load, thermals and benchmark conditions without fabricated targets. |
| `/learn/xmrig-cpu-threads/` | Explains why logical processor count and useful RandomX mining-thread count differ, with CPU cache as the key concept. |
| `/learn/randomx-memory-cache/` | Defines the RandomX dataset, cache, CPU cache, Huge Pages and NUMA as a shared reference for the symptom pages. |

The research did not justify replacing these with a different topic: XMRig's own current documentation directly supports each topic, and qualitative results show explicit symptom wording. No search volumes are claimed.

## Source strategy

XMRig documentation is the technical source for Huge Pages, RandomX memory and cache, MSR, CPU configuration and benchmarking. Microsoft Learn is used for the Windows memory-lock privilege and its system implications. Search-result wording is observational only. Community threads and competing guides are not relied on for technical claims. Every article has a visible Sources list with organization, title, direct URL and access date (6 October 2026).

## Article architecture

Five Markdown entries live under `src/content/articles/` and are validated by the typed Astro content collection in `src/content.config.ts`. Required title, description, publication date, section, summary, draft flag, sources and related IDs are schema-checked. Two statically generated routes (`learn/[slug]` and `troubleshoot/[slug]`) render the entries with a reusable `ArticleLayout`. Draft entries are excluded from route generation, hub listings and the sitemap.

Article layout provides the existing site shell, breadcrumbs, dates, semantic article content, visible sources, related links, return-to-hub navigation, canonical metadata and schema. Articles use no client JavaScript, external embeds or new dependencies. Code/status examples are clearly labelled illustrative when simplified.

## Internal linking and hubs

Learn surfaces the two conceptual guides first; Troubleshoot surfaces the three diagnostic guides first. Remaining conceptual topics stay clearly described as in-scope plans. Contextual links connect adjacent articles; breadcrumbs and return links connect each page to its hub. The sitemap derives published article URLs from the collection and omits drafts.

## Metadata and schema

Each page has a unique human-focused title and description, canonical URL, Open Graph `article` type and published-time metadata, and static Twitter metadata inherited from the site shell. JSON-LD contains `BreadcrumbList` and `TechArticle`, with honest publication dates and no invented author, rating or review fields. `dateModified` and Open Graph modified time appear only if a substantive `updatedDate` is supplied. No FAQ schema is used.

## Deferred topics and M04

Profitability, price, hardware rankings, affiliate content, GPU mining, pool rankings, wallet reviews and per-CPU benchmark pages remain out of scope. The strongest adjacent opportunity surfaced here is a **Windows first-run and startup-log guide**: several recurring problems begin before tuning (source verification, security-product scrutiny, and reading startup status), and that would bridge naturally into Huge Pages and MSR diagnostics. Validate that need against search-console queries and reader questions before writing. Keep it to one sourced guide rather than separate pages for every warning string.

## Lessons for M04

- Keep each article anchored to one observable question or one explanatory concept.
- Keep mutable OS instructions attributed and checked against current primary sources.
- Prefer comparable measurements over universal hashrate promises.
- Let the symptom pages refer readers to shared concepts instead of repeating whole explanations.
- Review real query and reader data before selecting the next cluster.
