/* **/
/* * 落叶漂流（漂漂）的时间表与记录。*/
/* * 注意：这个模块里没有任何接收「叶子上的字」的函数——字只活在组件的局部状态里，*/
/* * 漂走就没了，不进 IndexedDB、不进 gameContext、不进日志、不发网络请求。*/
/* */

export const LEAF_MIN_CHARS = 1;
export const LEAF_MAX_CHARS = 30;
/* 每个字开始晕开的间隔*/
export const CHAR_STAGGER_MS = 120;
/* 单个字晕开用多久*/
export const CHAR_FADE_MS = 600;
export const LEAF_NOTICE = "叶子上的字不会被保存，漂走就真的走了";

export function leafFloatContext(count: number): string | null {
  const leaves = Math.floor(count);
  if (!(leaves > 0)) return null;
  return "放走了 " + leaves + " 片烦恼叶子";
}

/* 第 index 个字在 elapsedMs 时的透明度：从 1 慢慢晕到 0*/
export function leafCharOpacity(index: number, charCount: number, elapsedMs: number): number {
  if (index < 0 || index >= charCount) return 0;
  const start = index * CHAR_STAGGER_MS;
  if (elapsedMs <= start) return 1;
  const passed = elapsedMs - start;
  if (passed >= CHAR_FADE_MS) return 0;
  return 1 - passed / CHAR_FADE_MS;
}

/* 一片叶子彻底漂没需要多久*/
export function leafFadeMs(charCount: number): number {
  if (charCount <= 0) return 0;
  return CHAR_STAGGER_MS * (charCount - 1) + CHAR_FADE_MS;
}