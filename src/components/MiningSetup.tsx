import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { MiningSessionTelemetry } from "./MiningTelemetry";
import { EmberStream } from "./EmberStream";
import type { EmberEvent } from "../emberStream.mjs";

type Profile = "quiet" | "balanced" | "performance";
type Pool = { host: string; port: number; tls: boolean; worker: string | null };
type Check = { id: string; label: string; passed: boolean };

export type MiningReadiness = {
  engine: "notInstalled" | "verifying" | "ready" | "modified" | "unsupported" | "error";
  engineIssue: string | null;
  engineVersion: string;
  walletMasked: string | null;
  pool: Pool | null;
  profile: Profile | null;
  logicalProcessors: number;
  threads: number | null;
  profileOptions: { profile: Profile; threads: number | null }[];
  revision: number;
  acknowledged: boolean;
  ready: boolean;
  startAllowed: boolean;
  startReason: string;
  checks: Check[];
  storageError: string | null;
};

export type MiningSessionStatus = {
  state: "unavailable" | "notConfigured" | "ready" | "starting" | "mining" | "paused" | "stopping" | "stopped" | "error";
  processId: number | null;
  sessionDurationSeconds: number | null;
  telemetry: {
    engineVersion: string | null;
    uptimeSeconds: number | null;
    paused: boolean | null;
    supportedAlgorithms: string[];
    shortHashrate: number | null;
    mediumHashrate: number | null;
    longHashrate: number | null;
    results: { accepted: number | null; rejected: number | null; total: number | null; currentJobDifficulty: number | null; acceptedDifficultyTotal: number | null } | null;
    poolConnection: { state: "connected" | "disconnected" | "unknown"; endpoint: string | null; uptimeSeconds: number | null; failures: number | null; pingMs: number | null; tlsVersion: string | null; algorithm: string | null; currentJobDifficulty: number | null } | null;
    cpuHugePages: { allocated: number; total: number } | null;
    sampleTimeUnixMs: number | null;
  } | null;
  telemetryFreshness: "unavailable" | "fresh" | "stale";
  error: { kind: string; message: string } | null;
  diagnostics: { source: "stdout" | "stderr" | "supervisor"; message: string }[];
  captureHealth: { stdoutReaderStarted: boolean; stderrReaderStarted: boolean; sanitizedLinesObserved: number; stdoutEofObserved: boolean; stderrEofObserved: boolean; stdoutReadError: string | null; stderrReadError: string | null } | null;
  startupStage: "checkingEngine" | "preparingSession" | "startingXmrig" | "waitingForMiner" | null;
  startupElapsedMs: number | null;
  startupTimings: { stage: string; elapsedMs: number }[];
};

type Props = { setup: MiningReadiness | null; onChange: (setup: MiningReadiness) => void; refresh: () => Promise<void>; session: MiningSessionStatus | null; refreshSession: () => Promise<void>; sessionStatusUnavailable: boolean; diagnosticsMode: boolean; diagnosticRunning: boolean; copyDiagnostics: () => void; events: EmberEvent[]; eventsUnavailable: boolean };

const engineCopy: Record<MiningReadiness["engine"], string> = {
  notInstalled: "Not installed",
  verifying: "Checking",
  ready: "Verified",
  modified: "Needs attention",
  unsupported: "Unavailable on this device",
  error: "Could not check",
};

