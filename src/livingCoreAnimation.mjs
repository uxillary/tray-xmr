/** Low-rate, cancellable frame player. No animation frame loop or work while paused. */
export function createFramePlayer({ frames, fps, loop, onFrame, schedule = setTimeout, cancel = clearTimeout }) {
  let frame = 0;
  let timer = null;
  let disposed = false;
  let running = false;
  const playable = Number.isInteger(frames) && frames > 1 && Number.isFinite(fps) && fps >= 4 && fps <= 8;
  const queue = () => {
    if (!running || disposed || !playable || (!loop && frame === frames - 1)) return;
    timer = schedule(() => {
      timer = null;
      if (!running || disposed) return;
      frame = (frame + 1) % frames;
      onFrame(frame);
      queue();
    }, 1000 / fps);
  };
  return {
    setRunning(next) {
      if (disposed || running === next) return;
      running = next;
      if (timer !== null) cancel(timer);
      timer = null;
      if (running) queue();
    },
    dispose() {
      disposed = true;
      running = false;
      if (timer !== null) cancel(timer);
      timer = null;
    },
  };
}
