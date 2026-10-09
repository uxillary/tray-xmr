# M10B — Mining economics tools implementation

**Scope:** public website only. Desktop application source was not changed.  
**Route:** `/tools/monero-mining-profitability-calculator/`  
**Build:** Astro static output; route-specific vanilla JavaScript.

## What changed

- Repaired the electricity calculator's 1–365 whole-day period boundary in both its browser validation and pure calculation function. Added a regression test for 0, 1, 365 and invalid day counts.
- Added the missing `result-title` heading referenced by the electricity results section and a structural regression test.
- Identified the prefilled 100 W electricity value as illustrative, with instructions to replace it with a wall measurement.
- Added the manual-assumption profitability calculator, its independent calculation module and deterministic tests.
- Linked the new tool from the tools hub, electricity calculator and low-hashrate troubleshooting article. Added it to the explicit static sitemap and route checks.

## Model and input rules

For each projection, `activeSeconds = days × hours/day × 3,600`, then miner hashes equal hashrate multiplied by active seconds. Expected block equivalents are miner hashes divided by network difficulty, or miner hashes divided by network hashrate multiplied by the 120-second target block interval. Both bases represent the same calculation when `difficulty = network hashrate × 120`.

Gross expected XMR equals expected block equivalents × user-entered full block reward. Pool fee XMR and fiat are calculated from the gross reward; revenue after fees is gross revenue less pool-fee value. Energy is `(whole-system watts ÷ 1,000) × hours/day × days`; electricity cost is energy × tariff. Estimated net is revenue after pool fees less electricity cost. Break-even tariff is revenue after fees divided by energy where energy is above zero; at zero energy it is explicitly undefined.

Daily, fixed 30-day and fixed 365-day results call the same pure model. These are constant-assumption scenarios, not future predictions. Fractional block equivalents are expected-value proportions, not individual block discoveries or guaranteed pool payouts.

All numeric fields start blank. Zero is accepted for miner hashrate, power, runtime, tariff, fee, XMR price and reward; the selected network input must be positive. The bounds are input and overflow guards, not estimates of current network or market conditions:

| Input | Validation |
| --- | --- |
| Miner hashrate | 0–1,000,000,000 H/s |
| Whole-system wall power | 0–20,000 W |
| Electricity tariff | 0–1,000 selected-currency units/kWh |
| Mining runtime | 0–24 hours/day |
| Pool fee | 0–100% |
| XMR price | 0–10,000,000 selected-currency units/XMR |
| Network difficulty | Positive, at most 1,000,000,000,000,000,000 hashes/block |
| Network hashrate | Positive, at most 10,000,000,000,000,000 H/s |
| Expected total block reward | 0–10 XMR/block |

The M10A specification gave generous caps as examples but did not set exact caps for price, difficulty, network hashrate or reward. Those four caps are implementation guardrails only. The calculator requires a finite numeric value, rejects malformed input and does not clamp values. GBP is selected initially; GBP, USD and EUR are display options. Changing currency keeps the entered numbers, changes labels/results, and tells the user to confirm or re-enter the tariff and XMR price in that currency; it never converts amounts.

## Results, privacy and accessibility

The result hierarchy leads with estimated daily net operating result and includes expected XMR after fees, block equivalents, gross revenue, pool fee, revenue after fees, energy, electricity cost and break-even tariff for all three horizons. Very small XMR remains visible in scientific notation with a precision note. Zero-energy break-even is described as undefined.

Calculations run locally in the browser. The page has no API calls, server submission, wallet field, account, cookie or persistent input storage. No dependency was added. The estimator is pool-style expected value only; it does not simulate solo probability, P2Pool or named-pool payouts. It excludes hardware cost, taxes, cooling, downtime and other operating expenses.

Inputs have explicit wrapping labels, units and associated help/error text; invalid fields expose `aria-invalid`. The network mode uses labelled radio buttons. A polite status message is debounced to avoid announcing every keystroke. Keyboard focus remains visible. Results use a semantic table and named section; color is not the only way to identify a negative estimate. The page retains static content without JavaScript and loads one small route-only client script.

SEO uses the M10A title and description proposal, one H1, the generated canonical URL, the explicit static sitemap, educational cross-links and internal link checks. No structured data or new article was added.

