import test from "node:test";
import assert from "node:assert/strict";
import { livingCoreState } from "./livingCoreState.mjs";
import { createWorkshopPlayer, staticWorkshopPose, stepWorkshop, WORKSHOP } from "./workshopBehaviour.mjs";
const view = (state, freshness = "fresh") => livingCoreState({ session: { state, startupStage: null, telemetryFreshness: freshness, telemetry: { shortHashrate: 128 } } });
test("bounded paths approach, tend/inspect and return from the current position", () => {
  let frame = staticWorkshopPose(view("ready"));
  for (let i = 0; i < 28; i++) frame = stepWorkshop(frame, view("starting"));
  assert.equal(frame.x, WORKSHOP.workX);
  const positions = new Set();
  for (let i = 0; i < 150; i++) { frame = stepWorkshop(frame, view("mining")); positions.add(frame.x); assert.ok(frame.x >= WORKSHOP.minX && frame.x <= WORKSHOP.maxX); }
  assert.ok(positions.has(WORKSHOP.workX - 16));
  frame.tick = 0;
  for (let i = 0; i < 24; i++) frame = stepWorkshop(frame, view("stopping"));
  assert.equal(frame.x, WORKSHOP.restX);
});

test("preparation notices first, arrives before working and gestures include reach, release and inspection", () => {
  let frame = staticWorkshopPose(view("ready"));
  for (let i = 0; i < 2; i++) { frame = stepWorkshop(frame, view("starting")); assert.equal(frame.x, WORKSHOP.restX); assert.equal(frame.phase, "notice"); }
  const phases = new Set(), gestures = new Set();
  for (let i = 0; i < 120; i++) {
    const previousX = frame.x;
    frame = stepWorkshop(frame, view("mining"));
    assert.ok(Math.abs(frame.x - previousX) <= 6);
    if (frame.phase === "tend") { assert.equal(frame.x, WORKSHOP.workX); gestures.add(frame.frame); }
    if (frame.phase === "walk") assert.equal(frame.facing, 1, "backsteps keep attention on the crystal");
    phases.add(frame.phase);
  }
  for (const phase of ["walk", "turn", "tend", "inspect"]) assert.ok(phases.has(phase), phase);
  assert.deepEqual([...gestures].sort(), [0, 2]);
});

test("rapid lifecycle changes preserve position instead of resetting to a static anchor", () => {
  const pending = new Map(); let id = 0, frame;
  const player = createWorkshopPlayer({ view: view("ready"), onFrame(next) { frame = next; }, schedule(fn) { pending.set(++id, fn); return id; }, cancel(key) { pending.delete(key); } });
  const advance = () => { const [key, fn] = pending.entries().next().value; pending.delete(key); fn(); };
  player.setRunning(true); player.setView(view("starting"));
  for (let i = 0; i < 9; i++) advance();
  for (const state of ["stopping", "starting", "mining", "stopped", "starting"]) {
    const x = frame.x; player.setView(view(state)); assert.equal(frame.x, x); assert.equal(pending.size, 1); advance(); assert.ok(Math.abs(frame.x - x) <= 6);
  }
  player.dispose(); assert.equal(pending.size, 0);
});
test("ready wanders only a few pixels, stopping allows a final gesture, unknown evidence freezes work", () => {
  let frame = staticWorkshopPose(view("ready"));
  for (let i = 0; i < 256; i++) { frame = stepWorkshop(frame, view("ready")); assert.ok(frame.x >= WORKSHOP.restX && frame.x <= WORKSHOP.restX + 16); }
  frame = { ...frame, x: WORKSHOP.workX, tick: 0 };
  assert.equal(stepWorkshop(frame, view("stopping")).x, frame.x);
  for (const next of [view("mining", "stale"), view("mining", "unavailable"), view("unavailable"), view("error")]) {
    const quiet = stepWorkshop(frame, next);
    assert.equal(quiet.x, frame.x); assert.equal(quiet.frame, 3); assert.equal(next.animate, false);
  }
});
test("rapid retargets use one timer, pause/reduced-motion/hidden gates and disposal cancel all work", () => {
  let sequence = 0, callbacks = 0;
  const pending = new Map();
  const player = createWorkshopPlayer({ view: view("ready"), onFrame() { callbacks++; }, schedule(fn) { pending.set(++sequence, fn); return sequence; }, cancel(id) { pending.delete(id); } });
  player.setRunning(true);
  for (const state of ["starting", "stopping", "mining", "ready", "starting"]) { player.setView(view(state)); assert.equal(pending.size, 1); }
  const advance = () => { const [id, fn] = pending.entries().next().value; pending.delete(id); fn(); };
  advance(); assert.equal(pending.size, 1);
  player.setView(view("mining", "stale")); assert.equal(pending.size, 0);
  player.setView(view("mining")); assert.equal(pending.size, 1);
  player.setRunning(false); assert.equal(pending.size, 0);
  player.setRunning(true); assert.equal(pending.size, 1);
  player.dispose(); const before = callbacks;
  player.setView(view("stopping")); player.setRunning(true);
  assert.equal(pending.size, 0); assert.equal(callbacks, before);
  assert.equal(staticWorkshopPose(view("error")).frame, 3);
  assert.equal(staticWorkshopPose(view("mining")).x, WORKSHOP.workX);
});

test("a fast Stopping → Stopped transition finishes its bounded return and stops scheduling", () => {
  const pending = new Map(); let id = 0, frame;
  const player = createWorkshopPlayer({ view: view("mining"), onFrame(next) { frame = next; }, schedule(fn) { pending.set(++id, fn); return id; }, cancel(id) { pending.delete(id); } });
  player.setRunning(true); player.setView(view("stopping")); player.setView(view("stopped"));
  let count = 0;
  while (pending.size) { const [key, fn] = pending.entries().next().value; pending.delete(key); fn(); assert.ok(++count < 30); }
  assert.equal(frame.x, WORKSHOP.restX); assert.equal(frame.phase, "settle"); assert.equal(frame.frame, 0); assert.equal(frame.facing, 1); assert.equal(pending.size, 0); player.dispose();
});

test("intensity changes clamp scheduler speed and keep one cancellable timer", () => {
  const pending = new Map(); let id = 0;
  const player = createWorkshopPlayer({ view: view("mining"), onFrame() {}, schedule(fn, delay) { pending.set(++id, { fn, delay }); return id; }, cancel(id) { pending.delete(id); } });
  player.setRunning(true);
  for (const [fps, expected] of [[100, 6], [-10, 4], [5, 5], [NaN, 4]]) {
    player.setIntensity(fps); assert.equal(pending.size, 1); assert.equal([...pending.values()][0].delay, 1000 / expected);
  }
  player.setRunning(false); player.setIntensity(6); assert.equal(pending.size, 0);
  player.dispose(); player.setIntensity(5); assert.equal(pending.size, 0);
});
