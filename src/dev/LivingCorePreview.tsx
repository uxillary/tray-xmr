import { useEffect, useRef, useState } from "react";
import type { invoke } from "@tauri-apps/api/core";
import { initialHistory, observeHashrate } from "../hashrateHistory.mjs";
import App from "../App";
import { checkStreamScrolling } from "./checkStreamScrolling";
import { checkLivingCoreLifecycle } from "./checkLivingCoreLifecycle";
import { checkLivePerformance } from "./checkLivePerformance";
import { checkDiagnostics } from "./checkDiagnostics";
import type { MiningReadiness, MiningSessionStatus } from "../components/MiningSetup";
import type { EmberEvent } from "../emberStream.mjs";
import "./LivingCorePreview.css";

const choices = [
  ["series", "Mining · simulated sample series"], ["gaps", "Mining · simulated missing-data gaps"], ["retained", "Stopped · retained simulated observations"], ["newSession", "New session · empty history"],
  ["notConfigured", "Not configured"], ["ready", "Ready"], ["starting", "Starting"],
  ["mining", "Mining"], ["paused", "Paused"], ["stopping", "Stopping"], ["stopped", "Stopped"],
  ["error", "Error"], ["unavailable", "Unavailable"], ["stale", "Mining · stale telemetry"],
  ["missing", "Mining · telemetry unavailable"], ["zero", "Mining · fresh zero hashrate"],
  ["missingRate", "Mining · missing rate"], ["failed", "Failed poll · cached Mining"],
  ["unknown", "Unknown lifecycle · cached telemetry"],
] as const;
type Choice = typeof choices[number][0];

const readiness: MiningReadiness = {
  engine: "ready", engineIssue: null, engineVersion: "6.26.0", walletMasked: "48…preview", developerWallet: "Development fixture only", pool: { host: "pool.example", port: 3333, tls: true, worker: null },
  profile: "quiet", logicalProcessors: 16, threads: 4, profileOptions: [{ profile: "quiet", threads: 4 }, { profile: "balanced", threads: 8 }, { profile: "performance", threads: 16 }], revision: 0, acknowledged: true,
  ready: true, startAllowed: true, startReason: "Development preview", checks: [], storageError: null,
};

const previewEvents: EmberEvent[] = Array.from({ length: 36 }, (_, index) => ({
  id: `fixture-event-${index}`, sessionId: "development-only", occurredAtUnixMs: Date.now() - (36 - index) * 10000,
  category: index % 6 === 4 ? "pool" : index % 6 === 5 ? "result" : "system",
  severity: index % 6 === 4 ? "warning" : index % 6 === 5 ? "success" : "informational",
  source: index % 6 >= 4 ? "xmrigSummary" : "emberLifecycle",
  kind: index % 6 === 4 ? { type: "poolConnectionChanged", data: { from: "connected", to: "disconnected" } }
    : index % 6 === 5 ? { type: "resultsAccepted", data: { count: 1 } }
      : { type: "miningStarted", data: { profile: "quiet", configuredThreads: 4 } },
}));

function fixture(choice: Choice): MiningSessionStatus {
  const state = ["stale", "missing", "zero", "missingRate", "failed", "series", "gaps"].includes(choice) ? "mining" : choice === "retained" ? "stopped" : choice === "newSession" ? "starting" : choice as MiningSessionStatus["state"];
  return {
    state, processId: ["mining", "starting", "stopping", "paused"].includes(state) ? 42 : null, sessionDurationSeconds: state === "mining" ? 125 : null,
    telemetryFreshness: choice === "stale" ? "stale" : choice === "missing" || state !== "mining" ? "unavailable" : "fresh",
    telemetry: choice === "missing" || state !== "mining" ? null : {
      engineVersion: "6.26.0", uptimeSeconds: 125, paused: false, supportedAlgorithms: ["rx/0"],
      shortHashrate: choice === "zero" ? 0 : choice === "missingRate" ? null : 128,
      mediumHashrate: 125, longHashrate: null, results: { accepted: 12, rejected: 0, total: 12, currentJobDifficulty: 10000, acceptedDifficultyTotal: 120000 }, poolConnection: { state: "connected", endpoint: "pool.example:3333", uptimeSeconds: 120, failures: 0, pingMs: 38, tlsVersion: "TLSv1.3", algorithm: "rx/0", currentJobDifficulty: 10000 }, cpuHugePages: { allocated: 4, total: 4 }, sampleTimeUnixMs: Date.now(),
    },
    error: state === "error" ? { kind: "preview", message: "Development attention pose" } : null,
    diagnostics: Array.from({ length: 60 }, (_, i) => ({ source: "supervisor", message: `Development fixture evidence ${i + 1}: engine ${state === "error" ? "exit observed" : "readiness checked"}. No native process was started.` })), captureHealth: null, startupStage: state === "starting" ? "waitingForMiner" : null,
    startupElapsedMs: null, startupTimings: [{ stage: "checkingEngine", elapsedMs: 12 }, { stage: "startingXmrig", elapsedMs: 220 }],
    contribution: { active: false, developerSlot: false, secondsToSwitch: null, userActiveSeconds: 0, developerActiveSeconds: 0, developerWallet: "" },
  };
}

