"use client";

import { createContext, useContext } from "react";
import type { MotionValue } from "motion/react";

/**
 * 世界里的盒子（演员）在屏幕上被祖先缩了多少：WorldActor 算出「要往外补多大的热区」放在这里，
 * 纸偶（PaperPuppet）拿去垫一层透明的可点区域。
 *
 * 不在 WorldActor 里时是 null —— 没被缩放，不用补。
 */
export const ActorContext = createContext<MotionValue<number> | null>(null);

/** 当前盒子要往外补多少（layout px，单边补一半） */
export function useActorTapPad(): MotionValue<number> | null {
  return useContext(ActorContext);
}
