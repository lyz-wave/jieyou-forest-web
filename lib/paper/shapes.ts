/** 基础形状生成器：只返回顶点，交给 roughen 生成手剪路径。 */
import type { Point } from "./geometry";
import type { Rng } from "./random";
import { between } from "./random";

export function ellipse(cx: number, cy: number, rx: number, ry: number, segments = 24): Point[] {
  return Array.from({ length: segments }, (_, i) => {
    const a = (i / segments) * Math.PI * 2;
    return { x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry };
  });
}

/** 不规则团块（树冠、云、灌木）：半径在 r × (1 ± wobble) 之间起伏 */
export function blob(
  rng: Rng,
  cx: number,
  cy: number,
  r: number,
  { wobble = 0.15, segments = 18, squashY = 1 }: { wobble?: number; segments?: number; squashY?: number } = {},
): Point[] {
  return Array.from({ length: segments }, (_, i) => {
    const a = (i / segments) * Math.PI * 2;
    const rr = r * (1 + between(rng, -wobble, wobble));
    return { x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr * squashY };
  });
}

/** 叶片：两端尖、中间宽；angle 是长轴方向（弧度） */
export function leaf(cx: number, cy: number, length: number, width: number, angle: number, segments = 10): Point[] {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const pts: Point[] = [];
  for (let side = 0; side < 2; side++) {
    for (let i = 0; i < segments; i++) {
      const t = side === 0 ? i / segments : 1 - i / segments;
      const lx = (t - 0.5) * length;
      const ly = (side === 0 ? -1 : 1) * Math.sin(Math.PI * t) * (width / 2);
      pts.push({ x: cx + lx * cos - ly * sin, y: cy + lx * sin + ly * cos });
    }
  }
  return pts;
}

/** 月牙：外圆减去偏移的内圆；opening 是缺口朝向（弧度） */
export function crescent(cx: number, cy: number, r: number, opening: number, segments = 20): Point[] {
  const ox = Math.cos(opening) * r * 0.45;
  const oy = Math.sin(opening) * r * 0.45;
  const inner = r * 0.85;
  const outer: Point[] = [];
  const innerPts: Point[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = opening + Math.PI * 0.32 + (i / segments) * Math.PI * 1.36;
    outer.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
  }
  for (let i = segments; i >= 0; i--) {
    const a = opening + Math.PI * 0.55 + (i / segments) * Math.PI * 0.9;
    const p = { x: cx + ox + Math.cos(a) * inner, y: cy + oy + Math.sin(a) * inner };
    // 内弧必须落在外圆里
    const d = Math.hypot(p.x - cx, p.y - cy);
    innerPts.push(d > r ? { x: cx + ((p.x - cx) / d) * r, y: cy + ((p.y - cy) / d) * r } : p);
  }
  return [...outer, ...innerPts];
}

export interface RidgeOptions {
  x0: number;
  x1: number;
  baseY: number;
  amplitude: number;
  bottomY: number;
  step: number;
}

/** 山脊：几个正弦叠加出起伏的顶线，再沿底边闭合 */
export function ridge(rng: Rng, { x0, x1, baseY, amplitude, bottomY, step }: RidgeOptions): Point[] {
  const waves = Array.from({ length: 3 }, (_, i) => ({
    freq: between(rng, 0.6, 1.4) * (i + 1) * ((Math.PI * 2) / (x1 - x0)),
    phase: between(rng, 0, Math.PI * 2),
    weight: 1 / (i + 1),
  }));
  const total = waves.reduce((s, w) => s + w.weight, 0);
  const top: Point[] = [];
  const n = Math.max(2, Math.round((x1 - x0) / step));
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    const v = waves.reduce((s, w) => s + Math.sin(x * w.freq + w.phase) * w.weight, 0) / total;
    top.push({ x, y: baseY + v * amplitude });
  }
  return [...top, { x: x1, y: bottomY }, { x: x0, y: bottomY }];
}

export interface TreeLineOptions {
  x0: number;
  x1: number;
  baseY: number;
  bottomY: number;
  minH: number;
  maxH: number;
  spacing: number;
  step: number;
}

/** 远处一排树：每棵是一个尖顶或圆顶的轮廓，取所有树的上包络线 */
export function treeLine(rng: Rng, { x0, x1, baseY, bottomY, minH, maxH, spacing, step }: TreeLineOptions): Point[] {
  const trees: { x: number; h: number; w: number; round: boolean }[] = [];
  for (let x = x0 - spacing; x <= x1 + spacing; x += spacing * between(rng, 0.6, 1.1)) {
    trees.push({ x, h: between(rng, minH, maxH), w: spacing * between(rng, 0.55, 0.85), round: rng() < 0.45 });
  }
  const heightAt = (x: number): number => {
    let best = 0;
    for (const t of trees) {
      const u = Math.abs(x - t.x) / t.w;
      if (u >= 1) continue;
      const h = t.round ? t.h * Math.sqrt(1 - u * u) : t.h * (1 - u);
      if (h > best) best = h;
    }
    return Math.min(maxH, best);
  };
  const top: Point[] = [];
  const n = Math.max(2, Math.round((x1 - x0) / step));
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    top.push({ x, y: baseY - heightAt(x) });
  }
  return [...top, { x: x1, y: bottomY }, { x: x0, y: bottomY }];
}
