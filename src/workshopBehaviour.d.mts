import type { LivingCoreView } from "./livingCoreState.mjs";
export type WorkshopFrame = { x: number; tick: number; frame: number; phase: string; facing: number };
export const WORKSHOP: Readonly<{ restX: number; workX: number; minX: number; maxX: number; groundY: number; fps: number }>;
export function staticWorkshopPose(view: LivingCoreView): WorkshopFrame;
export function stepWorkshop(previous: WorkshopFrame, view: LivingCoreView): WorkshopFrame;
export function createWorkshopPlayer(options: { view: LivingCoreView; onFrame: (frame: WorkshopFrame) => void; schedule?: typeof setTimeout; cancel?: typeof clearTimeout }): { setIntensity(fps: number): void; setView(view: LivingCoreView): void; setRunning(next: boolean): void; dispose(): void };
