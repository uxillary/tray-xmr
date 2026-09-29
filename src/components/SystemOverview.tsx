import type { SystemSnapshot } from "../types/system";

const GIB = 1024 ** 3;

export function formatBytesAsGb(bytes: number | null) {
  if (bytes === null) return null;
  const value = bytes / GIB;
  return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: value < 10 ? 1 : 0 }).format(value)} GB`;
}

export function formatDuration(seconds: number | null) {
  if (seconds === null) return null;
  if (seconds < 60) return "Under 1m";
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function SystemOverview({ snapshot }: { snapshot: SystemSnapshot | null }) {
  const cpuPercent = formatPercent(snapshot?.cpu.usagePercent ?? null);
  const usedMemory = formatBytesAsGb(snapshot?.memory.usedBytes ?? null);
  const totalMemory = formatBytesAsGb(snapshot?.memory.totalBytes ?? null);
  const memoryPercent = formatPercent(snapshot?.memory.usagePercent ?? null);
  const idle = snapshot?.activity.idleSeconds ?? null;

  return (
    <section className="system-awareness" aria-labelledby="system-awareness-title">
      <div className="system-heading">
        <h2 id="system-awareness-title">System awareness</h2>
        <span>Local device information</span>
      </div>
      <div className="system-grid">
        <SystemDetail label="Processor" value={snapshot?.cpu.model ?? "Unavailable"} detail={`${countLabel(snapshot?.cpu.logicalProcessors ?? null)} · ${cpuPercent ?? "Usage unavailable"}`} />
        <SystemDetail label="Memory" value={usedMemory && totalMemory ? `${usedMemory} / ${totalMemory}` : "Unavailable"} detail={memoryPercent !== null ? `${memoryPercent} in use` : "Usage unavailable"} />
        <SystemDetail label="Power" value={powerLabel(snapshot)} detail={batteryLabel(snapshot)} />
        <SystemDetail label="Activity" value={activityLabel(snapshot)} detail={activityDetail(snapshot, idle)} />
        <SystemDetail label="Device uptime" value={formatDuration(snapshot?.uptimeSeconds ?? null) ?? "Unavailable"} detail="Since Windows started" />
        <SystemDetail label="Windows" value={snapshot?.os ?? "Unavailable"} detail="Operating system" />
      </div>
    </section>
  );
}

function formatPercent(value: number | null) {
  return value === null ? null : `${Math.round(value)}%`;
}

function countLabel(count: number | null) {
  if (count === null) return "Processor count unavailable";
  return `${count} logical processor${count === 1 ? "" : "s"}`;
}

function powerLabel(snapshot: SystemSnapshot | null) {
  if (!snapshot) return "Unavailable";
  switch (snapshot.power.source) {
    case "external": return "External power";
    case "battery": return "On battery";
    case "notApplicable": return "No system battery";
    case "unknown": return "Unavailable";
  }
}

function batteryLabel(snapshot: SystemSnapshot | null) {
  if (snapshot?.power.source === "notApplicable") return "Battery level not applicable";
  const percent = snapshot?.power.batteryPercent;
  return percent === null || percent === undefined ? "Charge level unavailable" : `${percent}% charge`;
}

function activityLabel(snapshot: SystemSnapshot | null) {
  switch (snapshot?.activity.state) {
    case "active": return "Active";
    case "idle": return "Idle";
    default: return "Unavailable";
  }
}

function activityDetail(snapshot: SystemSnapshot | null, idle: number | null) {
  if (snapshot?.activity.state === "idle") return `Idle for ${formatDuration(idle) ?? "an unknown time"}`;
  if (snapshot?.activity.state === "active") return "Recent input";
  return "Activity status unavailable";
}

function SystemDetail({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <article className="system-detail"><h3>{label}</h3><strong title={value}>{value}</strong><p>{detail}</p></article>;
}

export function systemMetric(snapshot: SystemSnapshot | null) {
  const cpu = formatPercent(snapshot?.cpu.usagePercent ?? null);
  const used = formatBytesAsGb(snapshot?.memory.usedBytes ?? null);
  const total = formatBytesAsGb(snapshot?.memory.totalBytes ?? null);
  return {
    value: cpu ? `${cpu} CPU` : "Unavailable",
    detail: used && total ? `${used} / ${total} memory` : "Memory unavailable",
  };
}
