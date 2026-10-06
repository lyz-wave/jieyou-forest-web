"use client";

import type { CSSProperties, ReactNode } from "react";
import { STAGE_H } from "@/lib/scene/depth";
import { useScene } from "./SceneContext";

/**
 * 在纸层里按舞台坐标放置 HTML 内容。
 * (x, y) 是锚点：默认锚在内容的底边中点（动物站在地上）。
 * size 是内容的舞台单位宽高，会换算成像素。
 */
export function StageItem({
  x,
  y,
  width,
  height,
  anchor = "bottom",
  children,
  className,
  style,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  anchor?: "bottom" | "center";
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const { unit, stage } = useScene();
  // 舞台 SVG 用 slice 铺满：舞台中心对齐容器中心
  const cx = stage.width / 2 + x * unit;
  const cy = stage.height / 2 + (y - STAGE_H / 2) * unit;
  const w = width * unit;
  const h = height * unit;
  return (
    <div
      className={`absolute ${className ?? ""}`}
      style={{
        left: cx - w / 2,
        top: anchor === "bottom" ? cy - h : cy - h / 2,
        width: w,
        height: h,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
