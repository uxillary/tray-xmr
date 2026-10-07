import assert from "node:assert/strict";
import { after, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const vite = await createServer({ configFile: false, root: fileURLToPath(new URL("../", import.meta.url)), plugins: [react()], server: { middlewareMode: true }, appType: "custom" });
const { MiningSessionTelemetry } = await vite.ssrLoadModule("/src/components/MiningTelemetry.tsx");
const { MiningSetup } = await vite.ssrLoadModule("/src/components/MiningSetup.tsx");
after(() => vite.close());

const setup = {
  engine: "ready", engineIssue: null, engineVersion: "6.26.0", walletMasked: "48…ABC", pool: { host: "pool.example", port: 3333, tls: true, worker: null },
  profile: "quiet", logicalProcessors: 16, threads: 4,
  profileOptions: [{ profile: "quiet", threads: 4 }, { profile: "balanced", threads: 8 }, { profile: "performance", threads: 16 }],
  revision: 1, acknowledged: true, ready: true, startAllowed: true, startReason: "ready", checks: [], storageError: null,
};

function renderSession(overrides = {}) {
  const session = {
    state: "mining", processId: 42, sessionDurationSeconds: 65, telemetryFreshness: "fresh", error: null,
    telemetry: {
      shortHashrate: 873, mediumHashrate: 860, longHashrate: 820,
      results: { accepted: 3, rejected: 0, total: 3, currentJobDifficulty: 10000, acceptedDifficultyTotal: 30000 },
      poolConnection: { state: "connected", algorithm: "rx/0", currentJobDifficulty: 10000 }, cpuHugePages: { allocated: 0, total: 16 },
    },
    startupStage: null, startupElapsedMs: null, startupTimings: [], diagnostics: [], captureHealth: null,
    ...overrides,
  };
  return renderToStaticMarkup(createElement(MiningSessionTelemetry, { session, setup, onStop() {}, stopping: false }));
}

test("mining composition keeps status, pool, configured threads, work and details accessible", () => {
  const html = renderSession();
  assert.match(html, /<h2>Mining<\/h2>/);
  assert.match(html, /Current hashrate<\/span><strong>873 H\/s/);
  assert.match(html, /This PC to pool\. Pool status: Connected/);
  assert.match(html, /Quiet, 4 of 16 CPU threads configured/);
  assert.match(html, /1m 5s/);
  assert.match(html, /Accepted<\/span><strong>3/);
  assert.match(html, /Rejected<\/span><strong>0/);
  assert.match(html, /<summary>Details<\/summary>/);
  assert.match(html, /Stop mining/);
  assert.doesNotMatch(html, /aria-live/);
});

test("starting reserves metrics, while stale and disconnected values remain truthful", () => {
  const starting = renderSession({ state: "starting", processId: 42, sessionDurationSeconds: null, telemetryFreshness: "unavailable", telemetry: null, startupStage: "waitingForMiner" });
  assert.match(starting, /<h2>Starting<\/h2>/);
  assert.match(starting, /Current hashrate<\/span><strong>—/);
  assert.match(starting, /Pool status: —/);
  assert.match(starting, /Accepted<\/span><strong>—/);
  assert.match(starting, /Stop mining/);

  const stale = renderSession({ telemetryFreshness: "stale", telemetry: { shortHashrate: 0, results: { accepted: 0, rejected: 2 }, poolConnection: { state: "disconnected" } } });
  assert.match(stale, /Updates delayed/);
  assert.match(stale, /<strong>0 H\/s<\/strong>/);
  assert.match(stale, /Pool status: Disconnected/);
  assert.match(stale, /Rejected<\/span><strong>2/);
});

test("ready setup places Start before editable setup details; active session exposes Stop", () => {
  const callbacks = { onChange() {}, refresh: async () => {}, refreshSession: async () => {} };
  const ready = renderToStaticMarkup(createElement(MiningSetup, { ...callbacks, setup, session: { state: "ready", startupStage: null, processId: null }, sessionStatusUnavailable: false, diagnosticsMode: false, diagnosticRunning: false, copyDiagnostics() {} }));
  assert.ok(ready.indexOf("Start mining") < ready.indexOf('aria-labelledby="step-wallet"'));

  const active = renderToStaticMarkup(createElement(MiningSetup, { ...callbacks, setup, session: { state: "mining", startupStage: null, processId: 42, sessionDurationSeconds: 1, telemetryFreshness: "fresh", telemetry: null, error: null }, sessionStatusUnavailable: false, diagnosticsMode: false, diagnosticRunning: false, copyDiagnostics() {} }));
  assert.match(active, /Stop mining/);
});
