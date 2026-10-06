/**
 * 2.5D 景深数学。
 *
 * 坐标约定：
 * - 视口设 perspective = P，透视原点在视口中心。
 * - 「世界」容器的 transform = translate3d(cam.x, cam.y, cam.z)，视差和镜头推进只改这里。
 * - 深度为 d 的纸层：translateZ(-d) scale((P + d) / P)。相机静止时，所有纸层投影后和视口完全重合。
 * - 每个纸层里有一个「舞台」：视口四周各扩出 margin 的矩形。舞台内部用「舞台单位」定位：
 *   高 1000 单位、宽 3000 单位（与 SVG viewBox 一致，preserveAspectRatio = xMidYMid slice），
 *   x 以舞台中心为 0，y 从顶部 0 到底部 1000。
 */

export interface Viewport {
  width: number;
  height: number;
}

export interface Camera {
  x: number;
  y: number;
  z: number;
}

export interface StagePoint {
  x: number;
  y: number;
}

export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export const STAGE_W = 3000;
export const STAGE_H = 1000;
const EPS = 1e-6;

export function layerScale(depth: number, perspective: number): number {
  return (perspective + depth) / perspective;
}

/** 舞台在视口坐标中的位置，以及 1 舞台单位等于多少像素 */
export function stageRect(vp: Viewport, margin: number) {
  const width = vp.width + margin * 2;
  const height = vp.height + margin * 2;
  return {
    left: -margin,
    top: -margin,
    width,
    height,
    unit: Math.max(width / STAGE_W, height / STAGE_H),
  };
}

/** 纸层局部坐标（相对视口中心，像素）投影到视口坐标 */
function project(vp: Viewport, P: number, depth: number, cam: Camera, lx: number, ly: number) {
  const k = 1 / (P + depth - cam.z);
  return {
    x: (lx * (P + depth) + cam.x * P) * k + vp.width / 2,
    y: (ly * (P + depth) + cam.y * P) * k + vp.height / 2,
  };
}

/** 某个纸层的舞台投影到视口后的矩形 */
export function projectStage(vp: Viewport, margin: number, P: number, depth: number, cam: Camera): Rect {
  const hw = vp.width / 2 + margin;
  const hh = vp.height / 2 + margin;
  const tl = project(vp, P, depth, cam, -hw, -hh);
  const br = project(vp, P, depth, cam, hw, hh);
  return { left: tl.x, top: tl.y, right: br.x, bottom: br.y };
}

/** 舞台坐标中的一点，投影到视口坐标 */
export function projectPoint(
  vp: Viewport,
  margin: number,
  P: number,
  depth: number,
  cam: Camera,
  point: StagePoint,
): { x: number; y: number } {
  const { unit } = stageRect(vp, margin);
  return project(vp, P, depth, cam, point.x * unit, (point.y - STAGE_H / 2) * unit);
}

export function coversViewport(rect: Rect, vp: Viewport): boolean {
  return rect.left <= EPS && rect.top <= EPS && rect.right >= vp.width - EPS && rect.bottom >= vp.height - EPS;
}

/**
 * 把相机限制在「所有纸层都不露边」的范围内。
 * 推导：最近的纸层（d = 0）限制最严，允许的平移为 margin + 视口半宽 × z / P。
 */
export function clampCamera(vp: Viewport, margin: number, P: number, cam: Camera): Camera {
  const z = Math.min(P / 2, Math.max(0, cam.z));
  const maxX = margin + (vp.width * z) / (2 * P);
  const maxY = margin + (vp.height * z) / (2 * P);
  const clamp = (v: number, m: number) => Math.min(m, Math.max(-m, v));
  return { x: clamp(cam.x, maxX), y: clamp(cam.y, maxY), z };
}

/**
 * 镜头推近 z，并尽量把深度为 depth 的舞台点移到视口的 (中间, anchorY) 处。
 * anchorY：0 顶部、0.5 中间、1 底部。
 */
export function focusCamera(
  vp: Viewport,
  margin: number,
  P: number,
  depth: number,
  point: StagePoint,
  z: number,
  anchorY = 0.5,
): Camera {
  const { unit } = stageRect(vp, margin);
  const lx = point.x * unit;
  const ly = (point.y - STAGE_H / 2) * unit;
  const s = (P + depth) / P;
  // 投影：屏幕 y = (ly·s·P + cam.y·P) / (P + depth − z) + 中心；令它等于 anchorY 处
  const k = (P + depth - z) / P;
  const targetY = (anchorY - 0.5) * vp.height;
  return clampCamera(vp, margin, P, { x: -lx * s, y: targetY * k - ly * s, z });
}

/**
 * 镜头最多能推多近，才能让深度 depth 上 ±halfWidth（舞台单位）的范围仍然完整显示在视口里。
 * 推导：舞台点 x 投影后离中心 x·unit·(P+d)/(P+d−z)，令它 ≤ 视口半宽。
 */
export function maxZoomToFit(vp: Viewport, margin: number, P: number, depth: number, halfWidth: number): number {
  const { unit } = stageRect(vp, margin);
  const z = (P + depth) * (1 - (2 * halfWidth * unit) / vp.width);
  return Math.max(0, z);
}
