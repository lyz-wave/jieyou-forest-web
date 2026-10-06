/** 自动降低画质：按帧时间戳测帧率，连续 2 秒低于 45fps 就降一级，只降不升。 */

export type Quality = "high" | "medium" | "low";

export const QUALITY_SETTINGS: Record<Quality, { blurShadows: boolean; particles: number; farTrees: boolean }> = {
  high: { blurShadows: true, particles: 36, farTrees: true },
  medium: { blurShadows: false, particles: 16, farTrees: true },
  low: { blurShadows: false, particles: 6, farTrees: false },
};

const NEXT: Record<Quality, Quality> = { high: "medium", medium: "low", low: "low" };

export interface QualityGovernorOptions {
  initial?: Quality;
  warmupMs?: number;
  windowMs?: number;
  minFps?: number;
  /** 两帧间隔超过这个值（比如切到后台）就丢弃当前窗口 */
  maxGapMs?: number;
}

export interface QualityGovernor {
  readonly quality: Quality;
  sample(timestamp: number): void;
  /** 丢弃当前窗口，下一帧重新开始积累 */
  pause(): void;
  onChange(listener: (q: Quality) => void): () => void;
}

export function createQualityGovernor({
  initial = "high",
  warmupMs = 2000,
  windowMs = 2000,
  minFps = 45,
  maxGapMs = 1000,
}: QualityGovernorOptions = {}): QualityGovernor {
  let quality: Quality = initial;
  let firstTs: number | undefined;
  let lastTs: number | undefined;
  let windowStart: number | undefined;
  let frames = 0;
  const listeners = new Set<(q: Quality) => void>();

  const resetWindow = (t: number | undefined) => {
    windowStart = t;
    frames = 0;
  };

  return {
    get quality() {
      return quality;
    },
    sample(t) {
      if (firstTs === undefined) firstTs = t;
      if (lastTs === undefined || t - lastTs > maxGapMs) {
        lastTs = t;
        resetWindow(undefined);
        return;
      }
      lastTs = t;
      if (t - firstTs < warmupMs) return;
      if (windowStart === undefined) {
        resetWindow(t);
        return;
      }
      frames++;
      const elapsed = t - windowStart;
      if (elapsed < windowMs) return;
      const fps = (frames * 1000) / elapsed;
      resetWindow(t);
      if (fps < minFps && quality !== "low") {
        quality = NEXT[quality];
        for (const l of listeners) l(quality);
      }
    },
    pause() {
      lastTs = undefined;
      resetWindow(undefined);
    },
    onChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
