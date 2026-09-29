export function ThisDeviceStatus({ state }: { state: string }) {
  return (
    <section className="device-status" aria-label="This device status" aria-live="polite">
      <span className="device-status-led" aria-hidden="true" />
      <div className="device-status-copy">
        <span className="device-status-title">This device</span>
        <span className="device-status-state">{state}</span>
      </div>
    </section>
  );
}
