import { describe, expect, it } from "vitest";
import { screenScale, tapTip, transformScale } from "./tap";

const PERSPECTIVE = 1000;
const TREE_DEPTH = 274; // 树上那几只（depth 被 sizeAt 夹到最远）

describe("transformScale", () => {
  it("近处不缩：深度 0 时就是透视补偿本身", () => {
    expect(transformScale(0)).toBe(1);
  });

  it("树上的动物按最远比例缩小", () => {
    expect(transformScale(TREE_DEPTH)).toBeCloseTo(1.274 * 0.6, 6);
    // 关掉深度缩放（古树热区）时只剩透视补偿
    expect(transformScale(TREE_DEPTH, false)).toBeCloseTo(1.274, 6);
  });
});

describe("screenScale", () => {
  it("屏幕上的尺寸被 perspective 投影抵消掉透视补偿，只剩按深度缩小的那一档", () => {
    expect(screenScale(0)).toBe(1);
    expect(screenScale(TREE_DEPTH)).toBe(0.6);
    // 关掉深度缩放的盒子在屏幕上就是原样大小
    expect(screenScale(TREE_DEPTH, false)).toBe(1);
    expect(screenScale(30, false)).toBe(1);
  });

  it("和 transformScale 的关系就是投影那一除", () => {
    const s = (PERSPECTIVE + TREE_DEPTH) / PERSPECTIVE;
    expect(transformScale(TREE_DEPTH) / s).toBeCloseTo(screenScale(TREE_DEPTH), 6);
  });
});

describe("tapTip", () => {
  it("小纸偶要往外补，屏幕上才有 44px", () => {
    // 笃笃：layout 59.12px，屏幕上 59.12 × 0.6 ≈ 35.5px
    const box = { width: 59.12, height: 59.12 };
    const tip = tapTip(box, screenScale(TREE_DEPTH));
    expect(tip).toBeCloseTo(44 / 0.6 - 59.12, 6);
    expect((box.width + tip) * screenScale(TREE_DEPTH)).toBeCloseTo(44, 6);
  });

  it("补到屏幕上正好 44 就够，不会补过头", () => {
    const tip = tapTip({ width: 59.12, height: 59.12 }, 0.6);
    expect((59.12 + tip) * 0.6).toBeLessThan(44.001);
  });

  it("够大的纸偶不用补", () => {
    expect(tapTip({ width: 100, height: 120 }, 1)).toBe(0);
    expect(tapTip({ width: 44, height: 44 }, 1)).toBe(0);
    // 屏幕上 49.7px 的墨墨：layout 82.8px，够大
    expect(tapTip({ width: 82.8, height: 82.8 }, screenScale(TREE_DEPTH))).toBe(0);
  });

  it("看的是短边：扁盒子补到短边够 44", () => {
    expect(tapTip({ width: 120, height: 20 }, 1)).toBe(24);
    expect(tapTip({ width: 20, height: 120 }, 1)).toBe(24);
  });

  it("缩小得越狠补得越多，缩不动的深度不补", () => {
    expect(tapTip({ width: 40, height: 40 }, 0.5)).toBe(48);
    expect(tapTip({ width: 40, height: 40 }, 1)).toBe(4);
  });

  it("缩放不是正数时不动（避免算出负的热区）", () => {
    expect(tapTip({ width: 40, height: 40 }, 0)).toBe(0);
    expect(tapTip({ width: 40, height: 40 }, -1)).toBe(0);
  });

  it("最小可点边长可以调", () => {
    expect(tapTip({ width: 30, height: 30 }, 1, 64)).toBe(34);
  });
});
