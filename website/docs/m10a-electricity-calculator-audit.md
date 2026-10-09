# M10A — Electricity calculator audit

**Audit snapshot:** branch `main`, commit `5bc830688b6d94967762b0522667eefef70793aa`; existing working-tree changes were preserved. Review is limited to the public website. No calculator code was changed in M10A.

## Current implementation

The tool lives at `/tools/electricity-cost-calculator/`. Its static Astro page has one small route-scoped vanilla client module, `src/scripts/electricity-calculator.js`, and a pure helper module, `src/lib/electricity-cost.mjs`. The tools hub links to it and explicitly distinguishes the calculator from future mining scenario tools. The existing tool intentionally calculates energy and electricity costs only; it does not estimate mining income or profitability.

## What works well

- The model keeps the physical steps distinct: whole-system watts → kWh → tariff-based electricity cost. The page explains that CPU package power is not whole-computer wall draw and recommends a wall measurement for a household estimate.
- Daily energy uses the selected daily runtime; the selected period uses the entered day count; the yearly view always uses 365 days. Pence/kWh is converted to GBP/kWh, while GBP/USD/EUR are presentation currencies only. The page states that no currency conversion takes place.
- Calculation retains JavaScript number precision and rounds at presentation. Normal costs show two decimal places; small non-zero values retain additional precision, and extremely small values use scientific notation rather than disappearing as zero.
- The UI has inline validation for missing, malformed, negative and over-limit inputs. It accepts decimal commas and common grouped numbers, limits runtime to 24 hours, and requires an integer period in the browser UI. Zero watts, zero tariff and zero runtime are valid scenarios.
- The native labelled text/select controls are keyboard-operable. Error text is associated with fields, invalid state is exposed with `aria-invalid`, the summary has a polite live region, and focused controls have a visible orange outline. Reset uses the native form reset plus a scheduled recalculation.
- The calculation module contains no network or storage calls. Values are calculated in the browser and are not submitted or persisted by the tool.
- The page is static-first and the interactive module is route-scoped. At the 506 px browser viewport recorded in `m09b2-browser-qa.md`, its shell, inputs, and result flow stacked into a readable single-column view without horizontal document overflow. CSS separately defines breakpoints at 850 px and 600 px; the M09B.2 browser limitation means those other widths were not rendered in that pass.

## Calculation and validation review

The implemented equations are correct for the described estimate:

```text
kWh per hour = watts / 1,000
kWh per day = kWh per hour × hours per day
kWh per selected period = kWh per hour × hours per day × selected days
kWh per year = kWh per hour × hours per day × 365
cost = kWh × entered price per kWh
```

The pence conversion (`pence / 100`) is dimensionally correct. The JS helper rejects non-finite, negative and over-limit values. `formatEnergy` and `formatCost` only affect display.

| Input | Current UI boundary | Notes |
| --- | --- | --- |
| Whole-system power | 0–20,000 W | Includes the computer as a whole when measured at the wall; CPU package power is not equivalent. |
| Tariff | 0–1,000 currency units/kWh; or 0–100,000 p/kWh | Empty rate is permitted while energy is calculated; costs remain “Enter a rate.” Pence is valid only with GBP. |
| Runtime | 0–24 hours/day | Presets: 24, 12, 8, or custom. |
| Period | Intended 1–365 whole days | The displayed help says this; see confirmed boundary defect below. |
| Currency | GBP, USD or EUR | Changes formatting only; no FX conversion. |

## Confirmed defects

1. **Zero-day period contradicts the stated input contract.** `read()` in `src/scripts/electricity-calculator.js` rejects negative days and days above 365, but does not reject `0`; `calculateElectricity()` also accepts `days: 0`. The field help promises 1–365 days. Entering zero therefore produces a selectable period labelled `0 DAYS` and a zero period total. M10B should enforce the documented minimum and add a regression test. This is a real UI validation mismatch, not a mathematical error for the other periods.
2. **Results section has a broken accessible name reference.** The results `<section>` in `src/pages/tools/electricity-cost-calculator.astro` declares `aria-labelledby="result-title"`, but no element in the page has `id="result-title"`. The results landmark therefore has no name from that reference. M10B should add a visible, appropriately ranked heading with that ID or use a valid existing heading reference.

These are the only confirmed defects from this code audit. No repair was made because M10A is documentation-only.

## Enhancements (not confirmed defects)

- **Clarify the 100 W starting value.** The initial 100 W value is a harmless interface starting value and a later worked example, but it can be mistaken for a recommended or typical whole-system reading. Add a short “example starting value; replace with your wall measurement” cue or make wattage blank. Prefer blank if the page's first result should represent only user-supplied measurements.
- **Improve numeric affordances.** Consider `min`, `max`, `step` hints where useful, while retaining validation because text fields support decimal/grouped locale forms. Do not sacrifice those parsing behaviors just to use native numeric inputs.
- **Clarify the tariff boundary.** The rate-unit selector makes pence exclusive to GBP and the status explains the conflict. A stronger design could disable the pence option for non-GBP or move currency beside the tariff, but the current explicit status is functional.
- **Make 30-day projection intent obvious.** The entered period is already user-selectable and the yearly horizon is fixed at 365 days. Continue to call the selected period “30 days,” not a calendar month.
- **Accessibility verification.** Run a keyboard-only and screen-reader pass on the actual route after the naming repair; current code review and the prior focus screenshot are not a full assistive-technology audit.

## Privacy and limits

There are no wallet, pool, account or device-identifier fields. The client code has no fetch/XHR, analytics or persistence call. Users still provide their own watts, runtime and tariff; the result omits standing charges, time-of-use variation, taxes and other parts of a bill. Currency selection does not convert amounts. Preserve these boundaries in any shared results or extensions.

## Priority order

| Priority | Change | User value | Complexity |
| --- | --- | --- | --- |
| P0 | Reject period values below 1 and test zero | Prevents an input that contradicts the visible contract | Low |
| P0 | Repair the missing results heading/accessible name and test it | Gives assistive technology a meaningful results section | Low |
| P1 | Label 100 W as a replaceable example or blank it | Reduces the chance of treating a placeholder as measured guidance | Low |
| P1 | Run responsive QA at the existing 850/600 px breakpoints and narrow phones | Confirms CSS behavior that the previous browser pane could not expose | Medium |
| P2 | Consider helper text or controls for the GBP-only pence constraint | Makes a currently explained condition more discoverable | Low |

## Files reviewed

`src/pages/tools/electricity-cost-calculator.astro`, `src/scripts/electricity-calculator.js`, `src/lib/electricity-cost.mjs`, `tests/electricity-cost.test.mjs`, `src/styles/electricity-calculator.css`, `src/pages/tools/index.astro`, `src/components/SiteLayout.astro`, the low-hashrate, RandomX memory/cache and CPU-thread articles, `docs/site-strategy.md`, `docs/m05-electricity-calculator.md`, `docs/m09b-product-storytelling.md` and `docs/m09b2-browser-qa.md`.
