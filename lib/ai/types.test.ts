import { describe, expect, it } from "vitest";
import {
  AI_DELAY_MAX,
  AI_DELAY_MIN,
  BREAKDOWN_MAX,
  BUBBLE_MAX,
  BUBBLE_MIN,
  isValidInput,
  REFRAME_KINDS,
  REFRAME_LABELS,
  STEPS_MAX,
  STEPS_MIN,
  textLength,
  THOUGHT_MAX,
  TRAPS,
  TRAP_KINDS,
} from "./types";

describe("AI 接口约定", () => {
  it("思维陷阱表的键与陷阱类型一一对应，每条都有名字和一句话解释", () => {
    expect(Object.keys(TRAPS).sort()).toEqual([...TRAP_KINDS].sort());
    for (const kind of TRAP_KINDS) {
      expect(TRAPS[kind].name.length).toBeGreaterThan(0);
      expect(TRAPS[kind].note.length).toBeGreaterThan(0);
    }
  });

  it("翻面镜的三种版本顺序固定且都有中文标签", () => {
    expect([...REFRAME_KINDS]).toEqual(["humor", "warm", "realistic"]);
    for (const kind of REFRAME_KINDS) {
      expect(REFRAME_LABELS[kind].length).toBeGreaterThan(0);
    }
  });

  it("输入长度与数量的上下限来自规格", () => {
    expect(THOUGHT_MAX).toBe(100);
    expect(BUBBLE_MIN).toBe(1);
    expect(BUBBLE_MAX).toBe(5);
    expect(STEPS_MIN).toBe(3);
    expect(STEPS_MAX).toBe(5);
    expect(BREAKDOWN_MAX).toBe(60);
    expect(AI_DELAY_MIN).toBe(600);
    expect(AI_DELAY_MAX).toBe(1200);
  });

  it("textLength 按字符数算，忽略首尾空白", () => {
    expect(textLength("  你好  ")).toBe(2);
    expect(textLength("")).toBe(0);
    expect(textLength("   ")).toBe(0);
  });

  it("isValidInput 卡住空输入与超长输入", () => {
    expect(isValidInput("", 1, 60)).toBe(false);
    expect(isValidInput("   ", 1, 60)).toBe(false);
    expect(isValidInput("我好累", 1, 60)).toBe(true);
    expect(isValidInput("啊".repeat(61), 1, 60)).toBe(false);
    expect(isValidInput("啊".repeat(60), 1, 60)).toBe(true);
  });
});
