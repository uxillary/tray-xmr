/** Observed XMRig 10-second averages. Memory only; never resample or interpolate. */
export const HISTORY_WINDOW_MS = 120_000;
export const HISTORY_MAX_SAMPLES = 128;
export const HISTORY_GAP_MS = 5_000;
const active = new Set(["starting", "mining", "paused"]);
const known = new Set(["notConfigured", "ready", "starting", "mining", "paused", "stopping", "stopped", "error"]);

export function initialHistory() {
  return { samples: [], processId: null, lifecycle: null, lastTime: null, segment: 0, breakPending: true, endTime: null };
}

export function observeHashrate(previous, session, { unavailable = false, now = Date.now() } = {}) {
  let state = previous;
  const lifecycle = session?.state;
  const confirmed = !unavailable && known.has(lifecycle);
  if (confirmed) {
    const starting = lifecycle === "starting" && previous.lifecycle !== "starting";
    const resumed = active.has(lifecycle) && previous.lifecycle !== null && !active.has(previous.lifecycle);
    const changedProcess = session.processId != null && previous.processId != null && session.processId !== previous.processId;
    if (starting || resumed || changedProcess) {
      // Keep the timestamp watermark: a new lifecycle must not reattribute a cached old sample.
      state = { ...initialHistory(), lastTime: previous.lastTime, segment: previous.segment + 1 };
    }
    state = { ...state, lifecycle, processId: session.processId ?? (active.has(lifecycle) ? state.processId : null) };
  }
  const live = confirmed && lifecycle === "mining" && !session.startupStage;
  const endTime = active.has(lifecycle) ? Math.max(state.endTime ?? now, now) : state.endTime ?? now;
  const samples = state.samples.filter((sample) => endTime - sample.time <= HISTORY_WINDOW_MS).slice(-HISTORY_MAX_SAMPLES);
  state = { ...state, samples, endTime };
  const time = session?.telemetry?.sampleTimeUnixMs;
  const rate = session?.telemetry?.shortHashrate;
  const valid = live && session.telemetryFreshness === "fresh" && Number.isSafeInteger(time) && time > 0 && time <= now && now - time <= HISTORY_GAP_MS && Number.isFinite(rate) && rate >= 0;
  if (!valid) return { ...state, breakPending: true };
  if (state.lastTime !== null && time <= state.lastTime) {
    return time < state.lastTime ? { ...state, breakPending: true } : state;
  }
  const split = state.breakPending || state.lastTime !== null && time - state.lastTime > HISTORY_GAP_MS;
  const segment = state.segment + (split ? 1 : 0);
  return { ...state, segment, lastTime: time, breakPending: false, samples: [...samples, { time, rate, segment }].slice(-HISTORY_MAX_SAMPLES) };
}

/** Straight segments between actual observations; gaps are separate paths. */
export function historySegments(samples) {
  const groups = [];
  for (const sample of samples) {
    if (!groups.length || groups[groups.length - 1][0].segment !== sample.segment) groups.push([]);
    groups[groups.length - 1].push(sample);
  }
  return groups;
}
