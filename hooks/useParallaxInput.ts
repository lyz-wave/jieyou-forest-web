"use client";

import { useMotionValue, useSpring, type MotionValue } from "motion/react";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import {
  chooseParallaxSource,
  driftAt,
  tiltToParallax,
  type OrientationPermission,
  type ParallaxSource,
  type Tilt,
} from "@/lib/scene/parallax";
import { useReducedMotion } from "./useReducedMotion";

const PERMISSION_KEY = "jieyou:orientation-permission";

interface OrientationEventWithPermission {
  requestPermission?: () => Promise<"granted" | "denied">;
}

function orientationCtor(): OrientationEventWithPermission | undefined {
  if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) return undefined;
  return window.DeviceOrientationEvent as unknown as OrientationEventWithPermission;
}

function readPermission(): OrientationPermission {
  try {
    const v = window.localStorage.getItem(PERMISSION_KEY);
    return v === "granted" || v === "denied" ? v : "unknown";
  } catch {
    return "unknown";
  }
}

interface DeviceCaps {
  finePointer: boolean;
  hasOrientation: boolean;
  needsPermission: boolean;
}

const NO_CAPS: DeviceCaps = { finePointer: false, hasOrientation: false, needsPermission: false };
let capsCache: DeviceCaps | undefined;

/** 设备能力在页面生命周期内不变，读一次缓存起来 */
function readCaps(): DeviceCaps {
  if (!capsCache) {
    const ctor = orientationCtor();
    capsCache = {
      finePointer: window.matchMedia("(pointer: fine)").matches,
      hasOrientation: ctor !== undefined && "ontouchstart" in window,
      needsPermission: typeof ctor?.requestPermission === "function",
    };
  }
  return capsCache;
}

const noopSubscribe = () => () => {};

export interface ParallaxInput {
  /** 经弹簧平滑后的视差，取值 -1 到 1 */
  x: MotionValue<number>;
  y: MotionValue<number>;
  source: ParallaxSource;
  /** iOS 需要用户点按授权，且尚未询问过 */
  canRequestPermission: boolean;
  requestPermission(): Promise<void>;
}

export function useParallaxInput(): ParallaxInput {
  const reducedMotion = useReducedMotion();
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 60, damping: 18, mass: 0.6 });
  const y = useSpring(rawY, { stiffness: 60, damping: 18, mass: 0.6 });

  const caps = useSyncExternalStore(noopSubscribe, readCaps, () => NO_CAPS);
  const storedPermission = useSyncExternalStore(noopSubscribe, readPermission, () => "unknown" as const);
  const [askedPermission, setAskedPermission] = useState<OrientationPermission | null>(null);
  const permission = askedPermission ?? storedPermission;

  const source = chooseParallaxSource({ reducedMotion, ...caps, permission });

  useEffect(() => {
    rawX.set(0);
    rawY.set(0);
    if (source === "pointer") {
      const onMove = (e: PointerEvent) => {
        rawX.set((e.clientX / window.innerWidth) * 2 - 1);
        rawY.set((e.clientY / window.innerHeight) * 2 - 1);
      };
      window.addEventListener("pointermove", onMove);
      return () => window.removeEventListener("pointermove", onMove);
    }
    if (source === "orientation") {
      let baseline: Tilt | undefined;
      const onTilt = (e: DeviceOrientationEvent) => {
        if (e.beta === null || e.gamma === null) return;
        const tilt = { beta: e.beta, gamma: e.gamma };
        baseline ??= tilt;
        const p = tiltToParallax(tilt, baseline);
        rawX.set(p.x);
        rawY.set(p.y);
      };
      window.addEventListener("deviceorientation", onTilt);
      return () => window.removeEventListener("deviceorientation", onTilt);
    }
    if (source === "drift") {
      let frame = 0;
      const start = performance.now();
      const tick = (now: number) => {
        const p = driftAt(now - start);
        rawX.set(p.x);
        rawY.set(p.y);
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(frame);
    }
    return undefined;
  }, [source, rawX, rawY]);

  const requestPermission = useCallback(async () => {
    const ctor = orientationCtor();
    if (!ctor?.requestPermission) return;
    let result: OrientationPermission = "denied";
    try {
      result = (await ctor.requestPermission()) === "granted" ? "granted" : "denied";
    } catch (err) {
      console.warn("陀螺仪授权失败", err);
    }
    try {
      window.localStorage.setItem(PERMISSION_KEY, result);
    } catch {
      // 隐私模式下 localStorage 可能不可用，只影响下次是否再询问
    }
    setAskedPermission(result);
  }, []);

  return {
    x,
    y,
    source,
    canRequestPermission:
      !reducedMotion && !caps.finePointer && caps.hasOrientation && caps.needsPermission && permission === "unknown",
    requestPermission,
  };
}
