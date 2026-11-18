# M12A — Visual UX and information architecture audit

Audit date: **18 November 2026**. Scope: **website only; documentation and planning**. Branch: `main`. HEAD: `5c37ccdc4f96075ced30e845640b110633bf6bb2`. No commit, branch, deployment or M12B implementation was requested or performed.

## Baseline and evidence limits

The initial working tree had four modified generated files: `.astro/collections/articles.schema.json`, `.astro/data-store.json`, `.astro/dev.json` and `.astro/settings.json`, all under `website/`. These pre-existing differences are outside this deliverable and must not be discarded. No desktop source was changed or used to infer new product capabilities.

Read the central roadmap; all four requested M11 inventory/search/linking/implementation reports; `site-strategy.md`; M02 visual-system, M04 storytelling and M09B product-storytelling records; and the two existing M12A readiness reports. The existing M12A filenames describe an earlier production/accessibility investigation at a different commit. They are retained as historical evidence. **This four-document visual/UX planning set defines the requested M12B recommendation**, without rewriting historical reports or treating their checks as new results.

Evidence labels used throughout this set:

- **S — source-confirmed:** present in the current Astro, Markdown, CSS or script source.
- **G — generated-markup observation:** inspected in the freshly generated static HTML; establishes markup, not rendered geometry or interaction.
- **R — recommendation:** editorial/design judgment tied to S/G evidence; not proof of a defect or measured user impact.
- **P — prediction:** likely responsive/interaction effect requiring controlled browser validation.
- **H — historical:** earlier report, with its original date/scope; not rerun here.

Severity: **P0** broken/misleading; **P1** significant usability/discovery issue with concrete supporting evidence; **P2** meaningful improvement or bounded defect; **P3** optional polish. **No P0/P1 is established in this pass.** Visual preferences, absent analytics and unreachable local preview do not justify those severities.

### Fresh-build preview investigation

`SITE_URL=https://ember-m12a-audit.invalid npm run build` (environment set in PowerShell) succeeded with **17 HTML routes**, plus robots/sitemap output. This synthetic origin is only a local audit value. Started `npm run preview -- --host 127.0.0.1 --port 4339 --strictPort` from `website/`; Astro 7.3.5 reported ready at that exact address. PowerShell HTTP access failed with “An attempt was made to access a socket in a way forbidden by its access permissions.” Both the in-app browser and local Opera browser navigation returned `net::ERR_CONNECTION_TIMED_OUT`. Startup alone therefore did not establish independent listener identity or usable HTTP access. No older listener was substituted. The audit preview was stopped.

**No page was visually rendered in this pass.** Every route's “first screen” assessment below describes source order and likely emphasis, not an observed fold. No screenshot, mobile acceptance, focus visibility, interaction success, performance or WCAG conformance result is claimed.

### Evidence index

Paths below are relative to `website/`; selectors/sections identify the evidence without depending on generated/minified line numbers.

| ID | Evidence and significance |
| --- | --- |
| E01 | `src/components/SiteLayout.astro`: six main-navigation links, Explore Ember CTA, skip link, main target, eight footer links, centralized metadata and section-active logic. |
| E02 | `src/styles/site.css`: tokens, `.home-hero`, `.section`, `.site-footer`, `.hub-*`, `.resource-card-*`, diagram styles and breakpoints at 1100/900/680/420px. |
| E03 | `src/pages/index.astro`, `ProductPreview.astro`, `TechnicalFlow.astro`: product hero/status, three education cards, text-only Tools entry, conceptual pool/miner/supervision explanation. |
| E04 | `src/components/HubPage.astro`, `HubVisual.astro`, `ResourceCard.astro`: intro → editorial approach → conceptual visual → published resources → remaining cards; linked cards all say “Read resource.” |
| E05 | `src/components/ArticleLayout.astro`: breadcrumb, large title, Quick answer deck, publication date, mandatory visual, optional callout, body, sources, generic Ember aside, related links. No shared TOC; `updatedDate` used in metadata but not displayed. Article max-width is 820px, deck 690px. |
| E06 | `src/components/ArticleVisual.astro`: seven existing technical illustrations. Setup/security have five section links each; other diagrams have no section navigation. |
| E07 | `src/content/articles/*.md`: all seven published articles, headings, summaries, callouts, related lists and primary-source dates. Huge Pages has a detailed signal table; security has a Markdown comparison table. |
| E08 | Three `src/pages/tools/*.astro` implementations, three tool stylesheets and three `src/scripts/*.js` controllers: form/result order, help, validation and output states. |
| E09 | `src/lib/mining-economics.mjs`, `electricity-cost.mjs`, `xmrig-log-decoder.mjs`: calculation boundaries and bounded signal definitions. No model change is proposed. |
| E10 | `src/pages/ember/index.astro`, `ProductJourney.astro`, `ProductArchitecture.astro`, `src/pages/trust/index.astro`: product roles, status and trust ledgers. |
| E11 | `src/pages/sitemap.xml.ts`, `robots.txt.ts`, collection schema/loader and three `[slug].astro` routes: ten fixed HTML pages plus seven non-draft articles. Sitemap/robots are infrastructure, not additional audited content routes. |
| E12 | Fresh `dist/**/index.html`: 17 pages, one H1 on each, rooted internal-link inventory and section-link inventory. Every non-home content route has a main-content inbound link from another route, even excluding global header/footer. This bounded extraction is not a full crawler or external-link test. |

