import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";

type MiningState = "notConfigured" | "ready" | "mining" | "paused" | "error";
type Section = "overview" | "mining" | "activity" | "settings";

const sections: { id: Section; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "◫" },
  { id: "mining", label: "Mining", icon: "⌁" },
  { id: "activity", label: "Activity", icon: "◷" },
  { id: "settings", label: "Settings", icon: "⚙" },
];

function EmberMark() {
  return <img className="ember-mark" src="/ember-mark.svg" alt="" aria-hidden="true" />;
}

function App() {
  const [section, setSection] = useState<Section>("overview");
  const [miningState, setMiningState] = useState<MiningState | null>(null);
  const [statusError, setStatusError] = useState(false);

  useEffect(() => {
    invoke<MiningState>("shell_status")
      .then(setMiningState)
      .catch(() => setStatusError(true));
  }, []);

  const current = sections.find((item) => item.id === section)!;

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Main navigation">
        <div className="brand-lockup">
          <EmberMark />
          <span>ember</span>
        </div>
        <div className="sidebar-caption">WORKSPACE</div>
        <nav className="primary-nav" aria-label="Workspace">
          {sections.map((item) => (
            <button
              className={`nav-item${section === item.id ? " is-active" : ""}`}
              key={item.id}
              type="button"
              aria-current={section === item.id ? "page" : undefined}
              onClick={() => setSection(item.id)}
            >
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="footer-dot" aria-hidden="true" />
          <span>Foundation build</span>
        </div>
      </aside>

      <section className="workspace" aria-labelledby="page-title">
        <header className="topbar">
          <div className="breadcrumbs"><span>Ember</span><span className="crumb-separator">/</span>{current.label}</div>
          <div className="topbar-status"><span className="status-dot" />Desktop preview</div>
        </header>

        <div className="page-content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">YOUR WORKSPACE</p>
              <h1 id="page-title">{current.label}</h1>
            </div>
            <span className="version-chip">EARLY FOUNDATION</span>
          </div>

          {section === "overview" && (
            <>
              <section className="welcome-card" aria-labelledby="welcome-title">
                <div className="welcome-copy">
                  <p className="eyebrow">A CALMER WAY TO MINE</p>
                  <h2 id="welcome-title">Put idle power<br />to work.</h2>
                  <p className="welcome-description">Ember is being built to make mining easier to understand, easier to control, and clear about the resources it uses.</p>
                </div>
                <div className="welcome-art" aria-hidden="true"><EmberMark /><span className="art-orbit orbit-one" /><span className="art-orbit orbit-two" /></div>
                <span className="card-grain" aria-hidden="true" />
              </section>

              <section className="status-panel" aria-labelledby="mining-status-title">
                <div className="panel-heading">
                  <div><p className="eyebrow">MINING STATUS</p><h2 id="mining-status-title">Your machine</h2></div>
                  <span className="state-pill"><span className="state-indicator" />Not mining</span>
                </div>
                <div className="empty-state">
                  <div className="empty-icon" aria-hidden="true"><span /></div>
                  <div>
                    <h3>{statusError ? "Native status unavailable" : miningState === null ? "Checking app status…" : "Mining setup comes later"}</h3>
                    <p>{statusError ? "The desktop service could not be reached." : "No miner is configured. Mining setup will arrive in a later milestone, with clear controls and an explanation before anything starts."}</p>
                  </div>
                </div>
                <div className="panel-divider" />
                <div className="readiness-row"><span>Application foundation</span><span className="readiness-value"><span className="ready-dot" />Running locally</span></div>
              </section>

              <div className="lower-grid">
                <section className="small-panel"><p className="eyebrow">BUILT AROUND YOU</p><h2>Clear by design.</h2><p>Mining state, resource use, and estimates will be visible—never hidden in the background.</p><span className="panel-index">01</span></section>
                <section className="small-panel"><p className="eyebrow">YOUR KEYS STAY YOURS</p><h2>Non-custodial.</h2><p>Ember will use a public receiving address. It will never ask for a seed phrase or private key.</p><span className="panel-index">02</span></section>
              </div>
            </>
          )}

          {section === "mining" && <section className="section-placeholder"><span className="placeholder-symbol" aria-hidden="true">⌁</span><p className="eyebrow">MINING</p><h2>Setup is not available yet.</h2><p>This foundation build does not configure or run a miner. Mining controls will be designed in a later milestone.</p></section>}
          {section === "activity" && <section className="section-placeholder"><span className="placeholder-symbol" aria-hidden="true">◷</span><p className="eyebrow">ACTIVITY</p><h2>No activity to show.</h2><p>There is no mining history in this foundation build. Ember will not invent statistics or earnings.</p></section>}
          {section === "settings" && <section className="section-placeholder"><span className="placeholder-symbol" aria-hidden="true">⚙</span><p className="eyebrow">SETTINGS</p><h2>Settings are coming later.</h2><p>Mining, wallet, profile, and notification settings are not configured in this foundation build.</p></section>}

          <footer className="page-footer"><span>Ember is in active development.</span><span>Nothing is mining.</span></footer>
        </div>
      </section>
    </main>
  );
}

export default App;
