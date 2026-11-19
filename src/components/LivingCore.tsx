import { useEffect, useRef, useState, type CSSProperties } from "react";
import manifest from "../livingCoreManifest.json";
import { createWorkshopPlayer, staticWorkshopPose, WORKSHOP } from "../workshopBehaviour.mjs";
import type { LivingCoreView } from "../livingCoreState.mjs";
import { EmberCore, type EmberCoreState } from "./EmberCore";
import "./LivingCore.css";

const assets: Record<string, { file: string; frames: number; cellWidth: number; cellHeight: number }> = manifest.assets;
const basePath = "/living-core/v3/";

function fallbackState(view: LivingCoreView): EmberCoreState {
  if (view.lifecycle === "mining") return view.activeWork ? "mining" : "inactive";
  if (view.lifecycle === "notConfigured") return "not-configured";
  if (view.lifecycle === "error") return "warning";
  if (view.lifecycle === "unavailable") return "inactive";
  if (view.lifecycle === "stopping") return "stopped";
  return view.lifecycle;
}

/** Decorative only: lifecycle copy, telemetry and controls stay outside the scene. */
type IntensityMotion = { fps: number; seconds: number; level: string };
export function LivingCore({ view, reducedMotion = false, inspectFrame, intensity = { fps: 5, seconds: 3.6, level: "steady" } }: { view: LivingCoreView; reducedMotion?: boolean; inspectFrame?: number; intensity?: IntensityMotion }) {
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
      const nextScale = 1; // Tiny RPG scale: 32 logical/CSS pixels, including wide windows.
      setScale(nextScale);
      setLeft(Math.floor((width - 320 * nextScale) / 2));
      // The closer v2 composition also fits a 192px static crop under zoom.
      setFits(width >= 256);
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
      {fits ? <ArtworkScene view={view} motionAllowed={motionAllowed && !reducedMotion} inspectFrame={inspectFrame} intensity={intensity} /> : <EmberCore state={fallbackState(view)} compact />}
    </div>
  );
}

function ArtworkScene({ view, motionAllowed, inspectFrame, intensity }: { view: LivingCoreView; motionAllowed: boolean; inspectFrame?: number; intensity: IntensityMotion }) {
  const layerIds = ["workshop", "pedestal", view.activeWork ? "crystal-lit" : "crystal-dormant", "character"];
  const [loaded, setLoaded] = useState<Set<string>>(() => new Set());
  const [failure, setFailure] = useState(false);
  const [fallbackFailure, setFallbackFailure] = useState(false);
  const [frame, setFrame] = useState(() => staticWorkshopPose(view));
  const player = useRef<ReturnType<typeof createWorkshopPlayer> | null>(null);
  const initialView = useRef(view);
  const ready = layerIds.every((id) => loaded.has(id));
  useEffect(() => {
    player.current = createWorkshopPlayer({ view: initialView.current, onFrame: setFrame });
    return () => { player.current?.dispose(); player.current = null; };
  }, []);
  useEffect(() => { player.current?.setView(view); }, [view.pose, view.animate]);
  useEffect(() => { player.current?.setIntensity(view.activeWork ? intensity.fps : 4); }, [view.activeWork, intensity.fps]);
  useEffect(() => { player.current?.setRunning(ready && !failure && motionAllowed); }, [ready, failure, motionAllowed]);
  const visible = motionAllowed ? frame : staticWorkshopPose(view);
  const playing = ready && !failure && motionAllowed && (view.animate || (view.lifecycle === "stopped" && (frame.x !== WORKSHOP.restX || ["walk", "turn", "withdraw"].includes(frame.phase))));
  if (failure && fallbackFailure) return <EmberCore state={fallbackState(view)} compact />;
  const spriteFrame = inspectFrame === undefined ? visible.frame : Math.max(0, Math.min(3, Math.floor(inspectFrame)));
  return <div className="living-core-viewport" data-energy={view.activeWork ? intensity.level : "inactive"} data-frame={motionAllowed ? spriteFrame : 0} data-tending={view.activeWork && motionAllowed && visible.phase === "tend" && spriteFrame === 2} data-x={visible.x} data-behaviour={visible.phase} data-playing={playing} data-asset-status={failure ? "fallback" : ready ? "ready" : "loading"} style={{ "--work-cycle": `${Math.max(2.4, Math.min(4.8, intensity.seconds || 3.6))}s` } as CSSProperties}>
    <div className="living-core-canvas">
      {!ready && !failure && <img className="living-core-static" src={basePath + manifest.fallback} width="320" height="144" alt="" />}
      {failure ? <img className="living-core-static" src={basePath + manifest.fallback} width="320" height="144" alt="" onError={() => setFallbackFailure(true)} /> : <>
        {layerIds.map((id) => {
          const asset = assets[id];
          return <span className={`living-core-layer living-core-layer--${id}`} key={id} style={id === "character" ? { left: visible.x - 16 + (visible.phase === "tend" && spriteFrame === 2 ? 1 : 0), top: WORKSHOP.groundY - 32 - (visible.phase === "walk" ? spriteFrame % 2 : 0), width: 32, height: 32, transform: `scaleX(${visible.facing})` } : undefined}>
            <img src={basePath + asset.file} width={asset.cellWidth * asset.frames} height={asset.cellHeight} alt="" draggable="false" style={{ left: id === "character" ? -32 * spriteFrame : 0 }} onLoad={(event) => {
              if (event.currentTarget.naturalWidth !== asset.cellWidth * asset.frames || event.currentTarget.naturalHeight !== asset.cellHeight) { setFailure(true); return; }
              setLoaded((current) => current.has(id) ? current : new Set(current).add(id));
            }} onError={() => setFailure(true)} />
          </span>;
        })}
        <span className={`living-core-light${view.activeWork ? " is-active" : ""}`} />
        <span className="workshop-conduit"><i /><i /><i /></span>
        <span className="workshop-flywheel"><i /></span>
        <span className="workshop-crystal-facet" />
        <span className="workshop-crystal-contact" />
      </>}
    </div>
  </div>;
}
