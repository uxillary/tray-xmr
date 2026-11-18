export function presentEmberEvent(event) {
  const { type, data } = event.kind;
  switch (type) {
    case "sessionStarting":
      return { marker: "SYSTEM", message: "Preparing mining session", icon: "engine" };
    case "miningStarted":
      return { marker: "ENGINE", message: "Mining started", icon: "engine" };
    case "miningStopped":
      return {
        marker: "SYSTEM",
        message: data.reason === "contributionSwitch" ? "Switching developer fee wallet" : data.reason === "startupCancelled" ? "Mining startup stopped" : "Mining stopped",
        icon: "stop",
      };
    case "miningFailed":
      if (data.failure === "unexpectedEngineExit") return { marker: "ERROR", message: "Mining engine stopped unexpectedly", icon: "warning" };
      if (data.failure === "stopFailed") return { marker: "ERROR", message: "Ember couldn’t stop the mining engine", icon: "warning" };
      return { marker: "WARNING", message: "Mining couldn’t start", icon: "warning" };
    case "poolConnectionChanged":
      return data.to === "connected"
        ? { marker: "POOL", message: data.from === "disconnected" ? "Pool connection restored" : "Pool connection established", icon: "pool" }
        : { marker: "POOL", message: "Pool connection lost", icon: "pool" };
    case "resultsAccepted":
      return { marker: "ACCEPTED", message: data.count === 1 ? "Result accepted" : `${data.count} results accepted`, icon: "accepted" };
    case "resultsRejected":
      return { marker: "REJECTED", message: data.count === 1 ? "Result rejected" : `${data.count} results rejected`, icon: "warning" };
    default:
      return { marker: "SYSTEM", message: "Mining activity updated", icon: "engine" };
  }
}

export function formatEmberEventTime(timestamp) {
  const date = new Date(timestamp);
  if (!Number.isFinite(timestamp) || Number.isNaN(date.getTime())) return "--:--:--";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

/** Preserve backend ordering; never derive events from measurements or timestamps. */
export function streamUpdate(events, previousId, following) {
  const latest = events.at(-1)?.id ?? null;
  if (latest === previousId || latest === null) return { added: 0, follow: following };
  const previousIndex = events.findIndex((event) => event.id === previousId);
  return { added: previousId === null ? 0 : previousIndex < 0 ? events.length : events.length - previousIndex - 1, follow: following };
}

/** Copy only known structured fields; never serialize arbitrary payload keys. */
export function eventContext(event) {
  const { type, data } = event.kind;
  const oneOf = (value, allowed) => allowed.includes(value) ? value : "unavailable";
  if (type === "miningStarted" || type === "sessionStarting") return {
    profile: oneOf(data.profile, ["quiet", "balanced", "performance"]),
    configuredThreads: Number.isSafeInteger(data.configuredThreads) && data.configuredThreads >= 0 ? data.configuredThreads : null,
  };
  if (type === "miningStopped") return { reason: oneOf(data.reason, ["owner", "applicationQuit", "startupCancelled", "contributionSwitch"]), wasMining: data.wasMining === true };
  if (type === "miningFailed") return { failure: oneOf(data.failure, ["startup", "unexpectedEngineExit", "stopFailed"]) };
  if (type === "poolConnectionChanged") return { from: oneOf(data.from, ["connected", "disconnected", "unknown"]), to: oneOf(data.to, ["connected", "disconnected", "unknown"]) };
  if (type === "resultsAccepted" || type === "resultsRejected") return { count: Number.isSafeInteger(data.count) && data.count >= 0 ? data.count : null };
  return {};
}

export function eventExplanation(event) {
  if (event.kind.type === "miningFailed") return event.kind.data.failure === "stopFailed" ? "Check the session before closing Ember; the engine may still be running." : "Open Diagnostics for startup and engine evidence.";
  if (event.kind.type === "poolConnectionChanged" && event.kind.data.to === "disconnected") return "The pool is unreachable. Watch for a restored connection.";
  if (event.kind.type === "resultsRejected") return "The pool declined this submission. This does not indicate earnings.";
  return null;
}
