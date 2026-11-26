import { parseNumber, formatCost } from './electricity-cost.mjs';

export const CURRENCIES = Object.freeze(['GBP', 'USD', 'EUR']);
export const HASHRATE_UNITS = Object.freeze({ 'H/s': 1, 'kH/s': 1000 });
// Broad arithmetic bounds, not hardware-performance claims. Positive floors keep
// ratios and percentage denominators well away from floating-point underflow.
export const EFFICIENCY_LIMITS = Object.freeze({ minimum: 0.000001, hashrateHs: 1e12, watts: 1e9, tariff: 1000, hours: 24 });

function read(value, minimum, maximum) {
  if (String(value ?? '').length > 80) return { error: 'This number exceeds the supported range.' };
  const parsed = typeof value === 'number'
    ? { value, error: Number.isFinite(value) ? null : 'Enter a finite number.' }
    : parseNumber(value);
  if (parsed.error) return parsed;
  if (parsed.value < minimum || parsed.value > maximum) {
    return { error: `Enter a value from ${minimum.toLocaleString('en-GB', { maximumSignificantDigits: 6 })} to ${maximum.toLocaleString('en-GB')}.` };
  }
  return parsed;
}

export function normalizeHashrate(value, unit) {
  if (!Object.hasOwn(HASHRATE_UNITS, unit)) throw new RangeError('Choose H/s or kH/s.');
  const parsed = read(value, EFFICIENCY_LIMITS.minimum / HASHRATE_UNITS[unit], EFFICIENCY_LIMITS.hashrateHs / HASHRATE_UNITS[unit]);
  if (parsed.error) throw new RangeError(parsed.error);
  return parsed.value * HASHRATE_UNITS[unit];
}

// Validate independent quantities separately so an invalid cost assumption never
// invalidates measured computational efficiency, or a tariff invalidates energy.
export function compareEfficiency(input = {}) {
  const errors = {};
  const configurations = {};
  for (const key of ['a', 'b']) {
    const source = input[key] ?? {};
    let hashrateHs;
    if (!Object.hasOwn(HASHRATE_UNITS, source.unit)) errors[`${key}Unit`] = 'Choose H/s or kH/s.';
    else {
      try { hashrateHs = normalizeHashrate(source.hashrate, source.unit); }
      catch (error) { errors[`${key}Hashrate`] = error.message; }
    }
    const power = read(source.watts, EFFICIENCY_LIMITS.minimum, EFFICIENCY_LIMITS.watts);
    if (power.error) errors[`${key}Watts`] = power.error;
    configurations[key] = hashrateHs !== undefined && !power.error
      ? { hashrateHs, watts: power.value, efficiency: hashrateHs / power.value }
      : null;
  }
  const hours = read(input.hours, 0, EFFICIENCY_LIMITS.hours);
  const tariff = read(input.tariff, 0, EFFICIENCY_LIMITS.tariff);
  if (hours.error) errors.hours = hours.error;
  if (tariff.error) errors.tariff = tariff.error;
  if (!CURRENCIES.includes(input.currency)) errors.currency = 'Choose GBP, USD or EUR.';
  for (const config of Object.values(configurations)) {
    if (!config) continue;
    config.dailyEnergyKWh = hours.error ? null : config.watts / 1000 * hours.value;
    config.costs = config.dailyEnergyKWh === null || tariff.error || errors.currency ? null
      : Object.fromEntries([1, 30, 365].map(days => [days, config.dailyEnergyKWh * tariff.value * days]));
  }
  const { a, b } = configurations;
  const comparison = !a || !b ? null : {
    hashrateDifference: b.hashrateHs - a.hashrateHs,
    powerDifference: b.watts - a.watts,
    hashrateChangePercent: (b.hashrateHs / a.hashrateHs - 1) * 100,
    powerChangePercent: (b.watts / a.watts - 1) * 100,
    efficiencyChangePercent: (b.efficiency / a.efficiency - 1) * 100,
    energyDifference: a.dailyEnergyKWh === null || b.dailyEnergyKWh === null ? null : b.dailyEnergyKWh - a.dailyEnergyKWh,
    costDifferences: !a.costs || !b.costs ? null : Object.fromEntries([1, 30, 365].map(days => [days, b.costs[days] - a.costs[days]])),
  };
  return { a, b, comparison, errors, currency: input.currency };
}

// Tolerance only identifies arithmetic equality; calculations retain precision.
const direction = (percent) => Math.abs(percent) < 1e-10 ? 0 : Math.sign(percent);
export function interpretEfficiency(result) {
  const c = result.comparison;
  if (!c) return 'Enter sustained hashrate and average whole-PC wall power for both configurations.';
  const h = direction(c.hashrateChangePercent);
  const p = direction(c.powerChangePercent);
  const e = direction(c.efficiencyChangePercent);
  let summary = e === 0 ? 'Both configurations have equal measured efficiency.'
    : `Configuration B is ${e > 0 ? 'more' : 'less'} efficient than A: it produces ${e > 0 ? 'more' : 'fewer'} hashes per joule.`;
  if (h === 0 && p === 0) summary += ' Measured hashrate and power are identical.';
  else if (h === 0) summary += ` Hashrate is equal; B uses ${p > 0 ? 'more' : 'less'} power.`;
  else if (p === 0) summary += ` Power is equal; B produces ${h > 0 ? 'more' : 'fewer'} hashes per second.`;
  else if (h > 0 && e < 0) summary += ' B produces more hashes per second, but power consumption increases proportionally more.';
  else if (h < 0 && e > 0) summary += ' B produces fewer hashes per second but uses less energy per hash.';
  else summary += ` B produces ${h > 0 ? 'more' : 'fewer'} hashes per second and uses ${p > 0 ? 'more' : 'less'} power.`;
  if (c.costDifferences) {
    if (result.a.costs[1] === 0 && result.b.costs[1] === 0) summary += ' Electricity cost is zero at the entered tariff and runtime; efficiency is unchanged by these assumptions.';
    else if (c.costDifferences[1] < 0) summary += ` B reduces electricity expenditure${h < 0 ? ' and mining throughput' : ''}.`;
    else if (c.costDifferences[1] > 0) summary += ' B increases electricity expenditure.';
  }
  return summary;
}

export function efficiencyWinner(result) {
  if (!result.comparison) return 'Awaiting measurements';
  const d = direction(result.comparison.efficiencyChangePercent);
  return d === 0 ? 'Equal measured efficiency' : `Configuration ${d > 0 ? 'B' : 'A'} has greater efficiency`;
}

export function formatEfficiencyNumber(value, signed = false) {
  if (!Number.isFinite(value)) return '—';
  const clean = Object.is(value, -0) ? 0 : value;
  const magnitude = Math.abs(clean);
  const options = magnitude > 0 && (magnitude < 0.01 || magnitude >= 1e9)
    ? { maximumSignificantDigits: 4, ...(magnitude < 0.0001 || magnitude >= 1e9 ? { notation: 'scientific' } : {}) }
    : { maximumFractionDigits: 2 };
  return new Intl.NumberFormat('en-GB', { ...options, signDisplay: signed ? 'exceptZero' : 'auto' }).format(clean);
}

export function formatEfficiencyCost(value, currency, signed = false) {
  if (!Number.isFinite(value) || !CURRENCIES.includes(currency)) return '—';
  const clean = Object.is(value, -0) ? 0 : value;
  return `${signed && clean > 0 ? '+' : ''}${formatCost(clean, currency)}`;
}
