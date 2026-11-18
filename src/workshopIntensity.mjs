/** Session-local visual metaphor only. Never a measure of results or earnings. */
export function initialIntensity() {
  return { key: null, samples: [], lastTime: null, baseline: null, ratio: 1, level: "steady", candidate: null, dwell: 0, responsive: false, active: false };
}

/** A stalled status request must not keep old visual evidence alive indefinitely. */
export function telemetryExpiryDelay(session, now = Date.now()) {
  if (session?.state !== "mining" || session.telemetryFreshness !== "fresh") return null;
  const stamp = session.telemetry?.sampleTimeUnixMs;
  return Number.isFinite(stamp) && stamp > 0 && stamp <= now ? Math.max(0, 5001 - (now - stamp)) : 5001;
}

export function stepIntensity(previous, { session, key, unavailable = false, reducedMotion = false, now = Date.now() }) {
  const rate = session?.telemetry?.shortHashrate;
  const active = !unavailable && session?.state === "mining" && !session.startupStage && session.telemetryFreshness === "fresh" && Number.isFinite(rate) && rate > 0;
  if (!active || reducedMotion) return initialIntensity();
  const stamp = session.telemetry.sampleTimeUnixMs;
  const validTime = Number.isFinite(stamp) && stamp > 0 && stamp <= now && now - stamp <= 5000;
  let state = previous.key === key ? previous : initialIntensity();
  if (!validTime) return { ...initialIntensity(), key, active: true };
  if (state.lastTime !== null && stamp === state.lastTime) return { ...state, active: true };
  if (state.lastTime !== null && (stamp < state.lastTime || stamp - state.lastTime > 5000)) state = initialIntensity();
  const samples = [...state.samples, { time: stamp, rate }].filter((s) => stamp - s.time <= 60000).slice(-64);
  let baseline = state.baseline;
  if (baseline === null && samples.length >= 12 && stamp - samples[0].time >= 30000) {
    const sorted = samples.map((s) => s.rate).sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    if (samples.every((s) => Math.abs(s.rate / median - 1) <= .15)) baseline = median;
  }
  if (baseline === null) return { ...initialIntensity(), key, samples, lastTime: stamp, active: true };
  // Bound the ratio before smoothing; one outlier cannot race the machinery.
  const ratio = state.ratio + .25 * (Math.max(.5, Math.min(1.5, rate / baseline)) - state.ratio);
  const level = state.level;
  const target = level === "lively" ? ratio < 1.08 ? "steady" : "lively"
    : level === "gentle" ? ratio > .92 ? "steady" : "gentle"
      : ratio > 1.18 ? "lively" : ratio < .82 ? "gentle" : "steady";
  const dwell = target === level ? 0 : state.candidate === target ? state.dwell + 1 : 1;
  const nextLevel = dwell >= 3 ? target : level;
  return { key, samples, lastTime: stamp, baseline, ratio, level: nextLevel, candidate: target, dwell: nextLevel !== level ? 0 : dwell, responsive: true, active: true };
}

export function intensityMotion(state) {
  return !state.active ? { fps: 4, seconds: 4, level: "inactive" }
    : state.level === "lively" ? { fps: 6, seconds: 2.4, level: "lively" }
      : state.level === "gentle" ? { fps: 4, seconds: 4.8, level: "gentle" }
        : { fps: 5, seconds: 3.6, level: "steady" };
}