## Existing strengths and identity

The identity is coherent in source: graphite/charcoal surfaces with a subtle olive undertone, restrained warm orange, large local-system display typography, monospaced instrumentation and thin technical rules. Preserve the hero composition and its short signal-trace animation. Product imagery is explicitly illustrative and supplies no fabricated telemetry. The site avoids generic cryptocurrency pictures, price hype and unsupported download promises.

Static HTML, descriptive article titles, specific quick answers, meaningful primary-source lists, safe troubleshooting caveats and independent standalone-XMRig guidance are valuable foundations. Planned cards are non-links with status labels. Published cards have full-card links. The existing diagrams already distinguish permission/allocation, CPU cache/RandomX memory, worker counts and product/process boundaries: improve their diagnostic usefulness rather than starting a second illustration system.

### Five largest UX opportunities

1. **P2 R, E04:** useful hub destinations follow several layers of editorial framing. Move usable resources nearer the introduction and subordinate future themes.
2. **P2 R, E05–E07:** long articles have no complete shared section index; setup/security's five-stage visuals only cover part of their bodies. Add purpose-sensitive section navigation.
3. **P2 R/P, E08:** profitability requires a long blank form; at ≤850px results follow all inputs, and its projection figures reach 9px at ≤600px. Improve completion guidance and result hierarchy.
4. **P2 R, E05–E07:** summary → diagram → callout → another short/quick answer can repeat the opening idea before the actionable diagnosis. Edit ordering by article purpose.
5. **P2 R, E03/E04/E08:** tool affordances are weaker than article affordances: homepage Tools is a text line after three cards and tool cards say “Read resource.” Give tools task-specific labels and outcomes.

### Five largest visual opportunities

1. Replace hubs' repeated intro/feature/concept-panel emphasis with prominent available-resource composition; retain concise editorial context.
2. Add a modest desktop article navigation rail while keeping a comfortable prose measure; use the spare outer space for orientation rather than widening every paragraph.
3. Make tool inputs, empty states and daily-result summaries visually legible at comfortable text sizes; reserve dense detail for secondary comparison views.
4. Turn Huge Pages' existing conceptual diagram into a signal-to-decision explanation and improve memory/thread distinctions with explicit labels.
5. Differentiate warnings, definitions, examples and next actions through consistent semantic treatments instead of repeated near-identical dark panels.

### Composition and typography assessment

**Sparse versus dense:** `.section` applies 64–104px top and bottom padding, so adjacent homepage sections can accumulate 128–208px between content edges. Hubs combine a large intro, decorative numeric index, editorial feature and a ≥126px conceptual strip with a 44px bottom margin before resources (E02/E04). These are confirmed spacing rules, **not measured excessive gaps**. Their cumulative rhythm is a P2 design-review candidate. Conversely, tool help, formula captions and results use many 9–12px sizes; the security comparison and four-column Huge Pages table demand sustained reading in constrained space.

**Reading width:** the article wrapper is 820px, not unusually narrow by definition. `--reading:720px` is not the article's governing width. Do not widen prose simply to fill a 1200px site container. A main column around 65–75 characters plus a secondary orientation rail is a candidate to compare in browser QA, not a replacement token mandated by this audit.

**Two-column balance:** hubs use a `.45fr` numeric index column and a large feature aside; these contain less task value than their resources. Tools split inputs/results even when input height greatly exceeds empty-result height. Product and Trust columns have meaningful distinct content and should not receive a blanket layout change. Article styles contain several hardcoded colors/type values alongside shared tokens; unify only touched presentation roles and remeasure them.

