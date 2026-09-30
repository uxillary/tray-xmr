export function ThisDeviceStatus({ deviceName, cpuPercent, miningState }: { deviceName: string | null; cpuPercent: number | null; miningState: string | null }) {
  const active = miningState === "starting" || miningState === "mining" || miningState === "paused" || miningState === "stopping";
  const label = miningState === "starting" ? "Starting" : miningState === "paused" ? "Paused" : active ? "Mining" : "Not mining";
  return (
    <section className="device-status" aria-label="This device status" aria-live="polite">
      <div className="device-status-copy">
        <span className="device-status-title">This device</span>
        {deviceName && <span className="device-name" title={deviceName}>{deviceName}</span>}
        <span className={`device-status-state${active ? " is-mining" : ""}`}><span className="device-status-led" aria-hidden="true" />{label}</span>
        <span className="device-cpu">CPU {cpuPercent === null ? "—" : `${Math.round(cpuPercent)}%`}</span>
      </div>
    </section>
  );
}
