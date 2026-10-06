import { describe, expect, it } from "vitest";
import type { Point } from "./geometry";
import { distanceToPolygon } from "./geometry";
import { pathFromPoints, roughenPolygon, roughPath } from "./roughen";

const square: Point[] = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
  { x: 0, y: 100 },
];

describe("roughenPolygon", () => {
  it("同一种子生成完全相同的路径", () => {
    const a = roughPath(square, { seed: "leaf", amplitude: 3, step: 10 });
    const b = roughPath(square, { seed: "leaf", amplitude: 3, step: 10 });
    expect(a).toBe(b);
  });

  it("不同种子生成不同的路径", () => {
    const a = roughPath(square, { seed: "a", amplitude: 3, step: 10 });
    const b = roughPath(square, { seed: "b", amplitude: 3, step: 10 });
    expect(a).not.toBe(b);
  });

  it("每个点偏离原始轮廓不超过幅度 a", () => {
    const amplitude = 4;
    const points = roughenPolygon(square, { seed: "bound", amplitude, step: 7 });
    for (const p of points) {
      // 路径坐标会保留 1 位小数，留出舍入误差
      expect(distanceToPolygon(p, square)).toBeLessThanOrEqual(amplitude + 0.1);
    }
  });

  it("按步长细分每条边", () => {
    const points = roughenPolygon(square, { seed: "step", amplitude: 0, step: 10 });
    // 每条边 100 / 10 = 10 段，共 40 个点
    expect(points).toHaveLength(40);
  });

  it("幅度为 0 时点都落在原始轮廓上", () => {
    const points = roughenPolygon(square, { seed: "flat", amplitude: 0, step: 25 });
    for (const p of points) {
      expect(distanceToPolygon(p, square)).toBeCloseTo(0, 5);
    }
  });
});

describe("pathFromPoints", () => {
  it("闭合路径以 M 开头、Z 结尾，坐标保留 1 位小数", () => {
    const d = pathFromPoints([
      { x: 0, y: 0 },
      { x: 10.26, y: 0 },
      { x: 10, y: 10.04 },
    ]);
    expect(d).toBe("M0 0L10.3 0L10 10Z");
  });

  it("开放路径不带 Z", () => {
    expect(pathFromPoints([{ x: 1, y: 2 }, { x: 3, y: 4 }], false)).toBe("M1 2L3 4");
  });

  it("空点集返回空字符串", () => {
    expect(pathFromPoints([])).toBe("");
  });
});
