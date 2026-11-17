import { useEffect, useRef, useState } from "react";
import { OverviewPage } from "../App";
import manifest from "../livingCoreManifest.json";
import { livingCoreState } from "../livingCoreState.mjs";
import { MiningSessionTelemetry } from "../components/MiningTelemetry";
import { EmberStream } from "../components/EmberStream";
import { checkLivingCoreLifecycle } from "./checkLivingCoreLifecycle";
import type { MiningReadiness, MiningSessionStatus } from "../components/MiningSetup";
import "./LivingCorePreview.css";

const choices = [
  ["notConfigured", "Not configured"], ["ready", "Ready"], ["starting", "Starting"],
  ["mining", "Mining"], ["paused", "Paused"], ["stopping", "Stopping"], ["stopped", "Stopped"],
  ["error", "Error"], ["unavailable", "Unavailable"], ["stale", "Mining · stale telemetry"],
  ["missing", "Mining · telemetry unavailable"], ["zero", "Mining · fresh zero hashrate"],
  ["missingRate", "Mining · missing rate"], ["failed", "Failed poll · cached Mining"],
  ["unknown", "Unknown lifecycle · cached telemetry"],
] as const;
type Choice = typeof choices[number][0];

const readiness: MiningReadiness = {
  engine: "ready", engineIssue: null, engineVersion: "", walletMasked: null, developerWallet: "", pool: null,
  profile: "quiet", logicalProcessors: 16, threads: 4, profileOptions: [], revision: 0, acknowledged: true,
  ready: true, startAllowed: false, startReason: "Development preview", checks: [], storageError: null,
};

function fixture(choice: Choice): MiningSessionStatus {
  const state = ["stale", "missing", "zero", "missingRate", "failed"].includes(choice) ? "mining" : choice as MiningSessionStatus["state"];
  return {
    state, processId: null, sessionDurationSeconds: null,
    telemetryFreshness: choice === "stale" ? "stale" : choice === "missing" || state !== "mining" ? "unavailable" : "fresh",
    telemetry: choice === "missing" || state !== "mining" ? null : {
      engineVersion: null, uptimeSeconds: null, paused: false, supportedAlgorithms: [],
      shortHashrate: choice === "zero" ? 0 : choice === "missingRate" ? null : 128,
      mediumHashrate: null, longHashrate: null, results: null, poolConnection: null, cpuHugePages: null, sampleTimeUnixMs: null,
    },
    error: state === "error" ? { kind: "preview", message: "Development attention pose" } : null,
    diagnostics: [], captureHealth: null, startupStage: state === "starting" ? "waitingForMiner" : null,
    startupElapsedMs: null, startupTimings: [],
    contribution: { active: false, developerSlot: false, secondsToSwitch: null, userActiveSeconds: 0, developerActiveSeconds: 0, developerWallet: "" },
  };
}

