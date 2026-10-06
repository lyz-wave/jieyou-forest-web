"use client";

import { useEffect } from "react";
import { createQualityGovernor } from "@/lib/scene/quality";
import { useSceneStore } from "@/lib/stores/scene";

/** 用 rAF 采样帧率，掉帧时自动降低画质（写入 scene store）。手动锁定画质后不再采样。 */
export function useQualityGovernor(): void {
  const locked = useSceneStore((s) => s.qualityLocked);

  useEffect(() => {
    if (locked) return;
    const gov = createQualityGovernor({ initial: useSceneStore.getState().quality });
    const unsubscribe = gov.onChange((q) => useSceneStore.getState().setQuality(q));
    let frame = 0;
    const tick = (t: number) => {
      gov.sample(t);
      frame = requestAnimationFrame(tick);
    };
    const onVisibility = () => {
      if (document.hidden) gov.pause();
    };
    frame = requestAnimationFrame(tick);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", onVisibility);
      unsubscribe();
    };
  }, [locked]);
}
