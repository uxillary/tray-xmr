# M05 — Mining electricity cost calculator

## Purpose and user intent

The calculator estimates electricity energy and cost for a mining PC or another workload. It serves Monero/XMRig users, CPU miners and people comparing continuous or part-time PC operation. It intentionally does not estimate income, rewards, profitability, break-even or return on investment.

## Calculation model

- `kWh = (watts ÷ 1,000) × hours`
- `cost = kWh × manually entered price per kWh`
- Per-hour energy uses one hour; daily energy uses the entered hours per day; the selected period uses entered days; annual energy uses 365 days.
- The rate remains a manually entered numeric value. Pence per kWh is converted to pounds per kWh by dividing by 100. GBP, USD and EUR affect display only; there is no foreign-exchange conversion.
- Calculations retain full JavaScript number precision and format only for display. Currency normally shows two decimals; amounts below one cent/penny show up to four significant digits, with scientific notation for extremely small non-zero costs.

## Assumptions and bounds

- Defaults are 100 W, 24 hours/day, 30 days and an empty rate. They are interface starting values, not hardware guidance or a suggested tariff.
- Supported bounds: 0–20,000 W; 0–1,000 currency units/kWh or 0–100,000 pence/kWh; 0–24 hours/day; 1–365 whole days. Zero power and zero rate are valid.
- Inputs accept decimal commas and common grouped forms. Invalid, negative and out-of-range values show inline errors.
- Whole-system wall power is recommended for a household estimate. CPU package power omits GPU, motherboard, memory, storage, fans and PSU losses.
- The year is a fixed 365 days; no seasonal rates, taxes or standing charges are modeled.

## Architecture and accessibility

Calculation, parsing and formatting helpers live in `src/lib/electricity-cost.mjs` and are independently tested with Node's built-in test runner. A small vanilla module is imported only by the calculator route. Other pages remain statically rendered without client-side JavaScript. The form uses labels, native keyboard controls, visible focus, inline `aria-invalid`/described errors, a polite live summary, and touch-sized controls. The page content and methodology remain present if JavaScript is unavailable.

## SEO and discovery

The route has a clean canonical URL, descriptive title and description, useful server-rendered instructions and formula, and is included in the generated sitemap. It is linked from the Tools hub and from the low-hashrate troubleshooting article where wall power and cooling are discussed. No query-string state is used, so there are no input-specific duplicate URLs. No structured-data type is forced for a straightforward calculator page.

## Verification and performance

Run `npm test`, `npm run check`, `npm run build` and `npm run check:links` in `website/`. The content verifier checks canonical/title uniqueness, JSON-LD parsing, internal routes, article content and sitemap coverage; it also enforces the calculator-only client script scope. The production calculator JavaScript bundle is 4,824 bytes uncompressed and appears only on this route. Calculator-specific CSS is 6,345 bytes uncompressed; the shared 40,789 byte site stylesheet is unchanged by this route-level stylesheet. No browser framework or client runtime dependency was added. `yaml` is declared as a direct website build dependency for the custom Markdown loader; the installed package was already present transitively in the toolchain and is not bundled for visitors.

## Future reuse

The tested calculation module and native form/error patterns can support later independent tools. A future hashrate converter can reuse the static instrument layout; a local XMRig log helper should keep parsing in the browser and define its privacy behavior before implementation.
