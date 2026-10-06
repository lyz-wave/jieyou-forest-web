"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import type { ReactNode } from "react";
import { PERSPECTIVE } from "@/lib/scene";
import { STAGE_H } from "@/lib/scene/depth";
import { screenScale, tapTip, transformScale } from "@/lib/scene/tap";
import { ActorContext } from "./ActorContext";
import { useScene } from "./SceneContext";

/**
 * 3D 世界里自由定位的元素（动物、篝火）。
 * 位置是舞台坐标 (x, y) + 深度 depth，算法和纸层相同：translateZ(-depth) scale((P + depth)/P)，
 * 所以远近、视差和纸层完全一致，深度也可以连续变化（走动、跳跃、聚拢）。
 * (x, y) 是内容底边中点（脚底）；size 是舞台单位下的宽高。
 * perspectiveScale 为 true 时按深度额外缩小（草地上越远越小，见 sizeAt）。
 */
export function WorldActor({
  x,
  y,
  depth,
  width,
  height,
  children,
  className,
  testId,
  perspectiveScale = true,
}: {
  x: MotionValue<number>;
  y: MotionValue<number>;
  depth: MotionValue<number>;
  width: number;
  height: number;
  children: ReactNode;
  className?: string;
  testId?: string;
  perspectiveScale?: boolean;
}) {
  const { unit } = useScene();
  const w = width * unit;
  const h = height * unit;
  const transform = useTransform(() => {
    const d = depth.get();
    // 位置补偿和纸层一样：静止时舞台坐标就是屏幕位置
    const s = (PERSPECTIVE + d) / PERSPECTIVE;
    // 世界原点在视口中心；舞台 y=500 对应视口中心
    const px = x.get() * unit;
    const py = (y.get() - STAGE_H / 2) * unit;
    return `translate3d(${px * s}px, ${py * s}px, ${-d}px) scale(${transformScale(d, perspectiveScale)})`;
  });
  // 屏幕上的缩放越小，纸偶越难点中：小动物要往外补一圈透明热区（纸偶自己去贴）
  const tapPad = useTransform(() => tapTip({ width: w, height: h }, screenScale(depth.get(), perspectiveScale)));
  return (
    <motion.div
      data-testid={testId}
      className={`absolute left-1/2 top-1/2 ${className ?? ""}`}
      style={{
        width: w,
        height: h,
        marginLeft: -w / 2,
        marginTop: -h,
        transform,
        transformOrigin: "50% 100%",
        transformStyle: "preserve-3d",
      }}
    >
      <ActorContext.Provider value={tapPad}>{children}</ActorContext.Provider>
    </motion.div>
  );
}
