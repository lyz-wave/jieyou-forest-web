/** 纸片粒子参数：全部由种子决定，渲染时通过 CSS 变量传给关键帧动画。 */
import { between, seeded } from "../paper/random";

export type ParticleKind = "leaf" | "mote" | "firefly";

export interface Particle {
  kind: ParticleKind;
  /** 起点横向位置（视口宽度百分比） */
  left: number;
  /** 光斑和萤火虫的纵向位置（视口高度百分比） */
  top: number;
  size: number;
  /** 秒 */
  duration: number;
  /** 秒；负数表示动画已经播到一半，避免一开始全挤在顶部 */
  delay: number;
  /** 左右摇摆幅度（px） */
  sway: number;
  /** 正面颜色 */
  front: string;
  /** 背面颜色（落叶翻过去时显示） */
  back: string;
}

const LEAF_COLORS: readonly [string, string][] = [
  ["#7da55e", "#b7cf8f"],
  ["#d99a3e", "#f0c97a"],
  ["#c8553d", "#e79a7f"],
  ["#5f8f64", "#9cc49a"],
];

export function makeParticles(count: number, night: boolean): Particle[] {
  const rng = seeded(`particles-${night ? "night" : "day"}`);
  return Array.from({ length: count }, (_, i) => {
    const roll = rng();
    const kind: ParticleKind = night ? (roll < 0.55 ? "firefly" : roll < 0.8 ? "leaf" : "mote") : roll < 0.6 ? "leaf" : "mote";
    const [front, back] = LEAF_COLORS[i % LEAF_COLORS.length];
    const duration = kind === "leaf" ? between(rng, 14, 24) : between(rng, 6, 12);
    return {
      kind,
      left: between(rng, 0, 100),
      top: kind === "firefly" ? between(rng, 40, 92) : between(rng, 10, 70),
      size: kind === "leaf" ? between(rng, 10, 18) : kind === "firefly" ? between(rng, 4, 7) : between(rng, 5, 11),
      duration,
      delay: -between(rng, 0, duration),
      sway: between(rng, 20, 60),
      front,
      back,
    };
  });
}
