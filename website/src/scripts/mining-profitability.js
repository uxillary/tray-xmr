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
  const touched = new Set();
  let requested = false;
  let announceTimer;
  const get = (name) => form.elements.namedItem(name);
  const status = document.querySelector('#mining-status');
  const setStatus = (message, announce) => {
    clearTimeout(announceTimer);
    if (status.textContent !== message) status.textContent = message;
    if (announce) announceTimer = setTimeout(() => { document.querySelector('#mining-announcement').textContent = message; }, 450);
  };
  const clearResults = () => {
    for (const id of ['daily-revenue', 'daily-cost', 'daily-net']) document.querySelector(`#${id}`).textContent = '—';
    document.querySelector('#result-meaning').textContent = 'No valid estimate is shown until the required inputs are complete.';
    document.querySelectorAll('.projection-table [data-key]').forEach((cell) => { cell.textContent = '—'; });
    document.querySelector('#break-even').textContent = '—';
    document.querySelector('#break-even-note').textContent = 'Available when electricity consumption is above zero.';
  };
  const display = (key, value, currency) => key === 'netXmr' ? formatXmr(value)
    : key === 'energyKwh' ? `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 4 }).format(value)} kWh`
      : key === 'expectedBlocks' ? `${new Intl.NumberFormat(undefined, { maximumSignificantDigits: 5 }).format(value)} expected`
        : formatMoney(value, currency);

  function update(shouldAnnounce = false) {
    const announce = (message) => setStatus(message, shouldAnnounce);
    const values = {};
    let valid = true;
    let missing = false;
    for (const [name, errorId, maximum, positive] of fields) {
      const input = get(name);
      const error = document.querySelector(`#${errorId}`);
      const raw = input.value.trim();
      let message = '';
      if (!raw) { missing = true; message = 'Enter a value.'; }
      else {
        const parsed = parseNumber(raw);
        if (parsed.error) message = parsed.error;
        else if (parsed.value < 0 || (positive && parsed.value === 0)) message = positive ? 'Enter a value greater than zero.' : 'Enter zero or a positive value.';
        else if (parsed.value > maximum) message = `Enter no more than ${new Intl.NumberFormat().format(maximum)}.`;
        else values[name] = parsed.value;
      }
      const visible = requested || touched.has(name) ? message : '';
      if (error.textContent !== visible) error.textContent = visible;
      input.setAttribute('aria-invalid', String(Boolean(visible)));
      if (message) valid = false;
    }
    const basis = get('networkBasis').value;
    const networkName = basis === 'difficulty' ? 'networkDifficulty' : 'networkHashrate';
    const networkError = document.querySelector(basis === 'difficulty' ? '#difficulty-error' : '#network-hash-error');
    const networkInput = get(networkName);
    const networkRaw = networkInput.value.trim();
    let networkMessage = '';
    if (!networkRaw) { missing = true; networkMessage = 'Enter a value.'; valid = false; }
    else {
      const parsed = parseNumber(networkRaw);
      const max = basis === 'difficulty' ? MINING_LIMITS.networkDifficulty : MINING_LIMITS.networkHashrate;
      networkMessage = parsed.error ?? (parsed.value <= 0 ? 'Enter a value greater than zero.' : parsed.value > max ? `Enter no more than ${new Intl.NumberFormat().format(max)}.` : '');
      if (parsed.error || parsed.value <= 0 || parsed.value > max) valid = false;
      else values[networkName] = parsed.value;
    }
    const visibleNetwork = requested || touched.has(networkName) ? networkMessage : '';
    if (networkError.textContent !== visibleNetwork) networkError.textContent = visibleNetwork;
    networkInput.setAttribute('aria-invalid', String(Boolean(visibleNetwork)));
    const currency = get('currency').value;
    document.querySelectorAll('[data-unit-currency]').forEach((unit) => { unit.textContent = unit.textContent.endsWith('/ kWh') ? `${currency} / kWh` : `${currency} / XMR`; });
    if (!valid || missing) {
      clearResults();
      announce(requested ? 'Complete the highlighted assumptions. No valid estimate is available.' : 'Complete the remaining assumptions to see an estimate. Untouched fields are not marked invalid.');
      return false;
    }
    const input = { ...values, currency, networkBasis: basis, networkDifficulty: basis === 'difficulty' ? values.networkDifficulty : null, networkHashrate: basis === 'hashrate' ? values.networkHashrate : null };
    try {
      const projections = calculateMiningProjections(input);
      const [daily] = projections;
      document.querySelector('#daily-revenue').textContent = formatMoney(daily.revenueAfterPoolFees, currency);
      document.querySelector('#daily-cost').textContent = formatMoney(daily.electricityCost, currency);
      document.querySelector('#daily-net').textContent = formatMoney(daily.estimatedNet, currency);
      document.querySelector('#result-meaning').textContent = daily.estimatedNet < 0 ? 'Estimated electricity cost exceeds revenue after pool fees under these assumptions.' : daily.estimatedNet > 0 ? 'Estimated revenue after pool fees exceeds electricity cost under these assumptions.' : 'Estimated revenue after pool fees equals electricity cost under these assumptions.';
      document.querySelectorAll('.projection-table [data-key]').forEach((cell) => {
        const result = projections.find((item) => item.days === Number(cell.dataset.period));
        cell.textContent = display(cell.dataset.key, result[cell.dataset.key], currency);
      });
      document.querySelector('#break-even').textContent = daily.breakEvenTariff === null ? 'Undefined at zero energy use' : `${formatMoney(daily.breakEvenTariff, currency)} / kWh`;
      document.querySelector('#break-even-note').textContent = daily.breakEvenTariff === null ? 'Zero electricity consumption; no finite tariff can be calculated.' : 'Daily tariff at which modeled revenue after fees equals electricity cost.';
      announce(`Daily estimate: revenue after pool fee ${formatMoney(daily.revenueAfterPoolFees, currency)}, electricity ${formatMoney(daily.electricityCost, currency)}, operating balance ${formatMoney(daily.estimatedNet, currency)}. Expected value, not a payout.`);
      return true;
    } catch {
      clearResults();
      announce('These assumptions exceed the supported calculation range. Review your values.');
      return false;
    }
  }

  form.addEventListener('input', (event) => {
    if (event.target.value.trim()) touched.add(event.target.name);
    update();
  });
  form.addEventListener('focusout', (event) => { touched.add(event.target.name); update(true); });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    requested = true;
    if (update(true)) {
      const title = document.querySelector('#mining-results-title');
      title.focus();
      title.scrollIntoView({ block: 'start' });
    }
    else form.querySelector('[aria-invalid="true"]')?.focus();
  });
  form.addEventListener('change', (event) => {
    if (event.target.name === 'networkBasis') {
      const difficulty = event.target.value === 'difficulty';
      document.querySelector('#difficulty-wrap').hidden = !difficulty;
      document.querySelector('#network-hashrate-wrap').hidden = difficulty;
      get(difficulty ? 'networkHashrate' : 'networkDifficulty').value = '';
      get(difficulty ? 'networkHashrate' : 'networkDifficulty').setAttribute('aria-invalid', 'false');
      touched.delete(difficulty ? 'networkHashrate' : 'networkDifficulty');
      document.querySelector(difficulty ? '#network-hash-error' : '#difficulty-error').textContent = '';
    }
    if (event.target.name === 'currency') {
      const currency = event.target.value;
      document.querySelector('#currency-status').textContent = `Currency changed to ${currency}. Numeric assumptions were kept; enter or confirm the tariff and XMR price in ${currency}. No conversion was applied.`;
    }
    update(true);
  });
  form.addEventListener('reset', () => requestAnimationFrame(() => {
    requested = false;
    touched.clear();
    document.querySelector('#difficulty-wrap').hidden = false;
    document.querySelector('#network-hashrate-wrap').hidden = true;
    document.querySelector('#currency-status').textContent = 'Enter fiat assumptions in GBP.';
    form.querySelectorAll('[aria-invalid]').forEach((input) => input.setAttribute('aria-invalid', 'false'));
    form.querySelectorAll('.field-error').forEach((error) => { error.textContent = ''; });
    update(true);
  }));
  update();
}
