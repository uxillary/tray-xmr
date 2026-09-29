import { BellSimpleIcon } from "@phosphor-icons/react/dist/csr/BellSimple";
import { ClockCounterClockwiseIcon } from "@phosphor-icons/react/dist/csr/ClockCounterClockwise";
import { CpuIcon } from "@phosphor-icons/react/dist/csr/Cpu";
import { GearSixIcon } from "@phosphor-icons/react/dist/csr/GearSix";
import { HouseIcon } from "@phosphor-icons/react/dist/csr/House";
import { LightningIcon } from "@phosphor-icons/react/dist/csr/Lightning";
import { WalletIcon } from "@phosphor-icons/react/dist/csr/Wallet";
import { useEffect, useState, type ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";
import { EmberCore, type EmberCoreState } from "./components/EmberCore";
import { EmptyState } from "./components/EmptyState";
import { MetricCard } from "./components/MetricCard";
import { StatusBadge } from "./components/StatusBadge";
import { ThisDeviceStatus } from "./components/ThisDeviceStatus";
import { SystemOverview, systemMetric } from "./components/SystemOverview";
import { useSystemSnapshot } from "./hooks/useSystemSnapshot";
import { MiningSetup, type MiningReadiness } from "./components/MiningSetup";
import type { SystemSnapshot } from "./types/system";
import "./App.css";

type Section = "overview" | "mining" | "activity" | "settings";

const sections: { id: Section; label: string; icon: ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <HouseIcon weight="regular" /> },
  { id: "mining", label: "Mining", icon: <LightningIcon weight="regular" /> },
  { id: "activity", label: "Activity", icon: <ClockCounterClockwiseIcon weight="regular" /> },
  { id: "settings", label: "Settings", icon: <GearSixIcon weight="regular" /> },
];

const stateLabels: Record<string, { label: string; core: EmberCoreState }> = {
  notConfigured: { label: "Not configured", core: "not-configured" },
  ready: { label: "Ready", core: "ready" },
  mining: { label: "Mining", core: "mining" },
  paused: { label: "Paused", core: "paused" },
  error: { label: "Needs attention", core: "warning" },
};

function App() {
  const [section, setSection] = useState<Section>("overview");
  const [nativeState, setNativeState] = useState<string | null>(null);
  const [statusError, setStatusError] = useState(false);
  const systemSnapshot = useSystemSnapshot();
  const [setup, setSetup] = useState<MiningReadiness | null>(null);

  function acceptSetup(next: MiningReadiness) {
    setSetup(next);
    setNativeState(next.ready ? "ready" : "notConfigured");
    setStatusError(false);
  }

  async function refreshSetup() {
    try { acceptSetup(await invoke<MiningReadiness>("mining_readiness")); }
    catch { setStatusError(true); setNativeState(null); setSetup(null); }
  }

  useEffect(() => {
    void refreshSetup();
  }, [section]);

  const current = sections.find((item) => item.id === section)!;
  const status = nativeState ? stateLabels[nativeState] : undefined;
  const system = systemMetric(systemSnapshot);

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
          <ThisDeviceStatus deviceName={systemSnapshot?.deviceName ?? null} cpuPercent={systemSnapshot?.cpu.usagePercent ?? null} />
        </div>
      </aside>

      <main className="workspace">
        <div className="page-content">
          <header className="page-heading"><h1>{current.label}</h1></header>

          {section === "overview" && <OverviewPage status={status} statusError={statusError} systemSnapshot={systemSnapshot} systemMetric={system} />}
          {section === "mining" && <MiningSetup setup={setup} onChange={acceptSetup} refresh={refreshSetup} />}
          {section === "activity" && <ActivityPage />}
          {section === "settings" && <SettingsPage setup={setup} editSetup={() => setSection("mining")} />}
        </div>
      </main>
    </div>
  );
}

