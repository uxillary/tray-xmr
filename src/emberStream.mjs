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
        message: data.reason === "startupCancelled" ? "Mining startup stopped" : "Mining stopped",
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
