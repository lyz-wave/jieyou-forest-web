import { describe, expect, it } from "vitest";
import { chooseParallaxSource, driftAt, tiltToParallax } from "./parallax";

describe("chooseParallaxSource", () => {
  const base = { reducedMotion: false, finePointer: false, hasOrientation: false, needsPermission: false, permission: "unknown" as const };

  it("减弱动画优先：静止", () => {
    expect(chooseParallaxSource({ ...base, reducedMotion: true, finePointer: true })).toBe("none");
  });

  it("有鼠标用鼠标", () => {
    expect(chooseParallaxSource({ ...base, finePointer: true, hasOrientation: true })).toBe("pointer");
  });

  it("有陀螺仪且不需要授权时用陀螺仪", () => {
    expect(chooseParallaxSource({ ...base, hasOrientation: true })).toBe("orientation");
  });

  it("需要授权但还没授权时自动漂移", () => {
    expect(chooseParallaxSource({ ...base, hasOrientation: true, needsPermission: true })).toBe("drift");
  });

  it("授权后用陀螺仪", () => {
    expect(
      chooseParallaxSource({ ...base, hasOrientation: true, needsPermission: true, permission: "granted" }),
    ).toBe("orientation");
  });

  it("拒绝授权后保持自动漂移", () => {
    expect(chooseParallaxSource({ ...base, hasOrientation: true, needsPermission: true, permission: "denied" })).toBe(
      "drift",
    );
  });

  it("都没有时自动漂移", () => {
    expect(chooseParallaxSource(base)).toBe("drift");
  });
});

describe("tiltToParallax", () => {
  it("相对基准倾斜 ±15° 映射到 ±1，超出时截断", () => {
    const baseline = { beta: 40, gamma: 0 };
    expect(tiltToParallax({ beta: 40, gamma: 0 }, baseline)).toEqual({ x: 0, y: 0 });
    expect(tiltToParallax({ beta: 40, gamma: 7.5 }, baseline).x).toBeCloseTo(0.5);
    expect(tiltToParallax({ beta: 55, gamma: -30 }, baseline)).toEqual({ x: -1, y: 1 });
  });
});

describe("driftAt", () => {
  it("幅度不超过 0.3，并且随时间变化", () => {
    let moved = false;
    const first = driftAt(0);
    for (let t = 0; t < 40_000; t += 250) {
      const p = driftAt(t);
      expect(Math.abs(p.x)).toBeLessThanOrEqual(0.3);
      expect(Math.abs(p.y)).toBeLessThanOrEqual(0.3);
      if (p.x !== first.x || p.y !== first.y) moved = true;
    }
    expect(moved).toBe(true);
  });
});
