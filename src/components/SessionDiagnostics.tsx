import { useEffect, useRef, useState } from "react";
import { CpuIcon } from "@phosphor-icons/react/dist/csr/Cpu";
import type { MiningSessionStatus } from "./MiningSetup";

const stageLabels: Record<string, string> = { checkingEngine: "Engine check", preparingSession: "Session preparation", startingXmrig: "Engine launch", waitingForMiner: "First reading" };
const stageLabel = (stage: string) => stageLabels[stage] ?? stage;

/** Native dialog supplies focus trapping, Escape and focus return to its opener. */
export function SessionDiagnostics({ session, diagnosticsMode, copyDiagnostics }: { session: MiningSessionStatus; diagnosticsMode: boolean; copyDiagnostics: () => void | Promise<void> }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [copyStatus, setCopyStatus] = useState("");
  useEffect(() => () => dialog.current?.close(), []);
  const health = session.captureHealth;
  const notes = diagnosticsMode ? session.diagnostics : session.diagnostics.filter((entry) => entry.source === "supervisor");
  if (!notes.length && !session.startupTimings.length && !diagnosticsMode && !session.error) return null;
  return <div className="session-diagnostics">
    <button type="button" className="diagnostics-open text-action" onClick={() => dialog.current?.showModal()}><CpuIcon aria-hidden="true" /> Diagnostics{session.error ? " · needs attention" : ""}</button>
    <dialog ref={dialog} className="diagnostics-drawer" aria-labelledby="diagnostics-title" onClick={(event) => { if (event.target === dialog.current) dialog.current.close(); }}>
      <header><div><span className="operation-kicker">TECHNICAL EVIDENCE</span><h2 id="diagnostics-title">Session diagnostics</h2></div><button type="button" autoFocus onClick={() => dialog.current?.close()} aria-label="Close diagnostics">Close ×</button></header>
      <div className="diagnostics-content">
        {session.error && <p className="field-error" role="alert">{session.error.kind}: {session.error.message}</p>}
        <section><h3>Startup</h3><dl className="diagnostics-facts">
          <div><dt>Stage</dt><dd title={session.startupStage ?? undefined}>{session.startupStage ? stageLabel(session.startupStage) : "No startup in progress"}</dd></div>
          <div><dt>Process ID</dt><dd>{session.processId ?? "Not running"}</dd></div>
          {session.startupTimings.map((timing, index) => <div key={`${index}-${timing.stage}`}><dt title={timing.stage}>{stageLabel(timing.stage)}</dt><dd>{timing.elapsedMs.toLocaleString()} ms</dd></div>)}
        </dl></section>
        {diagnosticsMode && <section><h3>Output capture</h3>{health ? <dl className="diagnostics-facts">
          <div><dt>Readers</dt><dd>stdout {health.stdoutReaderStarted ? "started" : "not started"} · stderr {health.stderrReaderStarted ? "started" : "not started"}</dd></div>
          <div><dt>Sanitized lines</dt><dd>{health.sanitizedLinesObserved.toLocaleString()}</dd></div>
          <div><dt>End of output</dt><dd>stdout {health.stdoutEofObserved ? "yes" : "no"} · stderr {health.stderrEofObserved ? "yes" : "no"}</dd></div>
          <div><dt>stdout error</dt><dd className={health.stdoutReadError ? "diagnostic-error" : undefined}>{health.stdoutReadError ?? "None reported"}</dd></div>
          <div><dt>stderr error</dt><dd className={health.stderrReadError ? "diagnostic-error" : undefined}>{health.stderrReadError ?? "None reported"}</dd></div>
        </dl> : <p>Capture evidence unavailable</p>}</section>}
        <section><h3>Engine notes</h3><p className="diagnostics-help">Sanitized output retained for this session.</p><div className="diagnostics-raw" role="region" aria-label="Sanitized engine output" tabIndex={0}>{notes.length ? <ol>{notes.map((entry, index) => <li key={index}><span>{entry.source}</span><code>{entry.message}</code></li>)}</ol> : <p>No output captured.</p>}</div></section>
      </div>
      {diagnosticsMode && <footer><button className="text-action" type="button" onClick={async () => { try { await copyDiagnostics(); setCopyStatus("Copied sanitized report"); } catch { setCopyStatus("Report could not be copied"); } }}>Copy sanitized report</button><span role="status">{copyStatus}</span></footer>}
    </dialog>
  </div>;
}
