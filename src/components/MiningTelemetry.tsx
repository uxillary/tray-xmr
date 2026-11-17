import { LivingCore } from "./LivingCore";
import { livingCoreState } from "../livingCoreState.mjs";
import { formatHashrate, miningTelemetryViewModel } from "../miningTelemetry.mjs";
import type { MiningReadiness, MiningSessionStatus } from "./MiningSetup";
import "./MiningTelemetry.css";

type Props = { session: MiningSessionStatus | null; setup: MiningReadiness | null; statusUnavailable?: boolean };
type SessionProps = Props & { onStop?: () => void; stopping?: boolean; reducedMotion?: boolean; inspectFrame?: number };

export function OverviewMiningTelemetry({ session, setup, statusUnavailable = false }: Props) {
  const view = miningTelemetryViewModel(session, setup);
  const profile = view.profile ? capitalize(view.profile) : "Profile unavailable";
  const duration = view.sessionDuration ?? (view.state === "starting" ? "—" : "Unavailable");

  return (
    <section className="overview-live" aria-labelledby="overview-live-title">
      <div className="overview-live-rate">
        <span id="overview-live-title">Current hashrate</span>
        <strong>{view.hashrate ?? view.hashrateLabel}</strong>
        <FreshnessNotice session={session} statusUnavailable={statusUnavailable} />
      </div>
      <div className="overview-live-ops">
        <PoolRoute state={view.poolState ?? "unavailable"} label={view.poolLabel} />
        <div className="overview-live-profile">
          <span className="operational-label">Power profile</span>
          <strong>{profile}</strong>
          {view.capacityKnown && <span>{view.threads} of {view.logicalProcessors} threads configured</span>}
        </div>
        <div className="overview-live-time">
          <span className="operational-label">Session</span>
          <strong>{duration}</strong>
        </div>
      </div>
    </section>
  );
}

