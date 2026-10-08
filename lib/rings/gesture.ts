import type { Memory } from "@/lib/journal/types";

/** 年轮现在停在哪一级：年 null 表示还在最外层（全部） */
export interface RingPath {
  year: number | null;
  month: number | null;
  day: number | null;
}

/** 点进去：只认已经选中的那一支，取它最近有记录的一层（年→该年最近有记录的月；月→该月最近有记录的那天） */
export function zoomIn(path: RingPath, memories: readonly Memory[]): RingPath {
  if (path.year === null) return path;
  if (path.day !== null) return path;
  const prefix = path.year + "-" + pad2(path.month ?? 0);
  if (path.month === null) {
    const inYear = memories.filter((m) => m.date.startsWith(String(path.year) + "-")).map((m) => m.date.slice(5, 7));
    const newest = inYear.sort().at(-1);
    return newest === undefined ? path : { ...path, month: Number(newest) };
  }
  const inMonth = memories.filter((m) => m.date.startsWith(prefix + "-")).map((m) => m.date.slice(8, 10));
  const newest = inMonth.sort().at(-1);
  return newest === undefined ? path : { ...path, day: Number(newest) };
}

/** 退回去一层：日 → 月 → 年 → 全部 */
export function zoomOut(path: RingPath): RingPath {
  if (path.day !== null) return { year: path.year, month: path.month, day: null };
  if (path.month !== null) return { year: path.year, month: null, day: null };
  if (path.year !== null) return { year: null, month: null, day: null };
  return path;
}

/** 两根手指的距离，用来判断是张开还是捏合 */
export function pinchDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** 手指往右划这么远就算「返回」 */
export const SWIPE_BACK = 80;

export function isBackSwipe(dx: number, dy: number): boolean {
  return dx >= SWIPE_BACK && Math.abs(dy) < SWIPE_BACK;
}

/** 双指张开 / 捏合到了阈值（相对起始距离的比例） */
export const PINCH_RATIO = 1.25;

export function pinchAction(start: number, now: number): "in" | "out" | null {
  if (start <= 0) return null;
  if (now >= start * PINCH_RATIO) return "in";
  if (now <= start / PINCH_RATIO) return "out";
  return null;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}
