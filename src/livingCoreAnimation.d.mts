export function createFramePlayer(options: {
  frames: number;
  fps: number;
  loop: boolean;
  onFrame: (frame: number) => void;
}): { setRunning: (running: boolean) => void; dispose: () => void };
