/**
 * 年轮的剪纸：一圈圈手剪出来的环带，像从纸上剪下来的树轮。
 * 这里只算路径与颜色，画的部分在 components/rings/RingBrowser.tsx。
 */

import { seeded } from "@/lib/paper/random";

/** 木头的底色：情绪的颜色往这里调，年轮才像木头而不是色环 */
export const WOOD = "#d9bf8e";
/** 树皮 */
export const BARK = "#a2794c";
/** 切面最浅的那层木色 */
export const WOOD_LIGHT = "#efe0bd";

export interface PaperPoint {
  x: number;
  y: number;
}

export interface CircleSpec {
  cx: number;
  cy: number;
  radius: number;
  seed: number;
  /** 半径起伏的幅度（相对半径），默认 0.05 */
  wobble?: number;
  /** 采样点个数，默认 48 */
  samples?: number;
  /** 边缘的波浪数（剪纸的花边），0 就是没有花边 */
  petals?: number;
  /** 波浪有多深（相对半径） */
  petal?: number;
}

function fmt(value: number): string {
  return String(Math.round(value * 10) / 10);
}

/** 一个手剪的不圆：半径沿角度起伏，同一个种子永远长一个样 */
export function wobbledCircle(spec: CircleSpec): PaperPoint[] {
  const { cx, cy, radius, seed } = spec;
  const wobble = spec.wobble ?? 0.05;
  const petals = spec.petals ?? 0;
  const petal = spec.petal ?? 0;
  const count = Math.max(8, Math.floor(spec.samples ?? 48));
  const rng = seeded(seed);
  const phaseA = rng() * Math.PI * 2;
  const phaseB = rng() * Math.PI * 2;
  const phaseC = rng() * Math.PI * 2;
  return Array.from({ length: count }, (_unused, index) => {
    const angle = (Math.PI * 2 * index) / count;
    const wave =
      0.6 * Math.sin(3 * angle + phaseA) + 0.3 * Math.sin(5 * angle + phaseB) + 0.1 * Math.sin(7 * angle + phaseC);
    const scallop = petals > 0 ? petal * Math.cos(petals * angle) : 0;
    const r = radius * (1 + wobble * wave + scallop);
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
}

/** 把一串点连成平滑的闭合曲线（Catmull-Rom 转三次贝塞尔），剪出来的边不是折线 */
export function smoothClosedPath(points: PaperPoint[]): string {
  if (points.length === 0) return "";
  const at = (index: number): PaperPoint => points[((index % points.length) + points.length) % points.length] as PaperPoint;
  const first = at(0);
  if (points.length < 3) {
    return "M " + points.map((point) => fmt(point.x) + " " + fmt(point.y)).join(" L ") + " Z";
  }
  let d = "M " + fmt(first.x) + " " + fmt(first.y);
  for (let index = 0; index < points.length; index++) {
    const previous = at(index - 1);
    const one = at(index);
    const two = at(index + 1);
    const next = at(index + 2);
    const control1 = { x: one.x + (two.x - previous.x) / 6, y: one.y + (two.y - previous.y) / 6 };
    const control2 = { x: two.x - (next.x - one.x) / 6, y: two.y - (next.y - one.y) / 6 };
    d += " C " + fmt(control1.x) + " " + fmt(control1.y) + " " + fmt(control2.x) + " " + fmt(control2.y) + " " + fmt(two.x) + " " + fmt(two.y);
  }
  return d + " Z";
}
export interface PackedRing {
  /** 环带中心线的半径 */
  radius: number;
  /** 环带有多宽 */
  width: number;
}

/** 最窄的一圈也有这么宽，不然点不着也看不见 */
export const MIN_BAND = 5;

export interface BandSpec {
  cx: number;
  cy: number;
  /** 环带中心线的半径 */
  radius: number;
  /** 环带有多宽 */
  width: number;
  seed: number;
  wobble?: number;
  /** 边缘的波浪数（剪纸的花边），0 就是没有花边 */
  petals?: number;
  /** 波浪有多深（相对半径） */
  petal?: number;
  /** 挖几个剪纸的小口 */
  cuts?: number;
  /** 内圈自己起伏多大（相对半径），不给就 0.06：宽度沿圆周有粗有细，才像树轮 */
  innerWobble?: number;
  /** 小口有多大，不给就按环宽算 */
  cutSize?: number;
}

/** 剪纸的镂空：在环带上挖出小叶子那样的口子 */
export function cutHoles(spec: BandSpec & { count: number; size?: number }): string[] {
  const count = Math.max(0, Math.floor(spec.count));
  if (count === 0 || spec.width < 4) return [];
  const rng = seeded(spec.seed + 977);
  const room = Math.max(1.2, Math.min(spec.width * 0.3, 4));
  const size = spec.size !== undefined && spec.size > 0 ? Math.min(spec.size, room) : room;
  return Array.from({ length: count }, (_unused, index) => {
    const angle = (Math.PI * 2 * index) / count + rng() * 0.9;
    const at = { x: spec.cx + spec.radius * Math.cos(angle), y: spec.cy + spec.radius * Math.sin(angle) };
    const turn = angle + Math.PI / 2;
    const leaf = [
      { x: 0, y: -size },
      { x: size * 0.62, y: 0 },
      { x: 0, y: size },
      { x: -size * 0.62, y: 0 },
    ].map((point) => ({
      x: at.x + point.x * Math.cos(turn) - point.y * Math.sin(turn),
      y: at.y + point.x * Math.sin(turn) + point.y * Math.cos(turn),
    }));
    return smoothClosedPath(leaf);
  });
}

/** 内外两条边最近也要留出这么宽，免得剪断了 */
const MIN_EDGE = 1.4;

/**
 * 环带的两条边。外圈是一次手剪；内圈自己另剪一次、起伏另起一个相位，
 * 于是宽度沿圆周有粗有细（真年轮就是这样，宽的那一边那年长得快）；
 * 内圈被外圈挤到只剩一条缝时会被推回去，不会戳出纸外。
 */
export function bandEdges(spec: BandSpec): { outer: PaperPoint[]; inner: PaperPoint[] | null } {
  const outerRadius = Math.max(0.5, spec.radius + spec.width / 2);
  const innerRadius = spec.radius - spec.width / 2;
  const outer = wobbledCircle({
    cx: spec.cx,
    cy: spec.cy,
    radius: outerRadius,
    seed: spec.seed,
    wobble: spec.wobble,
    petals: spec.petals,
    petal: spec.petal,
  });
  if (innerRadius <= 0.6) return { outer, inner: null };
  const raw = wobbledCircle({
    cx: spec.cx,
    cy: spec.cy,
    radius: innerRadius,
    seed: spec.seed + 9911,
    wobble: spec.innerWobble ?? 0.06,
    samples: outer.length,
  });
  const floor = Math.max(MIN_EDGE, innerRadius * 0.45);
  const inner = raw.map((point, index) => {
    const away = outer[index] ?? point;
    const outward = { x: point.x - spec.cx, y: point.y - spec.cy };
    const len = Math.hypot(outward.x, outward.y);
    const reach = Math.hypot(away.x - spec.cx, away.y - spec.cy);
    const target = Math.min(Math.max(len, floor), Math.max(floor, reach - MIN_EDGE));
    const k = len === 0 ? 1 : target / len;
    return { x: spec.cx + outward.x * k, y: spec.cy + outward.y * k };
  });
  return { outer, inner };
}

/**
 * 一张环形纸片：外圈 + 内圈（fillRule="evenodd" 就能把中间挖空）+ 剪纸的小口。
 * 半径比环宽还小时只剩一张圆纸片。
 */
export function ringPaperPath(spec: BandSpec): string {
  const { outer, inner } = bandEdges(spec);
  let d = smoothClosedPath(outer);
  if (inner !== null) d += " " + smoothClosedPath(inner);
  for (const hole of cutHoles({ ...spec, count: spec.cuts ?? 0, size: spec.cutSize })) d += " " + hole;
  return d;
}

/**
 * 年轮一圈挨着一圈长，不是等距排开的靶子：从核心往外一圈接一圈，
 * 每圈的宽窄由那一年的记录数定（宽的就多长一点），圈与圈之间只留一条缝。
 * 圈太多、盘子里放不下时整体收窄，最少留 MIN_BAND 宽，再挤不下就只留缝。
 */
export function packedRings(widths: number[], core: number, max: number, gap = 4): PackedRing[] {
  const count = widths.length;
  if (count === 0) return [];
  const room = Math.max(1, max - core);
  let bands = widths.map((width) => Math.max(MIN_BAND, width));
  let space = gap;
  const need = bands.reduce((sum, width) => sum + width, 0) + space * (count - 1);
  if (need > room) {
    const shrink = (room - space * (count - 1)) / bands.reduce((sum, width) => sum + width, 0);
    if (shrink * MIN_BAND >= MIN_BAND) {
      bands = bands.map((width) => width * shrink);
    } else {
      bands = bands.map(() => MIN_BAND);
      space = Math.max(0, (room - MIN_BAND * count) / Math.max(1, count - 1));
    }
  }
  const out: PackedRing[] = [];
  let edge = core;
  for (const width of bands) {
    out.push({ radius: edge + width / 2, width });
    edge += width + space;
  }
  return out;
}

/** 一圈里的一根木纹 */
export function grainPath(spec: { cx: number; cy: number; radius: number; seed: number }): string {
  return smoothClosedPath(
    wobbledCircle({ cx: spec.cx, cy: spec.cy, radius: spec.radius, seed: spec.seed + 31, wobble: 0.04, samples: 36 }),
  );
}

/**
 * 真年轮不是同一个圆心：越往外偏得越多。同种子同序号永远一样，偏移不会超过 max。
 */
export function eccentricAt(seed: number, index: number, max = 4): PaperPoint {
  const rng = seeded(seed + index * 13 + 7);
  const grow = Math.min(1, Math.max(0, index) / 6);
  const a = rng();
  const b = rng();
  const base = { x: Math.sin(seed * 1.3), y: Math.cos(seed * 0.9) };
  return {
    x: max * (0.6 * grow * base.x + 0.4 * (a * 2 - 1)),
    y: max * (0.6 * grow * base.y + 0.4 * (b * 2 - 1)),
  };
}

function rgb(color: string): [number, number, number] | null {
  const hit = /^#([0-9a-fA-F]{6})$/.exec(color.trim());
  if (hit === null) return null;
  const value = Number.parseInt(hit[1] ?? "", 16);
  if (Number.isNaN(value)) return null;
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function hexOf(parts: [number, number, number]): string {
  const at = (value: number): string =>
    Math.round(Math.max(0, Math.min(255, value))).toString(16).padStart(2, "0");
  return "#" + at(parts[0]) + at(parts[1]) + at(parts[2]);
}

/** 把情绪色往木头色里调一点：年轮该像木头，只是带着那一年的颜色 */
export function woodTint(color: string, amount: number): string {
  const from = rgb(color);
  const to = rgb(WOOD);
  if (from === null || to === null) return color;
  const k = Math.max(0, Math.min(1, amount));
  return hexOf([
    from[0] + (to[0] - from[0]) * k,
    from[1] + (to[1] - from[1]) * k,
    from[2] + (to[2] - from[2]) * k,
  ]);
}
