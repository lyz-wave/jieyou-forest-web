import { describe, expect, it } from "vitest";
import {
  BREATH_PHASES,
  DEFAULT_ROUNDS,
  MAX_ROUNDS,
  MIN_ROUNDS,
  PHASE_MS,
  clampRounds,
  closingLine,
  phaseAt,
  roundMs,
  shellBreathContext,
  totalMs,
} from "./shell-breath";

describe("盒式呼吸的阶段计算", () => {
  it("一轮是吸 4 秒、屏 4 秒、呼 4 秒、屏 4 秒", () => {
    expect(PHASE_MS).toBe(4000);
    expect(BREATH_PHASES).toEqual(["inhale", "hold", "exhale", "hold"]);
    expect(roundMs()).toBe(16000);
  });

  it("按时间给出当前阶段、第几轮和剩余秒数", () => {
    expect(phaseAt(0, 3)).toEqual({ done: false, phase: "inhale", round: 1, remainingMs: 4000 });
    expect(phaseAt(4000, 3)).toEqual({ done: false, phase: "hold", round: 1, remainingMs: 4000 });
    expect(phaseAt(8000, 3)).toEqual({ done: false, phase: "exhale", round: 1, remainingMs: 4000 });
    expect(phaseAt(12000, 3)).toEqual({ done: false, phase: "hold", round: 1, remainingMs: 4000 });
  });

  it("阶段里剩余的时间是倒数", () => {
    expect(phaseAt(1000, 3)).toEqual({ done: false, phase: "inhale", round: 1, remainingMs: 3000 });
  });

  it("下一轮从第一阶段的吸气重新开始", () => {
    expect(phaseAt(16000, 3)).toEqual({ done: false, phase: "inhale", round: 2, remainingMs: 4000 });
    expect(phaseAt(32000, 3)).toEqual({ done: false, phase: "inhale", round: 3, remainingMs: 4000 });
  });

  it("默认 3 轮是 48 秒，做完就 done", () => {
    expect(totalMs(3)).toBe(48000);
    expect(phaseAt(47999, 3).done).toBe(false);
    expect(phaseAt(48000, 3)).toEqual({ done: true });
    expect(phaseAt(60000, 3)).toEqual({ done: true });
  });

  it("轮数只能在 1–10 之间", () => {
    expect(DEFAULT_ROUNDS).toBe(3);
    expect(MIN_ROUNDS).toBe(1);
    expect(MAX_ROUNDS).toBe(10);
    expect(clampRounds(0)).toBe(1);
    expect(clampRounds(99)).toBe(10);
    expect(clampRounds(3.4)).toBe(3);
    expect(clampRounds(Number.NaN)).toBe(DEFAULT_ROUNDS);
  });

  it("收尾的话不为空", () => {
    expect(closingLine().length).toBeGreaterThan(0);
  });

  it("完成才记 gameContext", () => {
    expect(shellBreathContext(3)).toBe("完成了 3 轮盒式呼吸");
    expect(shellBreathContext(0)).toBeNull();
  });
});