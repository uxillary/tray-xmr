const presentations = {
  unavailable: { label: "Status unavailable", tone: "attention" },
  notConfigured: { label: "Not configured", tone: "neutral" },
  ready: { label: "Ready", tone: "positive" },
  starting: { label: "Starting", tone: "pending" },
  mining: { label: "Mining", tone: "positive" },
  paused: { label: "Paused", tone: "pending" },
  stopping: { label: "Stopping", tone: "pending" },
  stopped: { label: "Stopped", tone: "neutral" },
  error: { label: "Needs attention", tone: "attention" },
};

export function deviceStatusPresentation(state) {
  if (state === null || state === undefined) return { label: "Checking status", tone: "neutral" };
  return presentations[state] ?? { label: "Status unavailable", tone: "neutral" };
}
