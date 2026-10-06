/**
 * 森林的地面和溪流（纯函数）。
 *
 * 草地是夹在「草地纸层」（深度 110）和「前景纸层」（深度 0）之间的一个斜面：
 * 深度大于 110 的地方会被草地纸层挡住，所以地上的动物只在 [nearDepth, farDepth] 里活动。
 * 动物的位置会做和纸层相同的位置补偿，所以相机静止时「舞台坐标」就是屏幕上看到的位置，
 * 地面高度只需要按深度在舞台 y 上做线性插值：越远越高。
 */

export const GROUND = {
  /** 草地最远处：紧贴草地纸层前面 */
  farDepth: 104,
  farY: 790,
  /** 草地最近处：前景草叶后面。留出底部按钮和提示纸条的高度，动物不会被遮住 */
  nearDepth: 12,
  nearY: 900,
  /** 溪流的源头（舞台 x），从这里向右一直流出画面 */
  streamStartX: -40,
  /** 溪流最宽处的半宽（以深度计，px） */
  streamHalfWidth: 13,
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * 透视缩放：草地在画面里代表一大片纵深（从脚边一直到古树），而 3D 深度只有不到 100px，
 * 光靠 CSS 透视几乎看不出远近。所以动物另外按深度缩小：最近处 1，草地最远处和树上 FAR_SCALE。
 */
export const FAR_SCALE = 0.6;

export function sizeAt(depth: number): number {
  const d = clamp(depth, GROUND.nearDepth, GROUND.farDepth);
  const t = (d - GROUND.nearDepth) / (GROUND.farDepth - GROUND.nearDepth);
  return 1 - t * (1 - FAR_SCALE);
}

/** 某个深度上地面的舞台 y */
export function groundY(depth: number): number {
  const d = clamp(depth, GROUND.nearDepth, GROUND.farDepth);
  const t = (GROUND.farDepth - d) / (GROUND.farDepth - GROUND.nearDepth);
  return GROUND.farY + t * (GROUND.nearY - GROUND.farY);
}

/** 溪流中线在 x 处的深度：在草地中段蜿蜒，越往右稍微靠近镜头 */
export function streamDepthAt(x: number): number {
  return 82 - (x - GROUND.streamStartX) * 0.006 + Math.sin(x / 260) * 4;
}

export function streamCenterY(x: number): number {
  return groundY(streamDepthAt(x));
}

/** 溪流在 x 处的半宽（深度），源头窄、往下游变宽 */
export function streamHalfWidthAt(x: number): number {
  return GROUND.streamHalfWidth * clamp(0.5 + (x - GROUND.streamStartX) / 900, 0.5, 1);
}

export function inStream(x: number, depth: number): boolean {
  if (x < GROUND.streamStartX) return false;
  return Math.abs(depth - streamDepthAt(x)) <= streamHalfWidthAt(x);
}

export interface WorldPos {
  /** 舞台 x */
  x: number;
  /** 舞台 y（脚底） */
  y: number;
  /** 深度，px */
  depth: number;
}

export function isOnGround(p: WorldPos, tolerance = 1): boolean {
  return Math.abs(p.y - groundY(p.depth)) <= tolerance;
}

/** 站在地上 (x, depth) 的位置 */
export function onGround(x: number, depth: number): WorldPos {
  return { x, y: groundY(depth), depth };
}
