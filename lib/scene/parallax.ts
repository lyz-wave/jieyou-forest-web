/** 视差输入的纯逻辑：选哪种来源、陀螺仪角度怎么换算、自动漂移的轨迹。 */

export type ParallaxSource = "none" | "pointer" | "orientation" | "drift";
export type OrientationPermission = "unknown" | "granted" | "denied";

export interface ParallaxEnv {
  reducedMotion: boolean;
  /** (pointer: fine)，即有鼠标 */
  finePointer: boolean;
  hasOrientation: boolean;
  /** iOS 13+：需要调用 DeviceOrientationEvent.requestPermission */
  needsPermission: boolean;
  permission: OrientationPermission;
}

export function chooseParallaxSource(env: ParallaxEnv): ParallaxSource {
  if (env.reducedMotion) return "none";
  if (env.finePointer) return "pointer";
  if (env.hasOrientation && (!env.needsPermission || env.permission === "granted")) return "orientation";
  return "drift";
}

export interface Tilt {
  beta: number;
  gamma: number;
}

const MAX_TILT = 15;
const clamp1 = (v: number) => Math.max(-1, Math.min(1, v));

/** 相对首次读数的倾角，±15° 映射到 ±1 */
export function tiltToParallax(tilt: Tilt, baseline: Tilt): { x: number; y: number } {
  return {
    x: clamp1((tilt.gamma - baseline.gamma) / MAX_TILT),
    y: clamp1((tilt.beta - baseline.beta) / MAX_TILT),
  };
}

const DRIFT_AMPLITUDE = 0.3;
const DRIFT_PERIOD_MS = 20_000;

/** 自动漂移：周期约 20 秒的李萨如曲线 */
export function driftAt(ms: number): { x: number; y: number } {
  const t = (ms / DRIFT_PERIOD_MS) * Math.PI * 2;
  return { x: Math.sin(t) * DRIFT_AMPLITUDE, y: Math.sin(t * 0.7 + 1) * DRIFT_AMPLITUDE * 0.6 };
}
