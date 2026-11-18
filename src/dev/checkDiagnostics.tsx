import { createRoot } from "react-dom/client";
import { SessionDiagnostics } from "../components/SessionDiagnostics";
import type { MiningSessionStatus } from "../components/MiningSetup";

export async function checkDiagnostics(host: HTMLElement, session: MiningSessionStatus) {
  const root = createRoot(host);
  const pause = () => new Promise<void>((resolve) => window.setTimeout(resolve, 100));
  const assert = (condition: boolean, message: string) => { if (!condition) throw new Error(message); };
  let copies = 0;
  try {
    root.render(<><button type="button">Outside drawer</button><SessionDiagnostics session={session} diagnosticsMode copyDiagnostics={() => { copies++; }} /></>);
    await pause();
    const opener = host.querySelector<HTMLButtonElement>(".diagnostics-open")!;
    opener.focus();
    const position = opener.getBoundingClientRect().top;
    opener.click();
    await pause();
    const dialog = host.querySelector<HTMLDialogElement>("dialog")!;
    assert(dialog.open && dialog.matches(":modal"), "Diagnostics is not modal");
    assert(dialog.contains(document.activeElement), "Focus did not enter Diagnostics");
    const rect = dialog.getBoundingClientRect();
    assert(rect.top >= 0 && rect.bottom <= window.innerHeight, "Drawer exceeds viewport");
    assert(opener.getBoundingClientRect().top === position, "Drawer displaced workspace");
    const output = dialog.querySelector<HTMLElement>(".diagnostics-raw")!;
    assert(getComputedStyle(output).overflowY === "auto" && output.scrollHeight > output.clientHeight, "Raw output is not independently bounded");
    dialog.querySelector<HTMLButtonElement>("footer button")!.click();
    await pause();
    assert(copies === 1 && dialog.textContent!.includes("Copied sanitized report"), "Copy did not report result");
    dialog.querySelector<HTMLButtonElement>('[aria-label="Close diagnostics"]')!.click();
    await pause();
    assert(!dialog.open && document.activeElement === opener, "Close did not return focus");
    opener.click(); await pause(); root.unmount(); await pause();
    assert(!document.querySelector(".diagnostics-drawer:modal"), "Unmount leaked modal");
    return "PASS · Diagnostics modal, focus entry/return, containment, independent output scrolling, copy feedback and unmount cleanup";
  } finally { if (host.childNodes.length) root.unmount(); }
}
