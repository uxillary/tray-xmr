import assert from "node:assert/strict";
import test from "node:test";
import { createFramePlayer } from "./livingCoreAnimation.mjs";

function player(options = {}) {
  const pending = new Map();
  const seen = [];
  let id = 0;
  const instance = createFramePlayer({
    frames: 4, fps: 4, loop: true, onFrame: (frame) => seen.push(frame),
    schedule: (fn, delay) => { assert.ok(delay >= 125); pending.set(++id, fn); return id; },
    cancel: (key) => pending.delete(key), ...options,
  });
  return { ...instance, seen, pending, tick() { const [key, fn] = [...pending][0]; pending.delete(key); fn(); } };
}

test("frame player advances at authored rate with only one pending timer", () => {
  const p = player();
  assert.equal(p.pending.size, 0);
  p.setRunning(true);
  p.setRunning(true);
  for (let i = 0; i < 5; i++) { assert.equal(p.pending.size, 1); p.tick(); }
  assert.deepEqual(p.seen, [1, 2, 3, 0, 1]);
  p.dispose();
  assert.equal(p.pending.size, 0);
});

test("hidden, offscreen and reduced-motion gates can suspend and resume without catching up", () => {
  const p = player();
  p.setRunning(true);
  p.tick();
  const obsoleteCallback = [...p.pending.values()][0];
  p.setRunning(false);
  assert.equal(p.pending.size, 0);
  obsoleteCallback();
  assert.deepEqual(p.seen, [1]);
  p.setRunning(true);
  p.tick();
  assert.deepEqual(p.seen, [1, 2]);
  p.dispose();
  p.setRunning(true);
  assert.equal(p.pending.size, 0);
});

test("one-shot preparation/settling stop on the final frame", () => {
  const p = player({ loop: false });
  p.setRunning(true);
  p.tick(); p.tick(); p.tick();
  assert.deepEqual(p.seen, [1, 2, 3]);
  assert.equal(p.pending.size, 0);
  p.setRunning(false); p.setRunning(true);
  assert.equal(p.pending.size, 0);
});

test("static and invalid clips never create timers", () => {
  for (const options of [{ frames: 1 }, { fps: 0 }, { fps: 60 }, { fps: NaN }, { frames: 1.5 }]) {
    const p = player(options);
    p.setRunning(true);
    assert.equal(p.pending.size, 0);
    p.dispose();
  }
});

test("pose replacement disposes its timer before a quiet or new pose takes over", () => {
  const mining = player({ frames: 12, fps: 6 });
  mining.setRunning(true);
  mining.tick();
  const oldTick = [...mining.pending.values()][0];
  mining.dispose();
  const quiet = player({ frames: 1, fps: 0 });
  quiet.setRunning(true);
  oldTick();
  assert.equal(mining.pending.size, 0);
  assert.deepEqual(mining.seen, [1]);
  assert.equal(quiet.pending.size, 0);
  const stopping = player({ frames: 6, fps: 6, loop: false });
  stopping.setRunning(true);
  for (let i = 0; i < 5; i++) stopping.tick();
  assert.equal(stopping.pending.size, 0);
  quiet.dispose(); stopping.dispose();
});
