"use client";

import { createContext, useContext } from "react";
import type { Layout } from "@/lib/forest/territory";
import type { LayerId } from "@/lib/scene";
import type { Lighting } from "@/lib/scene/lighting";
import type { Quality } from "@/lib/scene/quality";

export interface SceneContextValue {
  lighting: Lighting;
  quality: Quality;
  reducedMotion: boolean;
  /** 1 舞台单位 = 多少 CSS px */
  unit: number;
  /** 舞台像素尺寸（含视差余量） */
  stage: { width: number; height: number };
  /** 竖屏或横屏：决定动物用哪套位置 */
  layout: Layout;
}

export const SceneContext = createContext<SceneContextValue | null>(null);

export function useScene(): SceneContextValue {
  const ctx = useContext(SceneContext);
  if (!ctx) throw new Error("useScene 必须在 <PaperScene> 内使用");
  return ctx;
}

export const LayerContext = createContext<LayerId | null>(null);
