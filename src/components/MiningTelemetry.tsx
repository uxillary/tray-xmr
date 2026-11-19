import { useEffect, useMemo, useState } from "react";
import { ClockIcon } from "@phosphor-icons/react/dist/csr/Clock";
import { CheckCircleIcon } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { CpuIcon } from "@phosphor-icons/react/dist/csr/Cpu";
import { LinkSimpleIcon } from "@phosphor-icons/react/dist/csr/LinkSimple";
import { GaugeIcon } from "@phosphor-icons/react/dist/csr/Gauge";
import { InfoIcon } from "@phosphor-icons/react/dist/csr/Info";
import { initialHistory, type HashrateHistory } from "../hashrateHistory.mjs";
import { LivePerformance } from "./LivePerformance";
import { LivingCore } from "./LivingCore";
import { initialIntensity, intensityMotion, stepIntensity, telemetryExpiryDelay } from "../workshopIntensity.mjs";
import { livingCoreState } from "../livingCoreState.mjs";
import { formatHashrate, miningTelemetryViewModel } from "../miningTelemetry.mjs";
import type { MiningReadiness, MiningSessionStatus } from "./MiningSetup";
import "./MiningTelemetry.css";

type Props = { session: MiningSessionStatus | null; setup: MiningReadiness | null; statusUnavailable?: boolean };
type SessionProps = Props & { history?: HashrateHistory; controlsOnly?: boolean; onStop?: () => void; stopping?: boolean; reducedMotion?: boolean; inspectFrame?: number; onStart?: () => void; startDisabled?: boolean; starting?: boolean };

