import { describe, expect, it } from "vitest";
import {
  CHAR_FADE_MS,
  CHAR_STAGGER_MS,
  LEAF_MAX_CHARS,
  LEAF_MIN_CHARS,
  leafCharOpacity,
  leafFloatContext,
} from "./leaf-float";

describe("落叶漂流的记录", () => {
  it("一片都没放走就不产生 gameContext", () => {
    expect(leafFloatContext(0)).toBeNull();
  });

  it("只记放走了几片，不记叶子上的字", () => {
    expect(leafFloatContext(2)).toBe("放走了 2 片烦恼叶子");
    expect(leafFloatContext(1)).toBe("放走了 1 片烦恼叶子");
  });

  it("字数范围是 1–30", () => {
    expect(LEAF_MIN_CHARS).toBe(1);
    expect(LEAF_MAX_CHARS).toBe(30);
  });
});

describe("字迹晕开的时间表", () => {
  it("第一个字先开始淡，越靠后的字越晚", () => {
    expect(leafCharOpacity(0, 5, 0)).toBe(1);
    expect(leafCharOpacity(0, 5, CHAR_FADE_MS)).toBe(0);
    expect(leafCharOpacity(1, 5, CHAR_STAGGER_MS)).toBe(1);
    expect(leafCharOpacity(1, 5, CHAR_STAGGER_MS + CHAR_FADE_MS)).toBe(0);
    expect(leafCharOpacity(4, 5, CHAR_STAGGER_MS * 2)).toBe(1);
  });

  it("淡出过程是渐变的，不会突然跳变", () => {
    const mid = leafCharOpacity(0, 5, CHAR_FADE_MS / 2);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
  });

  it("全部淡完以后所有字都是 0", () => {
    const end = CHAR_STAGGER_MS * 4 + CHAR_FADE_MS;
    expect(leafCharOpacity(0, 5, end)).toBe(0);
    expect(leafCharOpacity(4, 5, end)).toBe(0);
  });
});