export function MiningSetup({ setup, onChange, refresh, session, refreshSession, sessionStatusUnavailable, diagnosticsMode, diagnosticRunning, copyDiagnostics, events, eventsUnavailable }: Props) {
  const [busy, setBusy] = useState(false);
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingWallet, setEditingWallet] = useState(false);
  const [address, setAddress] = useState("");
  const [customPool, setCustomPool] = useState(false);
  const [editingPool, setEditingPool] = useState(false);
  const [host, setHost] = useState("");
  const [port, setPort] = useState("");
  const [tls, setTls] = useState(true);
  const [worker, setWorker] = useState("");
  const [reviewed, setReviewed] = useState(false);

  async function startMining() {
    setStarting(true);
    setError(null);
    try {
      const next = await invoke<MiningReadiness>("start_mining");
      onChange(next);
      await refreshSession();
    } catch (failure) {
      const startError = typeof failure === "string" ? failure : "Ember could not start a controlled mining session.";
      await refresh();
      await refreshSession();
      setError(startError.includes("stopped at your request") ? null : startError);
    } finally {
      setStarting(false);
    }
  }

  async function stopMining() {
    setStopping(true);
    setError(null);
    try {
      onChange(await invoke<MiningReadiness>("stop_mining"));
      await refreshSession();
    } catch (failure) {
      setError(typeof failure === "string" ? failure : "Ember could not stop the owned mining process.");
      await refreshSession();
    } finally {
      setStopping(false);
    }
  }

  async function update(kind: string, value?: unknown) {
    setBusy(true);
    setError(null);
    try {
      const next = await invoke<MiningReadiness>("update_mining_setup", { change: { kind, value } });
      onChange(next);
      setReviewed(false);
      if (kind === "wallet") { setAddress(""); setEditingWallet(false); }
      if (kind === "pool") { setCustomPool(false); setEditingPool(false); }
    } catch (failure) {
      setError(classifyError(kind, failure));
    } finally {
      setBusy(false);
    }
  }

  async function setupEngine() {
    setBusy(true);
    setError(null);
    try {
      await invoke("provision_xmrig");
      await refresh();
    } catch {
      setError("Ember couldn’t verify or install the mining engine. Check your connection, storage, or security notifications, then try again.");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!setup) return <section className="setup-panel"><h2>Checking your setup</h2><p className="info-detail">Ember is checking your saved settings.</p><button className="setup-engine-button" onClick={refresh}>Try again</button></section>;

  if (!session && sessionStatusUnavailable) return <section className="setup-panel" role="status"><h2>Session status unavailable</h2><p className="info-detail">Ember couldn’t confirm whether a mining session is running. Check again before starting mining.</p><button className="setup-engine-button" onClick={() => void refreshSession()}>Check session status</button></section>;

  if (session && (session.startupStage !== null || ["starting", "mining", "paused", "stopping"].includes(session.state) || (session.state === "error" && session.processId !== null))) {
    const starting = session.state === "starting" || session.startupStage !== null;
    return <section className="active-mining-panel">
      <MiningSessionTelemetry session={session} setup={setup} statusUnavailable={sessionStatusUnavailable} onStop={() => void stopMining()} stopping={stopping} />
      <EmberStream events={events} unavailable={eventsUnavailable} />
      {session.error && <p className="field-error" role="alert">Ember couldn’t update the mining session. Technical details are available in Diagnostics.</p>}
      {(starting || session.state === "error") && <StartupDetails session={session} diagnosticsMode={diagnosticsMode} copyDiagnostics={copyDiagnostics} />}
      {diagnosticsMode && !starting && session.state !== "error" && <StartupDetails session={session} diagnosticsMode copyDiagnostics={copyDiagnostics} />}
      {error && <p className="field-error" role="alert">{error}</p>}
    </section>;
  }

  const checksExceptConsent = setup.checks.filter((check) => check.id !== "consent");
  const completeExceptConsent = checksExceptConsent.every((check) => check.passed);
  const nextStep = nextUserAction(setup);
  const showWalletForm = editingWallet || !setup.walletMasked;
  const showPoolForm = editingPool || customPool;
  const engineProblem = setup.engine === "modified" || setup.engine === "unsupported" || setup.engine === "error";
  const engineNeedsInstall = setup.engine === "notInstalled";
  const startBlockedByWindows = error?.includes("Windows prevented") || error?.includes("no longer available") || error?.includes("stopped before Ember could connect");

  return <div className="mining-setup" aria-busy={busy}>
    {!setup.ready && <section className="setup-welcome" aria-live="polite">
      <div><p className="eyebrow">YOUR SETUP</p><h2>Finish setup to continue</h2><p>{nextStep}</p></div>
    </section>}

    {error && !["wallet", "pool", "review", "storage"].includes(error) && <p className="setup-error-banner" role="alert">Ember couldn’t save that change. Check your setup and try again.</p>}
    {(setup.storageError || error === "storage") && <section className="setup-problem" role="alert"><div><h3>Saved setup needs attention</h3><p>Ember couldn’t read or save your local mining setup. Reset saved settings to start again.</p></div><button className="setup-engine-button" disabled={busy} onClick={() => update("reset")}>Reset setup</button></section>}

    {engineProblem && <section className="setup-problem" aria-live="polite"><div><p className="eyebrow">MINING ENGINE</p><h3>{setup.engine === "unsupported" ? "This device isn’t currently supported" : "Mining engine needs attention"}</h3><p>{setup.engine === "unsupported" ? "Ember can’t run the verified mining engine on this device." : "Ember couldn’t verify the installed mining engine."}</p></div>{setup.engine !== "unsupported" && <button className="setup-engine-button" disabled={busy} onClick={setupEngine}>Repair engine</button>}</section>}
    {engineNeedsInstall && <section className="setup-engine-compact"><span><strong>Mining engine</strong><small>XMRig {setup.engineVersion} · Not installed</small></span><button className="setup-engine-button" disabled={busy} onClick={setupEngine}>{busy ? "Setting up…" : "Set up engine"}</button></section>}

    {setup.ready && <section className="ready-panel" aria-labelledby="ready-title"><div><p className="eyebrow">YOUR MINING SETUP</p><h2 id="ready-title">Ready to mine</h2><div className="ready-operational"><span>{setup.profile ? capitalize(setup.profile) : "Power profile"}</span><span>{setup.threads} of {setup.logicalProcessors} threads configured</span></div></div><button className="setup-engine-button" disabled={!setup.startAllowed || busy || starting || stopping || diagnosticRunning} onClick={() => void startMining()}>{starting ? "Starting…" : "Start mining"}</button>{diagnosticRunning && <p className="ready-note">Finish or stop the XMRig integration test before mining.</p>}{error && <><p className="field-error" role="alert">{error}</p>{startBlockedByWindows && <div className="setup-recovery-actions"><button className="text-action" disabled={busy || starting || stopping} onClick={() => void startMining()}>Try again</button><button className="text-action" disabled={busy || starting || stopping} onClick={() => void refresh()}>Check engine</button><button className="text-action" disabled={busy || starting || stopping} onClick={() => void setupEngine()}>Repair engine</button><p>Review any Windows Security notification yourself. Ember does not change security settings or restore quarantined files.</p></div>}</>}{session?.state === "error" && <StartupDetails session={session} diagnosticsMode={diagnosticsMode} copyDiagnostics={copyDiagnostics} />}</section>}
    {events.length > 0 && <EmberStream events={events} unavailable={eventsUnavailable} compact />}

    <section className="setup-step" aria-labelledby="step-wallet">
      <StepHeading number="1" title="Wallet" id="step-wallet" />
      {showWalletForm ? <div className="step-body">
        <p className="step-description">Where should your mining rewards be sent?</p>
        <form onSubmit={(event) => { event.preventDefault(); void update("wallet", address); }}>
          <label className="setup-label" htmlFor="wallet-address">Monero wallet address</label>
          <input id="wallet-address" className="setup-input wallet-input" value={address} onChange={(event) => setAddress(event.target.value)} maxLength={106} autoComplete="off" spellCheck={false} required aria-describedby="wallet-help wallet-error" />
          <p id="wallet-help" className="field-help">Ember only needs your public receiving address. Never enter a seed phrase or private key.</p>
          {error === "wallet" && <p id="wallet-error" className="field-error" role="alert">Enter a valid Monero receiving address.</p>}
          <div className="form-actions"><button className="setup-engine-button" disabled={busy}>Save wallet</button>{editingWallet && <button className="setup-engine-button secondary" type="button" disabled={busy} onClick={() => { setAddress(""); setEditingWallet(false); setError(null); }}>Cancel</button>}</div>
        </form>
      </div> : <div className="step-body step-summary"><div><strong>Wallet configured</strong><span>{setup.walletMasked}</span></div><button className="text-action" disabled={busy} onClick={() => { setEditingWallet(true); setError(null); }}>Change</button><button className="text-action remove-action" disabled={busy} onClick={() => update("wallet", null)}>Remove</button></div>}
    </section>

    <section className="setup-step" aria-labelledby="step-pool">
      <StepHeading number="2" title="Pool" id="step-pool" />
      <div className="step-body">
        <p className="step-description">The pool is where your computer would connect to mine. Ember won’t connect during setup.</p>
        {!setup.pool && !customPool && <div className="pool-choice-grid">
          <div className="pool-choice pool-choice-muted"><span className="choice-label">RECOMMENDED</span><strong>Pool suggestions</strong><span>Coming in a future update</span></div>
          <button className="pool-choice pool-choice-custom" type="button" onClick={() => { setCustomPool(true); setError(null); }}><span className="choice-label">YOUR POOL</span><strong>Use a custom pool</strong><span>Enter the details supplied by your pool</span></button>
        </div>}
        {setup.pool && !editingPool ? <div className="step-summary pool-summary"><div><strong>{setup.pool.host}:{setup.pool.port}</strong><span>{setup.pool.tls ? "Secure connection · TLS" : "Unencrypted connection"}{setup.pool.worker ? ` · Worker ${setup.pool.worker}` : ""}</span></div><button className="text-action" disabled={busy} onClick={() => { setHost(setup.pool!.host); setPort(String(setup.pool!.port)); setTls(setup.pool!.tls); setWorker(setup.pool!.worker ?? ""); setEditingPool(true); setError(null); }}>Edit</button><button className="text-action remove-action" disabled={busy} onClick={() => update("pool", null)}>Remove</button></div> : showPoolForm && <form onSubmit={(event) => { event.preventDefault(); void update("pool", { host, port: Number(port), tls, worker: worker || null }); }}>
          <label className="setup-label" htmlFor="pool-address">Pool address</label>
          <input id="pool-address" className="setup-input" value={host} onChange={(event) => setHost(event.target.value)} maxLength={253} placeholder="pool.example.com" autoComplete="off" required aria-describedby="pool-address-error" />
          <div className="pool-fields"><label className="setup-label" htmlFor="pool-port">Port<input id="pool-port" className="setup-input" type="number" min={1} max={65535} value={port} onChange={(event) => setPort(event.target.value)} required aria-describedby="pool-address-error" /></label>
            <label className="setup-label worker-label" htmlFor="pool-worker">Worker name <span>Optional</span><input id="pool-worker" className="setup-input" value={worker} onChange={(event) => setWorker(event.target.value)} maxLength={64} autoComplete="off" /></label></div>
          <label className="tls-option"><input type="checkbox" checked={tls} onChange={(event) => setTls(event.target.checked)} /><span><strong>Secure connection (TLS)</strong><small>Encrypts the connection to your pool when supported.</small></span></label>
          {error === "pool" && <p id="pool-address-error" className="field-error" role="alert">Check the pool address, port and optional worker name.</p>}
          <div className="form-actions"><button className="setup-engine-button" disabled={busy}>Save pool</button>{editingPool && <button type="button" className="setup-engine-button secondary" disabled={busy} onClick={() => { setEditingPool(false); setError(null); }}>Cancel</button>}</div>
        </form>}
      </div>
    </section>

    <section className="setup-step" aria-labelledby="step-power">
      <StepHeading number="3" title="Power" id="step-power" />
      <div className="step-body"><p className="step-description">Choose how many of your {setup.logicalProcessors} CPU threads Ember may use while mining.</p>
        <div className="profile-options">{setup.profileOptions.map(({ profile, threads }) => <button key={profile} className={`profile-option${setup.profile === profile ? " selected" : ""}`} aria-pressed={setup.profile === profile} disabled={busy || threads === null} onClick={() => update("profile", profile)}><strong>{profile[0].toUpperCase() + profile.slice(1)}</strong><span>{profileDescription(profile)}</span><small>{threads === null ? "Unavailable" : `${threads} of ${setup.logicalProcessors} CPU threads`}</small></button>)}</div>
        <p className="field-help">These settings choose mining threads; actual CPU use and performance vary. Smart Mining is not available yet.</p>
      </div>
    </section>

    <section className="setup-step review-step" aria-labelledby="step-review">
      <StepHeading number="4" title="Review" id="step-review" />
      <div className="step-body"><p className="step-description">A few things to know before mining.</p>
        <ul className="review-points"><li>Mining uses CPU and electricity. Your device may feel slower, and rewards are not guaranteed.</li><li>Mining uses XMRig, which has a separate 1% upstream donation. Ember verifies the official pinned release before using it.</li><li>Windows or other security software may inspect or block mining software. Ember does not change those settings; review any security notification yourself.</li><li>Ember plans a separate 5% contribution. Its accounting mechanism is not active, and no Ember contribution is charged now.</li><li>Ember won’t start mining automatically when the app opens. You can stop or quit Ember at any time.</li></ul>
        <p className="review-selection">Your choices: {setup.walletMasked ?? "wallet not set"} · {setup.pool ? `${setup.pool.host}:${setup.pool.port}` : "pool not set"} · {setup.profile ? `${capitalize(setup.profile)} · ${setup.threads} threads` : "power not set"}</p>
        {setup.acknowledged ? <div className="consent-saved"><span role="status">Reviewed for these settings</span><button className="text-action" disabled={busy} onClick={() => update("revoke")}>Withdraw review</button></div> : <><label className="review-checkbox"><input type="checkbox" checked={reviewed} disabled={busy || !completeExceptConsent} onChange={(event) => setReviewed(event.target.checked)} /><span>I understand and have reviewed these choices.</span></label><button className="setup-engine-button" disabled={busy || !completeExceptConsent || !reviewed} onClick={() => update("acknowledge", { revision: setup.revision, risks: true, selections: true, donations: true })}>Confirm review</button>{error === "review" && <p className="field-error" role="alert">Complete the setup and review your current choices before confirming.</p>}{!completeExceptConsent && <p className="field-help">Complete the steps above before confirming.</p>}</>}
      </div>
    </section>

    <details className="setup-details"><summary>Setup details</summary><div className="setup-details-body">
      <div className="detail-engine"><span>Mining engine</span><strong>XMRig {setup.engineVersion} · {engineCopy[setup.engine]}</strong>{setup.engine !== "ready" && setup.engine !== "unsupported" && <button className="text-action" disabled={busy} onClick={setupEngine}>{setup.engine === "notInstalled" ? "Set up" : "Repair"}</button>}</div>
      {setup.engineIssue && <p className="field-error" role="alert">{setup.engineIssue}</p>}
      {setup.engine === "ready" && <p className="field-help">Ember checked the installed engine. <a href="https://github.com/xmrig/xmrig" target="_blank" rel="noreferrer">XMRig source and license</a>.</p>}
      {setup.storageError && <p className="field-error" role="alert">Ember couldn’t read your local mining setup. Reset saved settings above to start again.</p>}
      <ul className="readiness-checks">{setup.checks.map((check) => <li key={check.id}><span className={check.passed ? "check-pass" : "check-pending"}>{check.passed ? "Complete" : "Needs attention"}</span>{detailLabel(check)}</li>)}</ul>
      <p className="field-help">Pool settings are saved locally. Ember has not connected to the pool.</p>
    </div></details>
  </div>;
}

