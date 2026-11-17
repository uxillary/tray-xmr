import type { MiningReadiness, MiningSessionStatus } from "./components/MiningSetup";

export type LivingCoreLifecycle = MiningSessionStatus["state"];
export type LivingCorePose = LivingCoreLifecycle | "miningQuiet";
export type LivingCoreView = {
  lifecycle: LivingCoreLifecycle;
  pose: LivingCorePose;
  label: string;
  freshness: MiningSessionStatus["telemetryFreshness"];
  qualifier: string | null;
  activeWork: boolean;
  animate: boolean;
};
export function livingCoreState(input?: {
  session?: Pick<MiningSessionStatus, "state" | "startupStage" | "telemetry" | "telemetryFreshness"> | null;
  statusUnavailable?: boolean;
  readiness?: Pick<MiningReadiness, "ready"> | null;
}): LivingCoreView;
