import { useEffect, useId, useRef, useState } from "react";
import { formatHashrate } from "../miningTelemetry.mjs";
import { HISTORY_WINDOW_MS, historySegments, type HashrateHistory } from "../hashrateHistory.mjs";
import "./LivePerformance.css";

const timeLabel = (time: number) => new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

export function LivePerformance({ history, live, delayed = false, preparing = false }: { history: HashrateHistory; live: boolean; delayed?: boolean; preparing?: boolean }) {
  const id = useId();
  const plot = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1000);
  useEffect(() => {
    const element = plot.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setWidth(Math.max(160, element.clientWidth)));
    observer.observe(element);
    setWidth(Math.max(160, element.clientWidth));
    return () => observer.disconnect();
  }, []);
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const samples = history.samples;
  const selected = samples.find((sample) => sample.time === selectedTime);
  const end = history.endTime ?? samples[samples.length - 1]?.time ?? Date.now();
  const start = end - HISTORY_WINDOW_MS;
  const max = Math.max(1, ...samples.map((sample) => sample.rate)) * 1.15;
  const x = (time: number) => 52 + (time - start) / HISTORY_WINDOW_MS * (width - 72);
  const y = (rate: number) => 122 - rate / max * 96;
  const groups = historySegments(samples);
  const range = samples.length ? `Observed range ${formatHashrate(Math.min(...samples.map((s) => s.rate)))} to ${formatHashrate(Math.max(...samples.map((s) => s.rate)))}. ${samples.length} observation${samples.length === 1 ? "" : "s"}. ${groups.length > 1 ? `${groups.length} separate stretches; gaps contain no confirmed readings.` : ""}` : "No confirmed observations yet.";
  const state = preparing ? "Starting · waiting for first observation" : !live ? samples.length ? "Recent session · historical" : "Waiting for a session" : delayed ? "Signal interrupted · gaps preserved" : samples.length < 2 ? "Warming up" : "Live observations";
  const inspect = (key: string) => {
    const index = samples.findIndex((sample) => sample.time === selectedTime);
    const next = key === "Home" ? 0 : key === "End" ? samples.length - 1 : key === "ArrowLeft" ? Math.max(0, (index < 0 ? samples.length : index) - 1) : Math.min(samples.length - 1, index + 1);
    setSelectedTime(samples[next]?.time ?? null);
  };
  return <section className="live-performance" aria-labelledby={`${id}-title`} data-history-state={preparing ? "warming" : live ? delayed ? "interrupted" : "live" : "historical"}>
    <div className="performance-heading"><div><h3 id={`${id}-title`}>Performance <span>10-second average</span></h3><p>{state}</p></div><span className="performance-window">RECENT 2 MIN</span></div>
    <div ref={plot} className="performance-plot" role="group" aria-label="Hashrate observation inspection" aria-describedby={`${id}-summary ${id}-keys`} tabIndex={samples.length ? 0 : undefined}
      onKeyDown={(event) => { if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) { event.preventDefault(); inspect(event.key); } if (event.key === "Escape") setSelectedTime(null); }}
      onBlur={() => setSelectedTime(null)} onPointerLeave={() => setSelectedTime(null)}
      onPointerMove={(event) => { const box = event.currentTarget.getBoundingClientRect(); const time = start + (event.clientX - box.left - 52) / (width - 72) * HISTORY_WINDOW_MS; const nearest = samples.reduce<typeof samples[number] | null>((a, b) => a === null || Math.abs(b.time - time) < Math.abs(a.time - time) ? b : a, null); setSelectedTime(nearest?.time ?? null); }}>
      <svg viewBox={`0 0 ${width} 156`} preserveAspectRatio="none" role="img" aria-label="Recent observed hashrate, 10-second averages. Blank areas have no confirmed readings.">
        {[0, .5, 1].map((fraction) => <g key={fraction}><line className="performance-guide" x1="52" x2={width - 20} y1={y(max * fraction)} y2={y(max * fraction)} />{samples.length > 0 && <text x="0" y={y(max * fraction) - 7}>{formatHashrate(max * fraction)}</text>}</g>)}
        {[0, .5, 1].map((fraction) => <text className={fraction === .5 ? "performance-middle-tick" : undefined} key={fraction} x={52 + (width - 72) * fraction} y="150" textAnchor={fraction === 0 ? "start" : "end"}>{timeLabel(start + HISTORY_WINDOW_MS * fraction)}</text>)}
        {groups.map((group) => <g key={`${group[0].time}-${group[0].segment}`}><polyline className="performance-line" points={group.map((s) => `${x(s.time)},${y(s.rate)}`).join(" ")} />{group.map((s) => <circle className="performance-point" key={s.time} cx={x(s.time)} cy={y(s.rate)} r="2.4" />)}</g>)}
        {selected && <g><line className="performance-cursor" x1={x(selected.time)} x2={x(selected.time)} y1="20" y2="122" /><circle className="performance-selection" cx={x(selected.time)} cy={y(selected.rate)} r="4" /></g>}
      </svg>
      {!samples.length && <div className="performance-empty"><strong>{live || preparing ? "Listening for the first reading" : "A quiet workspace, ready when you are"}</strong><span>{live || preparing ? "Confirmed engine observations will appear here." : "Your session’s performance will take shape here."}</span></div>}
    </div>
    <div className="performance-footer"><p id={`${id}-summary`}>{range}</p><output aria-live="polite">{selected ? `${timeLabel(selected.time)} · ${formatHashrate(selected.rate)}` : ""}</output></div>
    <span className="sr-only" id={`${id}-keys`}>Focus the plot. Left and right arrows inspect actual observations; Home and End select first and latest. Escape clears inspection. Time gaps are not interpolated.</span>
  </section>;
}
