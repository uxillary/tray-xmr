import type { MiningSessionStatus } from "./components/MiningSetup";
export type HashrateSample = { time: number; rate: number; segment: number };
export type HashrateHistory = { samples: HashrateSample[]; processId: number | null; lifecycle: string | null; lastTime: number | null; segment: number; breakPending: boolean; endTime: number | null };
export const HISTORY_WINDOW_MS: number;
export const HISTORY_MAX_SAMPLES: number;
export const HISTORY_GAP_MS: number;
export function initialHistory(): HashrateHistory;
export function observeHashrate(previous: HashrateHistory, session: MiningSessionStatus | null, options?: { unavailable?: boolean; now?: number }): HashrateHistory;
export function historySegments(samples: HashrateSample[]): HashrateSample[][];
