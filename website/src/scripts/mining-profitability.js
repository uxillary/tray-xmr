import { calculateMiningProjections, formatMoney, formatXmr, parseNumber, MINING_LIMITS } from '../lib/mining-economics.mjs';

const form = document.querySelector('#mining-calculator');
if (form) {
  const fields = [
    ['minerHashrate', 'hash-error', MINING_LIMITS.hashrate, true],
    ['wallPowerWatts', 'power-error', MINING_LIMITS.watts, false],
    ['hoursPerDay', 'hours-error', MINING_LIMITS.hours, false],
    ['electricityPricePerKwh', 'tariff-error', MINING_LIMITS.tariff, false],
    ['poolFeePercent', 'fee-error', MINING_LIMITS.feePercent, false],
    ['expectedRewardPerBlock', 'reward-error', MINING_LIMITS.rewardPerBlock, false],
    ['xmrPrice', 'price-error', MINING_LIMITS.xmrPrice, false],
  ];
  let started = false;
  let announceTimer;
  const get = (name) => form.elements.namedItem(name);
  const status = document.querySelector('#mining-status');
  const setStatus = (message) => {
    clearTimeout(announceTimer);
    announceTimer = setTimeout(() => { status.textContent = message; }, 450);
  };
  const clearResults = () => {
    document.querySelector('#daily-net').textContent = 'Complete valid assumptions to calculate';
    document.querySelector('#result-meaning').textContent = 'No valid estimate is shown until the required inputs are complete.';
    document.querySelectorAll('.projection-table [data-key]').forEach((cell) => { cell.textContent = '—'; });
    document.querySelector('#break-even').textContent = '—';
    document.querySelector('#break-even-note').textContent = 'Available when electricity consumption is above zero.';
  };
  const display = (key, value, currency) => key === 'netXmr' ? formatXmr(value)
    : key === 'energyKwh' ? `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 4 }).format(value)} kWh`
      : key === 'expectedBlocks' ? `${new Intl.NumberFormat(undefined, { maximumSignificantDigits: 5 }).format(value)} expected`
        : formatMoney(value, currency);

  function update() {
    started = started || fields.some(([name]) => get(name).value.trim() !== '') || get('networkDifficulty').value.trim() !== '' || get('networkHashrate').value.trim() !== '';
    const values = {};
    let valid = true;
    let missing = false;
    for (const [name, errorId, maximum, positive] of fields) {
      const input = get(name);
      const error = document.querySelector(`#${errorId}`);
      const raw = input.value.trim();
      let message = '';
      if (!raw) { missing = true; if (started) message = 'Enter a value.'; }
      else {
        const parsed = parseNumber(raw);
        if (parsed.error) message = parsed.error;
        else if (parsed.value < 0 || (positive && parsed.value === 0)) message = positive ? 'Enter a value greater than zero.' : 'Enter zero or a positive value.';
        else if (parsed.value > maximum) message = `Enter no more than ${new Intl.NumberFormat().format(maximum)}.`;
        else values[name] = parsed.value;
      }
      error.textContent = message;
      input.setAttribute('aria-invalid', String(Boolean(message)));
      if (message) valid = false;
    }
    const basis = get('networkBasis').value;
    const networkName = basis === 'difficulty' ? 'networkDifficulty' : 'networkHashrate';
    const networkError = document.querySelector(basis === 'difficulty' ? '#difficulty-error' : '#network-hash-error');
    const networkInput = get(networkName);
    const networkRaw = networkInput.value.trim();
    if (!networkRaw) { missing = true; if (started) networkError.textContent = 'Enter a value.'; else networkError.textContent = ''; valid = false; }
    else {
      const parsed = parseNumber(networkRaw);
      const max = basis === 'difficulty' ? MINING_LIMITS.networkDifficulty : MINING_LIMITS.networkHashrate;
      networkError.textContent = parsed.error ?? (parsed.value <= 0 ? 'Enter a value greater than zero.' : parsed.value > max ? `Enter no more than ${new Intl.NumberFormat().format(max)}.` : '');
      if (parsed.error || parsed.value <= 0 || parsed.value > max) valid = false;
      else values[networkName] = parsed.value;
    }
    networkInput.setAttribute('aria-invalid', String(Boolean(networkError.textContent)));
    const currency = get('currency').value;
    document.querySelectorAll('[data-unit-currency]').forEach((unit) => { unit.textContent = unit.textContent.endsWith('/ kWh') ? `${currency} / kWh` : `${currency} / XMR`; });
    if (!valid || missing) {
      clearResults();
      setStatus(started ? 'Complete each highlighted assumption to see the estimate.' : 'Fill every numeric field to see a locally calculated estimate.');
      return;
    }
    const input = { ...values, currency, networkBasis: basis, networkDifficulty: basis === 'difficulty' ? values.networkDifficulty : null, networkHashrate: basis === 'hashrate' ? values.networkHashrate : null };
    try {
      const projections = calculateMiningProjections(input);
      const [daily, thirty, annual] = projections;
      document.querySelector('#daily-net').textContent = formatMoney(daily.estimatedNet, currency);
      document.querySelector('#result-meaning').textContent = daily.estimatedNet < 0 ? 'Estimated electricity cost exceeds revenue after pool fees under these assumptions.' : daily.estimatedNet > 0 ? 'Estimated revenue after pool fees exceeds electricity cost under these assumptions.' : 'Estimated revenue after pool fees equals electricity cost under these assumptions.';
      document.querySelectorAll('.projection-table [data-key]').forEach((cell) => {
        const result = projections.find((item) => item.days === Number(cell.dataset.period));
        cell.textContent = display(cell.dataset.key, result[cell.dataset.key], currency);
      });
      document.querySelector('#break-even').textContent = daily.breakEvenTariff === null ? 'Undefined at zero energy use' : `${formatMoney(daily.breakEvenTariff, currency)} / kWh`;
      document.querySelector('#break-even-note').textContent = daily.breakEvenTariff === null ? 'Zero electricity consumption; no finite tariff can be calculated.' : 'Daily tariff at which modeled revenue after fees equals electricity cost.';
      setStatus(`Estimate updated locally. Net per day ${formatMoney(daily.estimatedNet, currency)}, fixed 30 days ${formatMoney(thirty.estimatedNet, currency)}, fixed 365 days ${formatMoney(annual.estimatedNet, currency)}.`);
    } catch {
      clearResults();
      setStatus('These assumptions exceed the supported calculation range. Review the highlighted values.');
    }
  }

  form.addEventListener('input', update);
  form.addEventListener('change', (event) => {
    if (event.target.name === 'networkBasis') {
      const difficulty = event.target.value === 'difficulty';
      document.querySelector('#difficulty-wrap').hidden = !difficulty;
      document.querySelector('#network-hashrate-wrap').hidden = difficulty;
      get(difficulty ? 'networkHashrate' : 'networkDifficulty').value = '';
      document.querySelector(difficulty ? '#network-hash-error' : '#difficulty-error').textContent = '';
    }
    if (event.target.name === 'currency') {
      const currency = event.target.value;
      document.querySelector('#currency-status').textContent = `Currency changed to ${currency}. Numeric assumptions were kept; enter or confirm the tariff and XMR price in ${currency}. No conversion was applied.`;
    }
    update();
  });
  form.addEventListener('reset', () => requestAnimationFrame(() => {
    started = false;
    document.querySelector('#difficulty-wrap').hidden = false;
    document.querySelector('#network-hashrate-wrap').hidden = true;
    document.querySelector('#currency-status').textContent = 'Enter fiat assumptions in GBP.';
    form.querySelectorAll('[aria-invalid]').forEach((input) => input.setAttribute('aria-invalid', 'false'));
    form.querySelectorAll('.field-error').forEach((error) => { error.textContent = ''; });
    update();
  }));
  update();
}