**Repeated patterns:** nearly every long article opens with the same visual sequence, regardless of diagnostic, conceptual or safety purpose. Hubs reuse the same editorial preamble sequence. Reuse is helpful, but rank the reader's task before the reusable decoration. Keep existing icons, restrained motion and status labels.

## Route-by-route audit — all 17 published HTML routes

All mobile notes here are **P**, supported by current styles. All first-screen impressions are **S/G** composition assessments. Primary/secondary actions distinguish what exists from what is proposed.

### 1. `/` — homepage

- **Audience/intent:** first-time product evaluators and search visitors exploring the wider site; understand Ember and choose a useful next step.
- **First screen/hierarchy:** three-line “Monero mining … mystery” headline, Windows software description, Explore Ember/See how it works, development notice and illustrative setup preview. The engine relationship becomes explicit in later principles/flow content (E03).
- **Layout/readability/interest:** distinctive balanced hero in desktop CSS; large type and warm accents. Principles, flow, education, trust and closing CTA repeat generous section spacing. Preserve the animation and preview. Mobile stacks preview below copy at 680px; do not remove it.
- **Navigation/actions:** existing primary Explore Ember; secondary in-page how-it-works. Main nav exposes all hubs, but the educational discovery grid includes only Learn/Guides/Troubleshoot. Tools follows as a small text entry.
- **Internal linking:** all six hub/product destinations reachable; no individual article/tool is featured in the home body. Education copy mentions hashrate and pools even though these are planned themes in Learn.
- **Mobile:** check two-row sticky navigation, long hero copy and preview labels at 390/360px; below 420px buttons become full-width stacked controls.
- **Opportunities:** **P2 R** add a compact existing-resource entry for “Calculate mining costs” alongside learning/diagnosis; describe “Learn” using actual published coverage. Explain Ember's XMRig role succinctly near the hero copy without changing hero design. **P3 R** reduce repeated CTA/status phrasing only where a reader loses no availability context.

### 2. `/ember/` — product overview

- **Audience/intent:** future desktop-app evaluator; understand setup, XMRig relationship, status and trust boundaries.
- **First screen/hierarchy:** confident product heading and explicit development/no-public-download note. Purpose → feature rows → four-stage journey → architecture → resource links → implementation/status tiles → availability CTA (E10).
- **Layout/readability/interest:** strong existing journey and architecture; repeated explanations of configuration, state and release caveats can lengthen the page. Two columns have substantive content; preserve them unless browser evidence shows imbalance.
- **Navigation/actions:** primary Trust and transparency near the end; secondary concept/diagnostic/tool links between architecture and controls. No download CTA is appropriate.
- **Internal linking:** resources are linked through general hubs; product evidence routes to Trust. Users seeking “what can I use today?” must distinguish web tools from unreleased desktop software.
- **Mobile:** journey/architecture change four → two → one columns at 900/600px; status tiles become one column at 420px. Verify reading order and status labels.
- **Opportunities:** **P2 R** add a small status/section index and one concise current-use pointer to existing web tools. **P3 R** trim repeated prose around the retained diagrams. Product claims stay tied to existing website evidence; desktop acceptance was not rechecked.

### 3. `/learn/` — concepts hub

- **Audience/intent:** beginner building a mining mental model; experienced miner clarifying memory/threads.
- **First screen/hierarchy:** conceptual heading, editorial rationale, memory/cache/thread strip, two published resources, then three planned foundation topics (E04).
- **Layout/readability/interest:** attractive technical concept strip but broad hub framing precedes a small live collection. Numerical side index and editorial aside add atmosphere more than choice support.
- **Navigation/actions:** primary existing memory/cache or CPU-thread article; secondary currently planned themes cannot be selected. Add a genuine “new to setup?” route to the existing Windows guide, not a fake introductory article.
- **Internal linking:** body links only the two Learn articles; practical tools/troubleshooting depend on global navigation or those articles.
- **Mobile:** single-column cards below 680px; framing and planned items consume more vertical space. Check long article-card headings and category/status wrapping.
- **Opportunities:** **P2 R** resources immediately after a brief introduction, memory versus worker-count descriptions, contextual setup/cost links. Do not promise a published beginner mining overview or pool primer.

### 4. `/guides/` — Windows guide hub

