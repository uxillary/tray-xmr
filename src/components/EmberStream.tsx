import { useId, useLayoutEffect, useRef, useState } from "react";
import { CheckCircleIcon } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { CpuIcon } from "@phosphor-icons/react/dist/csr/Cpu";
import { LinkSimpleIcon } from "@phosphor-icons/react/dist/csr/LinkSimple";
import { StopCircleIcon } from "@phosphor-icons/react/dist/csr/StopCircle";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/csr/WarningCircle";
import type { EmberEvent } from "../emberStream.mjs";
import { eventContext, eventExplanation, formatEmberEventTime, presentEmberEvent, streamUpdate } from "../emberStream.mjs";

const iconByKind = {
  engine: CpuIcon,
  stop: StopCircleIcon,
  warning: WarningCircleIcon,
  pool: LinkSimpleIcon,
  accepted: CheckCircleIcon,
};

export function EmberStream({ events, unavailable = false, compact = false, mining = false }: { events: EmberEvent[]; unavailable?: boolean; compact?: boolean; mining?: boolean }) {
  const recent = events.slice(-256);
  const helpId = useId();
  const viewport = useRef<HTMLDivElement>(null);
  const following = useRef(true);
  const previousId = useRef<string | null>(null);
  const [unread, setUnread] = useState(0);
  const [verbose, setVerbose] = useState(false);
  const [away, setAway] = useState(false);
  const anchor = useRef<{ id: string; offset: number } | null>(null);
  function rememberPosition() {
    const element = viewport.current;
    if (!element) return;
    const top = element.getBoundingClientRect().top;
    const row = Array.from(element.querySelectorAll<HTMLElement>("li[data-event-id]")).find((item) => item.getBoundingClientRect().bottom > top);
    anchor.current = row ? { id: row.dataset.eventId!, offset: row.getBoundingClientRect().top - top } : null;
  }
  const latest = recent[recent.length - 1]?.id ?? null;
  useLayoutEffect(() => {
    const update = streamUpdate(recent, previousId.current, following.current);
    previousId.current = latest;
    if (update.follow && viewport.current) { viewport.current.scrollTop = viewport.current.scrollHeight; setUnread(0); }
    else {
      if (update.added) setUnread((count) => Math.min(256, count + update.added));
      const element = viewport.current;
      const saved = anchor.current;
      const row = saved && Array.from(element?.querySelectorAll<HTMLElement>("li[data-event-id]") ?? []).find((item) => item.dataset.eventId === saved.id);
      if (element && row && saved) element.scrollTop += row.getBoundingClientRect().top - element.getBoundingClientRect().top - saved.offset;
    }
    rememberPosition();
  }, [events, latest, verbose]);
  function returnToLatest() {
    following.current = true;
    if (viewport.current) viewport.current.scrollTop = viewport.current.scrollHeight;
    setUnread(0);
    setAway(false);
  }
  useLayoutEffect(() => {
    const element = viewport.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      if (following.current) element.scrollTop = element.scrollHeight;
      rememberPosition();
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <section className={`ember-stream ember-stream--${verbose ? "verbose" : "activity"}${compact ? " ember-stream--compact" : ""}`} aria-label="Ember Stream">
    <header className="ember-stream-heading">
      <div className="ember-stream-title"><h2>Live activity</h2><span>{unavailable ? "Unavailable" : mining ? "Listening" : "Quiet"}</span></div>
      <div className="stream-modes" role="group" aria-label="Stream presentation"><button type="button" aria-pressed={!verbose} onClick={() => { rememberPosition(); setVerbose(false); }}>Activity</button><button type="button" aria-pressed={verbose} onClick={() => { rememberPosition(); setVerbose(true); }}>Verbose</button></div>
    </header>
    {unavailable && <p className="stream-warning" role="status">Activity updates unavailable.{recent.length > 0 ? " Last received events retained." : ""}</p>}
    <div className="stream-viewport" ref={viewport} tabIndex={0} role="region" aria-label="Activity events, oldest to latest" aria-describedby={helpId} onKeyDown={(event) => {
      if (event.target !== event.currentTarget) return;
      if (event.key === "End") { event.preventDefault(); returnToLatest(); }
      if (event.key === "Home") { event.preventDefault(); following.current = false; setAway(true); event.currentTarget.scrollTop = 0; rememberPosition(); }
    }} onScroll={() => {
      const element = viewport.current;
      if (!element) return;
      following.current = element.scrollHeight - element.scrollTop - element.clientHeight < 24;
      setAway(!following.current);
      rememberPosition();
      if (following.current) setUnread(0);
    }}>
      {recent.length === 0 ? <div className="ember-stream-empty"><span aria-hidden="true">—</span><strong>All quiet here.</strong><p>Real session events will appear here when Ember has something to report.</p></div> : <ol className="ember-stream-list">
        {recent.map((event) => {
          const presentation = presentEmberEvent(event);
          const Icon = iconByKind[presentation.icon];
          const explanation = eventExplanation(event);
          const date = new Date(event.occurredAtUnixMs);
          return <li className={`ember-stream-row ember-stream-row--${event.severity}`} key={event.id} data-event-id={event.id}>
            <time title={Number.isNaN(date.getTime()) ? undefined : date.toLocaleString()} dateTime={Number.isNaN(date.getTime()) ? undefined : date.toISOString()}>{formatEmberEventTime(event.occurredAtUnixMs)}</time>
            <span className="ember-stream-marker">{verbose ? presentation.marker : event.category === "pool" ? "Connection" : event.category === "result" ? "Results" : "System"}</span>
            <Icon className="ember-stream-icon" weight="regular" aria-hidden="true" />
            <div className="stream-event-body"><span className="ember-stream-message">{presentation.message}</span><span className="stream-severity">{event.severity === "informational" ? "Info" : event.severity}</span>
              {!verbose && explanation && <p className="stream-explanation">{explanation}</p>}
              {verbose && <span className="stream-source"><span>{event.source}</span><span>{event.kind.type}</span></span>}
              {verbose && <details className="stream-event-detail" onToggle={() => { if (following.current && viewport.current) viewport.current.scrollTop = viewport.current.scrollHeight; rememberPosition(); }}><summary aria-label={`Technical detail: ${presentation.message}`}>Technical detail</summary><EventDetail event={event} /></details>}
            </div>
          </li>;
        })}
      </ol>}
    </div>
    <footer className="stream-footer"><span>{recent.length} buffered {recent.length === 1 ? "event" : "events"} · this app run only</span><span className="stream-follow-state">{away ? "Reading older events" : "Following latest"}</span><span role="status" aria-live="polite">{away && <button className="text-action" type="button" onClick={returnToLatest}>{unread > 0 ? `${unread} new · ` : ""}Return to latest ↓</button>}</span></footer>
    <span id={helpId} className="sr-only">Use arrow keys to scroll. Home reads oldest buffered events; End returns to latest. History is limited to 256 events in this app run.</span>
  </section>;
}

function EventDetail({ event }: { event: EmberEvent }) {
  const [copied, setCopied] = useState("");
  const context = eventContext(event);
  return <><dl className="stream-technical"><div><dt>Source</dt><dd>{event.source} · {event.category} · {event.kind.type}</dd></div>{Object.entries(context).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{String(value ?? "Unavailable")}</dd></div>)}<div><dt>Event</dt><dd>{event.id}</dd></div></dl><button className="text-action stream-copy" type="button" onClick={async () => {
    try { await navigator.clipboard.writeText(JSON.stringify({ time: Number.isFinite(event.occurredAtUnixMs) && !Number.isNaN(new Date(event.occurredAtUnixMs).getTime()) ? new Date(event.occurredAtUnixMs).toISOString() : null, category: presentEmberEvent(event).marker, source: event.source, kind: event.kind.type, context }, null, 2)); setCopied("Copied"); }
    catch { setCopied("Copy unavailable"); }
  }}>Copy event</button><span className="stream-copy-result" role="status">{copied}</span></>;
}
