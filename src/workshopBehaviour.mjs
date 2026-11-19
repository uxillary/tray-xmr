/** Deterministic ambient movement, unrelated to individual hashes or results. */
export const WORKSHOP = Object.freeze({ restX: 78, workX: 200, minX: 70, maxX: 204, groundY: 118, fps: 4 });
export function staticWorkshopPose(view) {
  return { x: view.activeWork || view.lifecycle === "stopping" ? WORKSHOP.workX : WORKSHOP.restX, tick: 0, frame: view.lifecycle === "error" || view.pose === "miningQuiet" || view.lifecycle === "unavailable" ? 3 : view.activeWork ? 2 : 0, phase: "still", facing: 1 };
}
export function stepWorkshop(previous, view) {
  const tick = previous.tick + 1;
  const cycle = tick % 96;
  let target = WORKSHOP.restX;
  let phase = "rest";
  if (view.lifecycle === "starting") { target = tick <= 2 ? previous.x : WORKSHOP.workX; phase = tick <= 2 ? "notice" : "prepare"; }
  else if (view.activeWork) { target = cycle >= 60 && cycle < 76 ? WORKSHOP.workX - 16 : WORKSHOP.workX; phase = target < WORKSHOP.workX ? "inspect" : "tend"; }
  else if (view.lifecycle === "stopped") { target = WORKSHOP.restX; phase = "settle"; }
  else if (view.lifecycle === "stopping") { target = tick <= 2 ? previous.x : WORKSHOP.restX; phase = "return"; }
  else if (view.lifecycle === "ready") { target = tick % 64 >= 40 && tick % 64 < 48 ? WORKSHOP.restX + 16 : WORKSHOP.restX; }
  else return { ...previous, tick, frame: view.lifecycle === "error" || view.pose === "miningQuiet" || view.lifecycle === "unavailable" ? 3 : 0, phase: "paused" };
  // Integer footfalls, a shorter final step, and no CSS interpolation between pixels.
  const delta = Math.sign(target - previous.x) * Math.min(6, Math.abs(target - previous.x));
  const x = Math.max(WORKSHOP.minX, Math.min(WORKSHOP.maxX, previous.x + delta));
  const arrived = !delta && previous.phase === "walk";
  if (arrived) phase = "turn";
  // Reach, hold, release, rest. Two gestures separated by different observation pauses.
  const gesture = cycle < 28 ? cycle % 14 : cycle < 48 ? (cycle - 28) % 20 : 12;
  const reaching = phase === "tend" && gesture >= 3 && gesture <= 6;
  return { x, tick, frame: delta ? tick % 2 : phase === "inspect" ? 3 : reaching ? 2 : phase === "prepare" && cycle % 16 < 3 ? 1 : 0, phase: delta ? "walk" : phase, facing: delta && !view.activeWork ? Math.sign(delta) : 1 };
}
/** One cancellable timer; retarget from current position on rapid lifecycle changes. */
export function createWorkshopPlayer({ view, onFrame, schedule = setTimeout, cancel = clearTimeout }) {
  let currentView = view;
  let current = staticWorkshopPose(view);
  let timer = null;
  let running = false;
  let disposed = false;
  let fps = WORKSHOP.fps;
  const queue = () => {
    const settling = currentView.lifecycle === "stopped" && (current.x !== WORKSHOP.restX || ["walk", "turn", "withdraw"].includes(current.phase));
    if (!running || disposed || (!currentView.animate && !settling)) return;
    timer = schedule(() => { timer = null; if (!running || disposed) return; current = stepWorkshop(current, currentView); onFrame(current); queue(); }, 1000 / fps);
  };
  const clear = () => { if (timer !== null) cancel(timer); timer = null; };
  return {
    setIntensity(nextFps) { const next = Number.isFinite(nextFps) ? Math.max(4, Math.min(6, nextFps)) : 4; if (disposed || next === fps) return; fps = next; clear(); queue(); },
    setView(next) {
      if (disposed) return;
      const changed = next.pose !== currentView.pose || next.animate !== currentView.animate;
      currentView = next;
      if (changed) { current = { ...current, tick: 0, phase: next.lifecycle === "starting" ? "notice" : "withdraw", frame: next.animate ? current.frame : staticWorkshopPose(next).frame }; clear(); onFrame(current); queue(); }
    },
    setRunning(next) { if (disposed || next === running) return; running = next; clear(); if (running) queue(); },
    dispose() { disposed = true; running = false; clear(); },
  };
}
