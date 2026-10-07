import assert from "node:assert/strict";
import test from "node:test";
import { formatHashrate, formatSessionDuration, miningTelemetryViewModel } from "./miningTelemetry.mjs";

test("formats hashrate units without inventing missing values", () => {
  assert.equal(formatHashrate(null), null);
  assert.equal(formatHashrate(0), "0 H/s");
  assert.equal(formatHashrate(0.01), "<0.1 H/s");
  assert.equal(formatHashrate(125.5), "125.5 H/s");
  assert.equal(formatHashrate(1250), "1.3 kH/s");
  assert.equal(formatHashrate(999_999), "1 MH/s");
  assert.equal(formatHashrate(1_500_000), "1.5 MH/s");
});

test("formats session duration compactly", () => {
  assert.equal(formatSessionDuration(null), null);
  assert.equal(formatSessionDuration(0), "0s");
  assert.equal(formatSessionDuration(65), "1m 5s");
  assert.equal(formatSessionDuration(3660), "1h 1m");
  assert.equal(formatSessionDuration(90000), "1d 1h");
});

test("maps fresh telemetry and configured profile capacity", () => {
  const view = miningTelemetryViewModel({
    state: "mining", sessionDurationSeconds: 65, telemetryFreshness: "fresh",
    telemetry: {
      shortHashrate: 125.5, mediumHashrate: 120, longHashrate: 110,
      results: { accepted: 4, rejected: 1, acceptedDifficultyTotal: 30000, currentJobDifficulty: 10000 },
      poolConnection: { state: "connected", algorithm: "rx/0", currentJobDifficulty: 10000 },
      cpuHugePages: { allocated: 0, total: 16 },
    },
  }, { profile: "quiet", threads: 4, logicalProcessors: 16 });
  assert.equal(view.stateLabel, "Mining");
  assert.equal(view.isSessionActive, true);
  assert.equal(view.freshnessLabel, "Live telemetry");
  assert.equal(view.hashrateLabel, "125.5 H/s");
  assert.equal(view.poolLabel, "Connected");
  assert.equal(view.accepted, 4);
  assert.equal(view.rejected, 1);
  assert.equal(view.sessionDuration, "1m 5s");
  assert.equal(view.profile, "quiet");
  assert.equal(view.lanes.length, 16);
  assert.equal(view.lanes.filter(Boolean).length, 4);
  assert.equal(view.cpuActivity, "Hashing observed");
});

test("keeps stale last-known zero visible and keeps lifecycle separate from pool state", () => {
  const view = miningTelemetryViewModel({
    state: "mining", sessionDurationSeconds: 2, telemetryFreshness: "stale",
    telemetry: {
      shortHashrate: 0, mediumHashrate: null, longHashrate: null,
      results: { accepted: 0, rejected: 0, acceptedDifficultyTotal: 0, currentJobDifficulty: 0 },
      poolConnection: { state: "disconnected", algorithm: null, currentJobDifficulty: 0 },
      cpuHugePages: null,
    },
  }, { profile: "balanced", threads: 8, logicalProcessors: 16 });
  assert.equal(view.stateLabel, "Mining");
  assert.equal(view.isSessionActive, true);
  assert.equal(view.freshnessLabel, "Updates delayed");
  assert.equal(view.hashrateLabel, "0 H/s");
  assert.equal(view.poolLabel, "Disconnected");
  assert.equal(view.accepted, 0);
  assert.equal(view.rejected, 0);
  assert.equal(view.cpuActivity, "No recent hashing reported");
});

test("unavailable telemetry and unknown pool remain unavailable and do not become zero", () => {
  const view = miningTelemetryViewModel({
    state: "starting", sessionDurationSeconds: null, telemetryFreshness: "unavailable", telemetry: null,
  }, { profile: "quiet", threads: 4, logicalProcessors: 16 });
  assert.equal(view.freshnessLabel, "Waiting for miner data");
  assert.equal(view.hashrateLabel, "—");
  assert.equal(view.accepted, null);
  assert.equal(view.rejected, null);
  assert.equal(view.poolLabel, "—");
  assert.equal(view.sessionDuration, null);
  assert.equal(view.isSessionActive, false);

  const unknown = miningTelemetryViewModel({
    state: "mining", sessionDurationSeconds: 1, telemetryFreshness: "fresh",
    telemetry: { shortHashrate: null, mediumHashrate: null, longHashrate: null, results: null, poolConnection: { state: "unknown", algorithm: null, currentJobDifficulty: null }, cpuHugePages: null },
  }, null);
  assert.equal(unknown.poolLabel, "Unknown");
  assert.equal(unknown.hashrateLabel, "Unavailable");
  assert.equal(unknown.lanes.length, 0);
});
