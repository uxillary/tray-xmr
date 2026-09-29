import { invoke } from "@tauri-apps/api/core";
import { BellSimpleIcon } from "@phosphor-icons/react/dist/csr/BellSimple";
import { ClockCounterClockwiseIcon } from "@phosphor-icons/react/dist/csr/ClockCounterClockwise";
import { CpuIcon } from "@phosphor-icons/react/dist/csr/Cpu";
import { GearSixIcon } from "@phosphor-icons/react/dist/csr/GearSix";
import { HouseIcon } from "@phosphor-icons/react/dist/csr/House";
import { LightningIcon } from "@phosphor-icons/react/dist/csr/Lightning";
import { WalletIcon } from "@phosphor-icons/react/dist/csr/Wallet";
import { useEffect, useState, type ReactNode } from "react";
import { EmberCore, type EmberCoreState } from "./components/EmberCore";
import { EmptyState } from "./components/EmptyState";
import { MetricCard } from "./components/MetricCard";
import { StatusBadge } from "./components/StatusBadge";
import { ThisDeviceStatus } from "./components/ThisDeviceStatus";
import { SystemOverview, systemMetric } from "./components/SystemOverview";
import { useSystemSnapshot } from "./hooks/useSystemSnapshot";
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

  useEffect(() => {
    invoke<string>("shell_status")
      .then((nextState) => {
        if (stateLabels[nextState]) setNativeState(nextState);
        else setStatusError(true);
      })
      .catch(() => setStatusError(true));
  }, []);

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
          {section === "mining" && <MiningPage />}
          {section === "activity" && <ActivityPage />}
          {section === "settings" && <SettingsPage />}
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
        <h2 id="setup-title">Not set up yet</h2>
        <p className="setup-description">Set up Ember to start putting idle power to work. Your wallet address, mining engine, and resource preferences will be configured before mining can begin.</p>
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

function MiningPage() {
  return (
    <>
      <section className="mining-state-panel" aria-labelledby="mining-state-title">
        <div className="mining-core-small"><EmberCore state="not-configured" compact /></div>
        <div className="mining-state-copy"><p className="eyebrow">CURRENT STATE</p><h2 id="mining-state-title">Not mining</h2><p>Configure an engine, public wallet address, and resource profile before mining can begin.</p></div>
      </section>
      <div className="details-grid">
        <InfoCard icon={<CpuIcon weight="regular" />} eyebrow="MINING ENGINE" title="Not configured" detail="No mining engine configured." />
        <InfoCard icon={<WalletIcon weight="regular" />} eyebrow="WALLET ADDRESS" title="Not configured" detail="Ember will use a public receiving address only." />
        <InfoCard icon={<LightningIcon weight="regular" />} eyebrow="RESOURCE PROFILE" title="Not configured" detail="Choose how Ember should use system resources." />
      </div>
    </>
  );
}

function ActivityPage() {
  return <EmptyState icon={<ClockCounterClockwiseIcon weight="light" />} title="No activity yet" description="Mining sessions and other meaningful events will appear here." />;
}

function SettingsPage() {
  return (
    <>
      <section className="settings-section" aria-labelledby="settings-general"><h2 id="settings-general">Application</h2><SettingRow icon={<HouseIcon />} label="Appearance" description="Using Ember’s default appearance." state="Default" /><SettingRow icon={<BellSimpleIcon />} label="Notifications" description="No notifications configured." state="Off" /></section>
      <section className="settings-section" aria-labelledby="settings-mining"><h2 id="settings-mining">Mining</h2><SettingRow icon={<CpuIcon />} label="Engine and resources" description="No mining engine configured." state="Not set up" /><SettingRow icon={<LightningIcon />} label="Profiles and schedules" description="No resource profile configured." state="Not set up" /></section>
    </>
  );
}

function InfoCard({ icon, eyebrow, title, detail }: { icon: ReactNode; eyebrow: string; title: string; detail: string }) {
  return <article className="info-card"><div className="info-card-icon" aria-hidden="true">{icon}</div><p className="eyebrow">{eyebrow}</p><h3>{title}</h3><p className="info-detail">{detail}</p></article>;
}

function SettingRow({ icon, label, description, state }: { icon: ReactNode; label: string; description: string; state: string }) {
  return <div className="setting-row"><span className="setting-icon" aria-hidden="true">{icon}</span><span className="setting-copy"><strong>{label}</strong><span>{description}</span></span><span className="setting-status">{state}</span></div>;
}

export default App;
