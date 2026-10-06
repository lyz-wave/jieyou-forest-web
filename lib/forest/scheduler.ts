/**
 * 走动调度器（纯状态机）：每隔 12–30 秒挑一只动物走动，同一时间最多一只在动。
 * 由外部传入时间戳，方便测试；渲染层用 rAF 或 setTimeout 驱动 tick。
 */
import type { AnimalId } from "../animals";
import { between, seeded } from "../paper/random";

export interface WanderScheduler {
  /** 下一次派任务的时间（ms） */
  readonly nextAt: number;
  /** 从 count 个锚点里挑一个和 current 不同的 */
  pickAnchor(count: number, current: number): number;
  /** 到点就返回要走动的动物，否则返回 null */
  tick(now: number): AnimalId | null;
  /** 某只动物走完了 */
  done(animal: AnimalId, now: number): void;
  pause(): void;
  resume(now: number): void;
}

const MIN_GAP = 12_000;
const MAX_GAP = 30_000;

export function createWanderScheduler({
  seed,
  animals,
  now,
}: {
  seed: string;
  animals: readonly AnimalId[];
  now: number;
}): WanderScheduler {
  const rng = seeded(seed);
  const gap = () => between(rng, MIN_GAP, MAX_GAP);
  let nextAt = now + gap();
  let moving: AnimalId | null = null;
  let last: AnimalId | null = null;
  let paused = false;

  return {
    get nextAt() {
      return nextAt;
    },
    pickAnchor(count, current) {
      if (count <= 1) return 0;
      return (current + 1 + Math.floor(rng() * (count - 1))) % count;
    },
    tick(t) {
      if (paused || moving !== null || t < nextAt) return null;
      // 尽量不连续挑同一只；只有一只时只能挑它
      const others = animals.filter((a) => a !== last);
      const pool = others.length > 0 ? others : animals;
      const pick = pool[Math.floor(rng() * pool.length)];
      moving = pick;
      last = pick;
      return pick;
    },
    done(animal, t) {
      if (moving !== animal) return;
      moving = null;
      nextAt = t + gap();
    },
    pause() {
      paused = true;
    },
    resume(t) {
      paused = false;
      moving = null;
      nextAt = t + gap();
    },
  };
}
