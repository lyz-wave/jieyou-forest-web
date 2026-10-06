"use client";

import { memo, type ReactNode } from "react";
import type { PaperPiece, SceneLayer } from "@/lib/scene";
import { layerScale, STAGE_H, STAGE_W } from "@/lib/scene/depth";
import { shadowOffset, type Palette } from "@/lib/scene/lighting";
import { LayerContext, useScene } from "./SceneContext";

const PALETTE_VAR: Record<keyof Palette, string> = {
  skyTop: "var(--paper-sky-top)",
  skyBottom: "var(--paper-sky-bottom)",
  hillFar: "var(--paper-hill-far)",
  treeFar: "var(--paper-tree-far)",
  forestMid: "var(--paper-forest-mid)",
  meadow: "var(--paper-meadow)",
  fore: "var(--paper-fore)",
  trunk: "var(--paper-trunk)",
  stream: "var(--paper-stream)",
  cloud: "var(--paper-cloud)",
  bloom: "var(--paper-bloom)",
  bloomCenter: "var(--paper-bloom-center)",
};

function fillOf(fill: PaperPiece["fill"]): string {
  if (fill === "glow") return "var(--paper-glow)";
  return fill.startsWith("#") ? fill : PALETTE_VAR[fill as keyof Palette];
}

const VIEWBOX = `${-STAGE_W / 2} 0 ${STAGE_W} ${STAGE_H}`;

/** 纸层的静态 SVG：先画所有阴影副本，再画纸片。整个 SVG 不做动画，只被栅格化一次。 */
const LayerArt = memo(function LayerArt({
  layer,
  shadowDx,
  shadowDy,
  blur,
}: {
  layer: SceneLayer;
  shadowDx: number;
  shadowDy: number;
  blur: boolean;
}) {
  const filterId = `soft-${layer.id}`;
  const maskId = (i: number) => `cut-${layer.id}-${i}`;
  const maskOf = (p: PaperPiece, i: number) => (p.cutouts ? `url(#${maskId(i)})` : undefined);
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox={VIEWBOX}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        {blur && (
          <filter id={filterId} x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        )}
        {layer.pieces.map(
          (p, i) =>
            p.cutouts && (
              <mask key={i} id={maskId(i)} maskUnits="userSpaceOnUse" x={-STAGE_W} y={-STAGE_H} width={STAGE_W * 2} height={STAGE_H * 3}>
                <rect x={-STAGE_W} y={-STAGE_H} width={STAGE_W * 2} height={STAGE_H * 3} fill="#fff" />
                <path d={p.cutouts} fill="#000" />
              </mask>
            ),
        )}
      </defs>
      <g fill="var(--paper-shadow)" filter={blur ? `url(#${filterId})` : undefined} style={{ opacity: "var(--paper-shadow-alpha)" }}>
        {layer.pieces.map(
          (p, i) =>
            p.shadow > 0 && (
              // 遮罩挂在平移后的 <g> 内部，镂空会跟着阴影一起偏移
              <g key={i} transform={`translate(${shadowDx * p.shadow} ${shadowDy * p.shadow})`}>
                <path d={p.d} mask={maskOf(p, i)} />
              </g>
            ),
        )}
      </g>
      {layer.pieces.map((p, i) => (
        <path key={i} d={p.d} fill={fillOf(p.fill)} opacity={p.opacity} mask={maskOf(p, i)} />
      ))}
    </svg>
  );
});

/**
 * 一个纸层：translateZ(-depth) + 缩放补偿，内部是铺满舞台的 SVG 和子元素（动物等）。
 * 子元素用 StageItem 按舞台坐标定位。
 */
export function PaperLayer({
  layer,
  perspective,
  children,
  before,
}: {
  layer: SceneLayer;
  perspective: number;
  children?: ReactNode;
  /** 画在纸层下方的内容（比如夜晚树冠后面的暖光） */
  before?: ReactNode;
}) {
  const { lighting, quality, stage } = useScene();
  const s = layerScale(layer.depth, perspective);
  const { dx, dy } = shadowOffset(lighting, 1);
  return (
    <LayerContext.Provider value={layer.id}>
      <div
        data-layer={layer.id}
        className="pointer-events-none absolute left-1/2 top-1/2"
        style={{
          width: stage.width,
          height: stage.height,
          marginLeft: -stage.width / 2,
          marginTop: -stage.height / 2,
          transform: `translateZ(${-layer.depth}px) scale(${s})`,
          transformStyle: "preserve-3d",
        }}
      >
        {before}
        <LayerArt layer={layer} shadowDx={dx} shadowDy={dy} blur={quality === "high"} />
        {children}
      </div>
    </LayerContext.Provider>
  );
}
