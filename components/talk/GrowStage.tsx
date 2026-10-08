"use client";

import { motion } from "motion/react";
import type { ReactElement } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTalkStore } from "@/lib/stores/talk";

/** 接不上话时跟小游戏里同一句：不把失败说成用户的错 */
export const GROW_FAILURE_LINE = "风太大了没听清，能再说一次吗？";

/** 岁岁把这一次收进年轮：一个光点从树干外缘亮起来，长成新的一圈。 */
export function GrowStage({ onRetry }: { onRetry: () => void }): ReactElement {
  const status = useTalkStore((s) => s.memoryStatus);
  const reducedMotion = useReducedMotion();
  const failed = status === "failed";

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <h2 id="talk-title" className="font-serif text-xl text-ink">
        {failed ? "这圈年轮先没长上" : "岁岁把这次收进年轮"}
      </h2>
      {failed ? (
        <>
          <p role="status" className="text-sm leading-relaxed text-ink-soft">
            {GROW_FAILURE_LINE}
          </p>
          <button type="button" onClick={onRetry} className="paper-button min-h-11 px-5 py-3 text-base">
            再试一次
          </button>
        </>
      ) : (
        <>
          <div data-testid="ring-growing" aria-hidden className="relative grid size-40 place-items-center">
            <motion.span
              className="absolute inset-0 rounded-full border-2 border-[var(--leaf)]"
              initial={reducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.55 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={reducedMotion ? { duration: 0 } : { duration: 1.1, ease: "easeOut" }}
            />
            <motion.span
              className="absolute inset-6 rounded-full"
              style={{ background: "var(--leaf)" }}
              initial={reducedMotion ? { opacity: 0.5 } : { opacity: 0.15 }}
              animate={{ opacity: 0.5 }}
              transition={reducedMotion ? { duration: 0 } : { duration: 1.1, ease: "easeOut" }}
            />
          </div>
          <p role="status" className="text-sm leading-relaxed text-ink-soft">
            一个光点从树干外缘亮起来，正慢慢长成新的一圈。
          </p>
        </>
      )}
    </div>
  );
}
