import { EmberCore, type EmberCoreState } from "./EmberCore";
import { formatHashrate, miningTelemetryViewModel } from "../miningTelemetry.mjs";
import type { MiningReadiness, MiningSessionStatus } from "./MiningSetup";

type Props = { session: MiningSessionStatus | null; setup: MiningReadiness | null; statusUnavailable?: boolean };
type SessionProps = Props & { onStop: () => void; stopping: boolean };

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

export function MiningSessionTelemetry({ session, setup, statusUnavailable = false, onStop, stopping }: SessionProps) {
  const view = miningTelemetryViewModel(session, setup);
  const starting = view.state === "starting";
  const poolState = view.poolState ?? "unavailable";
  const accepted = formatCount(view.accepted, starting);
  const rejected = formatCount(view.rejected, starting);
  const coreState = coreStateFor(view.state);
  const stateLabel = view.state === "error" ? "Attention" : view.stateLabel;
  const support = starting
    ? ""
    : view.state === "error"
      ? "The session needs attention"
      : view.state === "stopping"
        ? "Closing the owned mining process"
        : view.state === "paused"
          ? "Mining is paused"
          : "This device is connected to your selected pool";

  return (
    <div className={`mining-operation mining-operation--${view.state}`}>
      <section className="operation-main" aria-label="Mining session status">
        <div className="operation-identity">
          <EmberCore state={coreState} compact />
          <div>
            <span className="operation-kicker">EMBER CORE</span>
            <h2>{stateLabel}</h2>
            {support && <p>{support}</p>}
          </div>
        </div>
        <div className={`operation-rate${view.freshness === "stale" || statusUnavailable ? " is-stale" : ""}`}>
          <span>Current hashrate</span>
          <strong>{view.hashrate ?? view.hashrateLabel}</strong>
        </div>
        <div className="operation-actions">
          <FreshnessNotice session={session} statusUnavailable={statusUnavailable} />
          {view.state !== "stopping" && <button className="setup-engine-button stop-mining-button" type="button" disabled={stopping} onClick={onStop}>{stopping ? "Stopping…" : "Stop mining"}</button>}
        </div>
      </section>

      {starting && <p className="starting-note">{startupMessage(session?.startupStage ?? null, session?.startupElapsedMs ?? null)}</p>}

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
      </section>

      <details className="mining-advanced-details">
        <summary>Details</summary>
        <div className="details-groups">
          <section aria-labelledby="details-performance"><h3 id="details-performance">Performance</h3><dl>
            <Detail label="10-second average" value={formatOptionalRate(view.shortHashrate)} />
            <Detail label="60-second average" value={formatOptionalRate(view.mediumHashrate)} />
            <Detail label="15-minute average" value={formatOptionalRate(view.longHashrate)} />
            <Detail label="CPU activity" value={view.cpuActivity} />
          </dl></section>
          <section aria-labelledby="details-pool"><h3 id="details-pool">Pool and results</h3><dl>
            <Detail label="Pool algorithm" value={view.algorithm ?? "Unavailable"} />
            <Detail label="Current job difficulty" value={formatNumber(view.currentJobDifficulty)} />
            <Detail label="Accepted difficulty" value={formatNumber(view.acceptedDifficulty)} />
          </dl></section>
          <section aria-labelledby="details-engine"><h3 id="details-engine">Engine</h3><dl>
            <Detail label="Configured threads" value={view.capacityKnown ? `${view.threads} of ${view.logicalProcessors}` : "Unavailable"} />
            <Detail label="Worker evidence" value="Configured lanes do not confirm active CPU threads. A positive rate confirms observed hashing." />
            <Detail label="Huge pages" value={view.hugePages ? `${view.hugePages.allocated} of ${view.hugePages.total} allocated` : "Unavailable"} />
          </dl></section>
          <section aria-labelledby="details-measurement"><h3 id="details-measurement">Measurement</h3><dl>
            <Detail label="Current rate" value="XMRig rolling 10-second average; zero is distinct from unavailable." />
            <Detail label="Pool results" value="Counts are XMRig-reported submission responses, not pool account earnings." />
            {view.freshness === "stale" && <Detail label="Last update" value="The displayed values are the last reported sample." />}
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
  if (view.state === "starting" && !statusUnavailable) return null;
  const freshness = statusUnavailable && session ? "stale" : view.freshness;
  const message = statusUnavailable && !session ? "Ember status unavailable" : statusUnavailable ? "Updates delayed" : view.freshnessLabel;
  return <div className={`telemetry-freshness telemetry-freshness--${freshness}`}>
    <span className="freshness-mark" aria-hidden="true" /><span>{message}</span>
  </div>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
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

function coreStateFor(state: string): EmberCoreState {
  if (state === "starting" || state === "stopping") return "starting";
  if (state === "mining") return "mining";
  if (state === "paused") return "paused";
  if (state === "error") return "warning";
  if (state === "ready") return "ready";
  if (state === "stopped") return "stopped";
  return "not-configured";
}

function formatCount(value: number | null, starting: boolean) {
  return value === null ? starting ? "—" : "Unavailable" : value.toLocaleString();
}

function formatNumber(value: number | null) {
  return value === null ? "Unavailable" : value.toLocaleString();
}

function formatOptionalRate(value: number | null) {
  return formatHashrate(value) ?? "Unavailable";
}

function capitalize(value: string) { return value[0].toUpperCase() + value.slice(1); }
