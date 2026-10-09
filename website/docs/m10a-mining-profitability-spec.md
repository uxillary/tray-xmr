# M10A — Monero mining profitability calculator specification

**Status:** proposed specification only. Do not implement in M10A. Desktop mining code is out of scope; this web tool must remain mathematically independent from it.

## Product definition

Estimate expected Monero reward value and electricity-only operating balance from inputs supplied by the visitor. The first release is an educational scenario calculator, not a price feed, earnings forecast, investment tool, mining recommendation or Ember desktop feature. The result can be negative and must say so directly.

**First release: pool-style expected-value model only.** It estimates a miner’s proportional share of expected network rewards, less the entered pool fee. It does not simulate solo block discovery, payout timing, a named pool’s PPS/PPLNS rules, P2Pool share windows, stale shares or minimum thresholds. This is clearer for a repeatable expected-value estimate, but an average is not a promise of regular payment. Monero documents solo, pool and P2Pool as distinct mining choices; the P2Pool implementation also describes share-window and payout variance. See [Monero mining documentation](https://docs.getmonero.org/interacting/mining/) and the [P2Pool payout description](https://github.com/SChernykh/p2pool#how-payouts-work-in-p2pool), checked 9 October 2026.

## Inputs and contract

All numeric fields start **blank**. Do not prefill a current network value, market price, block reward, average CPU hashrate, tariff or pool fee. The currency selector may default to GBP because it is a display convention, not a market assumption. If a hypothetical example is offered later, label it as a fully synthetic worked scenario and keep it visually separate from live or measured data.

| Field | Unit and meaning | Proposed boundary / behavior |
| --- | --- | --- |
| Miner hashrate | H/s, measured/sustained hashrate while actively mining | Blank required; allow 0 as an explicit zero-output scenario; reject negatives, non-finite values and values above a generous product cap such as 1 GH/s. Explain that benchmark and pool-side rates vary by duration and conditions. |
| Whole-system power | W measured at the wall while the mining workload is active | Blank required; 0–20,000 W, reusing the existing electricity-tool boundary. Label as **whole-system wall power**, not CPU package power. |
| Electricity price | Selected display currency per kWh | Blank required; 0–1,000 currency units/kWh, mirroring the existing tool. Zero is valid. Standing charges and time-of-use rates are excluded. |
| Mining hours | hours/day | Blank required; 0–24. Hasrate and wall power are treated as active-period measurements and scaled by this runtime. |
| Pool fee | percent of estimated gross reward | Blank required; 0–100%. Zero can represent a no-fee pool assumption, not a claim about a specific service. |
| XMR price | selected display currency per XMR | Blank required; 0 is a valid zero-price scenario. No market feed or conversion is implied. |
| Network basis | exactly one of network difficulty or network hashrate | Blank required; mutually exclusive modes so the same network input is not applied twice. Difficulty is hashes of expected work per block; hashrate is hashes/second. Require positive finite values. |
| Expected total block reward | XMR per network block | Blank required; 0 is a valid sensitivity case; reject negatives. Label as **emission plus transaction fees, before any pool fee**, if the supplied value is intended to represent the full coinbase reward. |
| Display currency | ISO currency code, initially GBP | GBP default. Proposed initial set: GBP, USD, EUR, matching the existing electricity tool. One selector applies to the tariff, XMR price and fiat results; it performs no FX conversion. State that changing the selector changes the interpretation/labels of manually entered fiat values. |

The proposed numeric caps are conservative input/overflow guards, **not estimates of current network conditions**. Final caps and accessible validation copy should be reviewed alongside implementation and edge-case tests. Reject blank, malformed, negative, non-finite and over-cap fields before showing a numeric result. Reuse the existing parser only if its grouping/decimal ambiguity is made clear and tests cover the chosen behavior.

### Input defaults and assumptions

- There are no example CPU presets and no “typical” hashrate or power claims. Hardware, firmware, XMRig version, thread configuration, memory, power limits, cooling and measurement duration can change observed results; the existing [low-hashrate checklist](/troubleshoot/xmrig-low-hashrate/) already warns against treating unlike hashrates as comparable.
- The user enters the network value, block reward and XMR price. Put the value’s unit, source/date notes and assumption label beside results. No hidden static network default.
- The block interval constant should be `120 seconds` only while that remains the Monero target stated in the reviewed technical docs. Keep it named and documented in the calculation module; source/version it and revisit after protocol changes. Monero’s current technical specification states a 2-minute target and says the target may change.

## Auditable mathematical model

Use SI time units and H/s throughout the pure calculation core. Let:

```text
h       = miner hashrate (H/s while active)
P       = whole-system power (W while active)
u       = mining hours per day (h/day)
T       = target network block interval (seconds/block; currently documented as 120 s)
D       = network difficulty (expected hashes/block)
N       = network hashrate (H/s)
R       = expected total block reward (XMR/block; emission + transaction fees)
F       = pool fee fraction (entered percent / 100)
X       = entered fiat price (display currency/XMR)
E       = entered electricity price (display currency/kWh)
```

The active miner performs `h × u × 3,600` hashes in a day. Under a difficulty input:

```text
expected blocks/day = h × u × 3,600 / D
```

Difficulty is a work amount, **not a hashrate**. For a network-hashrate input, use the same expected-work relationship through expected network work per target block:

```text
expected network work/block = N × T
expected blocks/day = h × u × 3,600 / (N × T)
```

For a miner active all 24 hours, this is equivalently `(h / N) × (86,400 / T)`; at the current documented target, that is 720 expected network blocks/day. With a difficulty value consistent with `D ≈ N × T`, both modes must return the same estimate. The formula is an expected share of network work, not a claim that a fractional block was found. Monero adjusts difficulty each block and documents the two-minute target; implementations should keep difficulty units and target-time conversion explicit. See [Monero technical specs](https://docs.getmonero.org/technical-specs/) and the [Monero difficulty implementation](https://github.com/monero-project/monero/blob/master/src/cryptonote_basic/difficulty.cpp).

Daily and horizon calculations:

```text
miner hashes/day                 = h × u × 3,600
expected network block share/day = miner hashes/day / D
                                  OR miner hashes/day / (N × T)
gross expected XMR/day           = expected block share/day × R
pool fee XMR/day                 = gross expected XMR/day × F
net expected XMR/day             = gross expected XMR/day × (1 − F)
gross revenue/day                = gross expected XMR/day × X
pool fee value/day               = pool fee XMR/day × X
net revenue/day                  = net expected XMR/day × X
energy/day (kWh)                 = (P / 1,000) × u
electricity expense/day          = energy/day × E
operating balance/day            = net revenue/day − electricity expense/day
break-even tariff                = net revenue/day / energy/day, when energy/day > 0
```

For each result `q` in the daily outputs:

```text
30-day projection  = q × 30     (a fixed 30-day period, not a calendar month)
365-day projection = q × 365    (fixed year; no leap-year adjustment)
```

There is no compounding, difficulty growth, price change or uptime variability in the period multipliers. Show **daily / 30 days / 365 days** with the selected horizon clearly labelled.

**Synthetic unit check, not a typical or current network example:** let `h = 10,000 H/s`, `u = 24`, `N = 500,000,000,000 H/s`, `T = 120 s` and user-entered `R = 0.6 XMR`. Then the miner performs 864,000,000 hashes/day; `D = N × T = 60,000,000,000,000 hashes/block`; expected block share is `0.0000144/day`; gross expected reward is `0.00000864 XMR/day` before any fee. Both network input modes must produce the same result for these equivalent `D` and `N` values. These numbers are a formula check only, not defaults or a prediction.

## Reward and tail emission policy

Do not hardcode a reward. Monero’s tail emission began in May 2022; the project describes a base reward of 0.6 XMR per two-minute block, while its tail-emission page says block rewards are 0.6 XMR or less due to block-size penalties. Transaction fees are additional to newly emitted coins in the miner’s coinbase reward. The current value should be read from recent block data if ever added as optional sourced data, not copied into a timeless default. See [Tail Emission](https://www.getmonero.org/resources/moneropedia/tail-emission.html), [technical specs](https://docs.getmonero.org/technical-specs/) and the [Monero RPC block-data reference](https://docs.getmonero.org/rpc-library/monerod-rpc/) (coinbase reward and emission/fee fields), checked 9 October 2026.

For manual mode, explain whether `R` means a simple 0.6 XMR subsidy assumption or a user-entered estimate of total reward including fees. Prefer a single full-reward field in the UI with that distinction in helper text. A 0.6 input is not guaranteed current block income: penalties and fees can move the full coinbase reward above or below it. No app should be told that 0.6 is live.

## Rounding and currency display

- Keep full internal precision through all stages. Do not round XMR before converting it to fiat or subtracting pool fees/electricity.
- Display fiat with a locale-aware currency formatter, normally two decimals; retain extra significant digits for very small non-zero costs or results so values do not misleadingly read as exactly zero. Keep a negative sign on loss values, including amounts smaller than one minor currency unit.
- Display small expected XMR amounts with enough precision to compare daily results (recommend up to 12 fractional digits, with compact scientific notation only below that display threshold). Explain that expected values can be fractional below the atomic-unit/payout granularity and do not predict a spendable payment. Monero’s smallest denomination is 1e-12 XMR; an expected value is an average, not a transaction amount.
- Currency selection formats and labels fiat amounts only; it does not fetch or apply exchange rates. Re-enter the tariff and XMR price in the selected currency after switching.

## Edge-case behavior

| Case | Expected result |
| --- | --- |
| Any required input missing | Keep results as placeholders; show concise field-specific errors or a neutral “enter assumptions” prompt. Never substitute a hidden default. |
| `h = 0` | Valid; expected XMR/revenue are zero. Costs still follow power/runtime/rate. |
| `P = 0` | Valid; energy/cost are zero. Break-even tariff is “Not defined at zero energy,” not infinity or a fake value. |
| `E = 0` | Valid; electricity expense is zero. Do not label this “free power” unless the user supplied zero; bill standing charges remain excluded. |
| `u = 0` | Valid; daily hashes, expected XMR, energy and costs are zero. Break-even is not defined at zero energy. |
| `D = 0`, `N = 0`, negative network input | Invalid; never divide by zero or imply infinite earnings. |
| `R = 0` or `X = 0` | Valid sensitivity scenarios; XMR may still be earned when price is zero, but fiat revenue is zero. |
| `F = 0%` / `100%` | Valid endpoints. At 100%, net pool payout is zero. Values outside 0–100 are invalid. |
| Negative inputs, malformed strings, NaN/Infinity, over-bound values | Reject before calculation; leave outputs non-numeric and explain the field error. |
| Decimal inputs | Accept finite decimal H/s, watts, rate, hours, fee and XMR values. Do not round on input. |
| Very small expected values | Preserve sign and magnitude using the display policy above; identify them as expectations, not payout guarantees. |
| Break-even denominator is zero | Display “Not defined” for zero energy use. If inputs are missing/invalid, do not calculate it. |

All bounds are implementation guards, not guidance or live limits. Tests must exercise min/max, just-outside values, very small values, multiplication limits and every zero case. If any valid cap combination can overflow to a non-finite intermediate, narrow the cap or use a safer numeric strategy before release.

## Economic limitations shown beside results

The result section and an expanded “How to read this estimate” note should say that:

- Mining rewards are probabilistic; expected value does not mean realized income or a guaranteed payout.
- Solo mining is not modeled. Pool payouts vary by fee, scheme, payout threshold, share luck, rejected/stale shares, pool downtime and pool policy.
- Network difficulty/hashrate, block rewards/fees, miner hashrate, uptime, electricity use and XMR market price change. The entered inputs are held constant over every horizon.
- Whole-system wattage is user-measured; CPU-reported power may omit the rest of the computer and PSU losses.
- Electricity price is a simple per-kWh tariff. Standing charges, time-of-use schedules, taxes and bill-specific charges are excluded.
- Operating balance subtracts only the modeled electricity expense and pool fee. Hardware purchase, depreciation, cooling overhead, maintenance, other network/computer costs and tax are excluded. It is not a complete profit or return-on-investment calculation.
- A negative result remains visible and a positive result is still not a promise of profit.

Avoid “earn,” “guaranteed,” “real profit,” “passive income,” investment language, profitability claims about Monero generally, and any claim that Ember itself mines or produces the result.

## Data sourcing: choose manual inputs for v1

| Approach | Reliability and freshness | Privacy / failure | Maintenance, cost and static-hosting fit | Decision |
| --- | --- | --- | --- | --- |
| Manual assumptions | Values may be stale or mistyped, but their owner and units are visible; reproducible scenarios are possible | No external request; blank values make missing data explicit | No API keys, server, quota, cache or availability dependency; ideal for static Astro and offline-like local math | **Use for v1.** Pair with source/date labels and validation. |
| Optional user-triggered retrieval | Can be fresher, but endpoint/market coverage and availability vary | A user request discloses at least network metadata to the provider; expose the provider and exact fields fetched. Failure must leave manual inputs usable | Requires CORS/serverless proxy decisions, source attribution, caching/TTL, quotas and maintenance. Static hosting can call public APIs but browser keys and provider CORS are risks | Consider only after users need it and a stable source contract is reviewed. |
| Automatically refreshed values | Appears current, but stale cache, mismatched sources, price currency, block reward sampling and outages can be hidden | Network requests happen without an explicit action; visitors connect to providers or a proxy | Highest monitoring, caching, availability and change cost; more complex operational/privacy behavior | Reject for v1; it conflicts with the manual-first trust goal. |

If live values are added later, keep them outside the math core: a separate user-triggered data adapter returns typed values `{value, unit, source, observedAt}`; the pure calculator accepts exactly the same numeric inputs whether typed manually or populated from that adapter. Show source, observation time, cache age and stale/error state. Allow override; do not block manual calculation. Prefer a same-origin cache only if its operator, retention, rate limits and privacy effects are documented. Never request wallet addresses or pool credentials.

## User experience specification

1. **Your mining setup:** measured hashrate (H/s), whole-system wall watts, hours/day and electricity price/kWh.
2. **Network and reward assumptions:** mutually exclusive difficulty/network-hashrate mode; block reward (XMR/block); XMR price and pool fee. Keep source/date/context next to these user-entered assumptions.
3. **Estimated results:** XMR before and after modeled pool fee, gross revenue, fee value, electricity use/cost, and electricity-only operating balance for day, fixed 30 days and 365 days. Show break-even electricity tariff and its zero-energy condition.
4. **Interpretation:** a short expected-value/probability note beside the primary result, with limits and pool payout distinction in a concise disclosure.
5. **Method:** formulas and definitions below the tool, plus one carefully labelled synthetic worked example only if user testing shows it helps.

Use an ordinary responsive form/results layout consistent with the graphite/orange calculator style: native fields, explicit units, no chart library. A simple labelled stacked bar of net expected revenue versus electricity cost could clarify the difference only if it scales around zero and keeps losses visible; first test a text-first table because it is clearer, cheaper and more accessible. Do not use animated counters, fake live charts or decorative dashboard tiles. Keep actual results and their assumptions in server-rendered/static page text where possible; calculate locally after required values are supplied.

Inline guidance should be concise: “Hashrate” = measured hashes per second under the selected mining setup; “difficulty” = expected network work per block; “block reward” = new emission plus transaction fees for a block; “pool fee” = entered share deducted from expected gross reward; “energy” = watts × active hours converted to kWh; “expected rewards” = long-run share estimate, not a payout schedule; “break-even tariff” = modeled net reward value divided by modeled energy. Link out to longer guides rather than making each label a paragraph.

## Privacy and technical architecture proposal

- No accounts, backend arithmetic, cookies, local storage, or URL/query-string encoding of settings. Inputs remain in page memory unless product research later justifies opt-in saving.
- No third-party API calls in M10B. Ensure the client script does not transmit field values. Currency formatting uses `Intl.NumberFormat`; no exchange rate is fetched.
- Add an isolated pure function module, e.g. `src/lib/mining-economics.mjs`, with unit-bearing parameters and deterministic outputs. Add a small route-only vanilla script as with the electricity calculator; keep ordinary routes free of client code.
- Keep static Astro rendering, native labelled controls, error associations, `aria-invalid`, a valid named results region, a polite concise status update, keyboard focus and responsive CSS. Do not move the website to React or share desktop mining control code.
- Ensure output names distinguish **gross expected XMR**, **pool fee**, **net expected XMR**, **gross revenue**, **electricity cost** and **operating balance**. Negative values stay negative; source assumptions remain visible after calculations.

## Deterministic test plan for M10B

- Golden calculation with hand-checkable inputs; independent expected results for daily, 30-day and 365-day quantities.
- Equivalence of difficulty and network-hashrate modes when `D = N × 120`; additionally show that entering `D` as if it were H/s produces a different, caught unit-specific result.
- Time scaling, pool fee 0/100%, XMR price 0, block reward 0, zero miner hashrate, zero watts, zero hours, zero tariff, loss/negative operating balance and break-even denominator behavior.
- Reject missing required input, zero/negative difficulty, zero/negative network hashrate, negative values, fee >100%, malformed decimal/grouped formats, NaN/Infinity and each just-outside boundary.
- Preserve precision until final formatting; check small expected-XMR display, tiny positive and negative fiat results, and currency labels without implying FX conversion.
- UI-level assertions for label/units, blank defaults, mutually exclusive network mode, invalid field wiring and results accessible name. Verify local-only behavior and no persistence/network requests for form input.
- Check responsive interaction and focus at narrow/mobile/tablet/desktop widths. No large test framework dependency is needed; use Node's built-in test runner for pure math and the project's existing static checks/build for integration.

## Source notes

Research checked 9 October 2026. Current protocol details are not frozen product defaults. Primary sources: [Monero Technical Specs](https://docs.getmonero.org/technical-specs/) (2-minute block target, per-block difficulty retarget, tail emission); [Monero Tail Emission](https://www.getmonero.org/resources/moneropedia/tail-emission.html) (0.6 XMR or less due to penalties); [Monero RPC reference](https://docs.getmonero.org/rpc-library/monerod-rpc/) (block reward/emission/fee fields); [Monero difficulty implementation](https://github.com/monero-project/monero/blob/master/src/cryptonote_basic/difficulty.cpp); [Monero mining modes](https://docs.getmonero.org/interacting/mining/); and [P2Pool payout behavior](https://github.com/SChernykh/p2pool#how-payouts-work-in-p2pool).