function StepHeading({ number, title, id }: { number: string; title: string; id: string }) {
  return <div className="setup-step-heading"><span aria-hidden="true">{number}</span><h2 id={id}>{title}</h2></div>;
}

function nextUserAction(setup: MiningReadiness): string {
  if (setup.storageError) return "Reset your saved setup to continue.";
  if (setup.engine === "unsupported") return "This device isn’t currently supported for mining.";
  if (setup.engine !== "ready") return setup.engine === "notInstalled" ? "Set up the mining engine to continue." : "Repair the mining engine to continue.";
  if (!setup.walletMasked) return "Add your wallet address.";
  if (!setup.pool) return "Choose how to connect to a pool.";
  if (!setup.profile) return "Choose how much CPU Ember may use.";
  if (!setup.acknowledged) return "Review the information before continuing.";
  return "Ember needs attention before setup can be ready.";
}

function classifyError(kind: string, failure: unknown) {
  const message = typeof failure === "string" ? failure : "";
  if (message.includes("Local setup") || message.toLowerCase().includes("storage")) return "storage";
  if (kind === "wallet" && message.includes("public receiving address")) return "wallet";
  if (kind === "pool" && (message.includes("host or IP") || message.includes("Worker name") || message.includes("Pool endpoint"))) return "pool";
  if (kind === "acknowledge") return "review";
  return "setup";
}

