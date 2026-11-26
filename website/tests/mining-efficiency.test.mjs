import test from 'node:test';
import assert from 'node:assert/strict';
import { compareEfficiency, normalizeHashrate, interpretEfficiency, efficiencyWinner, formatEfficiencyNumber, formatEfficiencyCost, EFFICIENCY_LIMITS } from '../src/lib/mining-efficiency.mjs';

const example = () => ({ a: { hashrate: 8500, unit: 'H/s', watts: 145 }, b: { hashrate: 7900, unit: 'H/s', watts: 105 }, tariff: 0.25, hours: 24, currency: 'GBP' });
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9 * Math.max(1, Math.abs(expected)), `${actual} ≈ ${expected}`);

test('normalizes both units and established locale number conventions before comparison', () => {
  assert.equal(normalizeHashrate('8,500', 'H/s'), 8500);
  assert.equal(normalizeHashrate('8.5', 'kH/s'), 8500);
  assert.equal(normalizeHashrate('8,5', 'kH/s'), 8500);
  const input = example(); input.b.hashrate = '7.9'; input.b.unit = 'kH/s';
  assert.deepEqual(compareEfficiency(input), compareEfficiency(example()));
  assert.throws(() => normalizeHashrate(1, 'MH/s'), RangeError);
});

test('independent hypothetical arithmetic: efficiencies, energy and fixed-period costs', () => {
  const r = compareEfficiency(example());
  assert.deepEqual(r.errors, {});
  near(r.a.efficiency, 8500 / 145); near(r.b.efficiency, 7900 / 105);
  near(r.a.dailyEnergyKWh, 3.48); near(r.b.dailyEnergyKWh, 2.52);
  for (const [days, a, b] of [[1, .87, .63], [30, 26.10, 18.90], [365, 317.55, 229.95]]) {
    near(r.a.costs[days], a); near(r.b.costs[days], b);
  }
});

test('B relative to A percentages and signed absolute differences retain full precision', () => {
  const c = compareEfficiency(example()).comparison;
  near(c.hashrateChangePercent, -7.058823529411762);
  near(c.powerChangePercent, -27.586206896551722);
  near(c.efficiencyChangePercent, 28.3473389355742);
  assert.equal(c.hashrateDifference, -600); assert.equal(c.powerDifference, -40);
  near(c.energyDifference, -.96);
  for (const [days, expected] of [[1, -.24], [30, -7.2], [365, -87.6]]) near(c.costDifferences[days], expected);
});

test('identical configurations and zero tariff/runtime stay meaningful without division by zero', () => {
  const input = example(); input.b = { ...input.a };
  const equal = compareEfficiency(input);
  for (const field of ['hashrateDifference', 'powerDifference', 'hashrateChangePercent', 'powerChangePercent', 'efficiencyChangePercent', 'energyDifference']) assert.equal(equal.comparison[field], 0);
  assert.equal(efficiencyWinner(equal), 'Equal measured efficiency');
  assert.match(interpretEfficiency(equal), /identical/);
  for (const field of ['tariff', 'hours']) {
    const input = example(); input[field] = 0;
    const zero = compareEfficiency(input);
    assert.deepEqual(zero.errors, {});
    assert.equal(zero.a.costs[365], 0); assert.equal(zero.comparison.costDifferences[365], 0);
    assert.equal(zero.a.efficiency, equal.a.efficiency);
    assert.match(interpretEfficiency(zero), /cost is zero/);
  }
});

test('invalid and missing measurements clear dependent results and reject unrecognized units', () => {
  for (const field of ['hashrate', 'watts']) for (const invalid of ['', undefined, null, NaN, Infinity, -1, 0, 'bad', '1e999', Number.MIN_VALUE, '9'.repeat(400)]) {
    const input = example(); input.a[field] = invalid;
    const r = compareEfficiency(input);
    assert.equal(r.a, null); assert.equal(r.comparison, null); assert.ok(r.b);
    assert.ok(Object.keys(r.errors).length);
  }
  for (const unit of ['MH/s', '', null, 'toString', '__proto__']) {
    const input = example(); input.a.unit = unit;
    assert.equal(compareEfficiency(input).a, null);
  }
  assert.equal(compareEfficiency().comparison, null);
});

