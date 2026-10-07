export type DeviceStatusTone = "neutral" | "positive" | "pending" | "attention";
export function deviceStatusPresentation(state: string | null): { label: string; tone: DeviceStatusTone };
