import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { referenceEntries, referenceCategories } from '../src/data/xmrig-reference.mjs';
import { referenceSearchText, filterReference, defaultReferenceFilters } from '../src/lib/reference-filter.mjs';
import { calculateTeaching, normalizeTeachingHashrate, defaultTeachingInputs, formatTeaching, teachingLimits } from '../src/lib/reward-education.mjs';
const inventory = referenceEntries.map(e => ({ id: e.id, category: e.category, text: referenceSearchText(e, referenceCategories) }));
const find = (query, category = '') => filterReference(inventory, { query, category }).map(e => e.id);
const model = changes => calculateTeaching({ ...defaultTeachingInputs(), ...changes });

test('reference empty search, case and whitespace preserve stable inventory order', () => {
  assert.deepEqual(find(''), referenceEntries.map(e => e.id));
  assert.deepEqual(find('  HUGE   pages  '), find('huge pages'));
  assert.deepEqual(find(' \t\n '), find(''));
  assert.ok(find('cpu READY threads').includes('cpu-ready'));
});
test('reference terms, synthetic punctuation, abbreviations, explanations and actions are retrievable', () => {
  assert.deepEqual(find('huge pages 50%'), ['huge-pages-partial']);
  assert.ok(find('HP allocation').includes('huge-pages-full'));
  assert.ok(find('MSR registers').includes('msr-failed'));
  assert.ok(find('permission allocation').includes('huge-pages-partial'));
  for (const punctuation of ['[', '.*', '(?=', '<script>', '\\']) assert.doesNotThrow(() => find(punctuation));
  assert.deepEqual(find('<script>'), []);
});
test('reference category and query compose; reset restores all 15 entries', () => {
  for (const category of referenceCategories) assert.equal(find('', category.id).length, referenceEntries.filter(e => e.category === category.id).length);
  assert.deepEqual(find('MSR', 'cpu-memory'), []);
  assert.deepEqual(find('huge pages 100%', 'cpu-memory'), ['huge-pages-full']);
  assert.deepEqual(find('unknown message xyz'), []);
  assert.deepEqual(filterReference(inventory, defaultReferenceFilters()), inventory);
});
test('reference identifiers and category/entry anchor contracts remain unchanged', () => {
  assert.deepEqual(inventory.map(e => e.id), ['cpu-ready','huge-pages-full','huge-pages-partial','dataset-ready','speed-summary','msr-applied','msr-failed','pool-connected','new-job','share-accepted','share-rejected','read-error','algorithm-error','disconnect-family','retry-family']);
  const component = readFileSync(new URL('../src/components/XmrigReference.astro', import.meta.url), 'utf8');
  for (const contract of ['id={category.id}', 'id={entry.id}', 'href={`#${entry.id}`}', 'id="reference-categories"']) assert.ok(component.includes(contract));
});
test('teaching unit normalization has equivalent bounds across supported units', () => {
  for (const [unit, value] of [['H/s', 1e9], ['kH/s', 1e6], ['MH/s', 1e3], ['GH/s', 1]]) assert.equal(normalizeTeachingHashrate(value, unit), 1e9);
  assert.equal(normalizeTeachingHashrate(1e-18, 'GH/s'), 1e-9);
  assert.throws(() => normalizeTeachingHashrate(1, 'TH/s'));
});
test('independent M13D example: contribution, difficulty, hashes, blocks and reward', () => {
  assert.deepEqual(model().result, { relativeContribution: 0.001, assumedNetworkDifficulty: 120000000, hashesPerformed: 3600000, expectedBlockEquivalents: 0.03, expectedGrossReward: 0.015, assumedReward: 0.5 });
  assert.equal(model({ miner: '2000' }).result.expectedGrossReward, 0.03);
  assert.equal(model({ network: '2000000' }).result.expectedGrossReward, 0.0075);
  assert.equal(model({ seconds: '7200' }).result.expectedGrossReward, 0.03);
  assert.equal(model({ reward: '1' }).result.expectedGrossReward, 0.03);
});
test('zero miner and zero reward are valid without division by zero', () => {
  assert.equal(model({ miner: '0' }).result.expectedBlockEquivalents, 0);
  assert.equal(model({ reward: '0' }).result.expectedGrossReward, 0);
  assert.equal(model({ miner: '1000000' }).result.relativeContribution, 1);
});
test('invalid, missing, unsupported, excessive and nonfinite teaching assumptions clear results', () => {
  assert.equal(calculateTeaching().result, null);
  for (const field of ['miner','network','seconds','reward']) {
    for (const value of ['', 'bad', undefined, null, NaN, Infinity, -1, 1e99, 1e-99]) assert.equal(model({ [field]: value }).result, null, `${field}: ${value}`);
  }
  for (const changes of [{ network: '0' }, { seconds: '0' }, { miner: '1000001' }, { minerUnit: 'watts' }, { networkUnit: '__proto__' }]) assert.equal(model(changes).result, null);
});
test('extreme supported arithmetic stays finite and tiny values remain nonzero on display', () => {
  const tiny = model({ miner: 1e-9, network: 1e18, seconds: 1e-9, reward: 1e-9 }).result;
  assert.ok(tiny.expectedGrossReward > 0);
  assert.match(formatTeaching(tiny.expectedGrossReward), /e-/);
  const large = model({ miner: 1e18, network: 1e18, seconds: teachingLimits.seconds, reward: 1e6 }).result;
  assert.ok(Object.values(large).every(Number.isFinite));
  assert.equal(formatTeaching(0), '0'); assert.equal(formatTeaching(0.015), '0.015');
  assert.equal(formatTeaching(1 / 3), '0.3333333'); assert.equal(formatTeaching(NaN), '—');
  assert.equal(model({ miner: 1 }).result.expectedGrossReward, 0.000015);
});
test('reset assumptions are fresh copies of the static teaching example', () => {
  const changed = defaultTeachingInputs(); changed.miner = '0';
  assert.equal(defaultTeachingInputs().miner, '1000');
  assert.deepEqual(defaultTeachingInputs(), { miner: '1000', minerUnit: 'H/s', network: '1000000', networkUnit: 'H/s', seconds: '3600', reward: '0.5' });
});
