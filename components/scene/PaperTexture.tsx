"use client";

import { memo } from "react";

/**
 * 全屏纸张纹理：feTurbulence 噪点 + multiply 叠加。
 * 用一张小 SVG 做背景平铺，浏览器只栅格化一次；不拦截任何交互。
 */
const NOISE_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.45  0 0 0 0 0.38  0 0 0 0 0.3  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`;
const FIBER_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='480'><filter id='f'><feTurbulence type='fractalNoise' baseFrequency='0.012 0.09' numOctaves='2' seed='7'/><feColorMatrix values='0 0 0 0 0.5  0 0 0 0 0.42  0 0 0 0 0.32  0 0 0 0.35 0'/></filter><rect width='100%' height='100%' filter='url(#f)'/></svg>`;

const url = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

export const PaperTexture = memo(function PaperTexture() {
  return (
    <div
      data-testid="paper-texture"
      aria-hidden
      className="pointer-events-none fixed inset-0 z-40"
      style={{
        backgroundImage: `${url(NOISE_SVG)}, ${url(FIBER_SVG)}`,
        mixBlendMode: "multiply",
        opacity: 0.32,
      }}
    />
  );
});
