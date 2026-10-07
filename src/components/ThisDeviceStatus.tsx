import { deviceStatusPresentation } from "../deviceStatus.mjs";

export function ThisDeviceStatus({ deviceName, cpuPercent, miningState, statusUnavailable = false }: { deviceName: string | null; cpuPercent: number | null; miningState: string | null; statusUnavailable?: boolean }) {
  const presentation = deviceStatusPresentation(miningState);
  const isStaleKnownState = statusUnavailable && miningState !== "unavailable" && miningState !== null;
  const label = isStaleKnownState ? `${presentation.label} · updates delayed` : presentation.label;
  const tone = isStaleKnownState && presentation.tone === "positive" ? "pending" : presentation.tone;
  return (
    <section className="device-status" aria-label="This device status" aria-live="polite">
      <div className="device-status-copy">
        <span className="device-status-title">This device</span>
        {deviceName && <span className="device-name" title={deviceName}>{deviceName}</span>}
        <span className={`device-status-state${tone === "positive" ? " is-positive" : ""}${tone === "pending" ? " is-pending" : ""}${tone === "attention" ? " is-attention" : ""}`}><span className="device-status-led" aria-hidden="true" />{label}</span>
        <span className="device-cpu">CPU {cpuPercent === null ? "unavailable" : `${Math.round(cpuPercent)}%`}</span>
      </div>
    </section>
  );
}
