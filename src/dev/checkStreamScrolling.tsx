import { createRoot } from "react-dom/client";
import { EmberStream } from "../components/EmberStream";
import type { EmberEvent } from "../emberStream.mjs";

/** Explicit test-only events; never fed into the production App/IPC buffer. */
export async function checkStreamScrolling(host: HTMLElement) {
  const root = createRoot(host);
  const pause = () => new Promise<void>((resolve) => window.setTimeout(resolve, 100));
  const events: EmberEvent[] = Array.from({ length: 30 }, (_, i) => ({
    id: `test-only-${i}`, occurredAtUnixMs: i * 1000, sessionId: "test-only",
    category: "system", severity: "informational", source: "emberLifecycle",
    kind: { type: "miningStarted", data: { profile: "quiet", configuredThreads: 4 } },
  }));
  const render = async (rows: EmberEvent[]) => { root.render(<div className="unified-workspace"><p>Stream rendering test · synthetic events only</p><EmberStream events={rows} /></div>); await pause(); };
  const assert = (condition: boolean, message: string) => { if (!condition) throw new Error(message); };
  try {
    await render(events.slice(0, 28));
    const viewport = host.querySelector<HTMLElement>(".stream-viewport")!;
    assert(viewport.scrollTop > 0, "Initial view did not follow latest");
    viewport.scrollTop = 0;
    viewport.dispatchEvent(new Event("scroll", { bubbles: true }));
    await pause();
    await render(events);
    assert(viewport.scrollTop === 0, "New events interrupted reading older events");
    const verbose = host.querySelector<HTMLButtonElement>('.stream-modes button[aria-pressed="false"]')!;
    verbose.click();
    await pause();
    assert(Boolean(host.querySelector(".ember-stream--verbose")), "Verbose did not switch presentation");
    assert(host.querySelectorAll(".ember-stream-row").length === 30, "Mode switch changed the event buffer");
    assert(viewport.scrollTop === 0, "Mode switch interrupted older reading position");
    assert(Boolean(host.querySelector(".stream-source")), "Verbose has no technical provenance");
    const details = host.querySelector<HTMLDetailsElement>(".stream-event-detail")!;
    details.open = true;
    await pause();
    assert(details.textContent!.includes("emberLifecycle"), "Technical provenance missing");
    host.querySelector<HTMLButtonElement>('.stream-modes button[aria-pressed="false"]')!.click();
    await pause();
    assert(Boolean(host.querySelector(".ember-stream--activity")), "Activity did not restore");
    const button = host.querySelector<HTMLButtonElement>(".stream-footer button");
    assert(Boolean(button?.textContent?.includes("2 new")), "Missing return-to-latest affordance");
    button!.click();
    await pause();
    assert(viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 24, "Return to latest did not reach latest");
    assert(!host.querySelector(".stream-footer button"), "Unread count did not clear");
    await render([]);
    assert(host.querySelectorAll("li").length === 0, "Empty feed invented event rows");
    return "PASS · Stream follows latest, preserves older scroll and mode switch, retains event order, counts 2 new, returns to latest, exposes provenance, empty feed has no rows";
  } finally { root.unmount(); }
}
