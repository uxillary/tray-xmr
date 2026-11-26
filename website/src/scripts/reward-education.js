import { calculateTeaching, defaultTeachingInputs, formatTeaching as number } from '../lib/reward-education.mjs';
import { parseNumber } from '../lib/electricity-cost.mjs';

const workspace = document.querySelector('#teaching-workspace');
if (workspace) {
  const form = workspace.querySelector('#teaching-form');
  const fields = Object.keys(defaultTeachingInputs());
  const get = name => form.elements.namedItem(name);
  const node = name => document.getElementById(`teaching-${name}`);
  const text = (name, value) => { if (node(name).textContent !== value) node(name).textContent = value; };
  const touched = new Set();
  const slider = node('duration-slider');
  let timer;
  function update(announce = false) {
    const input = Object.fromEntries(fields.map(name => [name, get(name).value]));
    const { result: r, errors } = calculateTeaching(input);
    for (const field of fields) {
      const error = touched.has(field) ? errors[field] || '' : '';
      text(`${field}-error`, error); get(field).setAttribute('aria-invalid', String(Boolean(error)));
    }
    const seconds = parseNumber(get('seconds').value).value;
    const onSlider = seconds >= 3600 && seconds <= 86400 && seconds % 3600 === 0 && !errors.seconds;
    slider.hidden = !onSlider;
    workspace.querySelector('label[for="teaching-duration-slider"]').hidden = !onSlider;
    text('slider-note', onSlider ? 'The precise seconds input also accepts values outside this slider’s range.' : 'Duration slider is available for whole hours from 3,600 to 86,400 seconds. The precise input remains active.');
    if (onSlider) { slider.value = String(seconds); slider.setAttribute('aria-valuetext', `${seconds / 3600} hours (${seconds} seconds)`); }
    for (const [name, value] of [['contribution', r ? `${number(r.relativeContribution * 100)}%` : '—'], ['hashes', r ? number(r.hashesPerformed) : '—'], ['difficulty', r ? number(r.assumedNetworkDifficulty) : '—'], ['blocks', r ? number(r.expectedBlockEquivalents) : '—'], ['gross', r ? `${number(r.expectedGrossReward)} XMR` : '—'], ['one-block', r ? `${number(r.assumedReward)} XMR` : '—']]) text(name, value);
    node('fraction').style.width = r ? `${r.relativeContribution * 100}%` : '0%';
    text('ratio', r ? r.relativeContribution === 0 ? 'Zero miner contribution.' : `One part in approximately ${number(1 / r.relativeContribution)} of the network’s work.` : 'Contribution unavailable until assumptions are valid.');
    const interpretation = r ? `Over ${number(seconds)} seconds, the modeled expectation is ${number(r.expectedBlockEquivalents)} block equivalents and ${number(r.expectedGrossReward)} XMR gross. Expected value is neither a discovered block nor a balance owed.` : 'Enter valid assumptions to see expected work. Results are unavailable while any assumption is invalid.';
    text('interpretation', interpretation);
    clearTimeout(timer);
    if (announce) timer = setTimeout(() => text('announcement', interpretation), 450);
  }
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('input', event => { if (fields.includes(event.target.name)) touched.add(event.target.name); update(); });
  form.addEventListener('change', () => update(true));
  form.addEventListener('focusout', event => { if (fields.includes(event.target.name)) touched.add(event.target.name); update(true); });
  slider.addEventListener('input', () => { get('seconds').value = slider.value; touched.add('seconds'); update(); });
  form.addEventListener('reset', event => { event.preventDefault(); for (const [name, value] of Object.entries(defaultTeachingInputs())) get(name).value = value; touched.clear(); update(true); });
  update(); workspace.hidden = false;
}