function OverviewPage({ status, statusError, systemSnapshot, systemMetric: system }: { status: { label: string; core: EmberCoreState } | undefined; statusError: boolean; systemSnapshot: SystemSnapshot | null; systemMetric: { value: string; detail: string } }) {
  return (
    <>
      <section className="overview-hero" aria-labelledby="overview-title">
        <div className="hero-copy">
          <p className="eyebrow">A CALMER WAY TO MINE</p>
          <h2 id="overview-title">Put idle power<br />to work.</h2>
          <p className="hero-description">Clear information and control, so you can put your computer to work on your terms.</p>
          <div className="hero-status">
            <StatusBadge label={status?.label ?? (statusError ? "Status unavailable" : "Checking status")} tone={status?.core ?? "inactive"} />
            {statusError && <span className="status-caption">Ember couldn’t read its current state.</span>}
          </div>
        </div>
        <div className="hero-core-wrap"><EmberCore state={status?.core ?? "not-configured"} /><span className="core-caption">EMBER CORE <span>·</span> {coreLabel(status, statusError)}</span></div>
        <span className="hero-grain" aria-hidden="true" />
      </section>

      <section className="metrics-grid" aria-label="Mining overview">
        <MetricCard icon={<LightningIcon weight="light" />} label="Hashrate" value="—" />
        <MetricCard icon={<ClockCounterClockwiseIcon weight="light" />} label="Mining time" value="—" />
        <MetricCard icon={<WalletIcon weight="light" />} label="Estimated earnings" value="—" />
        <MetricCard icon={<CpuIcon weight="light" />} label="System" value={system.value} detail={system.detail} />
      </section>

      <SystemOverview snapshot={systemSnapshot} />

      <section className="setup-panel" aria-labelledby="setup-title">
        <p className="eyebrow">GETTING STARTED</p>
        <h2 id="setup-title">{status?.core === "ready" ? "Setup ready" : "Complete your mining setup"}</h2>
        <p className="setup-description">{status?.core === "ready" ? "Your local configuration and disclosures are complete. Mining is disabled pending the controlled-session milestone." : "Configure your public wallet, pool, verified engine and resource profile on the Mining page, then review the disclosures."}</p>
      </section>
    </>
  );
}

function coreLabel(status: { label: string; core: EmberCoreState } | undefined, statusError: boolean) {
  if (statusError) return "UNKNOWN";
  if (!status) return "CONNECTING";
  if (status.core === "mining") return "ACTIVE";
  if (status.core === "ready") return "READY";
  if (status.core === "paused") return "PAUSED";
  if (status.core === "warning") return "ATTENTION";
  if (status.core === "inactive") return "UNKNOWN";
  return "IDLE";
}

function ActivityPage() {
  return <EmptyState icon={<ClockCounterClockwiseIcon weight="light" />} title="No activity yet" description="Mining sessions and other meaningful events will appear here." />;
}

function SettingsPage({ setup, editSetup }: { setup: MiningReadiness | null; editSetup: () => void }) {
  return (
    <>
      <section className="settings-section" aria-labelledby="settings-general"><h2 id="settings-general">Application</h2><SettingRow icon={<HouseIcon />} label="Appearance" description="Using Ember’s default appearance." state="Default" /><SettingRow icon={<BellSimpleIcon />} label="Notifications" description="No notifications configured." state="Off" /></section>
      <section className="settings-section" aria-labelledby="settings-mining">
        <h2 id="settings-mining">Mining setup</h2>
        <SettingRow icon={<WalletIcon />} label="Public wallet" description={setup?.walletMasked ?? "No receiving address configured."} state="Local only" />
        <SettingRow icon={<CpuIcon />} label="Pool" description={setup?.pool ? `${setup.pool.host}:${setup.pool.port} · ${setup.pool.tls ? "TLS" : "Unencrypted TCP"}` : "No pool selected."} state="Untested" />
        <SettingRow icon={<LightningIcon />} label="Resource profile" description={setup?.profile ? `${setup.profile} · ${setup.threads} CPU threads` : "No profile selected."} state="Static" />
        <button className="setup-engine-button" type="button" onClick={editSetup}>Edit wallet, pool and resources</button>
        <p className="info-detail settings-note">Changes require a fresh acknowledgement on the Mining page.</p>
      </section>
    </>
  );
}
function SettingRow({ icon, label, description, state }: { icon: ReactNode; label: string; description: string; state: string }) {
  return <div className="setting-row"><span className="setting-icon" aria-hidden="true">{icon}</span><span className="setting-copy"><strong>{label}</strong><span>{description}</span></span><span className="setting-status">{state}</span></div>;
}

export default App;
