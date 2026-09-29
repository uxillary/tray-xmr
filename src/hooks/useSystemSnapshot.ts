import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import type { SystemSnapshot } from "../types/system";

const REFRESH_INTERVAL_MS = 5_000;
const isDocumentHidden = () => document.visibilityState === "hidden";

export function useSystemSnapshot() {
  const [snapshot, setSnapshot] = useState<SystemSnapshot | null>(null);

  useEffect(() => {
    let stopped = false;
    let inFlight = false;
    let timer: number | undefined;

    const sample = async () => {
      if (stopped || inFlight || isDocumentHidden()) return;
      inFlight = true;
      try {
        const next = await invoke<SystemSnapshot>("system_snapshot");
        if (!stopped) setSnapshot(next);
      } catch {
        // Keep the last successful snapshot; optional system signals fail independently.
      } finally {
        inFlight = false;
        if (!stopped && !isDocumentHidden()) {
          timer = window.setTimeout(sample, REFRESH_INTERVAL_MS);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (timer !== undefined) window.clearTimeout(timer);
      } else {
        if (timer !== undefined) window.clearTimeout(timer);
        void sample();
      }
    };

    void sample();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      stopped = true;
      if (timer !== undefined) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return snapshot;
}