export function MiningSessionTelemetry({ history, session, setup, statusUnavailable = false, onStop, stopping = false, reducedMotion = false, inspectFrame, onStart, startDisabled = false, starting: startPending = false, controlsOnly = false }: SessionProps) {
  const [expiredSample, setExpiredSample] = useState<MiningSessionStatus | null>(null);
  const observedSession = useMemo(() => {
    const stamp = session?.telemetry?.sampleTimeUnixMs;
    const invalidStamp = session?.telemetry && (typeof stamp !== "number" || !Number.isFinite(stamp) || stamp <= 0 || stamp > Date.now() || Date.now() - stamp > 5000);
    return session?.telemetryFreshness === "fresh" && (session === expiredSample || invalidStamp) ? { ...session, telemetryFreshness: "stale" as const } : session;
  }, [session, expiredSample]);
  useEffect(() => {
    const delay = telemetryExpiryDelay(session);
    if (delay === null || controlsOnly) return;
    const timer = window.setTimeout(() => setExpiredSample(session), delay);
    return () => window.clearTimeout(timer);
  }, [session, controlsOnly]);
  const view = miningTelemetryViewModel(observedSession, setup);
  const core = livingCoreState({ session: observedSession, readiness: setup, statusUnavailable });
  const [intensity, setIntensity] = useState(initialIntensity);
  const intensityKey = `${session?.processId}:${setup?.profile}:${setup?.threads}`;
  useEffect(() => {
    setIntensity((previous) => stepIntensity(previous, { session: observedSession, key: intensityKey, unavailable: statusUnavailable, reducedMotion }));
  }, [observedSession, intensityKey, statusUnavailable, reducedMotion]);
  const motion = intensityMotion(core.activeWork && !reducedMotion && intensity.key === intensityKey ? intensity : initialIntensity());
  const starting = core.lifecycle === "starting";
  const resting = !statusUnavailable && !session?.error && ["stopped", "ready", "notConfigured"].includes(core.lifecycle);
  const poolState = resting ? "idle" : statusUnavailable || view.freshness !== "fresh" ? "unknown" : view.poolState ?? "unavailable";
  const accepted = formatCount(view.accepted, starting || resting);
  const rejected = formatCount(view.rejected, starting || resting);
  const lastReported = statusUnavailable || view.freshness !== "fresh" || !["mining", "paused"].includes(core.lifecycle);

  return (
    <>
      <header className="workspace-status">
        <div className="operation-identity" role="status"><h2>{core.label}</h2><p className="operation-status-copy">{resting ? core.lifecycle === "stopped" ? "Squish is resting. Ready when you are." : core.lifecycle === "ready" ? "Your workshop is ready." : "Let’s get your workshop ready." : statusUnavailable ? "Check the connection. Stop remains available." : core.lifecycle === "mining" ? core.activeWork ? "A little work, happening right here." : "Waiting for confirmed work." : core.lifecycle === "starting" ? "Waking up the workshop." : core.lifecycle === "stopping" ? "Bringing things to a safe stop." : core.qualifier ?? "Check session details below."}</p></div>
        <div className="workspace-primary-action">
          {onStop && <button className="setup-engine-button stop-mining-button" type="button" disabled={stopping || session?.state === "stopping"} onClick={onStop}>{stopping || session?.state === "stopping" ? "Stopping…" : "Stop mining"}</button>}
          {onStart && <button className="setup-engine-button start-mining-button" type="button" disabled={startDisabled} onClick={onStart}>{startPending ? "Starting…" : "Start mining"}</button>}
          {!onStop && !onStart && core.lifecycle === "notConfigured" && <a className="workspace-setup-link" href="#setup" onClick={(event) => { event.preventDefault(); const details = document.querySelector<HTMLDetailsElement>(".workspace-setup"); if (details) details.open = true; details?.scrollIntoView({ behavior: "instant", block: "start" }); details?.querySelector<HTMLElement>("summary")?.focus(); }}>Set up mining ↓</a>}
        </div>
      </header>
      {!controlsOnly && session?.error && <p className="workspace-session-error" role="alert">{statusUnavailable ? "Last reported error: " : ""}{session.error.message}</p>}
    {!controlsOnly && <div className={`mining-operation mining-operation--living mining-operation--${core.lifecycle}`}>
      <section className="operation-main" aria-label="Mining session status">
        <div className="operation-world"><LivingCore view={core} reducedMotion={reducedMotion} inspectFrame={inspectFrame} intensity={motion} /><span className="core-caption">SQUISH’S WORKSHOP <span aria-hidden="true"> / </span><span>{core.activeWork ? "TENDING THE CORE" : core.lifecycle === "starting" ? "GETTING READY" : core.lifecycle === "stopping" ? "HEADING HOME" : "AT REST"}</span></span></div>
        <div className="operation-console">
          {resting ? <div className="operation-resting">
            <span className="operation-kicker">{core.lifecycle === "stopped" ? "AT REST" : "YOUR WORKSPACE"}</span>
            <strong>{core.lifecycle === "stopped" ? "Session stopped" : core.lifecycle === "ready" ? "Ready to begin" : "A little setup first"}</strong>
            <p>{core.lifecycle === "stopped" ? "Squish is resting. Ready when you are." : core.lifecycle === "ready" ? "Your setup is ready. Start when it suits you." : "Choose a wallet, pool and CPU profile to get ready."}</p>
            {view.hashrate !== null && <span className="operation-last-rate">Last reported: {view.hashrate} · no live hashrate</span>}
          </div> : <><div className={`operation-rate${lastReported ? " is-stale" : ""}`}>
              <span>Current hashrate</span><strong>{formatRate(starting ? "—" : view.hashrate ?? view.hashrateLabel)}</strong>
              <span className="operation-rate-context">{lastReported && view.hashrate !== null ? "Last reported · 10-second average" : "10-second average"}</span>
            </div><FreshnessNotice session={observedSession} statusUnavailable={statusUnavailable} /></>}
          {core.qualifier && !["Live telemetry", "Updates delayed", "Telemetry unavailable"].includes(core.qualifier) && <p className="operation-qualifier">{core.qualifier}</p>}
          {starting && <p className="starting-note is-active" aria-live="polite">{startupMessage(session?.startupStage ?? null, session?.startupElapsedMs ?? null)}</p>}
        </div>
      </section>

      <LivePerformance preparing={starting} history={history ?? initialHistory()} live={session?.state === "mining" && !session.startupStage} delayed={statusUnavailable || view.freshness !== "fresh" || history?.breakPending} />

      <section className="operation-details" aria-label="Current mining session details">
        <PoolRoute state={poolState} label={resting ? "Not connected" : lastReported && view.poolState === "connected" ? "Last connected · unconfirmed" : view.poolLabel} />
        <div className="operation-profile">
          <div className="operation-profile-heading">
            <span className="operational-label">CPU effort</span>
            <strong>{view.profile ? capitalize(view.profile) : "Unavailable"}</strong>
          </div>
          <ThreadCapacity setup={setup} />
        </div>
        <div className="operation-time">
          <span className="operational-label"><ClockIcon aria-hidden="true" /> {resting && view.sessionDuration ? "Last session" : "Session"}</span>
          <strong>{view.sessionDuration ?? (resting ? "Not running" : starting ? "—" : "Unavailable")}</strong>
        </div>
        <div className="operation-work" aria-label={`Accepted results: ${accepted}; rejected results: ${rejected}`}>
          <span><span><CheckCircleIcon aria-hidden="true" /> {resting && view.accepted !== null ? "Last accepted" : "Accepted"}</span><strong>{accepted}</strong></span>
          <span className={view.rejected !== null && view.rejected > 0 ? "has-rejections" : ""}><span>{resting && view.rejected !== null ? "Last rejected" : "Rejected"}</span><strong>{rejected}</strong></span>
        </div>

      </section>

      {session?.contribution?.active && <p className="workspace-fee">5% developer fee · {session.contribution.developerSlot ? "Developer wallet active" : "Your saved wallet active"} · next switch in {formatSwitchTime(session.contribution.secondsToSwitch)} <span>Details below</span></p>}
      <details className="mining-advanced-details">
        <summary>Details</summary>
        <p className="details-reading-status"><span className={`freshness-mark${lastReported ? " is-historical" : ""}`} aria-hidden="true" />{!session?.telemetry ? resting ? "No session readings yet. Missing measurements appear as Unavailable." : "No telemetry received. Missing measurements appear as Unavailable." : lastReported ? "Last reported measurements · current activity unconfirmed" : "Live engine readings · XMRig local API"}</p>
        {session?.contribution?.active && <div className="operation-contribution" aria-live="polite">
          <span className="operational-label">5% developer fee · active time target</span>
          <strong>{session.contribution.developerSlot ? "Developer wallet" : "Your saved wallet"} · next switch in {formatSwitchTime(session.contribution.secondsToSwitch)}</strong>
          {session.contribution.developerSlot && <code>{session.contribution.developerWallet}</code>}
          <span>Accounted mining time: your wallet {formatSwitchTime(session.contribution.userActiveSeconds)} · developer {formatSwitchTime(session.contribution.developerActiveSeconds)}.</span>
          <span>Actual reward share can vary with pool results and reconnect time. XMRig's separate 1% donation also applies.</span>
        </div>}
        <div className="details-groups">
          <section aria-labelledby="details-performance"><h3 id="details-performance"><GaugeIcon aria-hidden="true" /> Performance</h3><dl>
            <Detail label="10-second average" value={formatOptionalRate(view.shortHashrate)} />
            <Detail label="60-second average" value={formatOptionalRate(view.mediumHashrate)} />
            <Detail label="15-minute average" value={formatOptionalRate(view.longHashrate)} />
            <Detail label="CPU activity" value={lastReported ? "Unconfirmed · last reported readings" : view.cpuActivity} />
            <Detail label="Workshop energy" value={!core.activeWork ? "Inactive · positive live rate required" : intensity.responsive ? `${capitalize(intensity.level)} · relative to this session’s stable rate` : "Steady · no stable comparison yet"} />
          </dl></section>
          <section aria-labelledby="details-pool"><h3 id="details-pool"><LinkSimpleIcon aria-hidden="true" /> Pool and results</h3><dl>
            <Detail label="Pool endpoint" value={session?.telemetry?.poolConnection?.endpoint ?? "Unavailable"} />
            <Detail label="Ping" value={session?.telemetry?.poolConnection?.pingMs == null ? "Unavailable" : `${session.telemetry.poolConnection.pingMs} ms`} />
            <Detail label="Connection failures" value={formatNumber(session?.telemetry?.poolConnection?.failures ?? null)} />
            <Detail label="Pool TLS" value={session?.telemetry?.poolConnection?.tlsVersion ?? "Unavailable"} />
            <Detail label="Pool algorithm" value={view.algorithm ?? "Unavailable"} />
            <Detail label="Current job difficulty" value={formatNumber(view.currentJobDifficulty)} help="Work target assigned by the pool; not a reward amount." />
            <Detail label="Accepted difficulty" value={formatNumber(view.acceptedDifficulty)} help="Total difficulty of accepted submissions in this session." />
          </dl></section>
          <section aria-labelledby="details-engine"><h3 id="details-engine"><CpuIcon aria-hidden="true" /> Engine</h3><dl>
            <Detail label="Engine version" value={session?.telemetry?.engineVersion || setup?.engineVersion || "Unavailable"} />
            <Detail label="Configured threads" value={view.capacityKnown ? `${view.threads} of ${view.logicalProcessors}` : "Unavailable"} />
            <Detail label="Thread evidence" value="Configured capacity; not measured CPU usage" />
            <Detail label="Huge pages" value={view.hugePages ? `${view.hugePages.allocated} of ${view.hugePages.total} allocated` : "Unavailable"} help="Large memory pages used by the engine." />
          </dl></section>
          <section aria-labelledby="details-measurement"><h3 id="details-measurement"><InfoIcon aria-hidden="true" /> About these readings</h3><dl>
            <Detail label="Readings" value={!session?.telemetry ? resting ? "No active session" : "Telemetry unavailable" : lastReported ? "Last reported · current work unconfirmed" : view.freshnessLabel} />
            <Detail label="Current rate" value="Hashes per second, averaged over 10 seconds" />
            <Detail label="Pool results" value="Submission responses, not earnings" />
            <Detail label="Workshop" value="Relative processing pace only; no earnings, share or block prediction" />
            {lastReported && <Detail label="Last update" value="The displayed values are the last reported sample, not confirmation of current activity." />}
          </dl></section>
        </div>
      </details>
    </div>}
    </>
  );
}

