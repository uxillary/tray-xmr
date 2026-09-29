export type EmberCoreState = "not-configured" | "ready" | "mining" | "paused" | "warning" | "inactive";

export function EmberCore({ state, compact = false }: { state: EmberCoreState; compact?: boolean }) {
  return (
    <div className={`ember-core ember-core--${state}${compact ? " ember-core--compact" : ""}`} aria-hidden="true">
      <span className="core-halo" />
      <span className="core-orbit core-orbit--outer" />
      <span className="core-orbit core-orbit--inner" />
      <span className="core-disc"><span className="core-disc-inner"><img src="/ember-mark.svg" alt="" /></span></span>
    </div>
  );
}
