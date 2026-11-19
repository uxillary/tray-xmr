import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LivePerformance } from "../components/LivePerformance";
import { useHashrateHistory } from "../hooks/useHashrateHistory";
import type { MiningReadiness, MiningSessionStatus } from "../components/MiningSetup";
import { MiningSessionTelemetry } from "../components/MiningTelemetry";

export async function checkLivePerformance(host: HTMLElement, fixture: MiningSessionStatus, setup: MiningReadiness) {
  const root = createRoot(host);
  const wait = () => new Promise((resolve) => window.setTimeout(resolve, 70));
  let count = 0;
  const check = (condition: boolean, message: string) => { if (!condition) throw new Error(`Performance: ${message}`); count++; };
  function Harness({ session, unavailable = false }: { session: MiningSessionStatus; unavailable?: boolean }) {
    const history = useHashrateHistory(session, unavailable);
    return <><LivePerformance history={history} live={session.state === "mining"} delayed={unavailable || history.breakPending} /><MiningSessionTelemetry history={history} session={session} setup={setup} reducedMotion statusUnavailable={unavailable} onStop={() => {}} /></>;
  }
  const render = async (session: MiningSessionStatus, unavailable = false) => { root.render(<StrictMode><Harness session={session} unavailable={unavailable} /></StrictMode>); await wait(); };
  const sample = (rate: number | null, extra: Partial<MiningSessionStatus> = {}): MiningSessionStatus => ({ ...fixture, telemetry: { ...fixture.telemetry!, sampleTimeUnixMs: Date.now(), shortHashrate: rate }, ...extra });
  const points = () => host.querySelectorAll(".live-performance:first-child .performance-point").length;
  try {
    const first = sample(1200);
    await render(first);
    check(points() === 1, "StrictMode observation must occur once");
    await render({ ...first });
    check(points() === 1, "duplicate snapshot suppression");
    await render(sample(0));
    check(points() === 2 && host.textContent!.includes("0 H/s"), "zero is a numeric observation");
    await render(sample(null));
    check(points() === 2, "missing rate not added");
    await render(sample(1350));
    check(host.querySelectorAll(".live-performance:first-child .performance-line").length === 2, "missing-data gap");
    const plot = host.querySelector<HTMLElement>(".performance-plot")!;
    plot.focus();
    plot.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    await wait();
    check(host.querySelector("output")!.textContent!.includes("1.2 kH/s"), "keyboard first observation");
    plot.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await wait();
    check(host.querySelector("output")!.textContent!.includes("1.4 kH/s"), "keyboard latest observation");
    plot.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await wait();
    check(host.querySelector("output")!.textContent === "", "Escape clears inspection");
    await render(sample(1400, { telemetryFreshness: "stale" }));
    check(points() === 3 && host.textContent!.includes("Signal interrupted"), "stale evidence remains a gap");
    await render(sample(1400), true);
    check(points() === 3 && host.textContent!.includes("Stop mining"), "failed polling preserves Stop");
    await render(sample(1400, { state: "stopped", processId: null }));
    check(points() === 3 && host.textContent!.includes("historical") && host.textContent!.includes("Session stopped"), "stopped history is labelled");
    await render(sample(null, { state: "starting" }));
    check(points() === 0, "new session clears observations");
    await render(sample(1300, { processId: 43 }));
    check(points() === 1, "new process has only its own evidence");
    check(host.querySelector(".living-core")?.getAttribute("data-active-work") === "true" && host.querySelector(".living-core--still") !== null, "reduced-motion static workshop");
    check(host.querySelector(".performance-plot")!.getBoundingClientRect().width <= host.getBoundingClientRect().width, "plot fits its container");
    return `PASS · ${count} performance DOM/effect checks (StrictMode, sampling, gaps, keyboard, Stop, reset, reduced motion, resize)`;
  } finally { root.unmount(); }
}
