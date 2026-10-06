"use client";

import { useEffect, useState } from "react";

export interface ViewportSize {
  width: number;
  height: number;
}

/** 视口尺寸；首次渲染前返回 null（场景只在客户端渲染） */
export function useViewportSize(): ViewportSize | null {
  const [size, setSize] = useState<ViewportSize | null>(null);

  useEffect(() => {
    const update = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return size;
}
