import { CpuIcon } from "@phosphor-icons/react/dist/csr/Cpu";
import { GearSixIcon } from "@phosphor-icons/react/dist/csr/GearSix";
import { HouseIcon } from "@phosphor-icons/react/dist/csr/House";
import { LightningIcon } from "@phosphor-icons/react/dist/csr/Lightning";
import { WalletIcon } from "@phosphor-icons/react/dist/csr/Wallet";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ThisDeviceStatus } from "./components/ThisDeviceStatus";
import { useSystemSnapshot } from "./hooks/useSystemSnapshot";
import { MiningSetup, type MiningReadiness, type MiningSessionStatus } from "./components/MiningSetup";
import type { EmberEvent } from "./emberStream.mjs";
import { SystemOverview } from "./components/SystemOverview";
import type { SystemSnapshot } from "./types/system";
import "./App.css";

export type Section = "home" | "settings";

/** Old destinations intentionally converge on the same everyday workspace. */
export function workspaceDestination(path: string, hash = ""): Section {
  const destination = (hash.replace(/^#\/?/, "") || path.replace(/^\//, "")).replace(/\/$/, "").toLowerCase();
  return destination === "settings" ? "settings" : "home";
}
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
  { id: "home", label: "Home", icon: <HouseIcon weight="regular" /> },
  { id: "settings", label: "Settings", icon: <GearSixIcon weight="regular" /> },
];

function App({ reducedMotion = false, invokeCommand = invoke }: { reducedMotion?: boolean; invokeCommand?: typeof invoke }) {
  const [section, setSection] = useState<Section>(() => workspaceDestination(window.location.pathname, window.location.hash));
  const [setupRequested, setSetupRequested] = useState(false);
  const [nativeState, setNativeState] = useState<string | null>(null);
  const systemSnapshot = useSystemSnapshot(invokeCommand);
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

  function navigate(next: Section) {
    window.history.replaceState(null, "", `#/${next}`);
    setSection(next);
  }

  useEffect(() => {
    const update = () => setSection(workspaceDestination(window.location.pathname, window.location.hash));
    window.addEventListener("hashchange", update);
    window.addEventListener("popstate", update);
    return () => { window.removeEventListener("hashchange", update); window.removeEventListener("popstate", update); };
  }, []);

  function changeDiagnosticsMode(enabled: boolean) {
    setDiagnosticsMode(enabled);
    localStorage.setItem("ember.diagnosticsMode", String(enabled));
  }

  async function copyDiagnostics() {
    const report = await invokeCommand<string>("copy_diagnostics");
    await navigator.clipboard.writeText(report);
  }

  async function refreshIntegrationTest() {
    try { setIntegrationTest(await invokeCommand<IntegrationTestStatus>("xmrig_integration_test_status")); }
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
      setIntegrationTest(await invokeCommand<IntegrationTestStatus>("start_xmrig_integration_test"));
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
      setIntegrationTest(await invokeCommand<IntegrationTestStatus>("stop_xmrig_integration_test"));
    } catch (failure) {
      setIntegrationTestError(typeof failure === "string" ? failure : "The integration test is still stopping.");
      await refreshIntegrationTest();
    } finally {
      await refreshSetup();
    }
  }

  async function copyIntegrationReport() {
    try {
      const report = await invokeCommand<string>("copy_xmrig_integration_report");
      await navigator.clipboard.writeText(report);
      setIntegrationTestError(null);
    } catch (failure) {
      setIntegrationTestError(typeof failure === "string" ? failure : "The diagnostic report could not be copied.");
    }
  }

  function acceptSetup(next: MiningReadiness) {
    setSetup(next);
    setNativeState(next.ready ? "ready" : "notConfigured");
  }

  async function refreshSetup() {
    try { acceptSetup(await invokeCommand<MiningReadiness>("mining_readiness")); }
    catch { setNativeState(null); setSetup(null); }
  }

  const refreshSession = useCallback(() => {
    if (sessionRequest.current) return sessionRequest.current;
    const pending = invokeCommand<MiningSessionStatus>("mining_status", { diagnosticsMode })
      .then((next) => { setSession(next); setSessionStatusUnavailable(false); })
      .catch(() => setSessionStatusUnavailable(true))
      .finally(() => { sessionRequest.current = null; });
    sessionRequest.current = pending;
    return pending;
  }, [diagnosticsMode, invokeCommand]);

  const refreshMiningEvents = useCallback(() => {
    if (eventsRequest.current) return eventsRequest.current;
    const pending = invokeCommand<EmberEvent[]>("mining_events")
      .then((next) => { setMiningEvents(next); setMiningEventsUnavailable(false); })
      .catch(() => setMiningEventsUnavailable(true))
      .finally(() => { eventsRequest.current = null; });
    eventsRequest.current = pending;
    return pending;
  }, [invokeCommand]);

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
    if (section !== "home") return;
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
    if (section === "home" && (session?.state === "error" || session?.state === "stopped")) void refreshSetup();
  }, [section, session?.state]);

  const current = sections.find((item) => item.id === section)!;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand-lockup" type="button" onClick={() => navigate("home")} aria-label="Ember home">
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
              onClick={() => navigate(item.id)}
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

          <MiningSetup controlsOnly={section !== "home"} setupRequested={setupRequested} invokeCommand={invokeCommand} reducedMotion={reducedMotion} setup={setup} onChange={acceptSetup} refresh={refreshSetup} session={session} refreshSession={refreshSession} sessionStatusUnavailable={sessionStatusUnavailable} diagnosticsMode={diagnosticsMode} diagnosticRunning={integrationTest?.running ?? false} copyDiagnostics={copyDiagnostics} events={miningEvents} eventsUnavailable={miningEventsUnavailable} />
          {section === "settings" && <SettingsPage systemSnapshot={systemSnapshot} setup={setup} editSetup={() => { setSetupRequested(true); navigate("home"); }} diagnosticsMode={diagnosticsMode} setDiagnosticsMode={changeDiagnosticsMode} miningBusy={session !== null && (session.startupStage !== null || ["starting", "mining", "paused", "stopping"].includes(session.state))} integrationTest={integrationTest} integrationTestError={integrationTestError} startIntegrationTest={() => void startIntegrationTest()} stopIntegrationTest={() => void stopIntegrationTest()} copyIntegrationReport={() => void copyIntegrationReport()} />}
        </div>
      </main>
    </div>
  );
}