## Browser QA and preview diagnosis

The project command is `npm run dev` (`astro dev`). I attempted:

```text
npm run dev -- --host localhost --port 4321
```

Astro reported that port 4321 was already occupied, selected 4322, and announced `http://localhost:4322/`. That process also logged `Failed to create the dev server app: require is not defined`; the in-app browser timed out connecting to 4322. It was stopped after that single failed browser attempt. No Astro or production host configuration was changed.

An already-running preview at `http://localhost:4321/` was reachable in the in-app browser and served the current working-tree files. The route rendered and its calculator interactions worked. The browser refused `http://127.0.0.1:4321/`. Direct shell HTTP probes to `localhost` and `127.0.0.1` on ports 4321 and 4322 were denied by the shell's socket permissions, so they do not establish an HTTP failure or status code. The active listener's interface/owner could not be identified from this environment. The best-supported explanation for the fresh-server timeout is a browser/server network-environment boundary combined with the port collision; the browser timeout did not indicate a broken website.

The in-app browser inspected the profitability page, electricity calculator and tools hub at **1440, 1280, 1024, 768, 600, 390 and 360 px**. At each width, the three pages had no horizontal document overflow and the main navigation was present. Desktop and 360 px page captures were reviewed. On mobile, the form and results stack in reading order and the projection table wraps without document overflow. The Astro development toolbar overlays part of the wall-power field in screenshots; this overlay is development tooling, not page content.

Interactive checks in the browser:

- A deterministic manual scenario returned a negative daily result of `-£0.39`; setting tariff to zero returned a positive `£0.09`.
- Switching GBP to USD preserved tariff and price numerals, updated units/results and stated that no conversion was applied.
- Difficulty and equivalent network-hashrate modes returned the same result. Switching modes exposed only one network input and cleared the inactive value. A zero network hashrate was rejected and no estimate was shown.
- The electricity page rejected a 0-day period and exposed its inline error; its results region had the corrected accessible name.
- Keyboard Tab advanced to the next field and showed the focus outline.
- No console errors occurred after the variable-reference defect discovered during the first interaction was fixed. That initial ReferenceError was not present on subsequent page loads.

The browser successfully rendered the reachable localhost preview, but a direct shell HTTP status test and IPv4-browser connection were not available/successful. Contrast was visually inspected but not measured with a dedicated contrast tool; this was not a screen-reader certification.

## Verification

Final checks:

- `npm test` — passed, 20 tests.
- `npm run check` — passed, 0 errors, 0 warnings, 0 hints.
- `npm run build` — passed, 16 static pages generated.
- `npm run check:links` — passed; 16 static pages, canonical/title metadata, local links, article content and sitemap entries verified.
- `git diff --check` — passed; Git also emitted LF-to-CRLF conversion warnings for several working-tree files.

The built profitability client script is 7,428 bytes; its route stylesheet is 5,930 bytes. The script remains under the existing 12 KB tool budget. `package.json` and dependencies were not changed.

## Known limits and next step

The estimate depends on manual reward, market, network, hashrate, power and tariff inputs. Actual mining income varies with network conditions, pool policy, shares, uptime and luck; break-even covers electricity only. It is not a recommendation to mine and does not estimate total ownership cost. Dedicated screen-reader and quantitative contrast review remain future accessibility work.

Recommended next milestone: review usage and support feedback before selecting further economics-tool scope. Any live-data or payout-model proposal should be researched and specified separately. M10C/M11 implementation has not started.

## M10B implementation files

- `src/lib/electricity-cost.mjs`
- `src/scripts/electricity-calculator.js`
- `src/pages/tools/electricity-cost-calculator.astro`
- `tests/electricity-cost.test.mjs`
- `src/lib/mining-economics.mjs`
- `src/scripts/mining-profitability.js`
- `src/styles/mining-profitability.css`
- `src/pages/tools/monero-mining-profitability-calculator.astro`
- `src/pages/tools/index.astro`
- `src/components/HubPage.astro`
- `src/content/articles/xmrig-low-hashrate.md`
- `src/pages/sitemap.xml.ts`
- `scripts/verify-content.mjs`
- `tests/mining-economics.test.mjs`
- `docs/m10b-mining-economics-implementation.md`
