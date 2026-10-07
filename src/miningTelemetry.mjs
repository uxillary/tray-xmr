const activeStates = new Set(["mining", "paused"]);

export function formatHashrate(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return null;
  if (value === 0) return "0 H/s";
  if (value < 0.05) return "<0.1 H/s";

  const units = ["H/s", "kH/s", "MH/s"];
  let scaled = value;
  let unit = 0;
  while (scaled >= 1000 && unit < units.length - 1) {
    scaled /= 1000;
    unit += 1;
  }
  let precision = unit === 0 || scaled < 100 ? 1 : 0;
  if (Number(scaled.toFixed(precision)) >= 1000 && unit < units.length - 1) {
    scaled /= 1000;
    unit += 1;
    precision = scaled < 100 ? 1 : 0;
  }
  return `${scaled.toFixed(precision).replace(/\.0$/, "")} ${units[unit]}`;
}

export function formatSessionDuration(seconds) {
  if (!Number.isSafeInteger(seconds) || seconds < 0) return null;
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (minutes < 60) return remainder === 0 ? `${minutes}m` : `${minutes}m ${remainder}s`;
  const hours = Math.floor(minutes / 60);
  const leftoverMinutes = minutes % 60;
  if (hours < 24) return leftoverMinutes === 0 ? `${hours}h` : `${hours}h ${leftoverMinutes}m`;
  const days = Math.floor(hours / 24);
  const leftoverHours = hours % 24;
  return leftoverHours === 0 ? `${days}d` : `${days}d ${leftoverHours}h`;
}

export function miningTelemetryViewModel(session, setup) {
  const telemetry = session?.telemetry ?? null;
  const freshness = session?.telemetryFreshness ?? "unavailable";
  const state = session?.state ?? "unavailable";
  const connectedState = telemetry?.poolConnection?.state ?? null;
  const rate = telemetry?.shortHashrate ?? null;
  const hashrate = formatHashrate(rate);
  const threads = setup?.threads ?? null;
  const logicalProcessors = setup?.logicalProcessors ?? null;
  const configuredCapacityKnown = Number.isInteger(threads)
    && Number.isInteger(logicalProcessors)
    && threads >= 0
    && logicalProcessors > 0;
  const lanes = configuredCapacityKnown
    ? Math.min(32, logicalProcessors)
    : 0;
  const filledLanes = configuredCapacityKnown && threads > 0
    ? Math.max(1, Math.round((Math.min(threads, logicalProcessors) / logicalProcessors) * lanes))
    : 0;

  return {
    state,
    stateLabel: state === "notConfigured" ? "Not configured" : state === "unavailable" ? "Status unavailable" : state[0].toUpperCase() + state.slice(1),
    isSessionActive: activeStates.has(state),
    freshness,
    freshnessLabel: freshness === "fresh" ? "Live telemetry" : freshness === "stale" ? "Updates delayed" : state === "starting" ? "Waiting for miner data" : state === "error" ? "Telemetry unavailable" : "No active session",
    hashrate,
    hashrateLabel: hashrate ?? (state === "starting" ? "—" : "Unavailable"),
    hashrateDetail: freshness === "stale" && hashrate !== null ? "Last reported · 10-second window" : "10-second average",
    accepted: telemetry?.results?.accepted ?? null,
    rejected: telemetry?.results?.rejected ?? null,
    poolState: connectedState,
    poolLabel: connectedState ? connectedState[0].toUpperCase() + connectedState.slice(1) : state === "starting" ? "—" : "Unavailable",
    sessionDuration: formatSessionDuration(session?.sessionDurationSeconds),
    profile: setup?.profile ?? null,
    threads,
    logicalProcessors,
    capacityKnown: configuredCapacityKnown,
    lanes: Array.from({ length: lanes }, (_, index) => index < filledLanes),
    cpuActivity: rate === null ? "Waiting for rate data" : rate > 0 ? "Hashing observed" : "No recent hashing reported",
    acceptedDifficulty: telemetry?.results?.acceptedDifficultyTotal ?? null,
    currentJobDifficulty: telemetry?.poolConnection?.currentJobDifficulty ?? telemetry?.results?.currentJobDifficulty ?? null,
    algorithm: telemetry?.poolConnection?.algorithm ?? null,
    shortHashrate: telemetry?.shortHashrate ?? null,
    mediumHashrate: telemetry?.mediumHashrate ?? null,
    longHashrate: telemetry?.longHashrate ?? null,
    hugePages: telemetry?.cpuHugePages ?? null,
  };
}
