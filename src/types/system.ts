export type ActivityState = "active" | "idle" | "unknown";
export type PowerSource = "external" | "battery" | "notApplicable" | "unknown";

export interface SystemSnapshot {
  deviceName: string | null;
  os: string | null;
  cpu: {
    model: string | null;
    logicalProcessors: number | null;
    usagePercent: number | null;
  };
  memory: {
    usedBytes: number | null;
    totalBytes: number | null;
    usagePercent: number | null;
  };
  uptimeSeconds: number | null;
  power: {
    source: PowerSource;
    batteryPercent: number | null;
  };
  activity: {
    idleSeconds: number | null;
    state: ActivityState;
  };
  sampledAtUnixMs: number | null;
}
