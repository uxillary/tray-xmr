import test from "node:test";
import assert from "node:assert/strict";
import { deviceStatusPresentation } from "./deviceStatus.mjs";

test("keeps configured, active, stopped, pending and attention states distinct", () => {
  assert.deepEqual(deviceStatusPresentation("notConfigured"), { label: "Not configured", tone: "neutral" });
  assert.deepEqual(deviceStatusPresentation("ready"), { label: "Ready", tone: "positive" });
  assert.deepEqual(deviceStatusPresentation("mining"), { label: "Mining", tone: "positive" });
  assert.deepEqual(deviceStatusPresentation("starting"), { label: "Starting", tone: "pending" });
  assert.deepEqual(deviceStatusPresentation("paused"), { label: "Paused", tone: "pending" });
  assert.deepEqual(deviceStatusPresentation("stopped"), { label: "Stopped", tone: "neutral" });
  assert.deepEqual(deviceStatusPresentation("error"), { label: "Needs attention", tone: "attention" });
});

test("unknown and missing states are not inferred as idle or mining", () => {
  assert.deepEqual(deviceStatusPresentation("futureState"), { label: "Status unavailable", tone: "neutral" });
  assert.deepEqual(deviceStatusPresentation(null), { label: "Checking status", tone: "neutral" });
});
