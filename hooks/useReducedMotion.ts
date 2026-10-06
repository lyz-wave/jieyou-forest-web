"use client";

import { useReducedMotion as useSystemReducedMotion } from "motion/react";
import { useSceneStore } from "@/lib/stores/scene";

/** 是否减弱动画：系统设置，或开发调试时的覆盖 */
export function useReducedMotion(): boolean {
  const system = useSystemReducedMotion() ?? false;
  const override = useSceneStore((s) => s.reducedMotionOverride);
  return override ?? system;
}
