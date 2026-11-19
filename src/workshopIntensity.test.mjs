import test from "node:test";
import assert from "node:assert/strict";
import { initialIntensity, stepIntensity, intensityMotion, telemetryExpiryDelay } from "./workshopIntensity.mjs";
const sample = (rate = 100, time = 100000) => ({ state: "mining", processId: 42, telemetryFreshness: "fresh", telemetry: { shortHashrate: rate, sampleTimeUnixMs: time } });
const step = (state, rate, time, extra = {}) => stepIntensity(state, { session: sample(rate, time), key: "42:quiet:4", now: time, ...extra });
function calibrated(rate = 100) { let state = initialIntensity(); for (let time = 100000; time <= 132000; time += 2000) state = step(state, rate, time); return state; }
test("only distinct stable samples spanning 30 seconds establish a machine-local baseline", () => {
  let state = step(initialIntensity(), 100, 100000);
  for (let i = 0; i < 100; i++) state = step(state, 100, 100000);
  assert.equal(state.samples.length, 1); assert.equal(state.baseline, null);
  assert.equal(calibrated().baseline, 100); assert.equal(calibrated(50000).baseline, 50000);
  assert.equal(calibrated().level, "steady");
  state = initialIntensity();
  for (let time = 100000; time < 140000; time += 2000) state = step(state, time % 4000 ? 150 : 100, time);
  assert.equal(state.baseline, null); assert.equal(state.level, "steady");
});
test("relative rates are smoothed, require dwell and use hysteresis", () => {
  let state = calibrated();
  state = step(state, 200, 134000);
  assert.equal(state.level, "steady"); assert.equal(state.ratio, 1.125);
  for (let t = 136000; t <= 144000; t += 2000) state = step(state, 150, t);
  assert.equal(state.level, "lively"); assert.equal(state.baseline, 100);
  for (let t = 146000; t <= 162000; t += 2000) state = step(state, 112, t);
  assert.equal(state.level, "lively");
  for (let t = 164000; t <= 190000; t += 2000) state = step(state, 100, t);
  assert.equal(state.level, "steady");
  for (let t = 192000; t <= 218000; t += 2000) state = step(state, 60, t);
  assert.equal(state.level, "gentle");
});
test("zero, missing, stale, unavailable, reduced motion and every non-Mining lifecycle reset work", () => {
  const previous = calibrated();
  for (const session of [null, sample(0), sample(null), sample(NaN), { ...sample(), telemetry: null }, { ...sample(), telemetryFreshness: "stale" }, { ...sample(), telemetryFreshness: "unavailable" }, ...["ready", "starting", "stopping", "stopped", "paused", "error", "unavailable"].map((state) => ({ ...sample(), state })), { ...sample(), startupStage: "waitingForMiner" }]) {
    assert.deepEqual(stepIntensity(previous, { session, key: previous.key, now: 100000 }), initialIntensity());
  }
  assert.equal(step(previous, 100, 134000, { unavailable: true }).active, false);
  assert.equal(step(previous, 100, 134000, { reducedMotion: true }).active, false);
});
test("missing/old/future timestamps suppress work; gaps and config changes recalibrate", () => {
  const previous = calibrated();
  for (const stamp of [null, 0, NaN, 100000, 200001]) {
    const state = stepIntensity(previous, { session: sample(100, stamp), key: previous.key, now: 200000 });
    assert.equal(state.active, false); assert.equal(state.responsive, false); assert.equal(state.level, "steady");
  }
  for (const state of [step(previous, 100, 150000), step(previous, 100, 120000), step(previous, 100, 134000, { key: "43:performance:16" })]) {
    assert.equal(state.baseline, null); assert.equal(state.samples.length, 1);
  }
});
test("effect speed stays bounded at every level and input ratio is clamped", () => {
  for (const level of ["gentle", "steady", "lively"]) {
    const motion = intensityMotion({ ...calibrated(), level });
    assert.ok(motion.fps >= 4 && motion.fps <= 6); assert.ok(motion.seconds >= 2.4 && motion.seconds <= 4.8);
  }
  assert.equal(intensityMotion(initialIntensity()).level, "inactive");
  assert.equal(step(calibrated(), 1e12, 134000).ratio, 1.125);
});

test("visual evidence expires even if a fresh status request stalls", () => {
  assert.equal(telemetryExpiryDelay(sample(100, 100000), 100100), 4901);
  assert.equal(telemetryExpiryDelay(sample(100, 100000), 106000), 0);
  assert.equal(telemetryExpiryDelay(sample(100, null), 106000), 5001);
  assert.equal(telemetryExpiryDelay({ ...sample(), state: "stopped" }), null);
  assert.equal(telemetryExpiryDelay(null), null);
});
