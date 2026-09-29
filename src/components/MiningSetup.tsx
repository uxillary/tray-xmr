import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { EmberCore } from "./EmberCore";

type Profile = "quiet" | "balanced" | "performance";
type Pool = { host: string; port: number; tls: boolean; worker: string | null };
export type MiningReadiness = {
  engine: "notInstalled" | "verifying" | "ready" | "modified" | "unsupported" | "error";
  engineVersion: string; walletMasked: string | null; pool: Pool | null;
  profile: Profile | null; logicalProcessors: number; threads: number | null;
  profileOptions: { profile: Profile; threads: number | null }[];
  revision: number; acknowledged: boolean; ready: boolean; startAllowed: boolean; startReason: string;
  checks: { id: string; label: string; passed: boolean }[]; storageError: string | null;
};

export function MiningSetup({ setup, onChange, refresh }: {
  setup: MiningReadiness | null; onChange: (setup: MiningReadiness) => void; refresh: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingWallet, setEditingWallet] = useState(false);
  const [address, setAddress] = useState("");
  const [editingPool, setEditingPool] = useState(false);
  const [host, setHost] = useState(setup?.pool?.host ?? "");
  const [port, setPort] = useState(setup?.pool?.port?.toString() ?? "");
  const [tls, setTls] = useState(setup?.pool?.tls ?? true);
  const [worker, setWorker] = useState(setup?.pool?.worker ?? "");
  const [review, setReview] = useState({ risks: false, selections: false, donations: false });

  async function update(kind: string, value?: unknown) {
    setBusy(true); setError(null);
    try {
      const next = await invoke<MiningReadiness>("update_mining_setup", { change: { kind, value } });
      onChange(next); setReview({ risks: false, selections: false, donations: false });
      if (kind === "wallet") { setAddress(""); setEditingWallet(false); }
      if (kind === "pool") setEditingPool(false);
    } catch (failure) { setError(typeof failure === "string" ? failure : "Setup could not be saved. Please retry."); }
    finally { setBusy(false); }
  }

  async function install() {
    setBusy(true); setError(null);
    try { await invoke("provision_xmrig"); await refresh(); }
    catch { setError("Engine setup could not be completed. Check your connection, storage and security notifications, then retry. Do not disable security software."); await refresh(); }
    finally { setBusy(false); }
  }

  if (!setup) return <section className="setup-panel"><h2>Checking setup</h2><p className="info-detail">Ember is reading local configuration and verifying the engine.</p><button className="setup-engine-button" onClick={refresh}>Retry verification</button></section>;
  const completeExceptConsent = setup.checks.every((check) => check.passed || check.id === "consent");
  const engineLabel = { notInstalled: "Not installed", verifying: "Verifying…", ready: "Verified · Ready", modified: "Integrity check failed", unsupported: "Unsupported platform", error: "Verification unavailable" }[setup.engine];
  const showWalletForm = editingWallet || !setup.walletMasked;
  const showPoolForm = editingPool || !setup.pool;

  return <div className="mining-setup" aria-busy={busy}>
    <section className="mining-state-panel">
      <div className="mining-core-small"><EmberCore state={setup.ready ? "ready" : "not-configured"} compact /></div>
      <div className="mining-state-copy"><p className="eyebrow">CURRENT STATE</p><h2>{setup.ready ? "Setup ready · Not mining" : "Ready to configure"}</h2><p>Complete your local setup and review the disclosures. Mining is disabled in this milestone.</p></div>
    </section>
    {error && <p className="setup-engine-error" role="alert">{error}</p>}
    {setup.storageError && <section className="setup-panel"><p role="alert">{setup.storageError}</p><button className="setup-engine-button" disabled={busy} onClick={() => update("reset")}>Reset saved setup</button><p className="info-detail">Removes the saved wallet, pool, profile and acknowledgements.</p></section>}
    <section className="setup-panel">
      <p className="eyebrow">MINING ENGINE</p><h2>XMRig {setup.engineVersion} · {busy ? "Checking / saving…" : engineLabel}</h2>
      <p className="info-detail">Ember verifies the installed executable against its recorded digest. Setup downloads the official release and does not start mining. <a href="https://github.com/xmrig/xmrig" target="_blank" rel="noreferrer">XMRig source and GPLv3 notices</a>.</p>
      {setup.engine !== "ready" && setup.engine !== "unsupported" && <button className="setup-engine-button" disabled={busy} onClick={install}>{setup.engine === "notInstalled" ? "Set up engine" : "Repair / reinstall engine"}</button>}
      <button className="setup-engine-button secondary" disabled={busy} onClick={refresh}>Recheck integrity</button>
    </section>
    <div className="setup-grid">
      <section className="setup-panel" aria-labelledby="wallet-title">
        <p className="eyebrow">PUBLIC WALLET</p><h2 id="wallet-title">{setup.walletMasked ?? "Receiving address"}</h2>
        <p className="info-detail">Use a mainnet Monero standard address, subaddress or integrated address. Your pool must support the selected format. Ember never receives your seed, private keys or wallet password.</p>
        {showWalletForm ? <form onSubmit={(event) => { event.preventDefault(); void update("wallet", address); }}>
          <label>Public receiving address<input value={address} onChange={(event) => setAddress(event.target.value)} maxLength={106} autoComplete="off" spellCheck={false} required /></label>
          <button className="setup-engine-button" disabled={busy}>Save address</button>
          {setup.walletMasked && <button className="setup-engine-button secondary" type="button" disabled={busy} onClick={() => { setAddress(""); setEditingWallet(false); }}>Cancel</button>}
        </form> : <div><button className="setup-engine-button" disabled={busy} onClick={() => setEditingWallet(true)}>Change address</button><button className="setup-engine-button secondary" disabled={busy} onClick={() => update("wallet", null)}>Remove</button></div>}
      </section>
      <section className="setup-panel" aria-labelledby="pool-title">
        <p className="eyebrow">POOL</p><h2 id="pool-title">{setup.pool ? `${setup.pool.host}:${setup.pool.port}` : "Choose your pool"}</h2>
        <p className="info-detail">Manual Stratum connection · {setup.pool ? (setup.pool.tls ? "TLS enabled" : "Unencrypted TCP") : "TLS recommended"}. Copy host and port from your pool’s instructions. No connection or pool compatibility check is performed here.</p>
        {showPoolForm ? <form onSubmit={(event) => { event.preventDefault(); void update("pool", { host, port: Number(port), tls, worker: worker || null }); }}>
          <label>Pool host (no URL)<input value={host} onChange={(event) => setHost(event.target.value)} maxLength={253} placeholder="pool.example.org" autoComplete="off" required /></label>
          <div className="pool-fields"><label>Port<input type="number" min={1} max={65535} value={port} onChange={(event) => setPort(event.target.value)} required /></label><label>Worker name (optional)<input value={worker} onChange={(event) => setWorker(event.target.value)} maxLength={64} autoComplete="off" /></label></div>
          <label className="check-label"><input type="checkbox" checked={tls} onChange={(event) => setTls(event.target.checked)} />Use TLS</label>
          <button className="setup-engine-button" disabled={busy}>Save pool</button>
          {setup.pool && <button type="button" className="setup-engine-button secondary" disabled={busy} onClick={() => setEditingPool(false)}>Cancel</button>}
        </form> : <div><p className="info-detail">Worker: {setup.pool?.worker ?? "None"}</p><button className="setup-engine-button" disabled={busy} onClick={() => { setHost(setup.pool!.host); setPort(String(setup.pool!.port)); setTls(setup.pool!.tls); setWorker(setup.pool!.worker ?? ""); setEditingPool(true); }}>Edit pool</button><button className="setup-engine-button secondary" disabled={busy} onClick={() => update("pool", null)}>Remove</button></div>}
      </section>
    </div>
    <section className="setup-panel">
      <p className="eyebrow">RESOURCE PROFILE</p><h2>CPU resources</h2>
      <p className="info-detail">{setup.logicalProcessors} logical processors detected. Profiles select a fixed number of mining threads; they do not cap CPU usage or monitor other apps.</p>
      <div className="profile-options">{setup.profileOptions.map(({ profile, threads }) => <button key={profile} className={`profile-option${setup.profile === profile ? " selected" : ""}`} aria-pressed={setup.profile === profile} disabled={busy || threads === null} onClick={() => update("profile", profile)}><strong>{profile[0].toUpperCase() + profile.slice(1)}</strong><span>{threads ?? "—"} threads · {profile === "quiet" ? "Fewer resources" : profile === "balanced" ? "Moderate resources" : "More resources"}</span></button>)}</div>
      <p className="info-detail">Selected: {setup.profile ?? "None"}{setup.threads ? ` · ${setup.threads} threads` : ""}. Huge pages and MSR optimizations are disabled. Electricity use and performance vary by device.</p>
    </section>
    <section className="setup-panel consent-panel">
      <p className="eyebrow">BEFORE YOU MINE</p><h2>Review and acknowledge</h2>
      <p className="info-detail">Wallet: {setup.walletMasked ?? "Not configured"} · Pool: {setup.pool ? `${setup.pool.host}:${setup.pool.port} (${setup.pool.tls ? "TLS" : "unencrypted TCP"})` : "Not configured"} · Profile: {setup.profile ?? "Not selected"} ({setup.threads ?? "—"} threads) · Engine: XMRig {setup.engineVersion}.</p>
      <p className="info-detail">Ember plans a 5% contribution to support the project. Its accounting and technical mechanism are not active, and no Ember contribution is charged here. XMRig separately uses its own upstream donation, configured at 1%. A future controlled development session will be explicitly labeled as running without the Ember contribution.</p>
      {setup.acknowledged ? <><p className="consent-saved" role="status">Acknowledged for these settings. Changes require a fresh review.</p><button className="setup-engine-button secondary" disabled={busy} onClick={() => update("revoke")}>Withdraw acknowledgement</button></> : <>
        <label className="check-label"><input type="checkbox" checked={review.risks} disabled={busy} onChange={(event) => setReview({ ...review, risks: event.target.checked })} />I understand mining uses significant CPU and electricity, may affect device performance, and rewards are uncertain.</label>
        <label className="check-label"><input type="checkbox" checked={review.selections} disabled={busy} onChange={(event) => setReview({ ...review, selections: event.target.checked })} />I reviewed my public wallet, pool, resource profile and local XMRig engine above.</label>
        <label className="check-label"><input type="checkbox" checked={review.donations} disabled={busy} onChange={(event) => setReview({ ...review, donations: event.target.checked })} />I understand XMRig’s separate donation and Ember’s planned 5% contribution. Ember never starts mining automatically on launch.</label>
        <button className="setup-engine-button" disabled={busy || !completeExceptConsent || !Object.values(review).every(Boolean)} onClick={() => update("acknowledge", { revision: setup.revision, ...review })}>Acknowledge these settings</button>
        {!completeExceptConsent && <p className="info-detail">Complete the setup checks below before acknowledging.</p>}
      </>}
    </section>
    <section className="setup-panel">
      <p className="eyebrow">READINESS</p><h2>{setup.ready ? "Local setup is ready" : "Setup needs attention"}</h2>
      <ul className="readiness-checks">{setup.checks.map((check) => <li key={check.id}><span className={check.passed ? "check-pass" : "check-pending"}>{check.passed ? "✓ Complete" : "○ Required"}</span>{check.label}</li>)}</ul>
      <button className="setup-engine-button" disabled>Start mining</button><p className="info-detail">{setup.startReason}</p>
    </section>
  </div>;
}
