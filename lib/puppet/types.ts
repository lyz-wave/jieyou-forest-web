/**
 * 纸偶结构：部件 + 关节点。像用两脚钉固定的纸偶，子部件跟着父部件转。
 * 以后换画师素材时，只要按这个结构给出每个部件的 path 和关节点即可。
 */
import { hashString } from "../paper/random";

export type IdleKind = "breathe" | "blink" | "sway";

export interface IdleMotion {
  kind: IdleKind;
  /** 一个周期的秒数 */
  duration: number;
  /** breathe：缩放幅度（0.03 = 3%）；sway：摆动角度（度）；blink：闭眼时的纵向比例 */
  amount: number;
}

/** 步态里这个部件扮演的角色：腿前后摆、翅膀扇动 */
export type GaitRole = "leg-front" | "leg-back" | "wing";

export interface PuppetPart {
  id: string;
  gait?: GaitRole;
  /** SVG path，坐标在纸偶的 viewBox 内 */
  path: string;
  fill: string;
  /** 墨色细节（眼睛、鼻子、胡须）：不计入纸色数量，也不投影 */
  ink?: boolean;
  /** 关节点（viewBox 坐标），转动和缩放都以它为中心 */
  joint: [number, number];
  /** 同级部件的叠放顺序，越大越靠前；子部件 z < 0 画在父部件后面 */
  z: number;
  /** 在关节上画两脚钉 */
  pin?: boolean;
  idle?: IdleMotion;
  /** 只在水里显示（比如水獭腰间的水面纸条），上岸后隐藏 */
  waterOnly?: boolean;
  children?: PuppetPart[];
}

export interface PuppetDef {
  id: string;
  /** [宽, 高] */
  viewBox: [number, number];
  /** 纸偶画出来时的朝向；翻转朝向时以它为准 */
  facing: "left" | "right";
  parts: PuppetPart[];
  /** 点击时摆动的标志性部件 */
  signature: { part: string; angle: number };
  /**
   * 泡在水里的纸偶：viewBox 里这个 y 以下的部分在水面下，渲染时裁掉，
   * 并把这条水线对齐到所站位置（溪流中线）。
   */
  waterline?: number;
}

export function* walkParts(parts: readonly PuppetPart[]): Generator<PuppetPart> {
  for (const p of parts) {
    yield p;
    if (p.children) yield* walkParts(p.children);
  }
}

/** 主体纸色（不含墨色细节） */
export function puppetColors(def: PuppetDef): string[] {
  const colors = new Set<string>();
  for (const p of walkParts(def.parts)) if (!p.ink) colors.add(p.fill.toLowerCase());
  return [...colors];
}

export function validatePuppet(def: PuppetDef): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const kinds = new Set<IdleKind>();
  const [w, h] = def.viewBox;
  for (const p of walkParts(def.parts)) {
    if (ids.has(p.id)) errors.push(`${def.id}：部件 id「${p.id}」重复`);
    ids.add(p.id);
    const [jx, jy] = p.joint;
    if (jx < 0 || jx > w || jy < 0 || jy > h) errors.push(`${def.id}：部件「${p.id}」的关节点 (${jx}, ${jy}) 超出 viewBox`);
    if (p.idle) kinds.add(p.idle.kind);
  }
  const colors = puppetColors(def).length;
  if (colors < 2 || colors > 4) errors.push(`${def.id}：主体纸色有 ${colors} 种，应为 2–4 种`);
  for (const k of ["breathe", "blink", "sway"] as const) {
    if (!kinds.has(k)) errors.push(`${def.id}：缺少待机动画 ${k}`);
  }
  if (!ids.has(def.signature.part)) errors.push(`${def.id}：标志性部件「${def.signature.part}」不存在`);
  return errors;
}

/** 约 12 帧/秒的定格感：CSS steps() 的步数 = 周期秒数 × 12 */
const FPS = 12;

export function idleSteps(duration: number): number {
  return Math.max(2, Math.round(duration * FPS));
}

/** 待机动画起始延迟：由纸偶和部件 id 决定，固定且各不相同 */
export function idleDelay(puppetId: string, partId: string, duration: number): number {
  const r = hashString(`${puppetId}/${partId}`) / 2 ** 32;
  return -Math.round(r * duration * 100) / 100;
}
