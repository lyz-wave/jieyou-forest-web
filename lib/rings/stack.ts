/**
 * 年轮的纸雕：每一圈是一张环形纸片，从外到内一层层叠高（等高线纸雕）。
 * 这里只放算位置与颜色的纯函数，画的部分在 components/rings/RingBrowser.tsx。
 */

/** 每往里一层，纸片抬高多少像素 */
export const LAYER_STEP = 7;
/** 纸的厚度：侧面比纸面矮这么多 */
export const LAYER_THICKNESS = 3;
/** 点上一圈时，它先抬起发光的时长（毫秒） */
export const RISE_MS = 340;
/** 抬起时额外多抬多少像素 */
export const RISE_EXTRA = 10;

/**
 * 一层层叠高的高度表：数组顺序就是从外到内（最外圈是 0，最内圈最负、也就是最高）。
 */
export function layerLifts(total: number, step = LAYER_STEP): number[] {
  const count = Math.max(0, Math.floor(total));
  return Array.from({ length: count }, (_unused, index) => {
    const lift = -(count - 1 - index) * step;
    // 最外圈是 0，不要让它变成 -0
    return lift === 0 ? 0 : lift;
  });
}

function circle(cx: number, cy: number, radius: number): string {
  const r = Math.max(0.5, radius);
  return "M " + String(cx - r) + " " + String(cy) + " a " + String(r) + " " + String(r) + " 0 1 0 " + String(2 * r) + " 0 a " + String(r) + " " + String(r) + " 0 1 0 " + String(-2 * r) + " 0 Z";
}

/**
 * 一个环形纸片的路径：环宽撑出内外两个圆，配 fillRule="evenodd" 就能把中间挖空。
 * 环宽比半径还大时只剩一张圆纸片。
 */
export function annulusPath(radius: number, width: number, cx: number, cy: number): string {
  const outer = radius + width / 2;
  const inner = radius - width / 2;
  if (inner <= 0.5) return circle(cx, cy, outer);
  return circle(cx, cy, outer) + " " + circle(cx, cy, inner);
}

function channels(color: string): [number, number, number] | null {
  const hit = /^#([0-9a-fA-F]{6})$/.exec(color.trim());
  if (hit === null) return null;
  const value = Number.parseInt(hit[1] ?? "", 16);
  if (Number.isNaN(value)) return null;
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function hex(parts: [number, number, number]): string {
  const at = (value: number): string => Math.round(Math.max(0, Math.min(255, value))).toString(16).padStart(2, "0");
  return "#" + at(parts[0]) + at(parts[1]) + at(parts[2]);
}

/** 纸的侧面（裁口）：把纸色压暗一点 */
export function shade(color: string, amount: number): string {
  const c = channels(color);
  if (c === null) return color;
  const k = Math.max(0, Math.min(1, amount));
  return hex([c[0] * (1 - k), c[1] * (1 - k), c[2] * (1 - k)]);
}

/** 纸上的光点：把纸色提亮一点 */
export function lighten(color: string, amount: number): string {
  const c = channels(color);
  if (c === null) return color;
  const k = Math.max(0, Math.min(1, amount));
  return hex([c[0] + (255 - c[0]) * k, c[1] + (255 - c[1]) * k, c[2] + (255 - c[2]) * k]);
}

/** 光点缀在那一圈的正上方 */
export function sparkAt(radius: number, cx: number, cy: number): { x: number; y: number } {
  return { x: cx, y: cy - radius };
}
