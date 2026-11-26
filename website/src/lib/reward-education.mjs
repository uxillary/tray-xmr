import { parseNumber } from './electricity-cost.mjs';
import { teachingExample } from '../data/mining-education.mjs';

export const teachingUnits = Object.freeze({ 'H/s': 1, 'kH/s': 1e3, 'MH/s': 1e6, 'GH/s': 1e9 });
export const teachingLimits = Object.freeze({ positiveMinimum: 1e-9, hashrateHs: 1e18, seconds: 315360000, reward: 1e6 });
export const defaultTeachingInputs = () => ({ miner: String(teachingExample.minerHashrate), minerUnit: 'H/s', network: String(teachingExample.networkHashrate), networkUnit: 'H/s', seconds: '3600', reward: String(teachingExample.assumedReward) });

function read(value, maximum, positive = false, minimum = teachingLimits.positiveMinimum) {
  if (typeof value !== 'string' && typeof value !== 'number') throw new RangeError('Enter a finite number.');
  const parsed = typeof value === 'number' ? { value, error: !Number.isFinite(value) } : parseNumber(value);
  if (String(value).length > 80 || parsed.error || !Number.isFinite(parsed.value)) throw new RangeError('Enter a finite number.');
  if (parsed.value < 0 || (positive && parsed.value === 0) || parsed.value > maximum
    || (parsed.value > 0 && parsed.value < minimum)) throw new RangeError(`Use ${positive ? 'a positive value' : 'zero or a positive value'}; non-zero range ${minimum} to ${maximum}.`);
  return parsed.value;
}

export function normalizeTeachingHashrate(value, unit) {
  if (!Object.hasOwn(teachingUnits, unit)) throw new RangeError('Choose a supported hashrate unit.');
  return read(value, teachingLimits.hashrateHs / teachingUnits[unit], false, teachingLimits.positiveMinimum / teachingUnits[unit]) * teachingUnits[unit];
}

export function calculateTeaching(input = {}) {
  const errors = {}, values = {};
  for (const field of ['miner', 'network']) {
    try { values[field] = normalizeTeachingHashrate(input[field], input[`${field}Unit`]); }
    catch (error) { errors[Object.hasOwn(teachingUnits, input[`${field}Unit`]) ? field : `${field}Unit`] = error.message; }
  }
  for (const [field, max] of [['seconds', teachingLimits.seconds], ['reward', teachingLimits.reward]]) {
    try { values[field] = read(input[field], max, field === 'seconds'); }
    catch (error) { errors[field] = error.message; }
  }
  if (values.network === 0) errors.network = 'Total network hashrate must be positive and includes this miner.';
  if (values.miner > values.network) {
    errors.miner = 'Miner hashrate cannot exceed the whole network, which includes this miner.';
    errors.network = 'Total network hashrate must include at least this miner’s rate.';
  }
  if (Object.keys(errors).length) return { errors, result: null };
  const relativeContribution = values.miner / values.network;
  const assumedNetworkDifficulty = values.network * teachingExample.targetSeconds;
  const hashesPerformed = values.miner * values.seconds;
  const expectedBlockEquivalents = hashesPerformed / assumedNetworkDifficulty;
  const expectedGrossReward = expectedBlockEquivalents * values.reward;
  const result = { relativeContribution, assumedNetworkDifficulty, hashesPerformed, expectedBlockEquivalents, expectedGrossReward, assumedReward: values.reward };
  if (!Object.values(result).every(Number.isFinite)) return { errors: { miner: 'These assumptions exceed finite arithmetic limits.' }, result: null };
  return { errors, result };
}

export function formatTeaching(value) {
  if (!Number.isFinite(value)) return '—';
  if (value === 0) return '0';
  if (Math.abs(value) < 0.0001 || Math.abs(value) >= 1e12) return value.toExponential(4);
  return new Intl.NumberFormat('en-GB', { maximumSignificantDigits: 7 }).format(value);
}
