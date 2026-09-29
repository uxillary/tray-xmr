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

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand-lockup" type="button" onClick={() => setSection("overview")} aria-label="Ember home">
          <img className="brand-mark" src="/ember-mark.svg" alt="" />
          <span>ember</span>
        </button>

        <div className="nav-label">WORKSPACE</div>
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
          <div className="sidebar-state">
            <span className="state-led" aria-hidden="true" />
            <div><span className="sidebar-state-title">Local foundation</span><span className="sidebar-state-detail">No miner configured</span></div>
          </div>
          <div className="sidebar-version">EMBER <span>·</span> FOUNDATION</div>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div className="breadcrumbs"><span>Ember</span><span className="breadcrumb-divider">/</span><span className="breadcrumb-current">{current.label}</span></div>
          <div className="topbar-right"><span className="local-indicator" aria-hidden="true" /><span>On this device</span></div>
        </header>

        <div className="page-content">
          <header className="page-heading">
            <div><p className="eyebrow">YOUR WORKSPACE</p><h1>{current.label}</h1></div>
            <span className="build-label"><span className="build-led" />FOUNDATION BUILD</span>
          </header>

          {section === "overview" && (
            <>
              <section className="overview-hero" aria-labelledby="overview-title">
                <div className="hero-copy">
                  <p className="eyebrow">A CALMER WAY TO MINE</p>
                  <h2 id="overview-title">Put idle power<br />to work.</h2>
                  <p className="hero-description">Mining, made more understandable. Ember is being built to help you use your computer on your terms—with clear controls and honest information.</p>
                  <div className="hero-status"><StatusBadge label={status?.label ?? (statusError ? "Status unavailable" : "Checking status")} tone={status?.core ?? "inactive"} /><span className="status-divider" /><span className="status-caption">{statusError ? "The local app service could not be reached" : "Mining setup arrives in a later milestone"}</span></div>
                </div>
                <div className="hero-core-wrap"><EmberCore state={status?.core ?? "not-configured"} /><span className="core-caption">EMBER CORE <span>·</span> {status ? status.core === "mining" ? "ACTIVE" : status.core === "ready" ? "READY" : status.core === "paused" ? "PAUSED" : "IDLE" : statusError ? "UNKNOWN" : "CONNECTING"}</span></div>
                <span className="hero-grain" aria-hidden="true" />
              </section>

              <section className="metrics-grid" aria-label="Mining overview">
                <MetricCard icon={<LightningIcon weight="light" />} label="Hashrate" value="—" detail="Available after setup" />
                <MetricCard icon={<ClockCounterClockwiseIcon weight="light" />} label="Mining time" value="—" detail="No mining sessions yet" />
                <MetricCard icon={<WalletIcon weight="light" />} label="Estimated earnings" value="—" detail="Unavailable until mining data exists" />
                <MetricCard icon={<CpuIcon weight="light" />} label="System" value="Unavailable" detail="System awareness comes later" />
              </section>

              <section className="setup-panel" aria-labelledby="setup-title">
                <div className="setup-heading"><div><p className="eyebrow">GETTING STARTED</p><h2 id="setup-title">A foundation, not a miner</h2></div><span className="setup-step">01 <span>/</span> 03</span></div>
                <p className="setup-description">This build establishes Ember’s desktop experience. Mining setup will come later, with a clear explanation of resource use, wallet addresses, and Ember’s contribution before anything can start.</p>
                <div className="setup-divider" />
                <div className="setup-foot"><span className="setup-mark"><img src="/ember-mark.svg" alt="" /></span><span>No mining engine configured</span><span className="setup-note">Nothing is running in the background</span></div>
              </section>
              <footer className="page-footer"><span>Ember is in active development.</span><span>Local-first by design.</span></footer>
            </>
          )}

          {section === "mining" && <MiningPage />}
          {section === "activity" && <ActivityPage />}
          {section === "settings" && <SettingsPage />}
        </div>
      </main>
    </div>
  );
}

