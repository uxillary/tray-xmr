import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeXMRigLog, MAX_LOG_BYTES } from '../src/lib/xmrig-log-decoder.mjs';

test('rejects empty, non-text and oversized input', () => {
  assert.match(analyzeXMRigLog('').error, /Paste/);
  assert.match(analyzeXMRigLog(' \n ').error, /Paste/);
  assert.match(analyzeXMRigLog(null).error, /Paste/);
  assert.match(analyzeXMRigLog('x'.repeat(MAX_LOG_BYTES + 1)).error, /200 KB/);
  assert.equal(analyzeXMRigLog('x'.repeat(MAX_LOG_BYTES)).unknownLines, 1);
});

test('recognizes documented signals across CRLF/LF, timestamps and ANSI colors', () => {
  const log = '\u001b[32m[2026-01-02 03:04:05] cpu READY threads 8/8 huge pages 100%\u001b[0m\r\n[2026-01-02 03:04:06] msr register values for "intel" preset has been set successfully (16 ms)\n[2026-01-02 03:04:07] net use pool pool.example:3333 1000 ms';
  const result = analyzeXMRigLog(log);
  assert.deepEqual(result.signals.map((x) => x.title), ['CPU backend ready', 'Huge Pages fully allocated', 'MSR preset applied', 'Pool connection established']);
  assert.equal(result.unknownLines, 0);
});

test('groups duplicate state lines but preserves first and last chronology', () => {
  const result = analyzeXMRigLog('cpu READY threads 8/8 huge pages 50%\ncpu READY threads 8/8 huge pages 50%\naccepted (1/0)');
  assert.equal(result.signals[0].count, 2);
  assert.deepEqual([result.signals[0].firstOrder, result.signals[0].lastOrder], [1, 2]);
  assert.equal(result.signals.find((x) => x.title === 'Share accepted').count, 1);
});

test('keeps success and failure events separate and never returns captured identifiers', () => {
  const secret = '48wallet-address-private-identifier';
  const result = analyzeXMRigLog(`cpu READY threads 8/8 huge pages 35%\n[pool] connection lost ${secret}\n[pool] reconnect attempt ${secret}\n[CPU] rejected (${secret})\n[CPU] accepted (${secret})\nmsr failed ${secret}\nrandom unknown ${secret}`);
  const output = JSON.stringify(result);
  assert.doesNotMatch(output, new RegExp(secret));
  assert.deepEqual(result.signals.map((x) => x.title), ['CPU backend ready', 'Huge Pages partially allocated', 'Pool connection lost', 'Pool reconnect attempt', 'Share rejected', 'Share accepted', 'MSR operation reported a problem']);
  assert.equal(result.unknownLines, 1);
});

test('leaves unrelated, malformed and unknown output uninterpreted', () => {
  const result = analyzeXMRigLog('not a log\n\u0000???\n[2026-99-99] no matching status\n\n');
  assert.deepEqual(result.signals, []);
  assert.equal(result.unknownLines, 3);
});

test('normalizes Windows CRLF and summarizes repeated shares without merging outcomes', () => {
  const result = analyzeXMRigLog('[CPU] accepted (1/0)\r\n[CPU] accepted (2/0)\r\n[CPU] rejected (2/1)');
  assert.equal(result.signals[0].count, 2);
  assert.equal(result.signals[1].title, 'Share rejected');
});