- **Audience/intent:** beginner seeking standalone Windows setup; visitor encountering download/security warnings.
- **First screen/hierarchy:** editorial headline and safety rationale precede the three-stage conceptual path and two published guide cards. Security is first because collection sorting is by descending publication date (E04/E07).
- **Layout/readability/interest:** safety is a meaningful differentiator; chronological order does not explain which guide to choose. Planned workflow cards can resemble another sequence to complete after the published guides.
- **Navigation/actions:** primary choose setup or security guide; secondary relevant troubleshooting, currently via global nav. Proposed choice labels: “Starting from scratch” / “Windows blocked a download.”
- **Internal linking:** both published guides are available; guide-to-guide safety handoff is already present. Preserve it rather than adding a duplicate safety page.
- **Mobile:** resource stacking and stage strip reflow need rendered review; keep planned cards visually subordinate and non-interactive.
- **Opportunities:** **P2 R** task-led ordering and concise live-resource descriptions; reduce the editorial preamble. **P3 R** demote planned operational themes into a short future-topics list.

### 5. `/troubleshoot/` — diagnostic hub

- **Audience/intent:** experienced XMRig user with Huge Pages, MSR or performance symptoms; novice with a security alert.
- **First screen/hierarchy:** strong “Read the signal” positioning, editorial approach and observe/narrow/verify visual before published diagnostics. Decoder and security guide appear later under “More diagnostic topics,” mixed with a planned pool issue (E04).
- **Layout/readability/interest:** coherent diagnostic look; symptom choices carry more immediate task value than editorial framing. Three article cards plus mixed later cards require extra scanning.
- **Navigation/actions:** primary relevant symptom article; secondary decoder or security guidance. Make those existing actions part of a clearly named available diagnostic set.
- **Internal linking:** three diagnosis pages, decoder and security guide already linked. Pool-connection content is visibly planned; no broken destination is established.
- **Mobile:** prioritise symptom text and visible availability; check full-card focus and long headings when stacked.
- **Opportunities:** **P2 R** compact symptom chooser and prominent “Have a log?” link, retain conservative advice. Do not infer a diagnosis from the chooser or promote firmware changes.

### 6. `/tools/` — tools hub

- **Audience/intent:** search visitor comparing helpers, beginner estimating cost, experienced user interpreting logs.
- **First screen/hierarchy:** long manual-assumptions introduction, editorial panel and generic instrument metaphor precede five cards: three available and two planned (E04/E08).
- **Layout/readability/interest:** instrument visual is identity-consistent but conveys no actual tool operation. Tool cards share article styling and generic “Read resource” action. Available/planned badges correctly distinguish functionality.
- **Navigation/actions:** primary open one of three tools; secondary learn assumptions/privacy. Use “Calculate electricity cost,” “Build a mining scenario,” and “Decode a log.”
- **Internal linking:** all three tools linked; related guides are mainly discovered inside tools. No tool route is orphaned.
- **Mobile:** stack available tool cards first, keep descriptive text short and planned instruments compact. Avoid interactive controls nested in a linked card.
- **Opportunities:** **P2 R** move the three usable tools above editorial material; concise input → output summaries; optional labelled static previews using existing UI patterns. Functional mini-tools are not needed for M12B and would duplicate logic.

### 7. `/tools/electricity-cost-calculator/`

- **Audience/intent:** miner or continuous-PC-workload user estimating whole-system energy/cost from their own tariff.
- **First screen/hierarchy:** descriptive title/intro then input/result shell, followed by power-measurement note, method/context and back link. Useful functionality precedes long explanation (E08).
- **Layout/readability/interest:** clear power → energy → cost diagram and period readouts; help is often 11px and result labels 9px. Defaults are illustrative 100 W, 24 hours/day and 30 days; tariff is blank. Desktop result panel may leave unused height compared with the input column (P).
- **Navigation/actions:** primary enter wall watts/runtime/tariff and read costs; secondary switch to profitability or read whole-system measurement guidance. Reset exists.
- **Internal linking:** profitability, RandomX, Ember and Tools hub. Related technical link should explain why memory/resource information matters, not become a generic list.
- **States:** source controller validates ranges/integer days, handles pence with GBP and clears invalid output. No manual error/recovery pass occurred. The rate/currency mismatch returns before updating energy values; inspect whether prior energy readouts can appear stale after that sequence in future QA.
- **Mobile:** shell stacks at 850px; energy path becomes vertical at 600px. Results follow all form controls. Three period readouts remain side by side; test long currency values and 200% text.
- **Opportunities:** **P2 R** increase secondary text, tighten input/result composition, add a direct measurement-help anchor and compact result access on stacked layouts. Keep tariff blank, the cost-only model and currency non-conversion explicit.

