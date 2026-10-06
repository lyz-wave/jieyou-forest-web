import { describe, expect, it } from "vitest";
import { bounds } from "./geometry";
import { seeded } from "./random";
import { blob, crescent, ellipse, leaf, ridge, treeLine } from "./shapes";

describe("ellipse", () => {
  it("生成指定数量的点，且都在椭圆上", () => {
    const pts = ellipse(10, 20, 30, 15, 16);
    expect(pts).toHaveLength(16);
    for (const p of pts) {
      const v = ((p.x - 10) / 30) ** 2 + ((p.y - 20) / 15) ** 2;
      expect(v).toBeCloseTo(1, 6);
    }
  });
});

describe("blob", () => {
  it("半径在 r × (1 ± wobble) 之内，结果可复现", () => {
    const a = blob(seeded("blob"), 0, 0, 50, { wobble: 0.2, segments: 20 });
    const b = blob(seeded("blob"), 0, 0, 50, { wobble: 0.2, segments: 20 });
    expect(a).toEqual(b);
    expect(a).toHaveLength(20);
    for (const p of a) {
      const r = Math.hypot(p.x, p.y);
      expect(r).toBeGreaterThanOrEqual(50 * 0.8 - 1e-9);
      expect(r).toBeLessThanOrEqual(50 * 1.2 + 1e-9);
    }
  });
});

describe("leaf", () => {
  it("水平叶片的包围盒约等于长 × 宽", () => {
    const box = bounds(leaf(0, 0, 100, 30, 0));
    expect(box.maxX - box.minX).toBeCloseTo(100, 0);
    expect(box.maxY - box.minY).toBeLessThanOrEqual(30 + 1e-9);
    expect(box.maxY - box.minY).toBeGreaterThan(25);
  });

  it("旋转 90° 后长边变为竖直方向", () => {
    const box = bounds(leaf(0, 0, 100, 30, Math.PI / 2));
    expect(box.maxY - box.minY).toBeCloseTo(100, 0);
  });
});

describe("crescent", () => {
  it("月牙落在外圆之内", () => {
    for (const p of crescent(0, 0, 20, 0)) {
      expect(Math.hypot(p.x, p.y)).toBeLessThanOrEqual(20 + 1e-9);
    }
  });
});

describe("ridge", () => {
  it("山脊顶线在 baseY ± amplitude 之内，并以底边闭合", () => {
    const pts = ridge(seeded("hill"), { x0: -500, x1: 500, baseY: 400, amplitude: 60, bottomY: 1000, step: 20 });
    const top = pts.slice(0, -2);
    expect(top[0].x).toBe(-500);
    expect(top[top.length - 1].x).toBe(500);
    for (const p of top) {
      expect(p.y).toBeGreaterThanOrEqual(400 - 60 - 1e-9);
      expect(p.y).toBeLessThanOrEqual(400 + 60 + 1e-9);
    }
    expect(pts[pts.length - 2]).toEqual({ x: 500, y: 1000 });
    expect(pts[pts.length - 1]).toEqual({ x: -500, y: 1000 });
  });
});

describe("treeLine", () => {
  it("树冠线在 [baseY - maxH, baseY] 之内，横向铺满", () => {
    const pts = treeLine(seeded("trees"), {
      x0: -400,
      x1: 400,
      baseY: 600,
      bottomY: 1000,
      minH: 80,
      maxH: 160,
      spacing: 70,
      step: 8,
    });
    const top = pts.slice(0, -2);
    expect(top[0].x).toBe(-400);
    expect(top[top.length - 1].x).toBe(400);
    for (const p of top) {
      expect(p.y).toBeGreaterThanOrEqual(600 - 160 - 1e-9);
      expect(p.y).toBeLessThanOrEqual(600 + 1e-9);
    }
  });
});
