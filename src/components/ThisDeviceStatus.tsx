export function ThisDeviceStatus({ deviceName, cpuPercent }: { deviceName: string | null; cpuPercent: number | null }) {
  return (
    <section className="device-status" aria-label="This device status" aria-live="polite">
      <div className="device-status-copy">
        <span className="device-status-title">This device</span>
        {deviceName && <span className="device-name" title={deviceName}>{deviceName}</span>}
        <span className="device-status-state"><span className="device-status-led" aria-hidden="true" />Not mining</span>
        <span className="device-cpu">CPU {cpuPercent === null ? "—" : `${Math.round(cpuPercent)}%`}</span>
      </div>
    </section>
  );
}