test('partial validity: tariff and currency suppress costs; runtime also suppresses energy', () => {
  for (const field of ['tariff', 'hours', 'currency']) for (const value of ['', 'invalid', -1, Infinity, null]) {
    const input = example(); input[field] = value;
    const r = compareEfficiency(input);
    assert.ok(r.comparison); assert.ok(r.errors[field]);
    assert.equal(r.a.efficiency, 8500 / 145);
    assert.equal(r.a.costs, null); assert.equal(r.comparison.costDifferences, null);
    if (field === 'hours') assert.equal(r.a.dailyEnergyKWh, null);
    else near(r.a.dailyEnergyKWh, 3.48);
  }
  const input = example(); input.hours = 25; assert.ok(compareEfficiency(input).errors.hours);
  input.hours = 12; input.tariff = 1001; assert.ok(compareEfficiency(input).errors.tariff);
});

test('broad numeric boundaries prevent overflow while preserving tiny non-zero results', () => {
  const input = example();
  input.a = { hashrate: EFFICIENCY_LIMITS.minimum, watts: EFFICIENCY_LIMITS.watts, unit: 'H/s' };
  input.b = { hashrate: EFFICIENCY_LIMITS.hashrateHs, watts: EFFICIENCY_LIMITS.minimum, unit: 'H/s' };
  input.tariff = EFFICIENCY_LIMITS.tariff;
  const r = compareEfficiency(input);
  assert.deepEqual(r.errors, {});
  const checkFinite = obj => { for (const v of Object.values(obj)) if (typeof v === 'number') assert.ok(Number.isFinite(v)); else if (v && typeof v === 'object') checkFinite(v); };
  checkFinite(r);
  assert.notEqual(formatEfficiencyNumber(r.a.efficiency), '0');
  input.b.hashrate *= 2; assert.ok(compareEfficiency(input).errors.bHashrate);
  input.b = { hashrate: 1e9, watts: EFFICIENCY_LIMITS.watts * 2, unit: 'kH/s' };
  assert.ok(compareEfficiency(input).errors.bWatts);
});

test('display rounding, signs and supported currencies do not leak invalid values or negative zero', () => {
  assert.equal(formatEfficiencyNumber(58.620689655), '58.62');
  assert.equal(formatEfficiencyNumber(28.347338935, true), '+28.35');
  assert.equal(formatEfficiencyNumber(-0, true), '0');
  assert.notEqual(formatEfficiencyNumber(-.00000001, true), '-0');
  assert.equal(formatEfficiencyNumber(NaN), '—');
  assert.equal(formatEfficiencyCost(-0, 'GBP', true), formatEfficiencyCost(0, 'GBP'));
  for (const [currency, symbol] of [['GBP', '£'], ['USD', '$'], ['EUR', '€']]) {
    const input = example(); input.currency = currency;
    const r = compareEfficiency(input); assert.deepEqual(r.errors, {});
    near(r.a.costs[1], .87);
    assert.ok(formatEfficiencyCost(.87, currency).includes(symbol));
    assert.ok(formatEfficiencyCost(.87, currency, true).startsWith('+'));
  }
  assert.equal(formatEfficiencyCost(1, 'BAD'), '—');
});

test('deterministic interpretation covers throughput, efficiency and power trade-offs', () => {
  const cases = [
    [7900, 105, /fewer hashes per second but uses less energy per hash/],
    [10000, 150, /more efficient.*more hashes per second and uses more power/],
    [10000, 200, /power consumption increases proportionally more/],
    [8500, 105, /Hashrate is equal; B uses less power/],
    [8500, 180, /Hashrate is equal; B uses more power/],
    [9000, 145, /Power is equal; B produces more/],
    [8000, 145, /Power is equal; B produces fewer/],
    [17000, 290, /equal measured efficiency/],
    [7000, 140, /less efficient.*fewer hashes per second and uses less power/],
  ];
  for (const [hashrate, watts, expected] of cases) {
    const input = example(); input.b.hashrate = hashrate; input.b.watts = watts;
    assert.match(interpretEfficiency(compareEfficiency(input)), expected);
  }
  assert.match(interpretEfficiency(compareEfficiency(example())), /reduces electricity expenditure and mining throughput/);
});
