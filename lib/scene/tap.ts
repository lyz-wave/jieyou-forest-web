/**
 * 点击热区的几何（纯函数）。
 *
 * 世界里的盒子长在 layout px 里（尺寸 × unit），屏幕上还会被两道缩放影响：
 * ① 盒子自己的 transform：`scale((P + d)/P × sizeAt(d))`；
 * ② 3D 容器的 perspective：往后退 d 之后投影时要除以 (P + d)/P。
 * 两者正好抵消——所以开着深度缩放的盒子在屏幕上就是 sizeAt(d) 那么小，
 * 关掉缩放的（比如古树热区）则是原样大小（1）。
 *
 * 手机上树上那两只小动物只剩 30 多 px，手指点不中：要往外补一圈透明热区，补多少由这里算。
 */

import { sizeAt } from "@/lib/forest/ground";
import { PERSPECTIVE } from "@/lib/scene";

/** 可点区域的最小边长（CSS px） */
export const MIN_TAP = 44;

/** 盒子自己 transform 里用的缩放：透视补偿 × 按深度缩小的系数 */
export function transformScale(depth: number, perspectiveScale = true): number {
  const s = (PERSPECTIVE + depth) / PERSPECTIVE;
  return perspectiveScale ? s * sizeAt(depth) : s;
}

/** 盒子在屏幕上真正显示出来的缩放（transform 里的透视补偿被 perspective 投影抵消掉了） */
export function screenScale(depth: number, perspectiveScale = true): number {
  return perspectiveScale ? sizeAt(depth) : 1;
}

/**
 * 盒子在 layout px 里还要往外扩多少（单边补一半），屏幕上的可点区域才有 min 见方。
 * scale 传屏幕上的真实缩放（screenScale）；短边决定补多少：扁盒子补完两边都能到 min。
 */
export function tapTip(box: { width: number; height: number }, scale: number, min = MIN_TAP): number {
  if (!(scale > 0)) return 0;
  return Math.max(0, min / scale - Math.min(box.width, box.height));
}
