import { CheckCircleIcon } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { CpuIcon } from "@phosphor-icons/react/dist/csr/Cpu";
import { LinkSimpleIcon } from "@phosphor-icons/react/dist/csr/LinkSimple";
import { StopCircleIcon } from "@phosphor-icons/react/dist/csr/StopCircle";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/csr/WarningCircle";
import type { EmberEvent } from "../emberStream.mjs";
import { formatEmberEventTime, presentEmberEvent } from "../emberStream.mjs";

const iconByKind = {
  engine: CpuIcon,
  stop: StopCircleIcon,
  warning: WarningCircleIcon,
  pool: LinkSimpleIcon,
  accepted: CheckCircleIcon,
};

export function EmberStream({ events, unavailable = false, compact = false, mining = false }: { events: EmberEvent[]; unavailable?: boolean; compact?: boolean; mining?: boolean }) {
  const recent = events.slice(-8).reverse();
  return <section className={`ember-stream${compact ? " ember-stream--compact" : ""}`} aria-label="Ember Stream">
    <header className="ember-stream-heading">
      <div className="ember-stream-title"><span className={`ember-stream-indicator${mining && !unavailable ? " is-mining" : ""}${unavailable ? " is-unavailable" : ""}`} aria-hidden="true" /><h2>Session activity</h2><span>{unavailable ? "Unavailable" : mining ? "Mining" : "Recent activity"}</span></div>
      {recent.length > 0 && <span className="ember-stream-count">{recent.length} recent {recent.length === 1 ? "event" : "events"}</span>}
    </header>
    {unavailable ? <p className="ember-stream-empty">Stream is unavailable right now.</p> : recent.length === 0 ? <p className="ember-stream-empty">No events in this session yet.</p> : <ol className="ember-stream-list">
      {recent.map((event) => {
        const presentation = presentEmberEvent(event);
        const Icon = iconByKind[presentation.icon];
        const date = new Date(event.occurredAtUnixMs);
        return <li className={`ember-stream-row ember-stream-row--${event.severity}`} key={event.id}>
          <time dateTime={Number.isNaN(date.getTime()) ? undefined : date.toISOString()}>{formatEmberEventTime(event.occurredAtUnixMs)}</time>
          <span className="ember-stream-marker">{presentation.marker}</span>
          <Icon className="ember-stream-icon" weight="regular" aria-hidden="true" />
          <span className="ember-stream-message">{presentation.message}</span>
        </li>;
      })}
    </ol>}
  </section>;
}
