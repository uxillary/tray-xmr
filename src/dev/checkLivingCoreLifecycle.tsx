import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { OverviewPage } from "../App";
import { MiningSessionTelemetry } from "../components/MiningTelemetry";
import type { MiningReadiness, MiningSessionStatus } from "../components/MiningSetup";

/** Browser-only integration test: real React effects/observers, synthetic data, no IPC. */
export async function checkLivingCoreLifecycle(host: HTMLElement, session: MiningSessionStatus, setup: MiningReadiness) {
  const schedule = window.setTimeout;
  const cancel = window.clearTimeout;
  const pending = new Set<number>();
  const checks: string[] = [];
  let maximum = 0;
  let callbacks = 0;
  let unmounted = false;
  const pause = (ms: number) => new Promise<void>((resolve) => schedule(resolve, ms));
  const waitFor = async (condition: () => boolean, label: string) => {
    for (let attempt = 0; attempt < 60; attempt++) {
      if (condition()) return;
      await pause(50);
    }
    throw new Error(label);
  };
  // Instrument only the authored frame delays. Test waits use the original clock.
  // Wrappers are restored even if an assertion fails; this route never mounts App.
  window.setTimeout = ((handler: TimerHandler, delay?: number, ...args: unknown[]) => {
    if (typeof handler !== "function" || ![1000/4, 1000/6, 1000/8].includes(delay ?? 0)) return schedule(handler, delay, ...args);
    const id = schedule(() => { pending.delete(id); callbacks++; handler(...args); }, delay);
    pending.add(id);
    maximum = Math.max(maximum, pending.size);
    return id;
  }) as typeof window.setTimeout;
  window.clearTimeout = ((id?: number) => { if (id !== undefined) pending.delete(id); cancel(id); }) as typeof window.clearTimeout;
  const root = createRoot(host);
  const confirm = async (label: string, expected: number) => {
    await waitFor(() => pending.size === expected, `${label}: expected ${expected} pending timer, found ${pending.size}`);
    if (maximum > 1) throw new Error(`Duplicate animation timers: peak ${maximum}`);
    checks.push(label);
  };
  try {
    const render = async (page: "overview" | "mining", current = session, reduced = false, failed = false) => {
      root.render(<StrictMode>{page === "overview"
        ? <OverviewPage session={current} setup={setup} statusError={false} sessionStatusUnavailable={failed} systemSnapshot={null} openMining={() => {}} reducedMotion={reduced} />
        : <MiningSessionTelemetry session={current} setup={setup} statusUnavailable={failed} reducedMotion={reduced} onStop={() => {}} />}</StrictMode>);
      await pause(100);
      await waitFor(() => host.querySelector('[data-asset-status="ready"]') !== null, "Artwork did not load");
      host.querySelector(".living-core")?.scrollIntoView({ block: "center" });
      await pause(150);
    };
    for (const page of ["overview", "mining", "overview", "mining"] as const) {
      await render(page);
      await confirm(`${page} mount/switch`, 1);
    }
    const first = host.querySelector(".living-core-viewport")?.getAttribute("data-frame");
    await waitFor(() => host.querySelector(".living-core-viewport")?.getAttribute("data-frame") !== first, "Frames did not advance");
    checks.push("real frame advancement");
    await render("mining", session, true);
    await confirm("reduced motion", 0);
    if (host.querySelector(".living-core-viewport")?.getAttribute("data-frame") !== "0") throw new Error("Reduced motion did not hold frame zero");
    for (const [label, current, failed] of [
      ["stale telemetry", { ...session, telemetryFreshness: "stale" }, false],
      ["failed status polling", session, true],
      ["paused", { ...session, state: "paused" }, false],
      ["stopped", { ...session, state: "stopped" }, false],
    ] as [string, MiningSessionStatus, boolean][]) {
      await render("mining", current, false, failed);
      await confirm(label, 0);
    }
    await render("mining");
    await confirm("resume confirmed work", 1);
    host.style.display = "none";
    await pause(200);
    await confirm("hidden scene", 0);
    host.style.display = "block";
    await confirm("visible scene resumes", 1);
    root.unmount();
    unmounted = true;
    await confirm("unmount cleanup", 0);
    const before = callbacks;
    await pause(300);
    if (callbacks !== before) throw new Error("Animation callback ran after unmount");
    checks.push("no callbacks after unmount");
    return `PASS · ${checks.length} lifecycle checks · maximum ${maximum} pending frame timer · zero after unmount`;
  } finally {
    if (!unmounted) root.unmount();
    for (const id of pending) cancel(id);
    window.setTimeout = schedule;
    window.clearTimeout = cancel;
    host.style.display = "";
  }
}
