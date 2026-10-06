"use client";

import { motion } from "motion/react";
import type { ReactElement } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ONBOARDING_MIST } from "@/lib/scene";

export function MorningMist({ parted }: { parted: boolean }): ReactElement {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div aria-hidden data-testid="onboarding-mist" data-motion={reducedMotion ? "fade" : "fold"}
      className="pointer-events-none absolute inset-0 z-30" animate={{ opacity: parted ? 0 : 1 }}
      transition={{ duration: reducedMotion ? 0.4 : 1.5, delay: parted && !reducedMotion ? 0.5 : 0 }}>
      {ONBOARDING_MIST.map((mist, index) => (
        <svg key={index} viewBox="-1600 0 3200 1000" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
          {(["left", "right"] as const).map((side) => (
            <motion.path key={side} d={mist[side]} fill="var(--paper-cream)" opacity={mist.opacity}
              animate={{ x: parted && !reducedMotion ? (side === "left" ? -1800 : 1800) : 0 }}
              transition={{ duration: 1.5, delay: index * 0.15, ease: "easeInOut" }} />
          ))}
        </svg>
      ))}
    </motion.div>
  );
}
