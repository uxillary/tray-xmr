import assert from "node:assert/strict";
import { after, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { createServer as createHttpServer } from "node:http";
import { createServer } from "vite";

const vite = await createServer({ cacheDir: "node_modules/.vite-ssr-tests", configFile: false, root: fileURLToPath(new URL("../", import.meta.url)), plugins: [react(), {
  name: "static-markup-styles", enforce: "pre",
  resolveId(id) { if (id.endsWith(".css")) return "\0static-markup-style:" + id; },
  load(id) { if (id.startsWith("\0static-markup-style:")) return "export default {}"; },
}], server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null }, optimizeDeps: { noDiscovery: true }, appType: "custom" });
const { MiningSessionTelemetry } = await vite.ssrLoadModule("/src/components/MiningTelemetry.tsx");
const { EmberStream } = await vite.ssrLoadModule("/src/components/EmberStream.tsx");
const { workspaceDestination } = await vite.ssrLoadModule("/src/App.tsx");
const { MiningSetup } = await vite.ssrLoadModule("/src/components/MiningSetup.tsx");
const { SessionDiagnostics } = await vite.ssrLoadModule("/src/components/SessionDiagnostics.tsx");
after(() => vite.close());

const setup = {
  engine: "ready", engineIssue: null, engineVersion: "6.26.0", walletMasked: "48…ABC", pool: { host: "pool.example", port: 3333, tls: true, worker: null },
  profile: "quiet", logicalProcessors: 16, threads: 4,
  profileOptions: [{ profile: "quiet", threads: 4 }, { profile: "balanced", threads: 8 }, { profile: "performance", threads: 16 }],
  revision: 1, acknowledged: true, ready: true, startAllowed: true, startReason: "ready", checks: [], storageError: null,
};

function renderSession(overrides = {}, props = {}) {
  const session = {
    state: "mining", processId: 42, sessionDurationSeconds: 65, telemetryFreshness: "fresh", error: null,
    telemetry: {
      sampleTimeUnixMs: Date.now(),
      shortHashrate: 873, mediumHashrate: 860, longHashrate: 820,
      results: { accepted: 3, rejected: 0, total: 3, currentJobDifficulty: 10000, acceptedDifficultyTotal: 30000 },
      poolConnection: { state: "connected", algorithm: "rx/0", currentJobDifficulty: 10000 }, cpuHugePages: { allocated: 0, total: 16 },
    },
    startupStage: null, startupElapsedMs: null, startupTimings: [], diagnostics: [], captureHealth: null,
    contribution: { active: false, developerSlot: false, secondsToSwitch: null, userActiveSeconds: 0, developerActiveSeconds: 0, developerWallet: "" },
    ...overrides,
  };
  return renderToStaticMarkup(createElement(MiningSessionTelemetry, { session, setup, onStop() {}, stopping: false, ...props }));
}