### 8. `/tools/monero-mining-profitability-calculator/`

- **Audience/intent:** visitor exploring expected mining revenue versus electricity from a manual scenario.
- **First screen/hierarchy:** explicit no-live-data/no-forecast statement, long blank form and result table. Below: formula → input-sourcing table → hypothetical worked example → expected-value explanation → limits (E08/E09).
- **Layout/readability/interest:** excellent technical transparency, but form and detailed result display compete. At 851–1024px fields become one column while form/results still share the page; at ≤850px results move below the entire form. At ≤600px projection figures/headings become 9px. These are S rules; actual clipping/legibility is P.
- **Navigation/actions:** primary complete required assumptions and inspect daily net; secondary source inputs, compare electricity-only cost and review full calculation. No in-page links currently connect those tasks.
- **Internal linking:** memory/cache, threads, low hashrate, setup and electricity exist near the end; the main body lacks a direct Tools back link (global Tools navigation remains available).
- **States:** S-confirmed controller sets `started` after any numeric entry and immediately shows missing-value errors on other empty fields; this is a **P2 confirmed interaction-policy issue**, not a browser-observed announcement failure. Blank initial output and invalid-result clearing are deliberate. No model defect is asserted.
- **Opportunities:** **P2 R** group measured versus sourced assumptions; put “Where to get inputs” beside form groups; show a readable daily revenue/cost/net summary before the detailed projection table; introduce local navigation to method/example. Consolidate near-duplicate “Expected value is not a payout” and “Keep the result in context” paragraphs while preserving all limitations. Change validation timing only in a bounded UI change with regression checks.

### 9. `/tools/xmrig-log-decoder/`

- **Audience/intent:** XMRig user with a log excerpt; identify supported signals and choose a safe next check.
- **First screen/hierarchy:** question-led heading (tool name in title/kicker context), raw-log → signal → meaning → check strip, equal input/output panels, then scope/privacy explanation and guide links (E08/E09).
- **Layout/readability/interest:** strong local/no-upload messaging. Empty result panel is intentionally sparse. At small widths the vertical process strip plus 230px textarea delays analysis results (P). Several 10–12px technical labels need review.
- **Navigation/actions:** primary paste/review/analyze; secondary Clear or open signal-specific guide. No sample is currently offered. Results focus their heading after successful analysis; invalid input leaves focus unchanged.
- **Internal linking:** static Huge Pages/MSR/low-hashrate links plus generated Huge Pages/MSR result links. Pool/share cards offer text checks rather than a non-existent dedicated article.
- **Confirmed presentation defect:** stylesheet uses `var(--font-mono)` with no definition anywhere in `src/`; shared token is `--mono`. Affected font shorthand declarations are invalid and fall back to inherited/default styling. **P2 S**, not a screenshot-proven type mismatch.
- **Opportunities:** **P2 R** use the existing mono token; include concise supported/not-supported coverage next to input and a clearly labelled synthetic sample. Keep sample distinct from user content, never auto-upload/store it, preserve unknown-output and root-cause limitations. A version label requires evidence from existing parser fixtures, not a blanket support claim.

### 10. `/trust/`

- **Audience/intent:** security-conscious evaluator checking provenance, wallet handling, contribution and release status.
- **First screen/hierarchy:** strong trust statement and principle, implemented ledger, then open-work/limits ledger. Developer time-share disclosure is in the later open-work section (E10).
- **Layout/readability/interest:** numbered two-column ledger suits inspection; technical prose is dense and repeated caveats can obscure the few decisions a visitor needs. This documentation-like style is appropriate here more than on task hubs.
- **Navigation/actions:** primary inspect safeguards/limits and repository security model; secondary return to product status via global navigation. Body has no rooted internal links (G), but the page itself has inbound links and is not orphaned.
- **Internal linking:** add a brief product-status handoff and an anchor index for wallet, provisioning, process control, developer contribution and open release work. Keep external source/evidence links descriptive.
- **Mobile:** ledger collapses below 680px; check fee paragraph, link wrapping and heading context after the long implementation section.
- **Opportunities:** **P2 R** concise “What to know before evaluating” index; make fee and acceptance status findable. **P3 R** add dated website-evidence metadata only when the claim review actually occurs. Do not recertify implementation from this website audit.

### Shared article baseline (routes 11–17)

