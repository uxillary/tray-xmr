import { calculateElectricity, formatCost, formatEnergy, parseNumber, LIMITS } from '../lib/electricity-cost.mjs';

const form = document.querySelector('#electricity-calculator');
if (form) {
  const fields = {
    watts: { input: form.elements.watts, error: document.querySelector('#power-error'), max: LIMITS.watts },
    rate: { input: form.elements.rate, error: document.querySelector('#rate-error'), max: LIMITS.rate },
    hours: { input: form.elements.hours, error: document.querySelector('#hours-error'), max: LIMITS.hours },
    days: { input: form.elements.days, error: document.querySelector('#days-error'), max: LIMITS.days },
  };
  const preset = document.querySelector('#runtime-preset');
  const formatInteger = (value) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);

  function read(field, allowBlank = false) {
    const parsed = parseNumber(field.input.value);
    if (allowBlank && !field.input.value.trim()) return { value: null, error: null };
    if (parsed.error) return parsed;
    if (parsed.value < 0) return { value: null, error: 'Enter zero or a positive value.' };
    const maximum = field.input === fields.rate.input && document.querySelector('#rate-unit').value === 'pence' ? LIMITS.penceRate : field.max;
    if (parsed.value > maximum) return { value: null, error: `Enter no more than ${formatInteger(maximum)}.` };
    if (field.input === fields.days.input && !Number.isInteger(parsed.value)) return { value: null, error: 'Enter a whole number of days.' };
    return parsed;
  }

  function setText(id, value) { document.querySelector(`#${id}`).textContent = value; }
  function update() {
    const values = {};
    let valid = true;
    for (const [name, field] of Object.entries(fields)) {
      const parsed = read(field, name === 'rate');
      field.error.textContent = parsed.error ?? '';
      field.input.setAttribute('aria-invalid', String(Boolean(parsed.error)));
      if (parsed.error) valid = false;
      values[name] = parsed.value;
    }
    if (!valid || values.watts === null || values.hours === null || values.days === null) {
      for (const id of ['power-readout', 'energy-day', 'energy-period', 'energy-year', 'cost-hour', 'cost-day', 'cost-period', 'cost-year']) setText(id, '—');
      setText('calc-status', 'Correct the highlighted values to update the estimate.');
      return;
    }
    const currency = form.elements.currency.value;
    const rateUnit = document.querySelector('#rate-unit').value;
    const rate = values.rate ?? 0;
    const result = calculateElectricity({ ...values, rate, currency, rateUnit });
    const periodLabel = `${formatInteger(values.days)} ${values.days === 1 ? 'DAY' : 'DAYS'}`;
    setText('period-label', periodLabel);
    setText('period-cost-label', periodLabel);
    setText('power-readout', `${formatEnergy(values.watts)} W`);
    setText('energy-day', `${formatEnergy(result.kwhPerDay)} kWh`);
    setText('energy-period', `${formatEnergy(result.kwhPerPeriod)} kWh`);
    setText('energy-year', `${formatEnergy(result.kwhPerYear)} kWh`);
    for (const [id, key] of [['cost-hour', 'costPerHour'], ['cost-day', 'costPerDay'], ['cost-period', 'costPerPeriod'], ['cost-year', 'costPerYear']]) {
      setText(id, values.rate === null ? 'Enter a rate' : formatCost(result[key], currency));
    }
    setText('calc-status', values.rate === null ? `Energy is calculated: ${formatEnergy(result.kwhPerDay)} kWh/day. Add your rate to see estimated electricity cost.` : `Estimate updated: ${formatCost(result.costPerDay, currency)} per day, ${formatCost(result.costPerPeriod, currency)} for ${formatInteger(values.days)} days, and ${formatCost(result.costPerYear, currency)} per 365 days.`);
  }

  form.addEventListener('input', update);
  form.addEventListener('change', (event) => {
    if (event.target === preset && preset.value !== 'custom') {
      fields.hours.input.value = preset.value;
      update();
    } else if (event.target === fields.hours.input) preset.value = 'custom';
    update();
  });
  form.addEventListener('reset', () => requestAnimationFrame(() => {
    preset.value = '24';
    update();
  }));
  update();
}