function SettingsPage({ systemSnapshot, setup, editSetup, diagnosticsMode, setDiagnosticsMode, miningBusy, integrationTest, integrationTestError, startIntegrationTest, stopIntegrationTest, copyIntegrationReport }: { systemSnapshot: SystemSnapshot | null; setup: MiningReadiness | null; editSetup: () => void; diagnosticsMode: boolean; setDiagnosticsMode: (enabled: boolean) => void; miningBusy: boolean; integrationTest: IntegrationTestStatus | null; integrationTestError: string | null; startIntegrationTest: () => void; stopIntegrationTest: () => void; copyIntegrationReport: () => void }) {
  return (
    <>
      <section className="settings-section" aria-labelledby="settings-mining">
        <h2 id="settings-mining">Mining setup</h2>
        <SettingRow icon={<WalletIcon />} label="Public wallet" description={setup?.walletMasked ?? "No receiving address configured."} state="Local only" />
        <SettingRow icon={<CpuIcon />} label="Pool" description={setup?.pool ? `${setup.pool.host}:${setup.pool.port} · ${setup.pool.tls ? "TLS" : "Unencrypted TCP"}` : "No pool selected."} state="Untested" />
        <SettingRow icon={<LightningIcon />} label="Resource profile" description={setup?.profile ? `${setup.profile} · ${setup.threads} CPU threads` : "No profile selected."} state="Static" />
        <button className="setup-engine-button" type="button" onClick={editSetup}>Edit wallet, pool and resources</button>
        <p className="info-detail settings-note">Changes require a fresh acknowledgement on Home.</p>
      </section>
      <details className="settings-section"><summary>Device information</summary><SystemOverview snapshot={systemSnapshot} /></details>
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
