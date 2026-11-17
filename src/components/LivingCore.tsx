import { useEffect, useRef, useState, type CSSProperties } from "react";
import manifest from "../livingCoreManifest.json";
import { createFramePlayer } from "../livingCoreAnimation.mjs";
import type { LivingCoreView } from "../livingCoreState.mjs";
import { EmberCore, type EmberCoreState } from "./EmberCore";
import "./LivingCore.css";

const assets: Record<string, { file: string; frames: number; cellWidth: number; cellHeight: number }> = manifest.assets;
const basePath = "/living-core/v2/";

function fallbackState(view: LivingCoreView): EmberCoreState {
  if (view.lifecycle === "mining") return view.activeWork ? "mining" : "inactive";
  if (view.lifecycle === "notConfigured") return "not-configured";
  if (view.lifecycle === "error") return "warning";
  if (view.lifecycle === "unavailable") return "inactive";
  if (view.lifecycle === "stopping") return "stopped";
  return view.lifecycle;
}

/** Decorative only: lifecycle copy, telemetry and controls stay outside the scene. */
export function LivingCore({ view, reducedMotion = false, inspectFrame }: { view: LivingCoreView; reducedMotion?: boolean; inspectFrame?: number }) {
  const container = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [left, setLeft] = useState(0);
  const [fits, setFits] = useState(true);
  const [motionAllowed, setMotionAllowed] = useState(false);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = typeof IntersectionObserver === "undefined";
    const updateMotion = () => setMotionAllowed(!reducedMotion && inspectFrame === undefined && !media.matches && document.visibilityState === "visible" && inView);
    const measure = () => {
      const width = element.clientWidth;
      const nextScale = Math.max(1, Math.min(2, Math.floor(width / 240)));
      setScale(nextScale);
      setLeft(Math.floor((width - 320 * nextScale) / 2));
      // The closer v2 composition also fits a 192px static crop under zoom.
      setFits(width >= 192);
    };
    measure();
    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    resize?.observe(element);
    const intersection = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      updateMotion();
    });
    intersection?.observe(element);
    media.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateMotion);
    updateMotion();
    return () => {
      resize?.disconnect();
      intersection?.disconnect();
      media.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateMotion);
    };
  }, [reducedMotion, inspectFrame]);

  return (
    <div ref={container} className={`living-core${motionAllowed ? "" : " living-core--still"}`} aria-hidden="true" data-lifecycle={view.lifecycle} data-pose={view.pose} data-active-work={view.activeWork} data-scale={scale} style={{ "--scene-scale": scale, "--scene-left": `${left}px` } as CSSProperties}>
      {fits ? <ArtworkScene key={view.pose} view={view} motionAllowed={motionAllowed && !reducedMotion} inspectFrame={inspectFrame} /> : <EmberCore state={fallbackState(view)} />}
    </div>
  );
}

function ArtworkScene({ view, motionAllowed, inspectFrame }: { view: LivingCoreView; motionAllowed: boolean; inspectFrame?: number }) {
  const clip = manifest.clips[view.pose];
  const layerIds = [...manifest.baseLayers, clip.crystal, clip.character];
  const [loaded, setLoaded] = useState<Set<string>>(() => new Set());
  const [failure, setFailure] = useState(false);
  const [fallbackFailure, setFallbackFailure] = useState(false);
  const [frame, setFrame] = useState(0);
  const player = useRef<ReturnType<typeof createFramePlayer> | null>(null);
  const ready = layerIds.every((id) => loaded.has(id));
  const frames = assets[clip.character].frames;

  useEffect(() => {
    player.current = createFramePlayer({ frames, fps: clip.fps, loop: clip.loop, onFrame: setFrame });
    return () => { player.current?.dispose(); player.current = null; };
  }, [frames, clip.fps, clip.loop]);

  useEffect(() => {
    player.current?.setRunning(ready && !failure && motionAllowed && view.animate);
  }, [ready, failure, motionAllowed, view.animate]);

  // Reduced motion and suspended scenes always have a composed static first pose.
  const visibleFrame = inspectFrame !== undefined ? Math.max(0, Math.min(frames - 1, Math.floor(inspectFrame))) : motionAllowed && view.animate ? frame : 0;
  if (fallbackFailure) return <EmberCore state={fallbackState(view)} />;
  return (
    <div className="living-core-viewport" data-frame={visibleFrame} data-playing={ready && !failure && motionAllowed && view.animate} data-asset-status={failure ? "fallback" : ready ? "ready" : "loading"}>
      <div className="living-core-canvas">
        {(!ready || failure) && <img className="living-core-static" src={basePath + manifest.fallback} width="320" height="180" alt="" onError={() => setFallbackFailure(true)} />}
        {!failure && <div className="living-core-layers" style={{ visibility: ready ? "visible" : "hidden" }}>
          <span className={`living-core-light${view.activeWork ? " is-active" : ""}`} />
          {layerIds.map((id) => {
            const asset = assets[id];
            const index = asset.frames > 1 ? visibleFrame % asset.frames : 0;
            return <span className={`living-core-layer living-core-layer--${id}`} key={id}>
              <img src={basePath + asset.file} width={320 * asset.frames} height="180" alt="" draggable="false" style={{ left: -320 * index }}
                onLoad={(event) => {
                  if (event.currentTarget.naturalWidth !== 320 * asset.frames || event.currentTarget.naturalHeight !== 180) { setFailure(true); return; }
                  setLoaded((current) => new Set(current).add(id));
                }}
                onError={() => setFailure(true)} />
            </span>;
          })}
        </div>}
      </div>
    </div>
  );
}
