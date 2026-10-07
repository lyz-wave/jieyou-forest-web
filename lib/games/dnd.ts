/** 投放区在屏幕上的矩形（视口坐标，跟 getBoundingClientRect 一致） */
export interface ZoneRect {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * 落点落在哪个投放区上（纯函数，方便在 jsdom 里测）。
 * 命中含边界；还没量出尺寸的区域不算目标；重叠时取更小的那个（嵌在大区域里的小区域更具体）。
 */
export function zoneAtPoint(x: number, y: number, zones: readonly ZoneRect[]): string | null {
  let best: ZoneRect | null = null;
  for (const zone of zones) {
    if (zone.width <= 0 || zone.height <= 0) continue;
    if (x < zone.left || y < zone.top) continue;
    if (x > zone.left + zone.width || y > zone.top + zone.height) continue;
    if (best === null || zone.width * zone.height < best.width * best.height) best = zone;
  }
  return best === null ? null : best.id;
}
