export type EmberEventKind =
  | { type: "sessionStarting" | "miningStarted"; data: { profile: "quiet" | "balanced" | "performance"; configuredThreads: number | null } }
  | { type: "miningStopped"; data: { reason: "owner" | "applicationQuit" | "startupCancelled"; wasMining: boolean } }
  | { type: "miningFailed"; data: { failure: "startup" | "unexpectedEngineExit" | "stopFailed" } }
  | { type: "poolConnectionChanged"; data: { from: "connected" | "disconnected" | "unknown"; to: "connected" | "disconnected" | "unknown" } }
  | { type: "resultsAccepted" | "resultsRejected"; data: { count: number } };

export type EmberEvent = {
  id: string;
  occurredAtUnixMs: number;
  sessionId: string;
  category: "system" | "pool" | "result";
  severity: "informational" | "success" | "notice" | "warning" | "error";
  source: "emberLifecycle" | "xmrigSummary";
  kind: EmberEventKind;
};

export function presentEmberEvent(event: EmberEvent): { marker: string; message: string; icon: "engine" | "stop" | "warning" | "pool" | "accepted" };
export function formatEmberEventTime(timestamp: number): string;
