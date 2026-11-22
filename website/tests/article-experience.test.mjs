import test from 'node:test';
import assert from 'node:assert/strict';
import { articleExperience, contentsTree } from '../src/lib/article-experience.mjs';

test('contents use rendered Markdown and raw HTML headings, decoded text and existing IDs', () => {
  const result = articleExperience('<h2 id="before-you-begin">1. Before <em>you</em> begin</h2><h3 id="checks">A &amp; B</h3><pre><code>&lt;h2 id="fake"&gt;example&lt;/h2&gt;</code></pre>');
  assert.deepEqual(result.headings, [
    { depth: 2, slug: 'before-you-begin', text: '1. Before you begin' },
    { depth: 3, slug: 'checks', text: 'A & B' },
  ]);
  assert.match(result.html, /id="checks" tabindex="-1"/);
  assert.match(result.html, /aria-label="A &#x26; B: code example"/);
  assert.match(result.html, /&#x3C;h2 id="fake"/);
});

test('missing IDs are stable and avoid authored IDs, repeated headings and shell IDs', () => {
  const input = '<h2>Same</h2><h2 id="same">Authored</h2><h2>Same</h2><h2>Main</h2><h2>缓存 &amp; RAM</h2>';
  assert.deepEqual(articleExperience(input).headings.map((h) => h.slug), ['same-2', 'same', 'same-3', 'main-2', '缓存-ram']);
  assert.deepEqual(articleExperience(input), articleExperience(input));
});

test('duplicate authored IDs and invalid fragment IDs fail the build', () => {
  for (const html of ['<h2 id="x">A</h2><p id="x">B</p>', '<h2 id="main">A</h2>', '<h2 id="two words">A</h2>']) {
    assert.throws(() => articleExperience(html), /article ID/);
  }
});

test('contents preserve hierarchy and recover from skipped levels without inventing headings', () => {
  const headings = [2, 3, 4, 3, 2, 4].map((depth, i) => ({ depth, slug: `s${i}`, text: `Section ${i}` }));
  const tree = contentsTree(headings);
  assert.deepEqual(tree.map((h) => h.slug), ['s0', 's4']);
  assert.deepEqual(tree[0].children.map((h) => h.slug), ['s1', 's3']);
  assert.equal(tree[0].children[0].children[0].slug, 's2');
  assert.equal(tree[1].children[0].slug, 's5');
});

test('wide tables get a named focusable region, caption and row/column scope without losing values', () => {
  const result = articleExperience('<h2 id="checks">Release checks</h2><table><thead><tr><th>Check</th><th>Limit</th></tr></thead><tbody><tr><td>SHA-256</td><td>Not proof of safety</td></tr></tbody></table>');
  assert.match(result.html, /role="region" tabindex="0" aria-label="Release checks: scrollable table"/);
  assert.match(result.html, /<caption>Release checks<\/caption>/);
  assert.match(result.html, /<th scope="col">Check/);
  assert.match(result.html, /<th scope="row">SHA-256/);
  assert.match(result.html, /<td>Not proof of safety<\/td>/);
});

test('existing diagnostic table regions and captions are preserved without nested scroll traps', () => {
  const result = articleExperience('<div role="region" tabindex="0" aria-label="Signals"><table><caption>Actual signal guide</caption><tbody><tr><th scope="row">100%</th><td>Allocation only</td></tr></tbody></table></div>');
  assert.equal((result.html.match(/role="region"/g) ?? []).length, 1);
  assert.equal((result.html.match(/<caption>/g) ?? []).length, 1);
  assert.match(result.html, /aria-label="Signals"/);
});
