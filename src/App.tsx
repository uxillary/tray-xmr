import { ClockCounterClockwiseIcon } from "@phosphor-icons/react/dist/csr/ClockCounterClockwise";
import { CpuIcon } from "@phosphor-icons/react/dist/csr/Cpu";
import { GearSixIcon } from "@phosphor-icons/react/dist/csr/GearSix";
import { HouseIcon } from "@phosphor-icons/react/dist/csr/House";
import { LightningIcon } from "@phosphor-icons/react/dist/csr/Lightning";
import { WalletIcon } from "@phosphor-icons/react/dist/csr/Wallet";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";
import { EmberCore, type EmberCoreState } from "./components/EmberCore";
import { EmptyState } from "./components/EmptyState";
import { ThisDeviceStatus } from "./components/ThisDeviceStatus";
import { SystemOverview } from "./components/SystemOverview";
import { OverviewMiningTelemetry } from "./components/MiningTelemetry";
import { useSystemSnapshot } from "./hooks/useSystemSnapshot";
import { MiningSetup, type MiningReadiness, type MiningSessionStatus } from "./components/MiningSetup";
import type { EmberEvent } from "./emberStream.mjs";
import type { SystemSnapshot } from "./types/system";
import "./App.css";

type Section = "overview" | "mining" | "activity" | "settings";
type TestMark = "notRun" | "running" | "passed" | "failed" | "cancelled";
type IntegrationTestStatus = {
  running: boolean;
  currentVariant: string | null;
  engineVerification: TestMark;
  minimalApiTest: TestMark;
  quietProfileApiTest: TestMark;
  cleanup: TestMark;
  details: string[];
  reportAvailable: boolean;
};

const sections: { id: Section; label: string; icon: ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <HouseIcon weight="regular" /> },
  { id: "mining", label: "Mining", icon: <LightningIcon weight="regular" /> },
  { id: "activity", label: "Activity", icon: <ClockCounterClockwiseIcon weight="regular" /> },
  { id: "settings", label: "Settings", icon: <GearSixIcon weight="regular" /> },
];

const stateLabels: Record<string, { label: string; core: EmberCoreState }> = {
  notConfigured: { label: "Not configured", core: "not-configured" },
  unavailable: { label: "Status unavailable", core: "warning" },
  ready: { label: "Ready", core: "ready" },
  starting: { label: "Starting", core: "starting" },
  mining: { label: "Mining", core: "mining" },
  paused: { label: "Paused", core: "paused" },
  stopping: { label: "Stopping", core: "starting" },
  stopped: { label: "Stopped", core: "stopped" },
  error: { label: "Needs attention", core: "warning" },
};

