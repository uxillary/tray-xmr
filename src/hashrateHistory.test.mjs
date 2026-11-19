import assert from "node:assert/strict";
import { test } from "node:test";
import { HISTORY_MAX_SAMPLES, HISTORY_WINDOW_MS, initialHistory, observeHashrate, historySegments } from "./hashrateHistory.mjs";

const base = 1_000_000;
const snapshot = (time, rate = 100, overrides = {}) => ({ state: "mining", processId: 42, startupStage: null, telemetryFreshness: "fresh", telemetry: { sampleTimeUnixMs: time, shortHashrate: rate }, ...overrides });
const step = (history, time, rate = 100, overrides = {}, options = {}) => observeHashrate(history, snapshot(time, rate, overrides), { now: time, ...options });

test("orders authoritative timestamps and suppresses repeated/changed cached snapshots", () => {
  let h = step(initialHistory(), base);
  h = step(h, base, 999);
  h = step(h, base - 1);
  h = step(h, base + 1500, 110);
  assert.deepEqual(h.samples.map((s) => [s.time, s.rate]), [[base, 100], [base + 1500, 110]]);
  assert.equal(historySegments(h.samples).length, 2, "backwards clock evidence breaks continuity");
});

test("retains genuine equal-rate observations and irregular intervals without filling points", () => {
  let h = step(initialHistory(), base);
  for (const delta of [950, 2700, 6500]) h = step(h, base + delta);
  assert.equal(h.samples.length, 4);
  assert.equal(historySegments(h.samples).length, 1);
});

test("bounded recent window and count limits are independent and explicit", () => {
  let h = initialHistory();
  for (let i = 0; i < 400; i++) h = step(h, base + i * 100);
  assert.equal(h.samples.length, HISTORY_MAX_SAMPLES);
  h = step(h, base + 400_000);
  assert.equal(h.samples.length, 1);
  h = step(h, base + 400_000 + HISTORY_WINDOW_MS);
  assert.equal(h.samples.length, 2, "window includes its boundary");
  h = step(h, base + 400_001 + HISTORY_WINDOW_MS);
  assert.equal(h.samples.length, 2);
});

test("missing data and unavailable polls break paths without substituting zero", () => {
  let h = step(initialHistory(), base, 0);
  h = step(h, base + 1000, null);
  h = step(h, base + 2000, 120);
  h = step(h, base + 3000, 999, {}, { unavailable: true });
  h = step(h, base + 4000, 130);
  assert.deepEqual(h.samples.map((s) => s.rate), [0, 120, 130]);
  assert.equal(historySegments(h.samples).length, 3);
});

test("stale, expired, future, missing and invalid evidence cannot enter the graph", () => {
  for (const [time, rate, overrides, now] of [
    [base, 100, { telemetryFreshness: "stale" }, base],
    [base, 100, { telemetryFreshness: "unavailable" }, base],
    [base, 100, {}, base + 5001], [base + 1, 100, {}, base],
    [null, 100, {}, base], [NaN, 100, {}, base], [0, 100, {}, base],
    [base, -1, {}, base], [base, Infinity, {}, base], [base, null, {}, base],
  ]) {
    const h = observeHashrate(initialHistory(), snapshot(time, rate, overrides), { now });
    assert.equal(h.samples.length, 0);
    assert.equal(h.breakPending, true);
  }
});

test("stalled snapshot expiry and long polling gaps cannot bridge the line", () => {
  let h = step(initialHistory(), base);
  h = observeHashrate(h, snapshot(base), { now: base + 5001 });
  assert.equal(h.breakPending, true);
  h = step(h, base + 6000);
  assert.equal(historySegments(h.samples).length, 2);
  const irregular = step(step(initialHistory(), base), base + 5001);
  assert.equal(historySegments(irregular.samples).length, 2);
});

test("stop retains historical observations; next Starting clears them and rejects cached data", () => {
  let h = step(initialHistory(), base);
  h = step(h, base + 1000, 999, { state: "stopping" });
  h = step(h, base + 2000, 999, { state: "stopped", processId: null });
  assert.equal(h.samples.length, 1);
  h = step(h, base + 3000, 999, { state: "starting", processId: null });
  assert.equal(h.samples.length, 0);
  h = observeHashrate(h, snapshot(base), { now: base + 4000 });
  assert.equal(h.samples.length, 0);
  h = step(h, base + 4000, 140);
  assert.deepEqual(h.samples.map((s) => s.rate), [140]);
});

test("changed process, terminal re-entry and rapid transitions never combine sessions", () => {
  let h = step(initialHistory(), base);
  h = step(h, base + 1000, 200, { processId: 43 });
  assert.deepEqual(h.samples.map((s) => s.rate), [200]);
  for (const state of ["error", "ready", "starting", "stopping", "stopped", "starting"]) h = step(h, base + 2000, 999, { state });
  assert.equal(h.samples.length, 0);
  h = step(h, base + 3000, 50);
  assert.deepEqual(h.samples.map((s) => s.rate), [50]);
});

test("pause, unavailable and missing process identity interrupt conservatively", () => {
  let h = step(initialHistory(), base);
  h = step(h, base + 1000, 999, { state: "paused" });
  h = step(h, base + 2000, 100, { processId: null });
  assert.equal(h.samples.length, 2);
  assert.equal(historySegments(h.samples).length, 2);
  h = step(h, base + 3000, 999, { state: "futureState" });
  h = step(h, base + 4000);
  assert.equal(historySegments(h.samples).length, 3);
});

test("historical window stays anchored after stopping and reducer does not mutate input", () => {
  const h = step(initialHistory(), base);
  const stopped = step(h, base + 1000, 0, { state: "stopped", processId: null });
  const later = step(stopped, base + 900_000, 0, { state: "stopped", processId: null });
  assert.deepEqual(later.samples, stopped.samples);
  assert.equal(later.endTime, stopped.endTime);
  assert.equal(h.lifecycle, "mining");
  assert.equal(h.samples.length, 1);
});

test("wall-clock regression cannot move retained samples beyond the chart's time axis", () => {
  const h = step(initialHistory(), base);
  const backwards = step(h, base - 2000);
  assert.equal(backwards.endTime, base);
  assert.equal(backwards.samples.length, 1);
  assert.equal(backwards.breakPending, true);
});
