import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { referenceEntries as entries, referenceCategories as categories, referenceVersion, referenceReviewed } from '../src/data/xmrig-reference.mjs';
import { teachingExample as e, teachingScenarios } from '../src/data/mining-education.mjs';
import { analyzeXMRigLog } from '../src/lib/xmrig-log-decoder.mjs';
import { BLOCK_TARGET_SECONDS, calculateMiningEconomics } from '../src/lib/mining-economics.mjs';

test('finite reference covers all ten existing families with unique stable anchors', () => {
  assert.equal(entries.length, 15);
  assert.equal(categories.length, 5);
  assert.equal(new Set([...entries, ...categories].map((item) => item.id)).size, 20);
  for (const item of [...entries, ...categories]) assert.match(item.id, /^[a-z]+(?:-[a-z]+)*$/);
  assert.deepEqual(entries.flatMap((item) => item.decoderKeys).sort(), [
    'cpuReady', 'hugePagesFull', 'hugePagesPartial', 'msrApplied', 'msrFailed',
    'shareAccepted', 'shareRejected', 'poolConnected', 'poolDisconnect', 'poolRetry',
  ].sort());
  for (const category of categories) assert.ok(entries.some((item) => item.category === category.id));
});

test('every entry retains pinned source, version, context, boundary and next action', () => {
  assert.equal(referenceVersion, '6.26.0');
  assert.equal(referenceReviewed, '2026-11-25');
  for (const item of entries) {
    assert.ok(categories.some((category) => category.id === item.category));
    assert.equal(item.version, referenceVersion);
    assert.equal(item.reviewed, referenceReviewed);
    assert.match(item.source.url, /^https:\/\/github.com\/xmrig\/xmrig\/blob\/v6\.26\.0\/src\/.+#L\d+-L\d+$/);
    for (const key of ['title', 'establishes', 'doesNot', 'context', 'action', 'link', 'exampleKind']) assert.ok(item[key]);
    assert.match(item.href, /^\/(learn|guides|troubleshoot)\//);
    if (item.coverage === 'Reference-only') assert.equal(item.decoderKeys.length, 0);
  }
});

test('source-backed synthetic examples honestly describe actual decoder recognition', () => {
  for (const item of entries.filter((item) => item.example)) {
    const result = analyzeXMRigLog(item.example);
    assert.deepEqual(result.signals.map((signal) => signal.title), item.exampleTitles, item.id);
    assert.equal(result.unknownLines, item.exampleTitles.length ? 0 : 1, item.id);
  }
  assert.equal(entries.filter((item) => item.coverage === 'Recognized').length, 7);
  assert.equal(entries.filter((item) => item.coverage === 'Reference-only').length, 5);
  assert.equal(entries.filter((item) => item.coverage === 'Heuristic family').length, 2);
  assert.equal(entries.filter((item) => item.coverage === 'Wording-limited').length, 1);
  assert.equal(analyzeXMRigLog('msr register values for "ryzen_17h" preset has been set successfully').signals[0].title, 'MSR preset applied');
  assert.equal(analyzeXMRigLog('pool connection closed').signals[0].title, 'Pool connection lost');
  assert.equal(analyzeXMRigLog('stratum retry').signals[0].title, 'Pool reconnect attempt');
});

test('teaching arithmetic agrees with both unchanged calculator network bases', () => {
  assert.equal(e.targetSeconds, BLOCK_TARGET_SECONDS);
  assert.equal(e.networkDifficulty, 120_000_000);
  assert.equal(e.networkHashrate * e.targetSeconds, e.networkDifficulty);
  assert.equal(e.minerHashrate / e.networkHashrate, 0.001);
  assert.equal(e.relativeRate, 0.001);
  assert.equal(e.assumedReward, 0.5);
  assert.deepEqual(teachingScenarios.map((s) => [s.hashes, s.expectedBlocks, s.grossXmr]), [
    [3_600_000, 0.03, 0.015], [7_200_000, 0.06, 0.03], [36_000_000, 0.3, 0.15],
  ]);
  for (const s of teachingScenarios) for (const basis of ['difficulty', 'hashrate']) {
    const result = calculateMiningEconomics({ minerHashrate: e.minerHashrate, hoursPerDay: s.hours,
      wallPowerWatts: 0, electricityPricePerKwh: 0, poolFeePercent: 0, xmrPrice: 0,
      expectedRewardPerBlock: e.assumedReward, currency: 'GBP', networkBasis: basis,
      ...(basis === 'difficulty' ? { networkDifficulty: e.networkDifficulty } : { networkHashrate: e.networkHashrate }),
    }, 1);
    assert.equal(result.minerHashes, s.hashes);
    assert.equal(result.expectedBlocks, s.expectedBlocks);
    assert.equal(result.grossXmr, s.grossXmr);
  }
});

test('both collection routes and contextual entry points remain discoverable', () => {
  const read = (path) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8');
  for (const [slug, section, visual] of [['xmrig-log-reference', 'troubleshoot', 'log-reference'], ['mining-difficulty-expected-rewards', 'learn', 'difficulty']]) {
    const article = read(`content/articles/${slug}.md`);
    assert.match(article, new RegExp(`section: ${section}`));
    assert.match(article, new RegExp(`visual: ${visual}`));
    assert.ok(read(`pages/${section}/index.astro`).includes(slug));
  }
  assert.ok(read('pages/tools/xmrig-log-decoder.astro').includes('/troubleshoot/xmrig-log-reference/'));
  assert.ok(read('pages/tools/monero-mining-profitability-calculator.astro').includes('/learn/mining-difficulty-expected-rewards/#relative-hashrate'));
});
