"use client";

import { useMotionValue } from "motion/react";
import type { ReactElement } from "react";
import { WorldActor } from "@/components/scene/WorldActor";
import { TREE_HOTSPOT } from "@/lib/scene";

/**
 * 古树的可点热区：一块透明的按钮，按纸层的方式投影，所以缩放和视差都跟古树对齐。
 * 位置在树冠上（见 TREE_HOTSPOT），树干上站着的动物在更前面，仍然优先响应点击。
 */
export function TreeSpot({ onActivate }: { onActivate?: () => void }): ReactElement {
  const x = useMotionValue(TREE_HOTSPOT.x);
  const y = useMotionValue(TREE_HOTSPOT.y);
  const depth = useMotionValue(TREE_HOTSPOT.depth);
  return (
    <WorldActor
      x={x}
      y={y}
      depth={depth}
      width={TREE_HOTSPOT.width}
      height={TREE_HOTSPOT.height}
      perspectiveScale={false}
      testId="tree-spot"
    >
      <button
        type="button"
        aria-label="岁岁，古树，森林守护者"
        onClick={() => onActivate?.()}
        className="pointer-events-auto block h-full w-full cursor-pointer rounded-[35%] outline-offset-4"
      />
    </WorldActor>
  );
}
