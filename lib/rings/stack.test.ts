import { describe, expect, it } from "vitest";
import { annulusPath, layerLifts, lighten, shade, sparkAt } from "./stack";

describe("纸雕的层高", () => {
  it("从外到内一层层叠高，最内圈最高", () => {
    expect(layerLifts(3)).toEqual([-14, -7, 0]);
    expect(layerLifts(1)).toEqual([0]);
    expect(layerLifts(0)).toEqual([]);
    const lifts = layerLifts(4, 10);
    expect(lifts).toEqual([-30, -20, -10, 0]);
    for (let i = 1; i < lifts.length; i += 1) {
      expect(lifts[i]).toBeGreaterThan(lifts[i - 1] ?? 0);
    }
  });
});

describe("一张环形纸片", () => {
  it("环宽撑出内外两个圆，中间挖空", () => {
    const path = annulusPath(50, 10, 150, 150);
    expect(path.match(/M /g)?.length).toBe(2);
    expect(path).toContain("M 95 150");
    expect(path).toContain("M 105 150");
  });

  it("宽度比半径还大时就只有一张圆纸片", () => {
    const path = annulusPath(4, 12, 150, 150);
    expect(path.match(/M /g)?.length).toBe(1);
    expect(path).toContain("M 140 150");
  });
});

describe("纸的颜色", () => {
  it("侧面比纸面暗一点，光点比纸面亮一点", () => {
    expect(shade("#c4553f", 0.22)).toBe("#994231");
    expect(lighten("#c4553f", 0.4)).toBe("#dc998c");
  });

  it("认不出的颜色原样还回去，不出错", () => {
    expect(shade("rgba(0, 0, 0, 0.5)", 0.2)).toBe("rgba(0, 0, 0, 0.5)");
    expect(lighten("#fff", 0.3)).toBe("#fff");
  });
});

describe("光点", () => {
  it("缀在那一圈的正上方", () => {
    expect(sparkAt(60, 150, 150)).toEqual({ x: 150, y: 90 });
  });
});
