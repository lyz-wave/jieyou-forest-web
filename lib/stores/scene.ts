import { create } from "zustand";
import type { TimeOfDay } from "../scene/lighting";
import type { Quality } from "../scene/quality";

interface SceneState {
  /** 开发调试用：覆盖真实时间 */
  timeOverride: TimeOfDay | null;
  quality: Quality;
  /** 开发调试用：手动锁定画质（不再自动降级） */
  qualityLocked: boolean;
  /** 开发调试用：模拟减弱动画（null 表示跟随系统） */
  reducedMotionOverride: boolean | null;
  setTimeOverride(t: TimeOfDay | null): void;
  setQuality(q: Quality, lock?: boolean): void;
  setReducedMotionOverride(v: boolean | null): void;
}

export const useSceneStore = create<SceneState>()((set) => ({
  timeOverride: null,
  quality: "high",
  qualityLocked: false,
  reducedMotionOverride: null,
  setTimeOverride: (timeOverride) => set({ timeOverride }),
  setQuality: (quality, lock = false) => set({ quality, qualityLocked: lock }),
  setReducedMotionOverride: (reducedMotionOverride) => set({ reducedMotionOverride }),
}));
