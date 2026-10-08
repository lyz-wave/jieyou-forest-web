"use client";

import { useEffect, useState } from "react";
import { reveal } from "@/lib/talk/flow";

/** 打字机的速度：每个字多少毫秒 */
export const TYPE_MS = 28;

/**
 * 一次出一点字，说到这里为止。
 * 换一段话会从头开始；减弱动画时整段直接出现。
 */
export function useTypewriter(text: string, reducedMotion = false, intervalMs = TYPE_MS): string {
  const [state, setState] = useState({ text: "", shown: 0 });
  const shown = state.text === text ? state.shown : 0;

  useEffect(() => {
    if (!text || reducedMotion) return;
    let count = 0;
    const timer = window.setInterval(() => {
      count += 1;
      setState({ text, shown: count });
      if (count >= text.length) window.clearInterval(timer);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [text, reducedMotion, intervalMs]);

  if (reducedMotion) return text;
  return reveal(text, shown);
}