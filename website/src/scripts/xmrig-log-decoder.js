import { analyzeXMRigLog, MAX_LOG_BYTES } from '../lib/xmrig-log-decoder.mjs';

const input = document.querySelector('#xmrig-log');
if (input) {
  const error = document.querySelector('#input-error');
  const status = document.querySelector('#result-status');
  const list = document.querySelector('#signal-list');
  const count = document.querySelector('#byte-count');
  const resultsTitle = document.querySelector('#results-title');
  const bytes = (value) => new TextEncoder().encode(value).byteLength;
  const labels = { good: 'Good', info: 'Info', notice: 'Notice', warning: 'Warning', error: 'Error' };

  input.addEventListener('input', () => {
    count.textContent = `${Math.min(bytes(input.value), MAX_LOG_BYTES).toLocaleString()} / 200 KB`;
    error.textContent = '';
  });
  document.querySelector('#analyze-log').addEventListener('click', () => {
    list.replaceChildren();
    const result = analyzeXMRigLog(input.value);
    if (result.error) {
      error.textContent = result.error;
      status.textContent = 'No analysis was run.';
      return;
    }
    error.textContent = '';
    const n = result.signals.length;
    status.textContent = `${result.recognizedLines} recognized ${result.recognizedLines === 1 ? 'line' : 'lines'} grouped into ${n} ${n === 1 ? 'signal' : 'signals'}; ${result.unknownLines} ${result.unknownLines === 1 ? 'line' : 'lines'} left uninterpreted.`;
    for (const signal of result.signals) {
      const card = document.createElement('article');
      card.className = `signal-card signal-${signal.level}`;
      const marker = document.createElement('span'); marker.className = 'signal-level'; marker.textContent = labels[signal.level]; card.append(marker);
      const heading = document.createElement('h3'); heading.textContent = signal.title; card.append(heading);
      const observed = document.createElement('p'); observed.innerHTML = '<b>Observed</b>'; const meaning = document.createElement('p'); meaning.textContent = signal.meaning; card.append(observed, meaning);
      const next = document.createElement('p'); next.innerHTML = '<b>Next check</b>'; const advice = document.createElement('p'); advice.textContent = signal.next; card.append(next, advice);
      if (signal.href) { const link = document.createElement('a'); link.href = signal.href; link.textContent = signal.href.includes('huge-pages') ? 'Read the Huge Pages guide' : 'Read the MSR guide'; card.append(link); }
      const frequency = document.createElement('small'); frequency.textContent = `${signal.count} occurrence${signal.count === 1 ? '' : 's'} · first recognized line ${signal.firstOrder}${signal.count > 1 ? ` · last recognized line ${signal.lastOrder}` : ''}`; card.append(frequency);
      list.append(card);
    }
    if (n === 0) { const empty = document.createElement('p'); empty.className = 'decoder-empty'; empty.textContent = 'No supported signals found. This does not mean the log is healthy; review the original output or an XMRig guide.'; list.append(empty); }
    resultsTitle.focus();
  });
  document.querySelector('#clear-log').addEventListener('click', () => {
    input.value = ''; count.textContent = '0 / 200 KB'; error.textContent = ''; status.textContent = 'Analyze an excerpt to see recognized signals. Unknown lines are left uninterpreted.'; list.replaceChildren(); input.focus();
  });
}