function MiningPage() {
  return (
    <>
      <section className="page-intro"><span className="page-icon"><LightningIcon weight="light" /></span><div><h2>Mining, on your terms.</h2><p>Setup and controls will be introduced after Ember’s consent and engine boundaries are ready.</p></div></section>
      <section className="mining-state-panel"><div className="mining-core-small"><EmberCore state="not-configured" compact /></div><div className="mining-state-copy"><p className="eyebrow">CURRENT STATE</p><h2>Not configured</h2><p>No mining engine or wallet has been set up. This page will guide you through setup in a later milestone.</p></div><StatusBadge label="Unavailable" tone="inactive" /></section>
      <div className="details-grid">
        <InfoCard icon={<CpuIcon weight="regular" />} eyebrow="MINING ENGINE" title="Not configured" detail="Engine setup is not available in this build." />
        <InfoCard icon={<WalletIcon weight="regular" />} eyebrow="WALLET ADDRESS" title="Not configured" detail="No address requested or stored. Ember will only use a public receiving address." />
        <InfoCard icon={<LightningIcon weight="regular" />} eyebrow="RESOURCE PROFILE" title="Unavailable" detail="Smart Mining profiles will be designed in a later milestone." />
      </div>
      <footer className="page-footer"><span>Mining controls are not available in this build.</span><span>Nothing is mining.</span></footer>
    </>
  );
}

function ActivityPage() {
  return (
    <>
      <section className="page-intro"><span className="page-icon"><ClockCounterClockwiseIcon weight="light" /></span><div><h2>Your history, when there is one.</h2><p>Ember will keep local records of meaningful activity once those features exist.</p></div></section>
      <EmptyState icon={<ClockCounterClockwiseIcon weight="light" />} title="No activity yet" description="Mining history, Smart Mining decisions, milestones, and notifications will appear here once Ember begins operating. There are no historical events in this foundation build." />
      <footer className="page-footer"><span>Activity stays empty until there’s real activity.</span><span>Local-first by design.</span></footer>
    </>
  );
}

function SettingsPage() {
  return (
    <>
      <section className="page-intro"><span className="page-icon"><GearSixIcon weight="light" /></span><div><h2>Make Ember yours.</h2><p>Preferences will be added when their behavior is implemented and ready to explain.</p></div></section>
      <section className="settings-section" aria-labelledby="settings-general"><h2 id="settings-general">Application</h2><SettingRow icon={<HouseIcon />} label="Appearance" description="Visual preferences are not available yet." /><SettingRow icon={<BellSimpleIcon />} label="Notifications" description="Notification controls will appear when notifications are implemented." /></section>
      <section className="settings-section" aria-labelledby="settings-mining"><h2 id="settings-mining">Mining</h2><SettingRow icon={<CpuIcon />} label="Engine and resources" description="No engine or resource controls are configured." /><SettingRow icon={<LightningIcon />} label="Profiles and schedules" description="Smart Mining is planned for a later milestone." /></section>
      <footer className="page-footer"><span>Only working settings will become interactive.</span><span>Nothing is mining.</span></footer>
    </>
  );
}

function InfoCard({ icon, eyebrow, title, detail }: { icon: ReactNode; eyebrow: string; title: string; detail: string }) {
  return <article className="info-card"><div className="info-card-icon" aria-hidden="true">{icon}</div><p className="eyebrow">{eyebrow}</p><h3>{title}</h3><p className="info-detail">{detail}</p><span className="unavailable-label">NOT AVAILABLE</span></article>;
}

function SettingRow({ icon, label, description }: { icon: ReactNode; label: string; description: string }) {
  return <div className="setting-row"><span className="setting-icon" aria-hidden="true">{icon}</span><span className="setting-copy"><strong>{label}</strong><span>{description}</span></span><span className="setting-status">Coming later</span></div>;
}

export default App;
