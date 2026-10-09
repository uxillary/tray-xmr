import { formatCost, parseNumber } from './electricity-cost.mjs';

export const BLOCK_TARGET_SECONDS = 120;
export const CURRENCIES = Object.freeze(['GBP', 'USD', 'EUR']);
export const MINING_LIMITS = Object.freeze({
  hashrate: 1_000_000_000, watts: 20_000, tariff: 1_000, hours: 24,
  feePercent: 100, xmrPrice: 10_000_000, networkDifficulty: 1e18,
  networkHashrate: 1e16, rewardPerBlock: 10,
});

function requireNumber(name, value, min, max) {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
  if (value < min || value > max) throw new RangeError(`${name} must be between ${min} and ${max}`);
}

export function calculateMiningEconomics(input, days) {
  const { minerHashrate, wallPowerWatts, electricityPricePerKwh, hoursPerDay, poolFeePercent, xmrPrice, expectedRewardPerBlock, currency, networkBasis, networkDifficulty, networkHashrate } = input;
  requireNumber('minerHashrate', minerHashrate, 0, MINING_LIMITS.hashrate);
  requireNumber('wallPowerWatts', wallPowerWatts, 0, MINING_LIMITS.watts);
  requireNumber('electricityPricePerKwh', electricityPricePerKwh, 0, MINING_LIMITS.tariff);
  requireNumber('hoursPerDay', hoursPerDay, 0, MINING_LIMITS.hours);
  requireNumber('poolFeePercent', poolFeePercent, 0, MINING_LIMITS.feePercent);
  requireNumber('xmrPrice', xmrPrice, 0, MINING_LIMITS.xmrPrice);
  requireNumber('expectedRewardPerBlock', expectedRewardPerBlock, 0, MINING_LIMITS.rewardPerBlock);
  requireNumber('days', days, 1, 365);
  if (!Number.isInteger(days)) throw new RangeError('days must be a whole number');
  if (!CURRENCIES.includes(currency)) throw new RangeError('currency is not supported');
  if (networkBasis === 'difficulty') {
    if (networkHashrate !== undefined && networkHashrate !== null) throw new RangeError('provide exactly one network basis');
    requireNumber('networkDifficulty', networkDifficulty, Number.MIN_VALUE, MINING_LIMITS.networkDifficulty);
  } else if (networkBasis === 'hashrate') {
    if (networkDifficulty !== undefined && networkDifficulty !== null) throw new RangeError('provide exactly one network basis');
    requireNumber('networkHashrate', networkHashrate, Number.MIN_VALUE, MINING_LIMITS.networkHashrate);
  } else throw new RangeError('networkBasis must be difficulty or hashrate');

  const activeSeconds = days * hoursPerDay * 3600;
  const minerHashes = minerHashrate * activeSeconds;
  const expectedBlocks = networkBasis === 'difficulty'
    ? minerHashes / networkDifficulty
    : minerHashes / (networkHashrate * BLOCK_TARGET_SECONDS);
  const grossXmr = expectedBlocks * expectedRewardPerBlock;
  const poolFeeXmr = grossXmr * (poolFeePercent / 100);
  const netXmr = grossXmr - poolFeeXmr;
  const grossRevenue = grossXmr * xmrPrice;
  const poolFeeValue = grossRevenue * (poolFeePercent / 100);
  const revenueAfterPoolFees = grossRevenue - poolFeeValue;
  const energyKwh = (wallPowerWatts / 1000) * hoursPerDay * days;
  const electricityCost = energyKwh * electricityPricePerKwh;
  const estimatedNet = revenueAfterPoolFees - electricityCost;
  const breakEvenTariff = energyKwh > 0 ? revenueAfterPoolFees / energyKwh : null;
  const results = { days, activeSeconds, minerHashes, expectedBlocks, grossXmr, poolFeeXmr, netXmr, grossRevenue, poolFeeValue, revenueAfterPoolFees, energyKwh, electricityCost, estimatedNet, breakEvenTariff, currency };
  if (Object.values(results).some((value) => typeof value === 'number' && !Number.isFinite(value))) throw new RangeError('calculation exceeds the supported numeric range');
  return Object.freeze(results);
}

export function calculateMiningProjections(input) {
  return Object.freeze([1, 30, 365].map((days) => calculateMiningEconomics(input, days)));
}

export function formatXmr(value) {
  if (!Number.isFinite(value)) throw new RangeError('XMR amount must be finite');
  if (value !== 0 && Math.abs(value) < 1e-12) return `${value.toExponential(3)} XMR (below 1 piconero display precision)`;
  return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 12 }).format(value)} XMR`;
}

export function formatMoney(value, currency) {
  return formatCost(value, currency);
}

export { parseNumber };