E05 establishes a useful quick answer and clear source list, but repeats the same diagram/callout/body sequence. Publication date is visible; modification metadata is emitted for Huge Pages but its updated date is not displayed in the template. The article body itself dates that technical review, so there is no hidden-review-date defect. Related reading and a generic product aside appear after sources; contextual links generally help earlier in the body. Use a complete TOC for long tasks, shorter section links for conceptual notes, and retain a single low-pressure product aside. Do not force every article into a troubleshooting template.

### 11. `/troubleshoot/xmrig-huge-pages/`

- **Audience/intent:** Windows XMRig user seeing absent privilege or 0/partial allocation; distinguish signals and act safely.
- **First screen/hierarchy:** specific question/title and answer, conceptual page-mapping diagram, “Check this first” callout, then Quick diagnosis/table. The strongest decision aid follows repeated introductory framing.
- **Layout/readability/interest:** existing schematic is useful but the diagnostic table is more directly actionable. Table has caption/scoped headers, focusable region and instructions; CSS `min-width:880px` exceeds even the 820px article column, so local horizontal scrolling is designed in at desktop and mobile widths (S), not document overflow proved in-browser.
- **Navigation/actions:** primary find the matching signal and safe check; secondary local decoder or low-hashrate checklist. No complete section index.
- **Internal linking:** decoder, low hashrate, memory, threads and Windows setup already connected. Do not report these as missing.
- **Mobile:** four prose-heavy columns require sideways comparison. Recommend a compact signal decision summary before the full semantic table; retain full limitations in each branch.
- **Opportunities:** **P2 R** table/branch entry sooner, section links, privilege-versus-allocation visual tied to signals. Keep dated review and managed-device warnings next to system-policy decisions.

### 12. `/guides/xmrig-windows-setup/`

- **Audience/intent:** beginner conducting a first standalone Windows XMRig session, with experienced users returning to config/signature details.
- **First screen/hierarchy:** plain task title and summary, five linked stage checkpoints, then a long preparation section. Body has seven major task headings, so the five stages omit Common issues/Next steps.
- **Layout/readability/interest:** useful code, configuration anatomy and first-run signal map; provenance section necessarily contains dense commands, fingerprints and version-specific information. Avoid adding another decorative setup diagram.
- **Navigation/actions:** primary prepare → download/verify → configure → supervised start → verify; secondary stop/check security or follow symptom guide. Ctrl+C stop instruction is in the Start section, and security checks precede execution.
- **Internal linking:** security, decoder, three diagnostics, memory, threads, electricity and Ember status are already linked. The security branch must remain at the point of download.
- **Mobile:** scoped preformatted blocks scroll locally; verify full commands remain copyable/readable and manual H2 IDs are preserved. Stage links reflow to a vertical sequence at 700px.
- **Opportunities:** **P2 R** complete task index including issues/stop context, concise prerequisites, visually distinct non-runnable config example and safe stop checkpoint. Keep standalone/Ember separation and dated version evidence.

### 13. `/guides/xmrig-windows-security-warnings/`

- **Audience/intent:** user blocked by Defender/SmartScreen; decide whether to stop and what evidence to inspect.
- **First screen/hierarchy:** explicit stop/verify summary and five linked decision stages. Body adds warning distinctions, release-check comparison, authority/what-not-to-do and related sections beyond the five stage links.
- **Layout/readability/interest:** good safety-led visual with text alternatives. Release evidence is a standard Markdown three-column table. Unlike Huge Pages' custom table, it has no author-supplied caption/scoped headers/scroll region or shared article-body table styling (S); rendered size/overflow remains unverified.
- **Navigation/actions:** primary leave unresolved file blocked and verify source/evidence; secondary standalone setup only when checks are satisfactory. Never introduce a generic “Continue installation” button.
- **Internal linking:** setup and Huge Pages present; shared product aside identifies no release. No need to promote an unrelated calculator here.
- **Mobile:** table comparison and long signatures/technical terms need local scroll or a readable stacked evidence format. Keep each limitation with its corresponding check.
- **Opportunities:** **P2 R** accessible shared comparison-table treatment and complete section navigation; clear distinction between reputation, integrity/provenance and safety. Preserve safety instructions verbatim in meaning.

### 14. `/troubleshoot/xmrig-msr-error/`

