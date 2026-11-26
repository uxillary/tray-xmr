import { compareEfficiency, interpretEfficiency, efficiencyWinner, formatEfficiencyNumber as number, formatEfficiencyCost as money } from '../lib/mining-efficiency.mjs';

const form = document.querySelector('#efficiency-form');
if (form) {
  const get = name => form.elements.namedItem(name);
  const node = id => document.getElementById(id);
  const text = (id, value) => { if (node(id).textContent !== value) node(id).textContent = value; };
  const touched = new Set();
  const validatedFields = ['aHashrate', 'aUnit', 'aWatts', 'bHashrate', 'bUnit', 'bWatts', 'tariff', 'currency', 'hours'];
  let announcementTimer;
  const read = () => ({
    a: { hashrate: get('aHashrate').value, unit: get('aUnit').value, watts: get('aWatts').value },
    b: { hashrate: get('bHashrate').value, unit: get('bUnit').value, watts: get('bWatts').value },
    tariff: get('tariff').value, currency: get('currency').value, hours: get('hours').value,
  });
  function update(announce = false) {
    const result = compareEfficiency(read());
    for (const field of validatedFields) {
      const error = touched.has(field) ? result.errors[field] ?? '' : '';
      text(`${field}-error`, error);
      get(field).setAttribute('aria-invalid', String(Boolean(error)));
    }
    for (const key of ['a', 'b']) {
      const config = result[key];
      text(`${key}-result-name`, get(`${key}Name`).value.trim() || `Configuration ${key.toUpperCase()}`);
      text(`${key}-efficiency`, config ? number(config.efficiency) : '—');
      node(`${key}-bar`).style.width = result.comparison ? `${config.efficiency / Math.max(result.a.efficiency, result.b.efficiency) * 100}%` : '0%';
      text(`${key}-energy`, config?.dailyEnergyKWh != null ? `${number(config.dailyEnergyKWh)} kWh` : '—');
      for (const days of [1, 30, 365]) text(`${key}-cost-${days}`, config?.costs ? money(config.costs[days], result.currency) : '—');
    }
    const c = result.comparison;
    text('efficiency-winner', efficiencyWinner(result));
    text('efficiency-change', c ? `${number(c.efficiencyChangePercent, true)}%` : '—');
    text('hashrate-difference', c ? `${number(c.hashrateDifference, true)} H/s` : '—');
    text('power-difference', c ? `${number(c.powerDifference, true)} W` : '—');
    text('hashrate-change', c ? `${number(c.hashrateChangePercent, true)}% relative to A` : '—');
    text('power-change', c ? `${number(c.powerChangePercent, true)}% relative to A` : '—');
    text('energy-difference', c?.energyDifference != null ? `${number(c.energyDifference, true)} kWh` : '—');
    for (const days of [1, 30, 365]) text(`cost-difference-${days}`, c?.costDifferences ? money(c.costDifferences[days], result.currency, true) : '—');
    const interpretation = interpretEfficiency(result);
    text('efficiency-interpretation', interpretation);
    const status = !c ? 'Complete valid measurements for A and B to compare efficiency. Untouched fields are not marked invalid.'
      : result.errors.hours ? 'Efficiency reflects current measurements. Enter a runtime from 0 to 24 hours to see energy and costs.'
        : result.errors.tariff || result.errors.currency ? 'Efficiency and energy reflect current inputs. Enter a valid tariff and currency to see electricity costs.'
          : `Comparison updated. ${efficiencyWinner(result)}. All differences show B minus A.`;
    text('efficiency-status', status);
    clearTimeout(announcementTimer);
    if (announce) announcementTimer = setTimeout(() => {
      text('efficiency-announcement', c ? `${efficiencyWinner(result)}. B relative to A: ${number(c.efficiencyChangePercent, true)} percent efficiency. ${status}` : status);
    }, 450);
  }
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('input', event => {
    if (event.target.value.trim()) touched.add(event.target.name);
    update();
  });
  form.addEventListener('focusout', event => { touched.add(event.target.name); update(true); });
  form.addEventListener('change', event => {
    touched.add(event.target.name);
    if (event.target.name === 'currency') {
      node('efficiency-currency-note').hidden = false;
      text('efficiency-currency-note', `Currency changed to ${get('currency').value}. Confirm the tariff in this currency; the numeric value was kept and no conversion was applied.`);
    }
    update(true);
  });
  node('efficiency-example').addEventListener('click', () => {
    const values = { aHashrate: '8500', aWatts: '145', aUnit: 'H/s', aName: '', bHashrate: '7900', bWatts: '105', bUnit: 'H/s', bName: '', tariff: '0.25', currency: 'GBP', hours: '24' };
    for (const [key, value] of Object.entries(values)) get(key).value = value;
    touched.clear();
    node('efficiency-example-note').hidden = false;
    node('efficiency-currency-note').hidden = true;
    update(true);
  });
  form.addEventListener('reset', () => requestAnimationFrame(() => {
    touched.clear();
    node('efficiency-example-note').hidden = true;
    node('efficiency-currency-note').hidden = true;
    update(true);
  }));
  update();
}
