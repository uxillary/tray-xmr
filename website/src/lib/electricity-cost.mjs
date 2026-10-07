export const LIMITS = Object.freeze({ watts: 20_000, rate: 1_000, penceRate: 100_000, hours: 24, days: 365 });

export function parseNumber(value) {
  const input = String(value ?? '').trim().replace(/[\s\u00a0]/g, '');
  if (!input) return { value: null, error: 'Enter a value.' };
  if (!/^[+-]?[\d.,]+$/.test(input)) return { value: null, error: 'Use numbers only.' };
  let normalized = input;
  if (input.includes(',') && input.includes('.')) {
    normalized = input.lastIndexOf(',') > input.lastIndexOf('.')
      ? input.replaceAll('.', '').replace(',', '.')
      : input.replaceAll(',', '');
  } else if (input.includes(',')) {
    if (/^[+-]?(?:[1-9]\d{0,2})(,\d{3})+$/.test(input)) normalized = input.replaceAll(',', '');
    else if ((input.match(/,/g) ?? []).length === 1) normalized = input.replace(',', '.');
    else return { value: null, error: 'Check the number separators.' };
  } else if (input.includes('.')) {
    if (/^[+-]?(?:[1-9]\d{0,2})(\.\d{3})+$/.test(input)) normalized = input.replaceAll('.', '');
    else if ((input.match(/\./g) ?? []).length > 1) return { value: null, error: 'Check the number separators.' };
  }
  const number = Number(normalized);
  return Number.isFinite(number) ? { value: number, error: null } : { value: null, error: 'Enter a valid number.' };
}

export function calculateElectricity({ watts, rate, rateUnit = 'kwh', hours, days, currency = 'GBP' }) {
  const values = { watts, rate, hours, days };
  for (const [field, value] of Object.entries(values)) {
    if (!Number.isFinite(value) || value < 0) throw new RangeError(`${field} must be a non-negative number`);
    const maximum = field === 'rate' && rateUnit === 'pence' ? LIMITS.penceRate : LIMITS[field];
    if (value > maximum) throw new RangeError(`${field} exceeds the supported limit`);
  }
  const ratePerKwh = rateUnit === 'pence' ? rate / 100 : rate;
  const kwhPerHour = watts / 1000;
  const kwhPerDay = kwhPerHour * hours;
  const kwhPerPeriod = kwhPerHour * hours * days;
  const kwhPerYear = kwhPerHour * hours * 365;
  return Object.freeze({
    currency, ratePerKwh, kwhPerHour, kwhPerDay, kwhPerPeriod, kwhPerYear,
    costPerHour: kwhPerHour * ratePerKwh,
    costPerDay: kwhPerDay * ratePerKwh,
    costPerPeriod: kwhPerPeriod * ratePerKwh,
    costPerYear: kwhPerYear * ratePerKwh,
  });
}

export function formatEnergy(value) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 }).format(value);
}

export function formatCost(value, currency) {
  if (value !== 0 && Math.abs(value) < 0.000000005) {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, notation: 'scientific', maximumSignificantDigits: 3 }).format(value);
  }
  return Math.abs(value) < 0.01
    ? new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumSignificantDigits: 4 }).format(value)
    : new Intl.NumberFormat(undefined, { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}
