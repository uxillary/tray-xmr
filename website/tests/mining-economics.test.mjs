import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMiningEconomics, calculateMiningProjections, BLOCK_TARGET_SECONDS, formatMoney, formatXmr, parseNumber } from '../src/lib/mining-economics.mjs';
import { readFileSync } from 'node:fs';

const base = Object.freeze({ minerHashrate: 1000, wallPowerWatts: 100, electricityPricePerKwh: 0.2, hoursPerDay: 24, poolFeePercent: 1, xmrPrice: 150, expectedRewardPerBlock: 0.6, currency: 'GBP', networkBasis: 'difficulty', networkDifficulty: 86_400_000_000, networkHashrate: null });
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < Math.max(1e-12, Math.abs(expected) * 1e-12), `${actual} ≉ ${expected}`);

test('difficulty and network-hashrate approaches agree when difficulty is rate × target interval', () => {
  const diff = calculateMiningEconomics(base, 1);
  const byRate = calculateMiningEconomics({ ...base, networkBasis: 'hashrate', networkDifficulty: null, networkHashrate: base.networkDifficulty / BLOCK_TARGET_SECONDS }, 1);
  close(diff.expectedBlocks, 1 / 1000);
  close(byRate.expectedBlocks, diff.expectedBlocks);
});

test('applies reward, pool fee, whole-system energy, tariff and break-even tariff', () => {
  const result = calculateMiningEconomics(base, 1);
  close(result.grossXmr, 0.0006);
  close(result.poolFeeXmr, 0.000006);
  close(result.netXmr, 0.000594);
  close(result.grossRevenue, 0.09);
  close(result.poolFeeValue, 0.0009);
  close(result.revenueAfterPoolFees, 0.0891);
  close(result.energyKwh, 2.4);
  close(result.electricityCost, 0.48);
  close(result.estimatedNet, -0.3909);
  close(result.breakEvenTariff, 0.037125);
});

test('the published hypothetical calculator example matches the implemented model', () => {
  const example = { ...base, minerHashrate: 1000, wallPowerWatts: 100, hoursPerDay: 24, electricityPricePerKwh: 0.2, poolFeePercent: 1, xmrPrice: 150, expectedRewardPerBlock: 0.6, networkDifficulty: 86_400_000_000 };
  const result = calculateMiningEconomics(example, 1);
  close(result.expectedBlocks, 0.001);
  close(result.grossXmr, 0.0006);
  close(result.poolFeeXmr, 0.000006);
  close(result.netXmr, 0.000594);
  close(result.revenueAfterPoolFees, 0.0891);
  close(result.energyKwh, 2.4);
  close(result.electricityCost, 0.48);
  close(result.estimatedNet, -0.3909);

  const page = readFileSync(new URL('../src/pages/tools/monero-mining-profitability-calculator.astro', import.meta.url), 'utf8');
  assert.match(page, /86,400,000 ÷ 86,400,000,000 = 0\.001/);
  assert.match(page, /0\.0006 − 0\.000006 = 0\.000594 XMR/);
  assert.match(page, /£0\.0891 − £0\.48 = <strong>−£0\.3909 per day<\/strong>/);
  assert.match(page, /invented to demonstrate the implemented arithmetic/);
});

test('provides fixed daily, 30-day and 365-day projections from the same model', () => {
  const [daily, month, year] = calculateMiningProjections(base);
  assert.deepEqual([daily.days, month.days, year.days], [1, 30, 365]);
  close(month.energyKwh, daily.energyKwh * 30);
  close(year.netXmr, daily.netXmr * 365);
});

test('handles zero assumptions and undefined zero-energy break-even without infinity', () => {
  const result = calculateMiningEconomics({ ...base, minerHashrate: 0, wallPowerWatts: 0, electricityPricePerKwh: 0 }, 1);
  assert.equal(result.expectedBlocks, 0);
  assert.equal(result.estimatedNet, 0);
  assert.equal(result.breakEvenTariff, null);
  const energyWithoutTariff = calculateMiningEconomics({ ...base, electricityPricePerKwh: 0 }, 1);
  assert.equal(energyWithoutTariff.electricityCost, 0);
  const zeroPower = calculateMiningEconomics({ ...base, wallPowerWatts: 0 }, 1);
  assert.equal(zeroPower.breakEvenTariff, null);
  assert.ok(zeroPower.estimatedNet > 0);
});

test('rejects invalid, exclusive-basis, unsupported and out-of-range assumptions', () => {
  for (const change of [
    { minerHashrate: -1 }, { minerHashrate: Infinity }, { xmrPrice: NaN }, { poolFeePercent: 100.1 },
    { networkDifficulty: 0 }, { networkHashrate: 1 },
    { currency: 'CAD' }, { electricityPricePerKwh: 1001 }, { hoursPerDay: 24.1 }, { networkBasis: 'combined' },
  ]) assert.throws(() => calculateMiningEconomics({ ...base, ...change }, 1), RangeError);
  assert.throws(() => calculateMiningEconomics({ ...base, networkDifficulty: null, networkHashrate: 1000 }, 1), RangeError);
  assert.throws(() => calculateMiningEconomics(base, 0), RangeError);
  assert.throws(() => calculateMiningEconomics(base, 366), RangeError);
});

test('formats tiny non-zero XMR and fiat estimates without showing a rounded zero', () => {
  const tiny = formatXmr(1e-15);
  assert.match(tiny, /1\.000e-15/);
  assert.match(tiny, /below 1 piconero/);
  assert.notEqual(formatMoney(1e-9, 'GBP'), '£0.00');
  assert.match(formatXmr(0.000000000001), /XMR/);
  assert.equal(parseNumber('0,25').value, 0.25);
  const tinyExpected = calculateMiningEconomics({ ...base, minerHashrate: 1e-9, networkDifficulty: 1e18, wallPowerWatts: 0 }, 1);
  assert.match(formatXmr(tinyExpected.netXmr), /below 1 piconero/);
});

test('route starts numeric inputs blank and calculations have no network or persistence calls', () => {
  const page = readFileSync(new URL('../src/pages/tools/monero-mining-profitability-calculator.astro', import.meta.url), 'utf8');
  const script = readFileSync(new URL('../src/scripts/mining-profitability.js', import.meta.url), 'utf8');
  const inputs = [...page.matchAll(/<input\b[^>]*type="text"[^>]*>/g)].map(([input]) => input);
  assert.ok(inputs.length >= 9);
  assert.ok(inputs.every((input) => !/\bvalue=/.test(input)));
  assert.match(page, /aria-labelledby="mining-results-title"/);
  assert.match(page, /id="mining-results-title"/);
  assert.doesNotMatch(script, /\b(fetch|XMLHttpRequest|localStorage|sessionStorage|document\.cookie)\b/);
});
