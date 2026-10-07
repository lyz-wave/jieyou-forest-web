"use client";

import type { ReactElement } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ANIMALS, type CharacterId } from "@/lib/animals";
import { PuppetSvg } from "./PaperPuppet";

/**
 * 把纸偶缩小成一个标记：角色卡、入林选项、游戏里的提示行都用它。
 * 和森林里的纸偶同一套形状与纸色，只是不带按键、不响应指针。
 * 对读屏隐藏——旁边的名字才是可读的部分。
 */
export function PuppetMark({
  id,
  size,
  className = "",
}: {
  id: CharacterId;
  size: number;
  className?: string;
}): ReactElement {
  const reducedMotion = useReducedMotion();
  const shadowDy = Math.max(1, Math.round(size * 0.04));
  return (
    <span
      aria-hidden
      className={`relative inline-block shrink-0 align-[-0.18em] ${className}`}
      style={{ width: size, height: size }}
    >
      <PuppetSvg
        def={ANIMALS[id].puppet}
        silhouette
        reducedMotion={reducedMotion}
        submerged={false}
        style={{
          color: "var(--paper-shadow)",
          opacity: "var(--paper-shadow-alpha)",
          transform: `translate(0px, ${shadowDy}px)`,
        }}
      />
      <PuppetSvg def={ANIMALS[id].puppet} silhouette={false} reducedMotion={reducedMotion} submerged={false} />
    </span>
  );
}
