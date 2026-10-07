import { describe, expect, it, vi } from "vitest";
import { createMockAI } from "./mock";
import {
  AI_FAILURE_LINE,
  BUBBLE_MAX,
  BUBBLE_MIN,
  REFRAME_KINDS,
  STEPS_MAX,
  STEPS_MIN,
  TRAPS,
} from "./types";

const INPUTS = [
  "明天要汇报，我怕大家觉得我很差",
  "我什么都做不好",
  "下周答辩，已经准备了一个月",
  "说不清为什么，就是累",
  "今天被领导说了一句，我一整天都在想是不是要被辞退了",
];

const instant = () => createMockAI({ delayMs: () => 0 });

describe("mock ForestAI：固定结果", () => {
  it("breakDown 对 1–60 字的输入返回 3–5 个非空步骤", async () => {
    const ai = instant();
    for (const input of INPUTS) {
      const { steps } = await ai.breakDown(input);
      expect(steps.length).toBeGreaterThanOrEqual(STEPS_MIN);
      expect(steps.length).toBeLessThanOrEqual(STEPS_MAX);
      for (const step of steps) {
        expect(step.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("splitThought 拆出 1–5 个气泡，气泡文字来自原句", async () => {
    const ai = instant();
    const input = "明天要汇报，我怕大家觉得我很差。";
    const { bubbles } = await ai.splitThought(input);
    expect(bubbles.length).toBeGreaterThanOrEqual(BUBBLE_MIN);
    expect(bubbles.length).toBeLessThanOrEqual(BUBBLE_MAX);
    const plain = input.replace(/[，,。！？!?；;\s]/g, "");
    for (const bubble of bubbles) {
      expect(bubble.text.trim().length).toBeGreaterThan(0);
      expect(plain).toContain(bubble.text.replace(/[，,。！？!?；;\s]/g, ""));
      expect(["fact", "guess"]).toContain(bubble.answer);
      expect(bubble.id.length).toBeGreaterThan(0);
    }
    expect(new Set(bubbles.map((b) => b.id)).size).toBe(bubbles.length);
  });

  it("思维陷阱只挂在猜测上，类型都在约定里", async () => {
    const ai = instant();
    for (const input of INPUTS) {
      const { bubbles } = await ai.splitThought(input);
      for (const bubble of bubbles) {
        if (bubble.trap) {
          expect(bubble.answer).toBe("guess");
          expect(Object.keys(TRAPS)).toContain(bubble.trap);
        }
      }
    }
  });

  it("reframe 按幽默/温柔/现实三种版本返回，三句互不相同", async () => {
    const ai = instant();
    for (const input of INPUTS) {
      const { versions } = await ai.reframe(input);
      expect(versions.map((v) => v.kind)).toEqual([...REFRAME_KINDS]);
      for (const version of versions) {
        expect(version.text.trim().length).toBeGreaterThan(0);
      }
      expect(new Set(versions.map((v) => v.text)).size).toBe(versions.length);
    }
  });

  it("同样的输入给出同样的结果", async () => {
    const input = INPUTS[0];
    expect(await instant().breakDown(input)).toEqual(await instant().breakDown(input));
    expect(await instant().splitThought(input)).toEqual(await instant().splitThought(input));
    expect(await instant().reframe(input)).toEqual(await instant().reframe(input));
  });

  it("不同的输入给出不同的结果", async () => {
    const ai = instant();
    expect(await ai.breakDown(INPUTS[0])).not.toEqual(await ai.breakDown(INPUTS[1]));
    expect(await ai.reframe(INPUTS[0])).not.toEqual(await ai.reframe(INPUTS[2]));
  });
});

describe("mock ForestAI：延迟、失败与中止", () => {
  it("默认延迟落在 600–1200ms 之间", async () => {
    vi.useFakeTimers();
    try {
      const ai = createMockAI();
      let done = false;
      const pending = ai.breakDown(INPUTS[0]).then(() => {
        done = true;
      });
      await vi.advanceTimersByTimeAsync(599);
      expect(done).toBe(false);
      await vi.advanceTimersByTimeAsync(601);
      await pending;
      expect(done).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("模拟失败开关打开时三个接口都拒绝，且带上给用户看的那句话", async () => {
    const ai = createMockAI({ delayMs: () => 0, shouldFail: () => true });
    await expect(ai.breakDown(INPUTS[0])).rejects.toThrow(AI_FAILURE_LINE);
    await expect(ai.splitThought(INPUTS[0])).rejects.toThrow(AI_FAILURE_LINE);
    await expect(ai.reframe(INPUTS[0])).rejects.toThrow(AI_FAILURE_LINE);
  });

  it("已经中止的请求立刻拒绝", async () => {
    const ai = instant();
    const controller = new AbortController();
    controller.abort();
    await expect(ai.reframe(INPUTS[0], { signal: controller.signal })).rejects.toThrow();
  });

  it("等待中中止会拒绝，且不会等到定时器走完", async () => {
    vi.useFakeTimers();
    try {
      const ai = createMockAI();
      const controller = new AbortController();
      const pending = ai.breakDown(INPUTS[0], { signal: controller.signal });
      const rejected = expect(pending).rejects.toThrow();
      controller.abort();
      await vi.advanceTimersByTimeAsync(2000);
      await rejected;
    } finally {
      vi.useRealTimers();
    }
  });
});
