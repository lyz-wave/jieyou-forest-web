"use client";

import { PaperGlyph } from "@/components/ui/PaperGlyph";
import { AnimatePresence, motion } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useForestStore } from "@/lib/stores/forest";
import { useTalkStore } from "@/lib/stores/talk";

/**
 * 「开始倾诉」按钮与聚拢后的纸条。
 * 按下去两件事一起发生：七只聚拢坐好，倾诉界面打开（见 TalkFlow）。
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
            onClick={() => {
              startGather(count);
              useTalkStore.getState().open();
            }}
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
            <p role="status">大家都在古树前坐好了</p>
            <button
              type="button"
              onClick={() => {
                useTalkStore.getState().finish();
                startDisperse(count);
              }}
              className="paper-button shrink-0 px-3 py-1.5"
            >
              让大家散开
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}