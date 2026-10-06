import { describe, expect, it } from "vitest";
import { makeParticles } from "./particles";

describe("makeParticles", () => {
  it("同一种子和数量生成相同的粒子", () => {
    expect(makeParticles(12, false)).toEqual(makeParticles(12, false));
  });

  it("数量按画质给定", () => {
    expect(makeParticles(36, false)).toHaveLength(36);
    expect(makeParticles(6, false)).toHaveLength(6);
  });

  it("白天只有落叶和光斑，夜晚多出萤火虫", () => {
    const day = makeParticles(36, false);
    expect(new Set(day.map((p) => p.kind))).toEqual(new Set(["leaf", "mote"]));
    const night = makeParticles(36, true);
    expect(night.some((p) => p.kind === "firefly")).toBe(true);
  });

  it("落叶两面颜色不同", () => {
    for (const p of makeParticles(36, false).filter((p) => p.kind === "leaf")) {
      expect(p.front).not.toBe(p.back);
    }
  });

  it("参数都在合理范围", () => {
    for (const p of makeParticles(36, true)) {
      expect(p.left).toBeGreaterThanOrEqual(0);
      expect(p.left).toBeLessThanOrEqual(100);
      expect(p.duration).toBeGreaterThan(0);
      expect(p.delay).toBeLessThanOrEqual(0);
      expect(p.size).toBeGreaterThan(0);
    }
  });
});
