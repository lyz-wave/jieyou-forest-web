"use client";

import { memo } from "react";
import { ancientTree } from "@/lib/scene";
import { STAGE_H, STAGE_W } from "@/lib/scene/depth";

const TREE = ancientTree();

/**
 * 夜晚古树树冠后面的暖光：只在逆光时可见，透过树冠的镂空纹样照出来。
 * 静态 SVG，颜色由 --paper-glow 控制（白天为透明）。
 */
export const CrownGlow = memo(function CrownGlow() {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox={`${-STAGE_W / 2} 0 ${STAGE_W} ${STAGE_H}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <radialGradient id="crown-glow" cx="50%" cy="55%" r="55%">
          <stop offset="0%" stopColor="#fff1c4" stopOpacity="1" />
          <stop offset="55%" stopColor="var(--paper-glow)" />
          <stop offset="100%" stopColor="var(--paper-glow)" stopOpacity="0.5" />
        </radialGradient>
      </defs>
      {/* 光只铺在树冠形状里，避免从树冠外漏光；白天 --paper-glow 透明，整个元素也隐藏 */}
      <path d={TREE.crown} fill="url(#crown-glow)" style={{ opacity: "var(--crown-glow-on, 0)" }} />
    </svg>
  );
});