function profileDescription(profile: Profile) {
  if (profile === "quiet") return "Light CPU use";
  if (profile === "balanced") return "Good everyday balance";
  return "Maximum configured CPU use";
}

function detailLabel(check: Check) {
  const labels: Record<string, string> = {
    engine: "Mining engine verified",
    wallet: "Public wallet address validated",
    pool: "Pool settings valid (connection untested)",
    profile: "Power profile selected",
    runtime: "Candidate configuration validated locally",
    consent: "Review acknowledged for current settings",
    process: "No Ember mining process running",
    platform: "Device platform and CPU count supported",
    storage: "Local setup storage available",
  };
  return labels[check.id] ?? check.label;
}

function capitalize(value: string) { return value[0].toUpperCase() + value.slice(1); }
function StartupDetails({ session, diagnosticsMode, copyDiagnostics }: { session: MiningSessionStatus; diagnosticsMode: boolean; copyDiagnostics: () => void }) {
  const supervisorNotes = session.diagnostics.filter((entry) => entry.source === "supervisor");
  if (!supervisorNotes.length && !session.startupTimings.length && !diagnosticsMode) return null;
  return <details className="setup-details"><summary>Show details</summary><div className="setup-details-body">
    <ul>{session.startupTimings.map((timing, index) => <li key={`${index}-${timing.stage}`}>{timing.stage}: {timing.elapsedMs} ms</li>)}{session.startupStage && <li>Current stage: {session.startupStage}</li>}{session.state === "starting" && <li>Miner process: {session.processId == null ? "not yet created" : "running; awaiting readiness"}</li>}</ul>
    {diagnosticsMode && session.captureHealth && <ul><li>Output readers: stdout {session.captureHealth.stdoutReaderStarted ? "started" : "not started"}, stderr {session.captureHealth.stderrReaderStarted ? "started" : "not started"}</li><li>Sanitized lines observed: {session.captureHealth.sanitizedLinesObserved}</li><li>Pipe EOF: stdout {session.captureHealth.stdoutEofObserved ? "yes" : "no"}, stderr {session.captureHealth.stderrEofObserved ? "yes" : "no"}</li>{(session.captureHealth.stdoutReadError || session.captureHealth.stderrReadError) && <li>Reader error category: {session.captureHealth.stdoutReadError ?? session.captureHealth.stderrReadError}</li>}</ul>}
    {diagnosticsMode && session.diagnostics.length > 0 && <ul>{session.diagnostics.map((entry, index) => <li key={`${index}-${entry.source}-${entry.message}`}>{entry.source}: {entry.message}</li>)}</ul>}
    {diagnosticsMode && <button className="text-action" type="button" onClick={copyDiagnostics}>Copy diagnostics</button>}
  </div></details>;
}
