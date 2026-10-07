"use client";

import { PaperGlyph } from "@/components/ui/PaperGlyph";
import { AnimatePresence, motion } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useForestStore } from "@/lib/stores/forest";

/**
 * 「开始倾诉」按钮与聚拢后的提示纸条。
 * 本阶段坐好后只提示「倾诉功能下个版本开放」，并可以让大家散开。
 */
export function GatherControls({ count }: { count: number }) {
  const gather = useForestStore((s) => s.gather);
  const startGather = useForestStore((s) => s.startGather);
  const startDisperse = useForestStore((s) => s.startDisperse);
  const reducedMotion = useReducedMotion();
  const fade = { initial: { opacity: 0, y: reducedMotion ? 0 : 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 } };

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-3 px-4"
      style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}
    >
      <AnimatePresence mode="wait">
        {gather === "idle" && (
          <motion.button
            key="start"
            {...fade}
            type="button"
            onClick={() => startGather(count)}
            className="paper-button pointer-events-auto px-7 py-3 text-lg"
          >
            <span className="inline-flex items-center gap-2">
              <PaperGlyph kind="leaf" size={18} />
              开始倾诉
            </span>
          </motion.button>
        )}
        {gather === "seated" && (
          <motion.div key="seated" {...fade} className="paper-card pointer-events-auto flex items-center gap-3 py-2 pl-4 pr-2 text-sm">
            <p role="status">大家都在听啦，倾诉功能下个版本开放</p>
            <button type="button" onClick={() => startDisperse(count)} className="paper-button shrink-0 px-3 py-1.5">
              让大家散开
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
