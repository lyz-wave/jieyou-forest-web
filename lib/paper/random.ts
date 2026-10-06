/** 带种子的随机数。场景形状、纸偶、粒子都必须用它，保证每次渲染结果一致。 */

export type Rng = () => number;

/** mulberry32：32 位种子，返回 [0, 1) 的均匀分布 */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a 32 位字符串哈希 */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function seeded(seed: string | number): Rng {
  return mulberry32(typeof seed === "number" ? seed : hashString(seed));
}

export function between(rng: Rng, min: number, max: number): number {
  return min + rng() * (max - min);
}
