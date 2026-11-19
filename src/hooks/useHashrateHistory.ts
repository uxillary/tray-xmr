import { useEffect, useState } from "react";
import type { MiningSessionStatus } from "../components/MiningSetup";
import { initialHistory, observeHashrate, type HashrateHistory } from "../hashrateHistory.mjs";
import { telemetryExpiryDelay } from "../workshopIntensity.mjs";

/** App-owned so navigating to Settings does not discard recent observations. */
export function useHashrateHistory(session: MiningSessionStatus | null, unavailable: boolean, seed?: HashrateHistory) {
  const [history, setHistory] = useState(() => seed ?? initialHistory());
  useEffect(() => {
    setHistory((previous) => observeHashrate(previous, session, { unavailable }));
    const delay = telemetryExpiryDelay(session);
    if (delay === null || unavailable) return;
    const timer = window.setTimeout(() => {
      setHistory((previous) => observeHashrate(previous, session, { unavailable: true }));
    }, delay);
    return () => window.clearTimeout(timer);
  }, [session, unavailable]);
  return history;
}