function PoolRoute({ state, label }: { state: string; label: string }) {
  return <div className={`pool-route pool-route--${state}`} role="group" aria-label={`This PC to pool. Pool status: ${label}`}>
    <span className="pool-route-node"><svg width="22" height="20" viewBox="0 0 22 20" fill="none" aria-hidden="true"><path d="M2 2h18v12H2zM7 18h8M11 14v4" stroke="currentColor" strokeWidth="1.5" /></svg>This PC</span>
    <span className="pool-route-link" aria-hidden="true"><span /></span>
    <span className="pool-route-end"><span className="pool-route-node"><svg width="19" height="20" viewBox="0 0 19 20" fill="none" aria-hidden="true"><path d="M2 2h15v6H2zM2 12h15v6H2zM5 5h2M5 15h2" stroke="currentColor" strokeWidth="1.5" /></svg>Pool</span><strong className="pool-route-status">{label}</strong></span>
  </div>;
}

function ThreadCapacity({ setup }: { setup: MiningReadiness | null }) {
  const view = miningTelemetryViewModel(null, setup);
  if (!view.capacityKnown) return <span className="thread-capacity-unavailable">Thread configuration unavailable</span>;
  const label = `${view.profile ? capitalize(view.profile) + ", " : ""}${view.threads} of ${view.logicalProcessors} CPU threads configured`;
  return <div className="thread-capacity">
    <span className="thread-lanes" role="img" aria-label={label}>
      {view.lanes.map((filled, index) => <span className={filled ? "thread-lane is-configured" : "thread-lane"} key={index} aria-hidden="true" />)}
    </span>
    <span className="thread-capacity-text">{view.threads} of {view.logicalProcessors} threads configured</span>
  </div>;
}