export default function LivingCorePreview() {
  const initial = (new URLSearchParams(window.location.search).get("state") ?? "ready") as Choice;
  const [choice, setChoice] = useState<Choice>(choices.some(([id]) => id === initial) ? initial : "ready");
  const [replay, setReplay] = useState(0);
  const [reduced, setReduced] = useState(new URLSearchParams(window.location.search).get("reduced") === "1");
  const [hidden, setHidden] = useState(false);
  const [checkResult, setCheckResult] = useState("");
  const [checking, setChecking] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const eventFixture = useRef(false);
  const [effort, setEffort] = useState(128);
  const rateFixture = useRef(128);
  const performanceFixture = useRef(initialHistory());
  const seriesStart = useRef(Date.now());
  const checkHost = useRef<HTMLDivElement>(null);
  const transitionTimer = useRef<number | null>(null);
  const clearTransition = () => { if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current); transitionTimer.current = null; };
  useEffect(() => clearTransition, []);
  const model = useRef({ session: fixture(choice), setup: { ...readiness }, failed: choice === "failed", statusReads: 0, choice });
  const install = (next: Choice) => {
    clearTransition();
    seriesStart.current = Date.now();
    performanceFixture.current = initialHistory();
    if (["series", "gaps", "retained"].includes(next)) {
      const end = Date.now() - 1000;
      for (let i = 0; i < 57; i++) {
        const now = end - (56 - i) * 2000;
        const sample = fixture("mining");
        sample.telemetry!.sampleTimeUnixMs = now;
        sample.telemetry!.shortHashrate = 860 + Math.round(55 * Math.sin(i / 5) + 17 * Math.cos(i / 2));
        if (next === "gaps" && (i >= 17 && i <= 22 || i >= 36 && i <= 39)) sample.telemetry!.shortHashrate = null;
        performanceFixture.current = observeHashrate(performanceFixture.current, sample, { now });
      }
      if (next === "retained") performanceFixture.current = observeHashrate(performanceFixture.current, fixture("stopped"));
    }
    const setup = next === "notConfigured" ? { ...readiness, ready: false, startAllowed: false, walletMasked: null, pool: null, profile: null, threads: null, acknowledged: false, checks: [{ id: "wallet", label: "Wallet", passed: false }, { id: "pool", label: "Pool", passed: false }, { id: "profile", label: "Power", passed: false }] } : { ...readiness };
    model.current = { session: fixture(next), setup, failed: next === "failed", statusReads: 0, choice: next };
  };
  const [previewInvoke] = useState<typeof invoke>(() => {
    install(choice);
    return (async (command: string, args: unknown) => {
      const current = model.current;
      if (command === "mining_readiness") return current.setup;
      if (command === "mining_status") {
        current.statusReads++;
        if (current.failed && current.statusReads > 1) throw new Error("Preview unavailable");
        const elapsed = Math.floor((Date.now() - seriesStart.current) / 1000);
        const shaped = ["series", "gaps"].includes(model.current.choice);
        const gap = model.current.choice === "gaps" && elapsed % 30 >= 15 && elapsed % 30 <= 20;
        return { ...current.session, sessionDurationSeconds: current.session.state === "mining" ? 125 + elapsed : current.session.sessionDurationSeconds,
          telemetry: current.session.telemetry ? { ...current.session.telemetry,
            sampleTimeUnixMs: model.current.choice === "stale" ? Date.now() - 8000 : Date.now(),
            shortHashrate: gap ? null : shaped ? 860 + Math.round(55 * Math.sin((56 + elapsed / 2) / 5) + 17 * Math.cos((56 + elapsed / 2) / 2)) : current.session.telemetry.shortHashrate === 128 ? rateFixture.current : current.session.telemetry.shortHashrate } : null };
      }
      if (command === "mining_events") return eventFixture.current ? previewEvents : [];
      if (command === "system_snapshot") return null;
      if (command === "start_mining") {
        clearTransition();
        current.session = fixture("starting");
        // Preview transition only. No native command or engine is invoked.
        transitionTimer.current = window.setTimeout(() => { transitionTimer.current = null; if (current.session.state === "starting") current.session = fixture("mining"); }, 3200);
        return current.setup;
      }
      if (command === "stop_mining") {
        clearTransition();
        current.session = { ...current.session, state: "stopping", startupStage: null };
        transitionTimer.current = window.setTimeout(() => { transitionTimer.current = null; if (current.session.state === "stopping") current.session = { ...current.session, state: "stopped", processId: null, telemetryFreshness: "unavailable" }; }, 4000);
        return current.setup;
      }
      if (command === "update_mining_setup") {
        const change = (args as { change: { kind: string; value: unknown } }).change;
        if (change.kind === "wallet") current.setup.walletMasked = change.value ? "48…preview" : null;
        if (change.kind === "pool") current.setup.pool = change.value as MiningReadiness["pool"];
        if (change.kind === "profile") { current.setup.profile = change.value as MiningReadiness["profile"]; current.setup.threads = 4; }
        current.setup.acknowledged = change.kind === "acknowledge";
        current.setup.checks = [
          { id: "wallet", label: "Wallet", passed: Boolean(current.setup.walletMasked) },
          { id: "pool", label: "Pool", passed: Boolean(current.setup.pool) },
          { id: "profile", label: "Power", passed: Boolean(current.setup.profile) },
        ];
        current.setup.ready = current.setup.checks.every((check) => check.passed) && current.setup.acknowledged;
        current.setup.startAllowed = current.setup.ready;
        current.session = fixture(current.setup.ready ? "ready" : "notConfigured");
        return { ...current.setup };
      }
      // Diagnostics/provisioning are deliberately unavailable in this fixture route.
      throw new Error("Not available in the isolated preview");
    }) as typeof invoke;
  });
  async function runChecks() {
    if (!checkHost.current) return;
    setChecking(true);
    try {
      const lifecycle = await checkLivingCoreLifecycle(checkHost.current, fixture("mining"), readiness);
      const stream = await checkStreamScrolling(checkHost.current);
      const diagnostics = await checkDiagnostics(checkHost.current, fixture("error"));
      const performance = await checkLivePerformance(checkHost.current, fixture("mining"), readiness);
      setCheckResult(`${lifecycle} · ${stream} · ${diagnostics} · ${performance}`);
    }
    catch (error) { setCheckResult(`FAIL · ${String(error)}`); }
    finally { setChecking(false); }
  }
  return <div className={`living-core-preview${reduced ? " preview-reduced" : ""}`}>
    <header className={`living-core-preview-toolbar${hidden ? " is-collapsed" : ""}`}>
      <div className="living-core-preview-heading"><strong>Home · isolated development preview</strong><p>Simulated preview data · Fixture telemetry{showEvents ? " and test-only events" : "; empty event feed"}. No XMRig or native mining commands.</p></div>
      <button className="living-core-preview-collapse" type="button" onClick={() => setHidden(!hidden)}>{hidden ? "Show preview controls" : "Hide preview controls"}</button>
      <label>State <select value={choice} onChange={(event) => { const next = event.target.value as Choice; setChoice(next); install(next); setReplay((value) => value + 1); }}>{choices.map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select></label>
      <button type="button" onClick={() => { install(choice); setReplay((value) => value + 1); }}>Replay state</button>
      <label><input type="checkbox" checked={reduced} onChange={(event) => setReduced(event.target.checked)} /> Reduced motion (use browser emulation for timer checks)</label>
      <label><input type="checkbox" checked={showEvents} onChange={(event) => { eventFixture.current = event.target.checked; setShowEvents(event.target.checked); }} /> Test-only event buffer</label>
      <label>Fixture rate <select value={effort} onChange={(event) => { const rate = Number(event.target.value); rateFixture.current = rate; setEffort(rate); }}><option value={80}>80 H/s · lower</option><option value={128}>128 H/s · baseline</option><option value={192}>192 H/s · higher</option></select></label>
      <button type="button" disabled={checking} onClick={() => void runChecks()}>Run lifecycle checks</button>
      <p role="status">{checkResult}</p>
    </header>
    {!checking && <App initialPerformanceHistory={performanceFixture.current} key={replay} invokeCommand={previewInvoke} reducedMotion={reduced} />}
    <div ref={checkHost} className={checking ? "living-core-check-host" : undefined} />
  </div>;
}
