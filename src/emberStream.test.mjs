import test from "node:test";
import assert from "node:assert/strict";
import { formatEmberEventTime, presentEmberEvent } from "./emberStream.mjs";

const event = (type, data, extra = {}) => ({ id: "id", occurredAtUnixMs: 1, sessionId: "private-id", category: "system", severity: "informational", source: "emberLifecycle", kind: { type, data }, ...extra });

test("translates lifecycle events without exposing configuration or identifiers", () => {
  assert.deepEqual(presentEmberEvent(event("sessionStarting", { profile: "quiet", configuredThreads: 4 })), { marker: "SYSTEM", message: "Preparing mining session", icon: "engine" });
  assert.deepEqual(presentEmberEvent(event("miningStarted", { profile: "quiet", configuredThreads: 4 })), { marker: "ENGINE", message: "Mining started", icon: "engine" });
  assert.equal(presentEmberEvent(event("miningStopped", { reason: "owner", wasMining: true })).message, "Mining stopped");
  assert.equal(presentEmberEvent(event("miningStopped", { reason: "startupCancelled", wasMining: false })).message, "Mining startup stopped");
});

test("translates pool transitions and result deltas into concise singular and plural copy", () => {
  const pool = (from, to) => presentEmberEvent(event("poolConnectionChanged", { from, to }));
  assert.equal(pool("unknown", "connected").message, "Pool connection established");
  assert.equal(pool("disconnected", "connected").message, "Pool connection restored");
  assert.equal(pool("connected", "disconnected").message, "Pool connection lost");
  assert.equal(presentEmberEvent(event("resultsAccepted", { count: 1 })).message, "Result accepted");
  assert.equal(presentEmberEvent(event("resultsAccepted", { count: 3 })).message, "3 results accepted");
  assert.equal(presentEmberEvent(event("resultsRejected", { count: 2 })).message, "2 results rejected");
});

test("distinguishes startup, unexpected-exit, and stop failures", () => {
  assert.equal(presentEmberEvent(event("miningFailed", { failure: "startup" })).marker, "WARNING");
  assert.equal(presentEmberEvent(event("miningFailed", { failure: "unexpectedEngineExit" })).message, "Mining engine stopped unexpectedly");
  assert.equal(presentEmberEvent(event("miningFailed", { failure: "stopFailed" })).message, "Ember couldn’t stop the mining engine");
});

test("formats supplied Unix timestamps in local time and handles invalid values", () => {
  assert.equal(formatEmberEventTime(0), new Date(0).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
  assert.equal(formatEmberEventTime(Number.NaN), "--:--:--");
});
