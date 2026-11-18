import type { MiningSessionStatus } from "./components/MiningSetup";
export type Intensity = { key: string | null; samples: {time: number; rate: number}[]; lastTime: number | null; baseline: number | null; ratio: number; level: "gentle" | "steady" | "lively"; candidate: string | null; dwell: number; responsive: boolean; active: boolean };
export function initialIntensity(): Intensity;
export function telemetryExpiryDelay(session: MiningSessionStatus | null, now?: number): number | null;
export function stepIntensity(previous: Intensity, input: { session: MiningSessionStatus | null; key: string; unavailable?: boolean; reducedMotion?: boolean; now?: number }): Intensity;
export function intensityMotion(state: Intensity): {fps: number; seconds: number; level: string};
