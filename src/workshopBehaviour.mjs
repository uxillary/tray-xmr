/** Deterministic ambient movement, unrelated to individual hashes or results. */
export const WORKSHOP = Object.freeze({ restX: 78, workX: 200, minX: 70, maxX: 204, groundY: 118, fps: 4 });
export function staticWorkshopPose(view) {
  return { x: view.activeWork || view.lifecycle === "stopping" ? WORKSHOP.workX : WORKSHOP.restX, tick: 0, frame: view.lifecycle === "error" || view.pose === "miningQuiet" || view.lifecycle === "unavailable" ? 3 : view.activeWork ? 2 : 0, phase: "still", facing: 1 };
}
export function stepWorkshop(previous, view) {
  const tick = previous.tick + 1;
  let target = WORKSHOP.restX;
  let phase = "rest";
  if (view.lifecycle === "starting") { target = WORKSHOP.workX; phase = "prepare"; }
  else if (view.activeWork) { target = tick % 64 >= 40 && tick % 64 < 48 ? WORKSHOP.workX - 16 : WORKSHOP.workX; phase = target < WORKSHOP.workX ? "inspect" : "tend"; }
  else if (view.lifecycle === "stopped") { target = WORKSHOP.restX; phase = "settle"; }
  else if (view.lifecycle === "stopping") { target = tick <= 2 ? previous.x : WORKSHOP.restX; phase = "return"; }
  else if (view.lifecycle === "ready") { target = tick % 64 >= 40 && tick % 64 < 48 ? WORKSHOP.restX + 16 : WORKSHOP.restX; }
  else return { ...previous, tick, frame: view.lifecycle === "error" || view.pose === "miningQuiet" || view.lifecycle === "unavailable" ? 3 : 0, phase: "paused" };
  const delta = Math.sign(target - previous.x) * Math.min(8, Math.abs(target - previous.x));
  const x = Math.max(WORKSHOP.minX, Math.min(WORKSHOP.maxX, previous.x + delta));
  return { x, tick, frame: delta ? tick % 2 : phase === "inspect" ? 3 : phase === "tend" && tick % 6 < 4 ? 2 : 0, phase: delta ? "walk" : phase, facing: delta ? Math.sign(delta) : 1 };
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
    if (!running || disposed || (!currentView.animate && !(currentView.lifecycle === "stopped" && current.x !== WORKSHOP.restX))) return;
    timer = schedule(() => { timer = null; if (!running || disposed) return; current = stepWorkshop(current, currentView); onFrame(current); queue(); }, 1000 / fps);
  };
  const clear = () => { if (timer !== null) cancel(timer); timer = null; };
  return {
    setIntensity(nextFps) { const next = Number.isFinite(nextFps) ? Math.max(4, Math.min(6, nextFps)) : 4; if (disposed || next === fps) return; fps = next; clear(); queue(); },
    setView(next) {
      if (disposed) return;
      const changed = next.pose !== currentView.pose;
      currentView = next;
      if (changed) { current = { ...current, tick: 0, frame: next.animate ? 0 : staticWorkshopPose(next).frame }; clear(); onFrame(current); queue(); }
    },
    setRunning(next) { if (disposed || next === running) return; running = next; clear(); if (running) queue(); },
    dispose() { disposed = true; running = false; clear(); },
  };
}
