# M06 — Local-first XMRig Log Decoder

## Architecture and behavior

`src/lib/xmrig-log-decoder.mjs` exports the pure deterministic `analyzeXMRigLog` function and a 200,000-byte UTF-8 input limit. It strips ANSI CSI sequences, splits CRLF/LF, ignores blanks and recognized timestamps, applies a short ordered list of explicit text rules, groups repeated rule identifiers, and reports unknown-line count. No raw line or captured value appears in returned diagnostics. The vanilla module in `src/scripts/xmrig-log-decoder.js` is imported only by `/tools/xmrig-log-decoder/`.

The user pastes a log and activates **Analyze log**. The result summary announces recognized and unknown counts; the readout presents each signal's observed label, bounded meaning, suggested next check, occurrence count and relevant guide link. **Clear** empties the page state and returns focus to the textarea. Empty and over-limit input have validation messages. Results are never treated as a health score. The client module measured 6,420 bytes uncompressed in the production build.

## Privacy and limitations

Parsing occurs in browser memory. The pasted value is not uploaded, stored in localStorage, added to a URL, or sent to analytics. The tool does not echo line content or identifiers in results. This does not redact the input field or protect a log the user separately copies/shares; logs can contain wallet addresses, pool endpoints, usernames, worker names and IP addresses.

The recognized contract is intentionally narrow and based on XMRig 6.26.0 repository evidence. It does not identify DNS/auth failures, explain pool reject reasons, parse generic errors, or recognize all release/platform formatting variants. Unknown output is not classified as healthy. Grouping preserves first/last occurrence ordinal for each signal and keeps success/failure outcomes distinct, but does not recreate a fully interleaved timeline.

## Accessibility, layout and internal links

The page has a labelled native textarea, native buttons, visible focus styles, a concise polite status region, a separate validation alert, textual severity labels and keyboard focus to the result heading after analysis. The two-panel workspace stacks below 850px; the four-stage diagram stacks at narrow widths. Reduced-motion behavior is respected. Huge Pages and MSR signals link to existing troubleshooting guides; a general decoder card is available on the Troubleshoot hub. The Tools hub now offers the electricity calculator and decoder while retaining unimplemented concepts as non-interactive planned cards.

## Verification and performance

Node's built-in decoder tests cover empty/non-text/random input, malformed lines, CRLF/LF, timestamps, ANSI sequences, full/partial Huge Pages, MSR success/failure, pool state, accepted/rejected shares, duplicates, mixed unknown output, sensitive-value non-echo, and the exact size boundary. All 12 tests pass. `npm run check` reports 0 errors, warnings or hints; `npm run build` succeeds with 14 pages; `npm run check:links` validates all 14 static pages and sitemap links; `git diff --check` passes (Git prints existing line-ending normalization notices for modified working-tree files).

Browser QA was performed at 1440, 1280, 1024, 768, 600, and 390 CSS px. At each width the document scroll width matched its client width; the textarea remained within the viewport. A mixed startup/pool/share fixture produced fixed-text cards and retained unknown-line count; Analyze moved focus to the result heading, Clear emptied input and returned focus, empty and 200,001-byte inputs showed errors, and 200,000 bytes were accepted. Tab navigation reached Analyze. Reduced-motion behavior is covered by a route-level preference rule; no animation is used in the decoder. No physical-device QA is implied. The decoder client module measured 6,420 bytes uncompressed; no client framework or parser dependency is added.