test("mining composition keeps status, pool, configured threads, work and details accessible", () => {
  const html = renderSession();
  assert.match(html, /<h2>Mining<\/h2>/);
  assert.match(html, /Current hashrate<\/span><strong><span>873<\/span><small>H\/s<\/small>/);
  assert.match(html, /This PC to pool\. Pool status: Connected/);
  assert.match(html, /Quiet, 4 of 16 CPU threads configured/);
  assert.match(html, /1m 5s/);
  assert.match(html, /Accepted<\/span><strong>3/);
  assert.match(html, /Rejected<\/span><strong>0/);
  assert.match(html, /<summary>Details<\/summary>/);
  assert.match(html, /Stop mining/);
  assert.match(html, /data-pose="mining"/);
  assert.match(html, /data-active-work="true"/);
  assert.match(html, /living-core\/v3\/character\.png/);
  assert.doesNotMatch(html, /class="ember-core /);
  assert.doesNotMatch(html, /aria-live/);
});

test("starting reserves metrics, while stale and disconnected values remain truthful", () => {
  const starting = renderSession({ state: "starting", processId: 42, sessionDurationSeconds: null, telemetryFreshness: "unavailable", telemetry: null, startupStage: "waitingForMiner" });
  assert.match(starting, /<h2>Starting<\/h2>/);
  assert.match(starting, /Current hashrate<\/span><strong>—/);
  assert.match(starting, /Pool status: —/);
  assert.match(starting, /Accepted<\/span><strong>—/);
  assert.match(starting, /Stop mining/);

  const stale = renderSession({ telemetryFreshness: "stale", telemetry: { sampleTimeUnixMs: Date.now(), shortHashrate: 0, results: { accepted: 0, rejected: 2 }, poolConnection: { state: "disconnected" } } });
  assert.match(stale, /Updates delayed/);
  assert.match(stale, /<strong><span>0<\/span><small>H\/s<\/small><\/strong>/);
  assert.match(stale, /Pool status: Disconnected/);
  assert.match(stale, /Rejected<\/span><strong>2/);
  assert.match(stale, /data-pose="miningQuiet"/);
  assert.doesNotMatch(stale, /crystal-lit\.png|data-active-work="true"/);
});

test("failed polling overrides cached Mining while preserving Stop and last-known measurements", () => {
  const html = renderSession({}, { statusUnavailable: true });
  assert.match(html, /<h2>Status unavailable<\/h2>/);
  assert.match(html, /data-pose="unavailable"/);
  assert.match(html, /Status unavailable · last reported readings/);
  assert.match(html, /Last reported · 10-second average/);
  assert.match(html, /Stop mining/);
  assert.match(html, /<span>873<\/span><small>H\/s<\/small>/);
  assert.doesNotMatch(html, /data-active-work="true"|crystal-lit\.png|Ember is tending/);
});

test("Mining uses shared lifecycle poses, reduced motion and a persistent disabled stopping control", () => {
  for (const state of ["starting", "mining", "stopping", "stopped", "paused", "error", "unavailable"]) {
    const html = renderSession({ state }, { reducedMotion: true });
    assert.match(html, new RegExp(`data-pose="${state}"`));
    assert.match(html, /living-core--still/);
    assert.match(html, /data-frame="0"/);
    assert.match(html, /aria-hidden="true"/);
    if (state !== "mining") assert.doesNotMatch(html, /data-active-work="true"/);
    if (state === "stopping") assert.match(html, /disabled="">Stopping…<\/button>/);
  }
  assert.match(renderSession({}, { stopping: true }), /disabled="">Stopping…<\/button>/);
});

test("unavailable and missing-rate telemetry suppress tending without inventing zero", () => {
  for (const overrides of [{ telemetryFreshness: "unavailable" }, { telemetry: null }, { telemetry: { shortHashrate: null } }]) {
    const html = renderSession(overrides);
    assert.match(html, /data-pose="miningQuiet"/);
    assert.doesNotMatch(html, /data-active-work="true"|crystal-lit\.png/);
    if (!overrides.telemetryFreshness) assert.match(html, /<strong>Unavailable<\/strong>/);
    if (overrides.telemetry === null) assert.doesNotMatch(html, />Live telemetry</);
  }
  const unknown = renderSession({ state: "futureState" });
  assert.match(unknown, /<h2>Status unavailable<\/h2>/);
  assert.match(unknown, /Status unavailable · last reported readings/);
  assert.doesNotMatch(unknown, /No active session|data-active-work="true"/);
});

test("ready setup places Start before editable setup details; active session exposes Stop", () => {
  const callbacks = { onChange() {}, refresh: async () => {}, refreshSession: async () => {}, events: [], eventsUnavailable: false };
  const ready = renderToStaticMarkup(createElement(MiningSetup, { ...callbacks, setup, session: { state: "ready", startupStage: null, processId: null }, sessionStatusUnavailable: false, diagnosticsMode: false, diagnosticRunning: false, copyDiagnostics() {} }));
  assert.ok(ready.indexOf("Start mining") < ready.indexOf('aria-labelledby="step-wallet"'));

  const active = renderToStaticMarkup(createElement(MiningSetup, { ...callbacks, setup, session: { state: "mining", startupStage: null, processId: 42, sessionDurationSeconds: 1, telemetryFreshness: "fresh", telemetry: null, error: null, contribution: { active: false } }, sessionStatusUnavailable: false, diagnosticsMode: false, diagnosticRunning: false, copyDiagnostics() {} }));
  assert.match(active, /Stop mining/);
});

test("missing, expired and future sample timestamps never light the workshop", () => {
  for (const sampleTimeUnixMs of [null, NaN, 0, Date.now() - 6000, Date.now() + 60000]) {
    const html = renderSession({ telemetry: { shortHashrate: 873, sampleTimeUnixMs } });
    assert.doesNotMatch(html, /data-active-work="true"|crystal-lit\.png/);
    assert.match(html, /Updates delayed|Telemetry unavailable/);
    assert.match(html, /Last reported · 10-second average/);
    const unavailable = renderSession({ telemetryFreshness: "unavailable", telemetry: { shortHashrate: 873, sampleTimeUnixMs } });
    assert.match(unavailable, /Telemetry unavailable/);
    assert.doesNotMatch(unavailable, /Updates delayed/);
  }
});

test("terminal scenes preserve setup recovery and unavailable status retains its retry action", () => {
  const props = { setup, onChange() {}, refresh: async () => {}, refreshSession: async () => {}, events: [], eventsUnavailable: false, diagnosticsMode: false, diagnosticRunning: false, copyDiagnostics() {} };
  const stopped = { state: "stopped", startupStage: null, processId: null, telemetryFreshness: "unavailable", telemetry: null, error: null, diagnostics: [], startupTimings: [], contribution: { active: false } };
  const html = renderToStaticMarkup(createElement(MiningSetup, { ...props, session: stopped, sessionStatusUnavailable: false }));
  assert.match(html, /data-pose="stopped"/);
  assert.match(html, /Start mining/);
  assert.match(html, /aria-labelledby="step-wallet"/);
  assert.doesNotMatch(html, /Stop mining/);
  const failed = renderToStaticMarkup(createElement(MiningSetup, { ...props, session: null, sessionStatusUnavailable: true }));
  assert.match(failed, /data-pose="unavailable"/);
  assert.match(failed, /Check session status/);
  assert.doesNotMatch(failed, /Start mining|Stop mining/);
});

test("intentional rest is calm, retained readings are historical and failures remain visible", () => {
  for (const state of ["stopped", "ready", "notConfigured"]) {
    const html = renderSession({ state, telemetryFreshness: "unavailable", telemetry: null, sessionDurationSeconds: null });
    assert.match(html, /operation-resting/);
    assert.match(html, state === "stopped" ? /Session stopped/ : state === "ready" ? /Ready to begin/ : /A little setup first/);
    assert.match(html, /Pool status: Not connected/);
    assert.match(html, /Not running/);
    assert.doesNotMatch(html, /<strong>Unavailable<\/strong>|Live telemetry|data-active-work="true"/);
  }
  const stopped = renderSession({ state: "stopped" });
  assert.match(stopped, /Last reported: 873 H\/s · no live hashrate/);
  assert.match(stopped, /Last session/);
  assert.match(stopped, /Last accepted/);
  assert.match(stopped, /Last rejected/);
  assert.doesNotMatch(stopped, /Pool status: Connected|Live telemetry/);
  const failed = renderSession({ state: "stopped" }, { statusUnavailable: true });
  assert.doesNotMatch(failed, /Session stopped|operation-resting/);
  assert.match(failed, /Status unavailable/);
  const error = renderSession({ state: "stopped", error: { kind: "stopFailed", message: "Engine still running" } });
  assert.doesNotMatch(error, /operation-resting/);
});

test("Home handles all legacy destinations and Settings remains separate", () => {
  for (const path of ["/", "/home", "/overview", "/mining", "/activity"]) {
    assert.equal(workspaceDestination(path), "home");
    assert.equal(workspaceDestination("/", "#" + path), "home");
  }
  assert.equal(workspaceDestination("/settings"), "settings");
  assert.equal(workspaceDestination("/", "#/settings"), "settings");
});

test("Home always includes one workshop and a calm empty Stream through setup and recovery", () => {
  const props = { setup: { ...setup, ready: false, walletMasked: null }, onChange() {}, refresh: async () => {}, refreshSession: async () => {}, events: [], eventsUnavailable: false, diagnosticsMode: false, diagnosticRunning: false, copyDiagnostics() {} };
  for (const state of ["notConfigured", "ready", "stopped", "error"]) {
    const html = renderToStaticMarkup(createElement(MiningSetup, { ...props, session: { state, processId: null, startupStage: null, diagnostics: [], startupTimings: [], telemetry: null, contribution: { active: false } }, sessionStatusUnavailable: false }));
    assert.equal((html.match(/class="living-core /g) ?? []).length, 1);
    assert.match(html, /aria-label="Setup steps"/);
    assert.match(html, /Wallet → Pool → Power → Review/);
    assert.match(html, /All quiet here/);
    assert.doesNotMatch(html, /class="ember-stream-row /);
  }
});

test("unknown status blocks Start while cached active ownership retains Stop even without readiness", () => {
  const props = { onChange() {}, refresh: async () => {}, refreshSession: async () => {}, events: [], eventsUnavailable: false, diagnosticsMode: false, diagnosticRunning: false, copyDiagnostics() {} };
  for (const session of [null, { state: "unavailable", startupStage: null, processId: null }, { state: "unknown", startupStage: null, processId: null }]) {
    const html = renderToStaticMarkup(createElement(MiningSetup, { ...props, setup, session, sessionStatusUnavailable: false }));
    assert.doesNotMatch(html, /Start mining/);
    assert.match(html, /Check session status/);
  }
  const html = renderToStaticMarkup(createElement(MiningSetup, { ...props, setup: null, session: { state: "mining", processId: 42, telemetry: null, startupStage: null, contribution: { active: false } }, sessionStatusUnavailable: true }));
  assert.match(html, /Stop mining/);
});

test("Activity renders supplied bounded events in backend order with severity and no technical clutter", () => {
  const events = Array.from({ length: 300 }, (_, i) => ({ id: `event-${i}`, occurredAtUnixMs: 1000+i, category: "system", severity: i % 2 ? "error" : "informational", source: "emberLifecycle", sessionId: "fixture", kind: { type: "miningStarted", data: { profile: "quiet", configuredThreads: 4 } } }));
  const html = renderToStaticMarkup(createElement(EmberStream, { events }));
  assert.equal((html.match(/class="ember-stream-row /g) ?? []).length, 256);
  assert.ok(html.indexOf('data-event-id="event-44"') < html.indexOf('data-event-id="event-299"'));
  assert.doesNotMatch(html, /data-event-id="event-43"/);
  assert.match(html, /ember-stream-row--error/);
  assert.match(html, /this app run only/);
  assert.doesNotMatch(html, /Technical detail|emberLifecycle|configuredThreads/);
  const quiet = renderToStaticMarkup(createElement(EmberStream, { events: [] }));
  assert.doesNotMatch(quiet, /<li/);
  const failed = renderToStaticMarkup(createElement(EmberStream, { events: events.slice(-2), unavailable: true }));
  assert.match(failed, /Last received events retained/);
  assert.equal((failed.match(/class="ember-stream-row /g) ?? []).length, 2);
});

test("Settings retains the same owned Stop control while hiding the scene and everyday feed", () => {
  const props = { controlsOnly: true, setup, onChange() {}, refresh: async () => {}, refreshSession: async () => {}, events: [], eventsUnavailable: false, diagnosticsMode: false, diagnosticRunning: false, copyDiagnostics() {} };
  for (const state of ["starting", "mining", "stopping"]) {
    const html = renderToStaticMarkup(createElement(MiningSetup, { ...props, session: { state, processId: 42, startupStage: null, telemetry: null }, sessionStatusUnavailable: true }));
    assert.match(html, state === "stopping" ? /Stopping…/ : /Stop mining/);
    assert.doesNotMatch(html, /class="living-core|Live activity|Start mining/);
  }
  assert.equal(renderToStaticMarkup(createElement(MiningSetup, { ...props, session: { state: "ready", processId: null, startupStage: null }, sessionStatusUnavailable: false })), "");
});

test("Diagnostics keeps all stage/capture errors in a named modal with separately focusable raw output", () => {
  const session = { processId: 42, state: "error", error: { kind: "stopFailed", message: "Engine may still be running" }, startupStage: null, startupTimings: [{ stage: "startingXmrig", elapsedMs: 0 }], diagnostics: [{ source: "supervisor", message: "Sanitized test note" }], captureHealth: { stdoutReaderStarted: true, stderrReaderStarted: true, sanitizedLinesObserved: 0, stdoutEofObserved: false, stderrEofObserved: true, stdoutReadError: "readFailure", stderrReadError: "pipeClosed" } };
  const html = renderToStaticMarkup(createElement(SessionDiagnostics, { session, diagnosticsMode: true, copyDiagnostics() {} }));
  assert.match(html, /<dialog[^>]*aria-labelledby="diagnostics-title"/);
  assert.match(html, /aria-label="Close diagnostics"/);
  assert.match(html, /Engine may still be running/);
  assert.match(html, /readFailure/); assert.match(html, /pipeClosed/);
  assert.match(html, /<dd>0 ms<\/dd>/); assert.match(html, /Sanitized test note/);
  assert.match(html, /role="region" aria-label="Sanitized engine output" tabindex="0"/);
  assert.match(html, /Copy sanitized report/);
  assert.doesNotMatch(html, /<dialog[^>]* open/);
});