function App() {
  const [section, setSection] = useState<Section>("overview");
  const [nativeState, setNativeState] = useState<string | null>(null);
  const [statusError, setStatusError] = useState(false);
  const systemSnapshot = useSystemSnapshot();
  const [setup, setSetup] = useState<MiningReadiness | null>(null);
  const [session, setSession] = useState<MiningSessionStatus | null>(null);
  const [sessionStatusUnavailable, setSessionStatusUnavailable] = useState(false);
  const sessionRequest = useRef<Promise<void> | null>(null);
  const [miningEvents, setMiningEvents] = useState<EmberEvent[]>([]);
  const [miningEventsUnavailable, setMiningEventsUnavailable] = useState(false);
  const eventsRequest = useRef<Promise<void> | null>(null);
  const [diagnosticsMode, setDiagnosticsMode] = useState(() => localStorage.getItem("ember.diagnosticsMode") === "true");
  const [integrationTest, setIntegrationTest] = useState<IntegrationTestStatus | null>(null);
  const [integrationTestError, setIntegrationTestError] = useState<string | null>(null);

  function changeDiagnosticsMode(enabled: boolean) {
    setDiagnosticsMode(enabled);
    localStorage.setItem("ember.diagnosticsMode", String(enabled));
  }

  async function copyDiagnostics() {
    const report = await invoke<string>("copy_diagnostics");
    await navigator.clipboard.writeText(report);
  }

  async function refreshIntegrationTest() {
    try { setIntegrationTest(await invoke<IntegrationTestStatus>("xmrig_integration_test_status")); }
    catch { setIntegrationTest(null); }
  }

  async function startIntegrationTest() {
    setIntegrationTestError(null);
    setIntegrationTest((current) => ({
      running: true,
      currentVariant: "Preparing",
      engineVerification: "running",
      minimalApiTest: "notRun",
      quietProfileApiTest: "notRun",
      cleanup: "notRun",
      details: current?.details ?? [],
      reportAvailable: false,
    }));
    try {
      setIntegrationTest(await invoke<IntegrationTestStatus>("start_xmrig_integration_test"));
    } catch (failure) {
      setIntegrationTestError(typeof failure === "string" ? failure : "The XMRig integration test could not start.");
      await refreshIntegrationTest();
    } finally {
      await refreshSetup();
    }
  }

  async function stopIntegrationTest() {
    setIntegrationTestError(null);
    try {
      setIntegrationTest(await invoke<IntegrationTestStatus>("stop_xmrig_integration_test"));
    } catch (failure) {
      setIntegrationTestError(typeof failure === "string" ? failure : "The integration test is still stopping.");
      await refreshIntegrationTest();
    } finally {
      await refreshSetup();
    }
  }

  async function copyIntegrationReport() {
    try {
      const report = await invoke<string>("copy_xmrig_integration_report");
      await navigator.clipboard.writeText(report);
      setIntegrationTestError(null);
    } catch (failure) {
      setIntegrationTestError(typeof failure === "string" ? failure : "The diagnostic report could not be copied.");
    }
  }

  function acceptSetup(next: MiningReadiness) {
    setSetup(next);
    setNativeState(next.ready ? "ready" : "notConfigured");
    setStatusError(false);
  }

  async function refreshSetup() {
    try { acceptSetup(await invoke<MiningReadiness>("mining_readiness")); }
    catch { setStatusError(true); setNativeState(null); setSetup(null); }
  }

  const refreshSession = useCallback(() => {
    if (sessionRequest.current) return sessionRequest.current;
    const pending = invoke<MiningSessionStatus>("mining_status", { diagnosticsMode })
      .then((next) => { setSession(next); setSessionStatusUnavailable(false); })
      .catch(() => setSessionStatusUnavailable(true))
      .finally(() => { sessionRequest.current = null; });
    sessionRequest.current = pending;
    return pending;
  }, [diagnosticsMode]);

  const refreshMiningEvents = useCallback(() => {
    if (eventsRequest.current) return eventsRequest.current;
    const pending = invoke<EmberEvent[]>("mining_events")
      .then((next) => { setMiningEvents(next); setMiningEventsUnavailable(false); })
      .catch(() => setMiningEventsUnavailable(true))
      .finally(() => { eventsRequest.current = null; });
    eventsRequest.current = pending;
    return pending;
  }, []);

  useEffect(() => {
    void refreshSetup();
  }, [section]);

  useEffect(() => {
    let cancelled = false;
    let timer = 0;
    const refresh = async () => {
      await refreshSession();
      if (!cancelled) timer = window.setTimeout(() => void refresh(), 1000);
    };
    void refresh();
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [refreshSession]);

  useEffect(() => {
    if (section !== "mining") return;
    let cancelled = false;
    let timer = 0;
    const refresh = async () => {
      await refreshMiningEvents();
      if (!cancelled) timer = window.setTimeout(() => void refresh(), 1200);
    };
    void refresh();
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [section, refreshMiningEvents]);

  useEffect(() => {
    if (!diagnosticsMode) return;
    void refreshIntegrationTest();
    const timer = window.setInterval(() => { void refreshIntegrationTest(); }, 500);
    return () => window.clearInterval(timer);
  }, [diagnosticsMode]);

  useEffect(() => {
    if (section === "mining" && (session?.state === "error" || session?.state === "stopped")) void refreshSetup();
  }, [section, session?.state]);

  const current = sections.find((item) => item.id === section)!;
  const busyStates = ["starting", "mining", "paused", "stopping"];
  const currentState = !session && sessionStatusUnavailable ? "unavailable" : session?.startupStage ? "starting" : session && (busyStates.includes(session.state) || session.state === "stopped") ? session.state : session?.state === "error" ? "error" : nativeState;
  const status = currentState ? stateLabels[currentState] : undefined;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand-lockup" type="button" onClick={() => setSection("overview")} aria-label="Ember home">
          <img className="brand-mark" src="/ember-mark.svg" alt="" />
          <span>ember</span>
        </button>

        <nav className="primary-nav" aria-label="Main navigation">
          {sections.map((item) => (
            <button
              className={`nav-item${section === item.id ? " is-active" : ""}`}
              key={item.id}
              type="button"
              aria-current={section === item.id ? "page" : undefined}
              onClick={() => setSection(item.id)}
            >
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
              {section === item.id && <span className="nav-indicator" aria-hidden="true" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <ThisDeviceStatus deviceName={systemSnapshot?.deviceName ?? null} cpuPercent={systemSnapshot?.cpu.usagePercent ?? null} miningState={sessionStatusUnavailable && !session ? "unavailable" : session?.state ?? nativeState} statusUnavailable={sessionStatusUnavailable} />
        </div>
      </aside>

      <main className={`workspace workspace--${section}`}>
        <div className="page-content">
          <header className="page-heading"><h1>{current.label}</h1></header>

          {section === "overview" && <OverviewPage status={status} statusError={statusError} systemSnapshot={systemSnapshot} session={session} setup={setup} sessionStatusUnavailable={sessionStatusUnavailable} openMining={() => setSection("mining")} />}
          {section === "mining" && <MiningSetup setup={setup} onChange={acceptSetup} refresh={refreshSetup} session={session} refreshSession={refreshSession} sessionStatusUnavailable={sessionStatusUnavailable} diagnosticsMode={diagnosticsMode} diagnosticRunning={integrationTest?.running ?? false} copyDiagnostics={() => void copyDiagnostics()} events={miningEvents} eventsUnavailable={miningEventsUnavailable} />}
          {section === "activity" && <ActivityPage />}
          {section === "settings" && <SettingsPage setup={setup} editSetup={() => setSection("mining")} diagnosticsMode={diagnosticsMode} setDiagnosticsMode={changeDiagnosticsMode} miningBusy={session !== null && (session.startupStage !== null || ["starting", "mining", "paused", "stopping"].includes(session.state))} integrationTest={integrationTest} integrationTestError={integrationTestError} startIntegrationTest={() => void startIntegrationTest()} stopIntegrationTest={() => void stopIntegrationTest()} copyIntegrationReport={() => void copyIntegrationReport()} />}
        </div>
      </main>
    </div>
  );
}

function OverviewPage({ status, statusError, systemSnapshot, session, setup, sessionStatusUnavailable, openMining }: { status: { label: string; core: EmberCoreState } | undefined; statusError: boolean; systemSnapshot: SystemSnapshot | null; session: MiningSessionStatus | null; setup: MiningReadiness | null; sessionStatusUnavailable: boolean; openMining: () => void }) {
  const isMining = session?.state === "mining" || session?.state === "paused";
  const isStarting = session?.state === "starting" || session?.startupStage !== null && session?.startupStage !== undefined;
  const isStopping = session?.state === "stopping";
  const isError = session?.state === "error";
  const headline = statusError || sessionStatusUnavailable ? "Status unavailable" : status?.label ?? "Checking status";
  const supportCopy = isMining
    ? "Ember is supervising this mining session."
    : isStarting
      ? "Ember is bringing your mining session online."
      : isStopping
        ? "Ember is closing the owned mining session."
        : isError
          ? "Open Mining to review the session and available recovery actions."
          : setup?.ready
            ? "Your setup is ready. Start mining only when you choose to."
            : "Complete your wallet, pool and power setup to begin.";
  return (
    <>
      <section className={`overview-hero${isMining ? " overview-hero--live" : ""}`} aria-labelledby="overview-title">
        <div className="hero-copy">
          <p className="eyebrow">THIS DEVICE</p>
          <h2 id="overview-title">{headline}</h2>
          <p className="hero-description">{supportCopy}</p>
          {!isMining && !isStarting && !isStopping && <button className="overview-mining-action" type="button" onClick={openMining}>{isError || statusError || sessionStatusUnavailable ? "Review Mining" : setup?.ready ? "Open Mining" : "Set up Mining"}</button>}
        </div>
        <div className="hero-core-wrap"><EmberCore state={status?.core ?? "inactive"} /><span className="core-caption">EMBER CORE</span></div>
      </section>

      <OverviewMiningTelemetry session={session} setup={setup} statusUnavailable={sessionStatusUnavailable} />

      <SystemOverview snapshot={systemSnapshot} />

    </>
  );
}

function ActivityPage() {
  return <EmptyState variant="timeline" icon={<ClockCounterClockwiseIcon weight="light" />} title="Activity timeline" description="Saved local history isn’t available yet. The live session Stream appears on Mining and isn’t saved here." />;
}

function SettingsPage({ setup, editSetup, diagnosticsMode, setDiagnosticsMode, miningBusy, integrationTest, integrationTestError, startIntegrationTest, stopIntegrationTest, copyIntegrationReport }: { setup: MiningReadiness | null; editSetup: () => void; diagnosticsMode: boolean; setDiagnosticsMode: (enabled: boolean) => void; miningBusy: boolean; integrationTest: IntegrationTestStatus | null; integrationTestError: string | null; startIntegrationTest: () => void; stopIntegrationTest: () => void; copyIntegrationReport: () => void }) {
  return (
    <>
      <section className="settings-section" aria-labelledby="settings-mining">
        <h2 id="settings-mining">Mining setup</h2>
        <SettingRow icon={<WalletIcon />} label="Public wallet" description={setup?.walletMasked ?? "No receiving address configured."} state="Local only" />
        <SettingRow icon={<CpuIcon />} label="Pool" description={setup?.pool ? `${setup.pool.host}:${setup.pool.port} · ${setup.pool.tls ? "TLS" : "Unencrypted TCP"}` : "No pool selected."} state="Untested" />
        <SettingRow icon={<LightningIcon />} label="Resource profile" description={setup?.profile ? `${setup.profile} · ${setup.threads} CPU threads` : "No profile selected."} state="Static" />
        <button className="setup-engine-button" type="button" onClick={editSetup}>Edit wallet, pool and resources</button>
        <p className="info-detail settings-note">Changes require a fresh acknowledgement on the Mining page.</p>
      </section>
      <section className={`settings-section settings-section--diagnostics${diagnosticsMode ? " is-open" : ""}`} aria-labelledby="settings-diagnostics">
        <h2 id="settings-diagnostics">Advanced / Diagnostics</h2>
        <label className="diagnostics-toggle"><span><strong>Diagnostics mode</strong><small>Show sanitized startup evidence and enable controlled diagnostic tools.</small></span><input type="checkbox" checked={diagnosticsMode} disabled={integrationTest?.running ?? false} onChange={(event) => setDiagnosticsMode(event.currentTarget.checked)} /></label>
        {diagnosticsMode && <div className="integration-test-panel" aria-live="polite">
          <div><strong>XMRig integration test</strong><p>Starts XMRig briefly using a safe test configuration. It does not use your wallet, connect to a mining pool, or mine.</p></div>
          {!integrationTest?.running && <button className="setup-engine-button" type="button" disabled={miningBusy} onClick={startIntegrationTest}>Test XMRig integration</button>}
          {miningBusy && !integrationTest?.running && <p>Stop the active mining session before running this test.</p>}
          {integrationTest?.running && <button className="setup-engine-button stop-mining-button" type="button" onClick={stopIntegrationTest}>Stop test</button>}
          {integrationTest?.running && <p className="integration-test-progress">Running {integrationTest.currentVariant ?? "diagnostic"}…</p>}
          {integrationTest && integrationTest.engineVerification !== "notRun" && <div className="integration-test-result">
            <h3>XMRig integration test</h3>
            <TestResultRow label="Engine verification" mark={integrationTest.engineVerification} />
            <TestResultRow label="Minimal API test" mark={integrationTest.minimalApiTest} />
            <TestResultRow label="Quiet-profile API test" mark={integrationTest.quietProfileApiTest} />
            <TestResultRow label="Cleanup" mark={integrationTest.cleanup} />
            {integrationTest.reportAvailable && <button className="text-action" type="button" onClick={copyIntegrationReport}>Copy diagnostic report</button>}
            {integrationTest.details.length > 0 && <details><summary>Show sanitized details</summary><ul>{integrationTest.details.map((detail, index) => <li key={`${index}-${detail}`}>{detail}</li>)}</ul></details>}
          </div>}
          {integrationTestError && <p className="field-error" role="alert">{integrationTestError}</p>}
        </div>}
      </section>
    </>
  );
}
function TestResultRow({ label, mark }: { label: string; mark: TestMark }) {
  const labels: Record<TestMark, string> = { notRun: "Not run", running: "Running", passed: "Passed", failed: "Failed", cancelled: "Cancelled" };
  return <div className="integration-test-row"><span>{label}</span><strong className={`test-mark-${mark}`}>{labels[mark]}</strong></div>;
}
function SettingRow({ icon, label, description, state }: { icon: ReactNode; label: string; description: string; state: string }) {
  return <div className="setting-row"><span className="setting-icon" aria-hidden="true">{icon}</span><span className="setting-copy"><strong>{label}</strong><span>{description}</span></span><span className="setting-status">{state}</span></div>;
}

export default App;
