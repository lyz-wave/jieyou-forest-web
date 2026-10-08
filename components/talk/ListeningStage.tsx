"use client";

import { motion } from "motion/react";
import type { ReactElement } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/** 聆听：动物不动、纸屑停下，只留一句话和慢慢亮起来的三点。 */
export function ListeningStage(): ReactElement {
  const reducedMotion = useReducedMotion();

  return (
    <div className="flex flex-col items-center gap-5 py-6 text-center">
      <h2 id="talk-title" className="font-serif text-xl text-ink">
        大家在听
      </h2>
      <p role="status" className="text-base leading-relaxed text-ink-soft">
        森林安静下来了。你说的话，它们都在听。
      </p>
      {reducedMotion ? null : (
        <span aria-hidden className="flex items-center gap-2">
          {[0, 1, 2].map((dot) => (
            <motion.span
              key={dot}
              data-testid="talk-dot"
              className="block h-2 w-2 rounded-full bg-[var(--paper-shadow)]"
              animate={{ opacity: [0.25, 1, 0.25] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: dot * 0.3 }}
            />
          ))}
        </span>
      )}
    </div>
  );
}
