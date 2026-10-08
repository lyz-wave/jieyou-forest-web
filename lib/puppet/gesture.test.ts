import { describe, expect, it } from "vitest";
import { gestureMoves, gestureTiming } from "./gesture";

describe("小动作落在哪些部件上", () => {
  it("点头转头、竖耳朵转耳朵、托腮抬手臂", () => {
    expect(gestureMoves("nod").map((m) => m.part)).toEqual(["head"]);
    expect(gestureMoves("ears").map((m) => m.part)).toEqual(["ear"]);
    expect(gestureMoves("chin").map((m) => m.part)).toEqual(["arm", "head"]);
  });

  it("每套关键帧都首尾相同（做完回到原位，不会歪着不动）", () => {
    for (const gesture of ["nod", "ears", "chin", "think", "smile"] as const) {
      const moves = gestureMoves(gesture);
      expect(moves.length).toBeGreaterThan(0);
      for (const move of moves) {
        for (const frames of Object.values(move.keyframes)) {
          if (!frames) continue;
          expect(frames[frames.length - 1]).toBe(frames[0]);
        }
      }
    }
    expect(gestureMoves("smile").map((m) => m.part)).toEqual(["", "head"]);
  });
});

describe("播放节奏", () => {
  it("聆听时反复轻轻做，反应只做一次", () => {
    const loop = gestureTiming(true);
    expect(loop.repeat).toBe(Infinity);
    expect(loop.repeatDelay).toBeGreaterThan(0.5);
    const once = gestureTiming(false);
    expect(once.repeat).toBe(0);
  });
});
