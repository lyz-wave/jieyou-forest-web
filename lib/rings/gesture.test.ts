import { describe, expect, it } from "vitest";
import type { Memory } from "@/lib/journal/types";
import { isBackSwipe, pinchAction, pinchDistance, zoomIn, zoomOut } from "./gesture";

function memory(date: string): Memory {
  return {
    id: "mem-" + date,
    sessionId: "s-" + date,
    date,
    title: "一次汇报",
    summary: "写点什么。",
    emotions: ["委屈"],
    themes: ["工作压力"],
    coreBelief: "我不行",
    shift: { from: "我不行", to: "一次没做好" },
    insight: "我还可以。",
    helpfulAnimals: ["owl"],
  };
}

const MEMORIES = [memory("2026-03-12"), memory("2026-03-05"), memory("2025-11-02"), memory("2026-01-20")];

describe("年轮手势", () => {
  it("张开手指：年 → 那年最近有记录的月 → 那个月最近有记录的那天", () => {
    const atYear = zoomIn({ year: 2026, month: null, day: null }, MEMORIES);
    expect(atYear.month).toBe(3);
    const atDay = zoomIn(atYear, MEMORIES);
    expect(atDay.day).toBe(12);
    expect(zoomIn(atDay, MEMORIES).day).toBe(12);
  });

  it("还没选年份、或那年一条记录都没有时不乱动", () => {
    expect(zoomIn({ year: null, month: null, day: null }, MEMORIES)).toEqual({ year: null, month: null, day: null });
    expect(zoomIn({ year: 2024, month: null, day: null }, MEMORIES).month).toBeNull();
  });

  it("捏合：日 → 月 → 年 → 全部", () => {
    expect(zoomOut({ year: 2026, month: 3, day: 12 })).toEqual({ year: 2026, month: 3, day: null });
    expect(zoomOut({ year: 2026, month: 3, day: null })).toEqual({ year: 2026, month: null, day: null });
    expect(zoomOut({ year: 2026, month: null, day: null })).toEqual({ year: null, month: null, day: null });
    expect(zoomOut({ year: null, month: null, day: null })).toEqual({ year: null, month: null, day: null });
  });

  it("两根手指的距离与阈值", () => {
    expect(pinchDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    expect(pinchAction(100, 130)).toBe("in");
    expect(pinchAction(100, 70)).toBe("out");
    expect(pinchAction(100, 105)).toBeNull();
    expect(pinchAction(0, 100)).toBeNull();
  });

  it("往右划够远才算返回，斜着划不算", () => {
    expect(isBackSwipe(90, 10)).toBe(true);
    expect(isBackSwipe(40, 0)).toBe(false);
    expect(isBackSwipe(90, 90)).toBe(false);
  });
});
