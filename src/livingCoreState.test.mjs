import assert from "node:assert/strict";
import test from "node:test";
import { livingCoreState } from "./livingCoreState.mjs";

const mining = { state: "mining", startupStage: null, telemetryFreshness: "fresh", telemetry: { shortHashrate: 873 } };

test("all nine Rust lifecycle states stay distinct", () => {
  for (const state of ["notConfigured", "ready", "starting", "mining", "paused", "stopping", "stopped", "error", "unavailable"]) {
    const view = livingCoreState({ session: { ...mining, state } });
    assert.equal(view.lifecycle, state);
    assert.equal(view.pose, state);
    assert.equal(view.activeWork, state === "mining");
  }
});

test("failed status beats cached mining, startup and readiness", () => {
  const view = livingCoreState({ session: { ...mining, startupStage: "waitingForMiner" }, readiness: { ready: true }, statusUnavailable: true });
  assert.equal(view.lifecycle, "unavailable");
  assert.equal(view.activeWork, false);
  assert.equal(view.animate, false);
  assert.equal(view.freshness, "unavailable");
});

test("missing and unknown status cannot confirm activity; readiness is a no-session fallback", () => {
  assert.equal(livingCoreState().lifecycle, "unavailable");
  assert.equal(livingCoreState({ readiness: { ready: true } }).lifecycle, "ready");
  assert.equal(livingCoreState({ readiness: { ready: false } }).lifecycle, "notConfigured");
  const unknown = livingCoreState({ session: { ...mining, state: "futureState", startupStage: "checkingEngine" }, readiness: { ready: true } });
  assert.equal(unknown.lifecycle, "unavailable");
  assert.equal(unknown.activeWork, false);
  assert.equal(unknown.animate, false);
  assert.equal(livingCoreState({ session: { ...mining, state: "stopped" }, readiness: { ready: true } }).lifecycle, "stopped");
});

test("startup preparation does not overwrite stopping, paused or terminal states", () => {
  assert.equal(livingCoreState({ session: { ...mining, startupStage: "checkingEngine" } }).lifecycle, "starting");
  for (const state of ["stopping", "stopped", "error", "paused", "unavailable"]) {
    assert.equal(livingCoreState({ session: { ...mining, state, startupStage: "checkingEngine" } }).lifecycle, state);
  }
});

test("stale and unavailable telemetry freeze work without rewriting Mining", () => {
  for (const telemetryFreshness of ["stale", "unavailable", undefined]) {
    const view = livingCoreState({ session: { ...mining, telemetryFreshness } });
    assert.equal(view.lifecycle, "mining");
    assert.equal(view.pose, "miningQuiet");
    assert.equal(view.animate, false);
    assert.equal(view.activeWork, false);
    assert.equal(view.qualifier, telemetryFreshness === "stale" ? "Updates delayed" : "Telemetry unavailable");
  }
});

test("fresh zero, absent rates and absent telemetry differ from stale readings", () => {
  for (const rate of [0, null, undefined, NaN, Infinity, -1]) {
    const view = livingCoreState({ session: { ...mining, telemetry: { shortHashrate: rate } } });
    assert.equal(view.freshness, "fresh");
    assert.equal(view.activeWork, false);
    assert.equal(view.qualifier, rate === 0 ? "No recent hashing reported" : "Waiting for rate data");
  }
  assert.equal(livingCoreState({ session: { ...mining, telemetry: null } }).qualifier, "Telemetry unavailable");
  assert.equal(livingCoreState({ session: mining }).activeWork, true);
});