- **Audience/intent:** miner seeing MSR failure; determine whether work can continue and avoid unsafe tuning.
- **First screen/hierarchy:** focused title/summary, access-boundary diagram, “Safe to ignore?” callout, then Quick diagnosis and checks.
- **Layout/readability/interest:** existing diagram clarifies hardware/access/applied-versus-unavailable; shorter article than setup. Repeating the conditional “may continue” idea in summary/callout/body can slow the answer.
- **Navigation/actions:** primary inspect full warning/build/context and normal mining state; secondary low-hashrate or decoder. No recommendation to disable Secure Boot should become a highlighted action.
- **Internal linking:** Huge Pages, low hashrate, decoder plus related threads. **Security-warning guide lacks a contextual link** from the provenance/driver-block discussion.
- **Mobile:** stack diagram while preserving branch labels; prevent a colored success state implying normal overall health.
- **Opportunities:** **P2 R** put concise conditional answer and safe checks together; contextual security-guide handoff beside blocked-file/driver discussion. A short section index is sufficient.

### 15. `/troubleshoot/xmrig-low-hashrate/`

- **Audience/intent:** miner comparing a low or variable rate; establish a valid baseline and narrow causes.
- **First screen/hierarchy:** specific question/summary, six-area diagnostic map, baseline callout, Quick diagnosis, five-step ordered check and detailed sections.
- **Layout/readability/interest:** good checklist and conservative framing; the diagram is a category map, not a decision tree. Avoid duplicating the five ordered checks in another diagram.
- **Navigation/actions:** primary follow measurement/check order; secondary decoder, focused diagnostic or electricity/profitability tool after measurement.
- **Internal linking:** both tools and all four technical concept/diagnostic pages are already well connected.
- **Mobile:** ordered cards are readable candidates; tools appear later in the cooling/load section. Need complete section links for repeat visitors.
- **Opportunities:** **P2 R** turn the ordered checks into navigable steps, add a blank comparison-record example (no invented CPU result), retain the distinction between pool estimates and repeatable benchmarks.

### 16. `/learn/randomx-memory-cache/`

- **Audience/intent:** beginner or experienced miner confusing CPU cache, RandomX cache, dataset, installed RAM and NUMA.
- **First screen/hierarchy:** specific title and conceptual summary, three-layer schematic, terminology callout, then Quick model and explanatory sections.
- **Layout/readability/interest:** strongest existing conceptual illustration; “nearest/system memory” layer labels could imply a simple hierarchy instead of distinct initialization/working resources. Caption appropriately says conceptual/not to scale.
- **Navigation/actions:** primary understand the three resources; secondary threads, Huge Pages or low-hashrate diagnosis. A broad product CTA would distract.
- **Internal linking:** concept/diagnostic cluster is complete. A measurement/cost handoff is optional only at resource-use context, not a required conversion funnel.
- **Mobile:** memory labels reflow, but small captions and topology notes need inspection. Avoid making arrows imply that CPU cache is a RAM allocation.
- **Opportunities:** **P2 R** label resource location and purpose explicitly; distinguish dataset initialization from active worker cache needs. Use a concise glossary/section index rather than a diagnostic checklist.

### 17. `/learn/xmrig-cpu-threads/`

- **Audience/intent:** user worried XMRig is not using all logical processors; understand counts and test safely.
- **First screen/hierarchy:** direct question/title and answer, 16-dot illustrative processor/cache diagram, callout, then short answer and definitions.
- **Layout/readability/interest:** good explanation of an often-confused count; 16 dots/four workspaces are illustrative, not a recommendation, but need stronger visible “no recommended count” context near the drawing.
- **Navigation/actions:** primary compare cores/logical processors/mining workers; secondary controlled thread-count test or low-hashrate checklist.
- **Internal linking:** memory/cache, low hashrate and related Huge Pages present; no contextual electricity link at the comparison step.
- **Mobile:** two visual columns stack at 680px; preserve count labels and caption alongside illustration.
- **Opportunities:** **P2 R** three-count visual explanation and blank comparison worksheet; optional wall-power link when cost/efficiency comparison is introduced. Never calculate an optimal thread count from dot count/cache alone.

## Confirmed defects versus recommendations

| Finding | Classification | Evidence / boundary |
| --- | --- | --- |
| Decoder references undefined `--font-mono` | P2 S presentation defect | E08/E02; source search finds no definition. Fix token reference in M12B; visual impact not measured here. |
| Profitability marks untouched empty fields invalid after first numeric entry | P2 S interaction-policy issue | E08 controller's `started`/empty-field branches. User-facing announcement burden remains untested. |
| Tool cards say “Read resource” | P2 S copy mismatch; R treatment | E04, including three available tools. Links still work; not a broken tool. |
| Security comparison lacks shared table presentation/explicit caption and scopes | P2 S omission; R enhancement | E05/E07; not by itself a proved WCAG failure. |
| No shared complete article section index; useful hub content appears late | P2 S structure; R improvement | E04/E05/E12; no measured abandonment or ranking effect. |
| Sparse desktop space, mobile result delay, nav/footer wrap, clipping | P2/P3 P | Styles support investigation; no rendered defect established. |

