export type TelemetrySession = {
  state: string;
  sessionDurationSeconds: number | null;
  telemetryFreshness: "unavailable" | "fresh" | "stale";
  telemetry: {
    shortHashrate: number | null;
    mediumHashrate: number | null;
    longHashrate: number | null;
    results: { accepted: number | null; rejected: number | null; acceptedDifficultyTotal: number | null; currentJobDifficulty: number | null } | null;
    poolConnection: { state: "connected" | "disconnected" | "unknown"; algorithm: string | null; currentJobDifficulty: number | null } | null;
    cpuHugePages: { allocated: number; total: number } | null;
  } | null;
} | null;
export type TelemetrySetup = { profile: "quiet" | "balanced" | "performance" | null; threads: number | null; logicalProcessors: number } | null;
export function formatHashrate(value: number | null): string | null;
export function formatSessionDuration(seconds: number | null): string | null;
export function miningTelemetryViewModel(session: TelemetrySession, setup: TelemetrySetup): {
  state: string; stateLabel: string; isSessionActive: boolean; freshness: string; freshnessLabel: string;
  hashrate: string | null; hashrateLabel: string; hashrateDetail: string; accepted: number | null; rejected: number | null;
  poolState: "connected" | "disconnected" | "unknown" | null; poolLabel: string; sessionDuration: string | null;
  profile: "quiet" | "balanced" | "performance" | null; threads: number | null; logicalProcessors: number;
  capacityKnown: boolean; lanes: boolean[]; cpuActivity: string; acceptedDifficulty: number | null;
  currentJobDifficulty: number | null; algorithm: string | null; shortHashrate: number | null;
  mediumHashrate: number | null; longHashrate: number | null; hugePages: { allocated: number; total: number } | null;
};