export function MiningSessionTelemetry({ session, setup, statusUnavailable = false, onStop, stopping = false, reducedMotion = false, inspectFrame }: SessionProps) {
  const view = miningTelemetryViewModel(session, setup);
  const core = livingCoreState({ session, readiness: setup, statusUnavailable });
  const starting = core.lifecycle === "starting";
  const poolState = view.poolState ?? "unavailable";
  const accepted = formatCount(view.accepted, starting);
  const rejected = formatCount(view.rejected, starting);
  const lastReported = statusUnavailable || view.freshness !== "fresh" || !["mining", "paused"].includes(core.lifecycle);
  const support = core.lifecycle === "unavailable"
    ? "Ember cannot confirm the current session status. Check the session before starting again."
    : starting
      ? "Preparing your supervised mining session"
    : core.lifecycle === "error"
      ? "The session needs attention"
      : core.lifecycle === "stopping"
        ? "Closing the owned mining process"
        : core.lifecycle === "paused"
          ? "Mining is paused"
          : core.lifecycle === "mining"
            ? core.activeWork ? "Ember is tending the Core while this device mines." : "Waiting for current evidence of hashing."
            : core.lifecycle === "stopped"
              ? "The session has ended"
              : core.lifecycle === "ready"
                ? "Ready when you are"
                : core.lifecycle === "notConfigured"
                  ? "Complete setup before starting"
                  : "";

  return (
    <div className={`mining-operation mining-operation--living mining-operation--${core.lifecycle}`}>
      <section className="operation-main" aria-label="Mining session status">
        <div className="operation-world">
          <LivingCore view={core} reducedMotion={reducedMotion} inspectFrame={inspectFrame} />
          <span className="core-caption">EMBER · LIVING CORE</span>
        </div>
        <div className="operation-console">
          <div className="operation-identity">
            <span className="operation-kicker">THIS DEVICE · MINING SESSION</span>
            <h2>{core.label}</h2>
            {support && <p>{support}</p>}
          </div>
          <div className={`operation-rate${lastReported ? " is-stale" : ""}`}>
            <span>Current hashrate</span>
            <strong>{formatRate(starting ? "—" : view.hashrate ?? view.hashrateLabel)}</strong>
            <span className="operation-rate-context">{lastReported && view.hashrate !== null ? "Last reported · 10-second average" : "10-second average"}</span>
          </div>
          <div className="operation-actions">
            <FreshnessNotice session={session} statusUnavailable={statusUnavailable} />
            {core.qualifier && core.qualifier !== "Live telemetry" && core.qualifier !== "Updates delayed" && core.qualifier !== "Telemetry unavailable" && <p className="operation-qualifier">{core.qualifier}</p>}
            {onStop && <button className="setup-engine-button stop-mining-button" type="button" disabled={stopping || session?.state === "stopping"} onClick={onStop}>{stopping || session?.state === "stopping" ? "Stopping…" : "Stop mining"}</button>}
          </div>
          <p className={`starting-note${starting ? " is-active" : ""}`} aria-live={starting ? "polite" : undefined}>
            {starting ? startupMessage(session?.startupStage ?? null, session?.startupElapsedMs ?? null) : " "}
          </p>
        </div>
      </section>

      <section className="operation-details" aria-label="Current mining session details">
        <PoolRoute state={poolState} label={view.poolLabel} />
        <div className="operation-profile">
          <div className="operation-profile-heading">
            <span className="operational-label">Power profile</span>
            <strong>{view.profile ? capitalize(view.profile) : "Unavailable"}</strong>
          </div>
          <ThreadCapacity setup={setup} />
        </div>
        <div className="operation-time">
          <span className="operational-label">Session</span>
          <strong>{view.sessionDuration ?? (starting ? "—" : "Unavailable")}</strong>
        </div>
        <div className="operation-work" aria-label={`Accepted results: ${accepted}; rejected results: ${rejected}`}>
          <span><span>Accepted</span><strong>{accepted}</strong></span>
          <span className={view.rejected !== null && view.rejected > 0 ? "has-rejections" : ""}><span>Rejected</span><strong>{rejected}</strong></span>
        </div>
        {session?.contribution.active && <div className="operation-contribution" aria-live="polite">
          <span className="operational-label">5% developer fee · active time target</span>
          <strong>{session.contribution.developerSlot ? "Developer wallet" : "Your saved wallet"} · next switch in {formatSwitchTime(session.contribution.secondsToSwitch)}</strong>
          {session.contribution.developerSlot && <code>{session.contribution.developerWallet}</code>}
          <span>Accounted mining time: your wallet {formatSwitchTime(session.contribution.userActiveSeconds)} · developer {formatSwitchTime(session.contribution.developerActiveSeconds)}.</span>
          <span>Actual reward share can vary with pool results and reconnect time. XMRig's separate 1% donation also applies.</span>
        </div>}
      </section>

      <details className="mining-advanced-details">
        <summary>Details</summary>
        <div className="details-groups">
          <section aria-labelledby="details-performance"><h3 id="details-performance">Performance</h3><dl>
            <Detail label="10-second average" value={formatOptionalRate(view.shortHashrate)} />
            <Detail label="60-second average" value={formatOptionalRate(view.mediumHashrate)} />
            <Detail label="15-minute average" value={formatOptionalRate(view.longHashrate)} />
            <Detail label="CPU activity" value={lastReported ? "Current activity is unconfirmed; last reported readings are retained." : view.cpuActivity} />
          </dl></section>
          <section aria-labelledby="details-pool"><h3 id="details-pool">Pool and results</h3><dl>
            <Detail label="Pool algorithm" value={view.algorithm ?? "Unavailable"} />
            <Detail label="Current job difficulty" value={formatNumber(view.currentJobDifficulty)} />
            <Detail label="Accepted difficulty" value={formatNumber(view.acceptedDifficulty)} />
          </dl></section>
          <section aria-labelledby="details-engine"><h3 id="details-engine">Engine</h3><dl>
            <Detail label="Engine version" value={session?.telemetry?.engineVersion || setup?.engineVersion || "Unavailable"} />
            <Detail label="Configured threads" value={view.capacityKnown ? `${view.threads} of ${view.logicalProcessors}` : "Unavailable"} />
            <Detail label="Worker evidence" value="Configured lanes do not confirm active CPU threads. A fresh positive rate confirms observed hashing." />
            <Detail label="Huge pages" value={view.hugePages ? `${view.hugePages.allocated} of ${view.hugePages.total} allocated` : "Unavailable"} />
          </dl></section>
          <section aria-labelledby="details-measurement"><h3 id="details-measurement">Measurement</h3><dl>
            <Detail label="Current rate" value="XMRig rolling 10-second average; zero is distinct from unavailable." />
            <Detail label="Pool results" value="Counts are XMRig-reported submission responses, not pool account earnings." />
            {lastReported && <Detail label="Last update" value="The displayed values are the last reported sample, not confirmation of current activity." />}
          </dl></section>
        </div>
      </details>
    </div>
  );
}

function PoolRoute({ state, label }: { state: string; label: string }) {
  return <div className={`pool-route pool-route--${state}`} role="group" aria-label={`This PC to pool. Pool status: ${label}`}>
    <span className="pool-route-node">This PC</span>
    <span className="pool-route-link" aria-hidden="true"><span /></span>
    <span className="pool-route-end"><span className="pool-route-node">Pool</span><strong className="pool-route-status">{label}</strong></span>
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
    : view.freshness === "unavailable" && ["mining", "paused", "stopping"].includes(view.state) ? "Telemetry unavailable" : view.freshnessLabel;
  return <div className={`telemetry-freshness telemetry-freshness--${freshness}`}>
    <span className="freshness-mark" aria-hidden="true" /><span>{message}</span>
  </div>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
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
