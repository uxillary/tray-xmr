import { analyzeXMRigLog, MAX_LOG_BYTES } from '../lib/xmrig-log-decoder.mjs';

const input = document.querySelector('#xmrig-log');
if (input) {
  const error = document.querySelector('#input-error');
  const status = document.querySelector('#result-status');
  const list = document.querySelector('#signal-list');
  const count = document.querySelector('#byte-count');
  const resultsTitle = document.querySelector('#results-title');
  const emptyState = document.querySelector('#decoder-empty-state');
  let analyzed = false;
  const bytes = (value) => new TextEncoder().encode(value).byteLength;
  const labels = { good: 'Reported event', info: 'Info', notice: 'Notice', warning: 'Check context', error: 'Error' };

  input.addEventListener('input', () => {
    count.textContent = `${bytes(input.value).toLocaleString()} / ${MAX_LOG_BYTES.toLocaleString()} bytes`;
    error.textContent = '';
    input.setAttribute('aria-invalid', 'false');
    if (analyzed) {
      list.replaceChildren(); emptyState.hidden = false;
      status.textContent = 'Input changed. Choose Analyze log to refresh the readout.';
      analyzed = false;
    }
  });
  document.querySelector('#analyze-log').addEventListener('click', () => {
    list.replaceChildren();
    emptyState.hidden = true;
    analyzed = true;
    const result = analyzeXMRigLog(input.value);
    if (result.error) {
      error.textContent = result.error;
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      status.textContent = 'No analysis was run.';
      return;
    }
    error.textContent = '';
    input.setAttribute('aria-invalid', 'false');
    const n = result.signals.length;
    status.textContent = `${result.recognizedLines} recognized ${result.recognizedLines === 1 ? 'line' : 'lines'} grouped into ${n} ${n === 1 ? 'signal' : 'signals'}; ${result.unknownLines} ${result.unknownLines === 1 ? 'line' : 'lines'} left uninterpreted.`;
    for (const signal of result.signals) {
      const card = document.createElement('article');
      card.className = `signal-card signal-${signal.level}`;
      const marker = document.createElement('span'); marker.className = 'signal-level'; marker.textContent = labels[signal.level]; card.append(marker);
      const heading = document.createElement('h3'); heading.textContent = signal.title; card.append(heading);
      const details = document.createElement('dl');
      const observed = document.createElement('dt'); observed.textContent = 'What it establishes'; const meaning = document.createElement('dd'); meaning.textContent = signal.meaning; details.append(observed, meaning);
      const next = document.createElement('dt'); next.textContent = 'Next check'; const advice = document.createElement('dd'); advice.textContent = signal.next; details.append(next, advice); card.append(details);
      if (signal.href) { const link = document.createElement('a'); link.href = signal.href; link.textContent = signal.href.includes('huge-pages') ? 'Read the Huge Pages guide' : 'Read the MSR guide'; card.append(link); }
      const frequency = document.createElement('small'); frequency.textContent = `${signal.count} occurrence${signal.count === 1 ? '' : 's'} · first recognized line ${signal.firstOrder}${signal.count > 1 ? ` · last recognized line ${signal.lastOrder}` : ''}`; card.append(frequency);
      list.append(card);
    }
    if (n === 0) { const empty = document.createElement('p'); empty.className = 'decoder-empty'; empty.textContent = 'No supported signals found. This does not mean the log is healthy; review the original output or an XMRig guide.'; list.append(empty); }
    resultsTitle.focus();
    resultsTitle.scrollIntoView({ block: 'start' });
  });
  document.querySelector('#clear-log').addEventListener('click', () => {
    input.value = ''; count.textContent = '0 / 200 KB'; error.textContent = ''; status.textContent = 'Analyze an excerpt to see recognized signals. Unknown lines are left uninterpreted.'; list.replaceChildren(); emptyState.hidden = false; analyzed = false; input.setAttribute('aria-invalid', 'false'); input.focus();
  });
}