function FreshnessNotice({ session, statusUnavailable }: { session: MiningSessionStatus | null; statusUnavailable: boolean }) {
  const view = miningTelemetryViewModel(session, null);
  const core = livingCoreState({ session, statusUnavailable });
  const unknown = statusUnavailable || (session !== null && core.lifecycle === "unavailable");
  const freshness = unknown || core.qualifier === "Telemetry unavailable" ? "unavailable" : view.freshness;
  const message = unknown ? session ? "Status unavailable · last reported readings" : "Ember status unavailable"
    : core.qualifier === "Telemetry unavailable" ? "Telemetry unavailable"
    : view.freshness === "fresh" && session?.telemetry && session.telemetry.shortHashrate === null ? "Rate missing · telemetry received"
    : view.freshness === "unavailable" && ["mining", "paused", "stopping"].includes(view.state) ? "Telemetry unavailable" : view.freshnessLabel;
  return <div className={`telemetry-freshness telemetry-freshness--${freshness}`}>
    <span className="freshness-mark" aria-hidden="true" /><span>{message}</span>
  </div>;
}

function Detail({ label, value, help }: { label: string; value: string; help?: string }) {
  return <div><dt>{label}</dt><dd className={value === "Unavailable" ? "detail-unavailable" : undefined}>{value}{help && <small className="detail-help">{help}</small>}</dd></div>;
}

function formatRate(value: string) {
  const match = /^(.*)\s+(H\/s|kH\/s|MH\/s)$/.exec(value);
  return match ? <><span>{match[1]}</span><small>{match[2]}</small></> : value;
}

function startupMessage(stage: MiningSessionStatus["startupStage"], elapsedMs: number | null) {
  const copy = {
    checkingEngine: "Checking the verified engine",
    preparingSession: "Preparing your private session",
    startingXmrig: "Starting the mining engine",
    waitingForMiner: "Waiting for the first live reading",
  } as const;
  const message = copy[stage ?? "waitingForMiner"];
  const seconds = Math.floor((elapsedMs ?? 0) / 1000);
  return seconds >= 10 ? `${message} · ${seconds}s` : message;
}

function formatCount(value: number | null, starting: boolean) {
  return value === null ? starting ? "—" : "Unavailable" : value.toLocaleString();
}

function formatSwitchTime(seconds: number | null) {
  if (seconds === null) return "unavailable";
  if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return minutes > 0 ? `${minutes}m ${remainder}s` : `${remainder}s`;
}

function formatNumber(value: number | null) {
  return value === null ? "Unavailable" : value.toLocaleString();
}

function formatOptionalRate(value: number | null) {
  return formatHashrate(value) ?? "Unavailable";
}

function capitalize(value: string) { return value[0].toUpperCase() + value.slice(1); }