## Responsive review ledger

**Exact viewport widths actually rendered/tested: none.** The seven required widths remain unverified. The following are test hypotheses, not acceptance results.

| Requested width | Current-build visual status | Source-based risk/check |
| ---: | --- | --- |
| 1440px | NOT VERIFIED | Content caps at 1200px; article 820px. Compare whitespace and diagram/table usefulness rather than stretching prose. Footer has eight unwrapped links above 680px. |
| 1280px | NOT VERIFIED | Check long footer row, hero balance, hub index/aside versus available resources. |
| 1024px | NOT VERIFIED | Profitability fields switch to one column within a two-column shell; inspect input/result imbalance and sticky-header clearance. |
| 768px | NOT VERIFIED | Navigation wraps into a second row at 900px; hero remains two columns until 680px; tools have stacked at 850px. Check result access and footer overflow. |
| 600px | NOT VERIFIED | Hero/hub/card/Trust layouts stack; article title becomes 2.55rem, tools use mobile styles; profitability result table uses 9px text. |
| 390px | NOT VERIFIED | Stacked home buttons; horizontal nav has hidden scrollbar; long tool labels/card status badges and local table scroll need touch/keyboard inspection. |
| 360px | NOT VERIFIED | Highest risk of concealed last nav link, dense result columns, code/table access and long figure labels. Body minimum is 320px, not proof of 360px success. |

Additional acceptance work: both sides of 1024/900/850/700/680/600/420px breakpoints when touched; 200% zoom and 400% reflow; no document-level horizontal scroll, except deliberately contained tables/code with discoverable access; nav scroll affordance; all footer links reachable; actual pointer/touch targets; mobile on-screen keyboard and results navigation. Screen dimensions are not a substitute for CSS viewport dimensions.

## Accessibility considerations and required future tests

Source strengths: skip link/main target, named navigation, visible-focus CSS, explicit form labels/descriptions/live errors, captions on many diagrams, status text beside color, scoped custom tables and reduced-motion rules. Generated HTML has one H1 per route. These do not establish WCAG compliance.

- **Keyboard/focus:** test skip link, all cards, nav overflow, TOC anchors, each form/control, table scroll and decoder analyze/clear/error recovery. Sticky header height varies; `scroll-padding-top:100px` may not match a wrapped header at zoom. Anchors must not land under it. Preserve decoder results focus and avoid automatic focus jumps on each calculator keystroke.
- **Reading order/headings:** test proposed side rails in DOM order, nested headings including diagram H2s, and complete section lists. Parent hub links currently receive `aria-current="page"` on article routes; review whether a location/section indication describes the relationship more accurately without weakening visual orientation.
- **Contrast:** historical readiness reports record selected solid-color calculations. No new measured contrast audit was performed, including gradients, disabled/hover/error/focus states and small labels. Recheck actual touched states and rendered surfaces. Do not infer compliance from historic token ratios.
- **Text scaling:** 9–12px metadata/results/help and the 2.55rem mobile article H1 require real text/zoom testing. Prefer readable default text to reducing font size until tables fit.
- **Forms/announcements:** test accessible unit names, help/error association, validation timing, currency changes, empty/invalid/recovered results and live-region duplication with a named screen reader/browser/version. Decoder error is an alert but not in textarea `aria-describedby`; assess adding association without double announcements.
- **Diagrams/tables:** retain plain-language equivalents, captions and meaningful reading order; hide only decorative marks. Security comparison needs a caption/headers plan. Compare semantic table plus local scroll versus stacked presentation with assistive technology before choosing.

Dedicated screen-reader testing, fresh measured contrast testing and manual keyboard/zoom checks remain outstanding for M12B/M12C. No pass is inferred from historical semantic tests.

## Decision

Preserve the identity and all existing routes. Implement the bounded six-item scope in [the prioritized plan](m12a-prioritized-improvement-plan.md) only in M12B, with rendered QA as its first evidence gate. [Journeys](m12a-organic-discovery-journeys.md) distinguish existing links from proposed changes; [visual opportunities](m12a-visual-content-opportunities.md) specify five useful diagram improvements. M12A stops at this plan.
