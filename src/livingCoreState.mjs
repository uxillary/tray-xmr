const lifecycles = new Set(["notConfigured", "ready", "starting", "mining", "paused", "stopping", "stopped", "error", "unavailable"]);
const labels = {
  notConfigured: "Not configured", ready: "Ready", starting: "Starting", mining: "Mining",
  paused: "Paused", stopping: "Stopping", stopped: "Stopped", error: "Needs attention", unavailable: "Status unavailable",
};

/** Rust owns lifecycle; freshness only qualifies the illustration's activity. */
export function livingCoreState({ session = null, statusUnavailable = false, readiness = null } = {}) {
  let lifecycle = "unavailable";
  if (!statusUnavailable) {
    if (session) {
      if (lifecycles.has(session.state)) lifecycle = session.state;
      // Do not let a lingering startup stage overwrite stopping or a terminal state.
      if (session.startupStage && ["notConfigured", "ready", "starting", "mining"].includes(lifecycle)) lifecycle = "starting";
    } else if (readiness) {
      lifecycle = readiness.ready ? "ready" : "notConfigured";
    }
  }
  const freshness = !statusUnavailable && ["fresh", "stale"].includes(session?.telemetryFreshness)
    ? session.telemetryFreshness : "unavailable";
  const rate = session?.telemetry?.shortHashrate;
  const rateKnown = typeof rate === "number" && Number.isFinite(rate) && rate >= 0;
  const activeWork = lifecycle === "mining" && freshness === "fresh" && rateKnown && rate > 0;
  const qualifier = lifecycle !== "mining" ? null
    : freshness === "stale" ? "Updates delayed"
      : freshness === "unavailable" || !session?.telemetry ? "Telemetry unavailable"
        : !rateKnown ? "Waiting for rate data"
          : rate === 0 ? "No recent hashing reported" : "Live telemetry";
  return {
    lifecycle,
    pose: lifecycle === "mining" && !activeWork ? "miningQuiet" : lifecycle,
    label: labels[lifecycle],
    freshness,
    qualifier,
    activeWork,
    animate: activeWork || ["ready", "starting", "stopping"].includes(lifecycle),
  };
}