export default function LivingCorePreview() {
  const [choice, setChoice] = useState<Choice>(() => new URLSearchParams(window.location.search).get("page") === "mining" ? "mining" : "ready");
  const [page, setPage] = useState<"overview" | "mining">(() => new URLSearchParams(window.location.search).get("page") === "mining" ? "mining" : "overview");
  const [reduced, setReduced] = useState(false);
  const [notice, setNotice] = useState(false);
  const [animated, setAnimated] = useState(true);
  const [frame, setFrame] = useState(0);
  const [replay, setReplay] = useState(0);
  const [dimensions, setDimensions] = useState("Measuring scene…");
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState("");
  const [controlsHidden, setControlsHidden] = useState(false);
  const checkHost = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const session = fixture(choice);
  const view = livingCoreState({ session, statusUnavailable: choice === "failed" });
  const clip = manifest.clips[view.pose];
  const frames = manifest.assets[clip.character as keyof typeof manifest.assets].frames;
  useEffect(() => {
    const scene = root.current?.querySelector<HTMLElement>(".living-core");
    if (!scene) return;
    const measure = () => {
      const scale = Number(getComputedStyle(scene).getPropertyValue("--scene-scale")) || 1;
      const size = manifest.characterSize;
      setDimensions(`${Math.round(scene.clientWidth)} × ${Math.round(scene.clientHeight)} px viewport · base sprite ${size.width*scale} × ${size.height*scale} px (${size.width} × ${size.height} logical, ${scale}×; motion bounds ≤ ${size.maxWidth*scale} × ${size.maxHeight*scale} px) · ${frames} frames at ${clip.fps} fps`);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(scene);
    measure();
    return () => observer.disconnect();
  }, [frames, clip.fps, replay, page, checking]);
  useEffect(() => {
    if (!checking || !checkHost.current) return;
    // Parent content is already unmounted before the test installs its clock.
    checkLivingCoreLifecycle(checkHost.current, fixture("mining"), readiness)
      .then(setCheckResult, (error: unknown) => setCheckResult(`FAIL · ${error instanceof Error ? error.message : String(error)}`))
      .finally(() => setChecking(false));
  }, [checking]);
  return <div className="living-core-preview" ref={root}>
    <header className={`living-core-preview-toolbar${controlsHidden ? " is-collapsed" : ""}`}>
      <div className="living-core-preview-heading"><strong>Living Core · development preview</strong><p>Synthetic state fixtures. No miner is started; results and earnings are never simulated.</p></div>
      <button className="living-core-preview-collapse" type="button" aria-expanded={!controlsHidden} onClick={() => setControlsHidden((value) => !value)}>{controlsHidden ? "Show preview controls" : "Hide preview controls"}</button>
      <label>Page <select value={page} onChange={(event) => setPage(event.target.value as "overview" | "mining")}><option value="overview">Overview</option><option value="mining">Mining</option></select></label>
      <label>State <select value={choice} onChange={(event) => { setChoice(event.target.value as Choice); setFrame(0); setNotice(false); }}>{choices.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label><input type="checkbox" checked={reduced} onChange={(event) => setReduced(event.target.checked)} /> Reduced motion</label>
      <label><input type="checkbox" checked={animated} onChange={(event) => setAnimated(event.target.checked)} /> Animate</label>
      {!animated && <label>Frame <input type="range" min="0" max={frames-1} value={Math.min(frame, frames-1)} onChange={(event) => setFrame(Number(event.target.value))} /><output>{Math.min(frame, frames-1)+1}/{frames}</output></label>}
      <button type="button" onClick={() => setReplay((value) => value+1)}>Replay transition</button>
      <button type="button" disabled={checking} onClick={() => { setCheckResult(""); setChecking(true); }}>Run lifecycle checks</button>
      {checkResult && <p role="status">{checkResult}</p>}
      <p className="living-core-preview-dimensions">{dimensions}</p>
    </header>
    <div className="app-shell">
      <aside className="sidebar" aria-label="Preview context">
        <div className="brand-lockup"><img className="brand-mark" src="/ember-mark.svg" alt="" /><span>ember</span></div>
        <button className={`nav-item${page === "overview" ? " is-active" : ""}`} onClick={() => setPage("overview")}>Overview</button><button className={`nav-item${page === "mining" ? " is-active" : ""}`} onClick={() => setPage("mining")}>Mining</button><p className="living-core-preview-note">Isolated artwork preview</p>
      </aside>
      <main className={`workspace workspace--${page}`}><div className="page-content">
        <header className="page-heading"><h1>{page === "mining" ? "Mining" : "Overview"}</h1></header>
        {checking ? <div className="living-core-check-host" ref={checkHost} /> : page === "overview" ? <OverviewPage key={`overview-${replay}`} session={session} setup={{ ...readiness, ready: choice !== "notConfigured" }} statusError={false} sessionStatusUnavailable={choice === "failed"} systemSnapshot={null} openMining={() => setPage("mining")} reducedMotion={reduced} inspectFrame={animated || reduced ? undefined : frame} /> : <section className="active-mining-panel">
          <MiningSessionTelemetry key={`mining-${replay}`} session={session} setup={readiness} statusUnavailable={choice === "failed"} onStop={["ready", "notConfigured", "stopped", "error", "unavailable", "unknown"].includes(choice) ? undefined : () => setNotice(true)} stopping={false} reducedMotion={reduced} inspectFrame={animated || reduced ? undefined : frame} />
          <EmberStream events={[]} mining={view.lifecycle === "mining"} />
        </section>}
        {notice && <p role="status">Preview only. No mining command was sent.</p>}
      </div></main>
    </div>
  </div>;
}
