import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const idExists = (html, id) => new RegExp(`\\bid=["']${id}["']`).test(html);

test('shared shell exposes skip link, named navigation landmarks and a main target', () => {
  const html = source('../src/components/SiteLayout.astro');
  assert.match(html, /class="skip-link" href="#main"/);
  assert.match(html, /<main id="main">/);
  assert.match(html, /<nav aria-label="Main navigation">/);
  assert.match(html, /<nav class="footer-links" aria-label="Footer navigation">/);
});

test('calculator inputs have concise labels, described help/error IDs and announced errors', () => {
  const electricity = source('../src/pages/tools/electricity-cost-calculator.astro');
  for (const id of ['power-watts', 'electricity-rate', 'runtime-preset', 'period-days', 'currency']) {
    assert.ok(idExists(electricity, id), `missing electricity input ${id}`);
    assert.match(electricity, new RegExp(`<label\\b[^>]*\\bfor="${id}"`), `missing label for ${id}`);
  }
  assert.match(electricity, /id="runtime-hours"[^>]*aria-label="Custom runtime in hours per day"/);
  for (const id of ['power-help', 'power-error', 'rate-help', 'rate-error', 'hours-error', 'days-help', 'days-error']) assert.ok(idExists(electricity, id), `missing described content ${id}`);
  assert.equal((electricity.match(/class="calc-error"[^>]*aria-live="polite"/g) ?? []).length, 4);
  assert.match(electricity, /id="calc-status" aria-live="polite"/);

  const mining = source('../src/pages/tools/monero-mining-profitability-calculator.astro');
  for (const id of ['miner-hashrate', 'wall-power-watts', 'mining-hours-per-day', 'electricity-price', 'pool-fee-percent', 'network-difficulty', 'network-hashrate', 'expected-reward-per-block', 'xmr-price', 'mining-currency']) {
    assert.ok(idExists(mining, id), `missing mining input ${id}`);
    assert.match(mining, new RegExp(`<label for="${id}">`), `missing label for ${id}`);
  }
  for (const id of ['hash-help', 'hash-error', 'difficulty-help', 'difficulty-error', 'currency-help', 'currency-status']) assert.ok(idExists(mining, id), `missing described content ${id}`);
  assert.equal((mining.match(/class="field-error"[^>]*aria-live="polite"/g) ?? []).length, 9);
  assert.match(mining, /id="mining-status" aria-live="polite"/);
});

test('log decoder exposes its input name, accessible validation, live status and results focus target', () => {
  const html = source('../src/pages/tools/xmrig-log-decoder.astro');
  assert.match(html, /<label for="xmrig-log">XMRig console or log excerpt<\/label>/);
  assert.match(html, /id="xmrig-log"[^>]*aria-describedby="log-help privacy-note"/);
  assert.match(html, /id="input-error" role="alert"/);
  assert.match(html, /id="result-status" class="decoder-status" aria-live="polite"/);
  assert.match(html, /id="results-title" tabindex="-1"/);
});
