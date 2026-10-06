/**
 * 手剪纸边：把多边形每条边细分，再沿法线方向随机抖动。
 * 用折线而不是曲线：既保证每个点偏离原轮廓不超过幅度，又像剪刀一刀刀剪出来的边。
 */
import type { Point } from "./geometry";
import { seeded } from "./random";

export interface RoughenOptions {
  seed: string | number;
  /** 法线方向的最大抖动距离 */
  amplitude: number;
  /** 细分步长，越小纸边越碎 */
  step: number;
}

export function roughenPolygon(polygon: readonly Point[], { seed, amplitude, step }: RoughenOptions): Point[] {
  const rng = seeded(seed);
  const out: Point[] = [];
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    if (len === 0) continue;
    const nx = -dy / len;
    const ny = dx / len;
    const segments = Math.max(1, Math.round(len / step));
    for (let s = 0; s < segments; s++) {
      const t = s / segments;
      // 顶点处不抖动，保留形状的转折
      const offset = s === 0 ? 0 : (rng() * 2 - 1) * amplitude;
      out.push({ x: a.x + dx * t + nx * offset, y: a.y + dy * t + ny * offset });
    }
  }
  return out;
}

const fmt = (n: number): string => {
  const r = Math.round(n * 10) / 10;
  return Object.is(r, -0) ? "0" : String(r);
};

export function pathFromPoints(points: readonly Point[], closed = true): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  const body = rest.map((p) => `L${fmt(p.x)} ${fmt(p.y)}`).join("");
  return `M${fmt(first.x)} ${fmt(first.y)}${body}${closed ? "Z" : ""}`;
}

export function roughPath(polygon: readonly Point[], options: RoughenOptions): string {
  return pathFromPoints(roughenPolygon(polygon, options));
}
