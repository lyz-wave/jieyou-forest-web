"use client";

import { useMotionValue, type MotionValue } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AnimalId } from "@/lib/animals";
import { inStream, type WorldPos } from "@/lib/forest/ground";
import { planMove, sampleTrack, trackDuration, type Facing, type Pose, type Track } from "@/lib/forest/motion";

export interface ActorMotion {
  x: MotionValue<number>;
  y: MotionValue<number>;
  depth: MotionValue<number>;
  /** 离地高度，接触阴影用 */
  lift: MotionValue<number>;
  facing: Facing;
  pose: Pose;
  /** 现在是否在溪流里（水獭用：在水里只露出上半身） */
  inWater: boolean;
  /** 当前所在位置 */
  position: () => WorldPos;
  /**
   * 沿规划好的路线移动过去。
   * 返回的 Promise 在走到时 resolve(true)；被新的移动打断时 resolve(false)。
   */
  moveTo(to: WorldPos, opts?: { instant?: boolean; maxDuration?: number }): Promise<boolean>;
  /** 原地转向（比如坐下后朝向圆心） */
  face(f: Facing): void;
}

/**
 * 一只动物的位置和姿态。位置用 MotionValue 每帧更新，不触发 React 重渲染；
 * 只有朝向和姿态变化时才重渲染（用来切换步态动画和翻转）。
 */
export function useActorMotion(animal: AnimalId, start: WorldPos, initialFacing: Facing): ActorMotion {
  const x = useMotionValue(start.x);
  const y = useMotionValue(start.y);
  const depth = useMotionValue(start.depth);
  const lift = useMotionValue(0);
  const [facing, setFacing] = useState<Facing>(initialFacing);
  const [pose, setPose] = useState<Pose>("idle");
  const [inWater, setInWater] = useState(() => inStream(start.x, start.depth));
  const current = useRef<WorldPos>(start);
  const facingRef = useRef<Facing>(initialFacing);
  const frame = useRef(0);
  /** 结束当前这次移动的 Promise（参数表示是否走完） */
  const finish = useRef<((completed: boolean) => void) | null>(null);

  const stop = useCallback(() => {
    cancelAnimationFrame(frame.current);
    finish.current?.(false);
    finish.current = null;
  }, []);

  useEffect(() => stop, [stop]);

  const moveTo = useCallback(
    (to: WorldPos, opts: { instant?: boolean; maxDuration?: number } = {}): Promise<boolean> => {
      stop();
      const apply = (p: WorldPos) => {
        x.set(p.x);
        y.set(p.y);
        depth.set(p.depth);
        // 只在进出水时重渲染
        setInWater(inStream(p.x, p.depth));
      };
      if (opts.instant) {
        apply(to);
        current.current = to;
        lift.set(0);
        setPose("idle");
        return Promise.resolve(true);
      }
      const track: Track = planMove(animal, current.current, to, { maxDuration: opts.maxDuration });
      const total = trackDuration(track);
      if (total === 0) return Promise.resolve(true);
      return new Promise<boolean>((resolve) => {
        // 起始时间取第一帧的 rAF 时间戳，和后续帧用同一个时钟
        let t0: number | null = null;
        let lastPose: Pose | null = null;
        finish.current = resolve;
        const tick = (now: number) => {
          t0 ??= now;
          const t = (now - t0) / 1000;
          const s = sampleTrack(track, t, facingRef.current);
          apply(s.pos);
          lift.set(s.lift);
          current.current = s.pos;
          if (s.facing !== facingRef.current) {
            facingRef.current = s.facing;
            setFacing(s.facing);
          }
          if (s.pose !== lastPose) {
            lastPose = s.pose;
            setPose(s.pose);
          }
          if (t >= total) {
            current.current = to;
            apply(to);
            setPose("idle");
            finish.current = null;
            resolve(true);
            return;
          }
          frame.current = requestAnimationFrame(tick);
        };
        frame.current = requestAnimationFrame(tick);
      });
    },
    [animal, depth, lift, stop, x, y],
  );

  const position = useCallback(() => current.current, []);

  const face = useCallback((f: Facing) => {
    facingRef.current = f;
    setFacing(f);
  }, []);

  return { x, y, depth, lift, facing, pose, inWater, position, moveTo, face };
}
