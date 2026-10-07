import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateElectricity, formatCost, parseNumber } from '../src/lib/electricity-cost.mjs';

test('calculates the reference continuous workload', () => {
  const result = calculateElectricity({ watts: 100, rate: 0.25, hours: 24, days: 30 });
  assert.ok(Math.abs(result.kwhPerDay - 2.4) < 1e-12);
  assert.ok(Math.abs(result.costPerDay - 0.6) < 1e-12);
  assert.ok(Math.abs(result.costPerPeriod - 18) < 1e-12);
  assert.ok(Math.abs(result.costPerYear - 219) < 1e-12);
});

test('handles zero and fractional values', () => {
  assert.equal(calculateElectricity({ watts: 0, rate: 0.25, hours: 24, days: 30 }).costPerDay, 0);
  const result = calculateElectricity({ watts: 12.5, rate: 0.1234, hours: 24, days: 30 });
  assert.ok(Math.abs(result.kwhPerDay - 0.3) < 1e-12);
  assert.ok(Math.abs(result.costPerDay - 0.03702) < 1e-12);
  assert.equal(formatCost(result.costPerHour, 'GBP'), '£0.001543');
});

test('runtime and pence rate are applied consistently', () => {
  const result = calculateElectricity({ watts: 100, rate: 24, rateUnit: 'pence', hours: 12, days: 30 });
  assert.ok(Math.abs(result.kwhPerDay - 1.2) < 1e-12);
  assert.ok(Math.abs(result.costPerDay - 0.288) < 1e-12);
  assert.ok(Math.abs(result.kwhPerYear - 438) < 1e-12);
  assert.throws(() => calculateElectricity({ watts: 1, rate: 100_001, rateUnit: 'pence', hours: 1, days: 1 }), RangeError);
  assert.equal(calculateElectricity({ watts: 1, rate: 0, hours: 1, days: 1 }).costPerHour, 0);
});

test('accepts decimal comma and grouped locale values', () => {
  assert.deepEqual(parseNumber('0,25'), { value: 0.25, error: null });
  assert.deepEqual(parseNumber('1.234,56'), { value: 1234.56, error: null });
  assert.deepEqual(parseNumber('1,234.56'), { value: 1234.56, error: null });
});

test('rejects blank, non-numeric, negative and out-of-range values', () => {
  for (const value of ['', 'watts']) assert.notEqual(parseNumber(value).error, null);
  assert.equal(parseNumber('-1').value, -1);
  assert.throws(() => calculateElectricity({ watts: -1, rate: 0, hours: 1, days: 1 }), RangeError);
  assert.throws(() => calculateElectricity({ watts: 20_001, rate: 0, hours: 1, days: 1 }), RangeError);
  assert.throws(() => calculateElectricity({ watts: 1, rate: 0, hours: 25, days: 1 }), RangeError);
  assert.throws(() => calculateElectricity({ watts: 1, rate: 0, hours: 1, days: 366 }), RangeError);
});
