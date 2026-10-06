"use client";

import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from "motion/react";
import { useEffect, useMemo, type ReactNode } from "react";
import { useParallaxInput } from "@/hooks/useParallaxInput";
import { useQualityGovernor } from "@/hooks/useQualityGovernor";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTimeOfDay } from "@/hooks/useTimeOfDay";
import { useViewportSize, type ViewportSize } from "@/hooks/useViewportSize";
import type { Layout } from "@/lib/forest/territory";
import { PARALLAX_MARGIN, PERSPECTIVE, SCENE_LAYERS, type LayerId } from "@/lib/scene";
import { clampCamera, focusCamera, maxZoomToFit, stageRect, type StagePoint } from "@/lib/scene/depth";
import { LIGHTING, lightingCssVars } from "@/lib/scene/lighting";
import { QUALITY_SETTINGS } from "@/lib/scene/quality";
import { useSceneStore } from "@/lib/stores/scene";
import { CrownGlow } from "./CrownGlow";
import { PaperLayer } from "./PaperLayer";
import { PaperTexture } from "./PaperTexture";
import { Particles } from "./Particles";
import { SceneContext, type SceneContextValue } from "./SceneContext";

const layoutOf = (vp: ViewportSize): Layout => (vp.width >= vp.height ? "landscape" : "portrait");

export interface CameraFocus {
  /** 对准的深度（px，和纸层、动物一样） */
  depth: number;
  point: StagePoint;
  /** 推近距离（px）；会被 keepWidth 限制 */
  z: number;
  /** 推近后，深度 depth 上 point.x ± keepWidth（舞台单位，按横竖屏分别给）仍要完整显示 */
  keepWidth?: Record<Layout, number>;
  /** 目标点放在视口的哪个高度（0 顶部 … 1 底部），默认中间 */
  anchorY?: number;
}

/** 相机：视差偏移 + 镜头推进。只改 world 的 transform，不触发 React 重渲染。 */
function useCamera(
  vp: ViewportSize | null,
  parallaxX: MotionValue<number>,
  parallaxY: MotionValue<number>,
  focus: CameraFocus | null,
  reducedMotion: boolean,
) {
  const baseX = useMotionValue(0);
  const baseY = useMotionValue(0);
  const baseZ = useMotionValue(0);
  const spring = reducedMotion ? { duration: 0 } : { stiffness: 70, damping: 20 };
  const sx = useSpring(baseX, spring);
  const sy = useSpring(baseY, spring);
  const sz = useSpring(baseZ, spring);

  useEffect(() => {
    if (!vp || !focus || reducedMotion) {
      baseX.set(0);
      baseY.set(0);
      baseZ.set(0);
      return;
    }
    // 留一点余量给视差，避免推近后视差把边缘带出来
    const margin = PARALLAX_MARGIN * 0.4;
    const layout = layoutOf(vp);
    const keep = focus.keepWidth?.[layout];
    const z = keep === undefined ? focus.z : Math.min(focus.z, maxZoomToFit(vp, margin, PERSPECTIVE, focus.depth, keep));
    const cam = focusCamera(vp, margin, PERSPECTIVE, focus.depth, focus.point, z, focus.anchorY);
    baseX.set(cam.x);
    baseY.set(cam.y);
    baseZ.set(cam.z);
  }, [vp, focus, reducedMotion, baseX, baseY, baseZ]);

  // 视差为 ±1 时偏移 ±margin；整体再限制在不露边的范围内
  return useTransform(() => {
    if (!vp) return "none";
    const raw = {
      x: sx.get() - parallaxX.get() * PARALLAX_MARGIN * 0.9,
      y: sy.get() - parallaxY.get() * PARALLAX_MARGIN * 0.9,
      z: sz.get(),
    };
    const cam = clampCamera(vp, PARALLAX_MARGIN, PERSPECTIVE, raw);
    return `translate3d(${cam.x}px, ${cam.y}px, ${cam.z}px)`;
  });
}

/**
 * 2.5D 纸雕场景。
 * - slots：按纸层放置的静态内容（{ [layerId]: ReactNode }）
 * - actors：放在 3D 世界里、按 (x, y, depth) 自由定位的内容（动物、篝火），用 WorldActor 包裹
 * - overlay：不参与 3D 的 UI（按钮、卡片），叠在场景上方、纸张纹理下方
 */
export function PaperScene({
  slots,
  actors,
  overlay,
  focus = null,
  timeOverride,
}: {
  slots?: Partial<Record<LayerId, ReactNode>>;
  actors?: ReactNode;
  overlay?: ReactNode;
  focus?: CameraFocus | null;
  timeOverride?: import("@/lib/scene/lighting").TimeOfDay;
}) {
  const vp = useViewportSize();
  const currentTime = useTimeOfDay();
  const time = timeOverride ?? currentTime;
  const reducedMotion = useReducedMotion();
  const quality = useSceneStore((s) => s.quality);
  const parallax = useParallaxInput();
  useQualityGovernor();

  const lighting = LIGHTING[time];
  const settings = QUALITY_SETTINGS[quality];
  const transform = useCamera(vp, parallax.x, parallax.y, focus, reducedMotion);

  const ctx = useMemo<SceneContextValue | null>(() => {
    if (!vp) return null;
    const r = stageRect(vp, PARALLAX_MARGIN);
    return {
      lighting,
      quality,
      reducedMotion,
      unit: r.unit,
      stage: { width: r.width, height: r.height },
      layout: layoutOf(vp),
    };
  }, [vp, lighting, quality, reducedMotion]);

  return (
    <div
      data-testid="paper-scene"
      data-time={time}
      data-quality={quality}
      data-parallax={parallax.source}
      data-layout={ctx?.layout}
      className="paper-scene fixed inset-0 overflow-hidden"
      style={{
        ...lightingCssVars(lighting),
        background: "linear-gradient(to bottom, var(--paper-sky-top), var(--paper-sky-bottom))",
      }}
    >
      {ctx && (
        <SceneContext.Provider value={ctx}>
          {/*
            3D 容器本身不接收点击：WebKit 做 3D 命中测试时会把 world 自己的盒子算在最前面，
            挡住里面的动物。可交互的元素自己打开 pointer-events。
          */}
          <div className="pointer-events-none absolute inset-0" style={{ perspective: PERSPECTIVE }}>
            <motion.div
              data-testid="paper-world"
              className="pointer-events-none absolute inset-0"
              style={{ transformStyle: "preserve-3d", transform, willChange: "transform" }}
            >
              {SCENE_LAYERS.filter((l) => settings.farTrees || !l.optional).map((layer) => (
                <PaperLayer
                  key={layer.id}
                  layer={layer}
                  perspective={PERSPECTIVE}
                  before={layer.id === "forest" ? <CrownGlow /> : undefined}
                >
                  {slots?.[layer.id]}
                </PaperLayer>
              ))}
              {actors}
            </motion.div>
          </div>
          {/* 时段色调：一层半透明的颜色叠加 */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 transition-[background-color] duration-[3000ms]"
            style={{ backgroundColor: "var(--paper-tint)" }}
          />
          <Particles count={settings.particles} night={lighting.fireflies} reducedMotion={reducedMotion} />
          {overlay}
          {parallax.canRequestPermission && (
            <button
              type="button"
              onClick={() => void parallax.requestPermission()}
              className="paper-button absolute right-3 top-20 z-30 px-3 py-2 text-sm"
              style={{ marginTop: "env(safe-area-inset-top)" }}
            >
              🍃 开启体感
            </button>
          )}
        </SceneContext.Provider>
      )}
      <PaperTexture />
    </div>
  );
}
