"use client";

import { useEffect, useState } from "react";
import { getTimeOfDay, type TimeOfDay } from "@/lib/scene/lighting";
import { useSceneStore } from "@/lib/stores/scene";

/** 当前时段：每分钟检查一次真实时间；开发调试时可被覆盖 */
export function useTimeOfDay(): TimeOfDay {
  const override = useSceneStore((s) => s.timeOverride);
  const [real, setReal] = useState<TimeOfDay>(() => getTimeOfDay(new Date()));

  useEffect(() => {
    const id = window.setInterval(() => setReal(getTimeOfDay(new Date())), 60_000);
    return () => window.clearInterval(id);
  }, []);

  return override ?? real;
}
