import { describe, expect, it } from "vitest";
import { getTimeOfDay, LIGHTING, shadowOffset } from "./lighting";

const at = (h: number, m: number) => new Date(2026, 9, 3, h, m);

describe("getTimeOfDay", () => {
  it.each([
    [4, 59, "night"],
    [5, 0, "dawn"],
    [7, 59, "dawn"],
    [8, 0, "day"],
    [16, 59, "day"],
    [17, 0, "dusk"],
    [18, 59, "dusk"],
    [19, 0, "night"],
    [0, 0, "night"],
  ] as const)("%i:%i → %s", (h, m, expected) => {
    expect(getTimeOfDay(at(h, m))).toBe(expected);
  });
});

describe("光源与阴影方向", () => {
  it("清晨光从左侧照来，阴影投向右侧", () => {
    expect(shadowOffset(LIGHTING.dawn, 10).dx).toBeGreaterThan(0);
  });

  it("白天阴影投向正下方，且偏移最短", () => {
    const day = shadowOffset(LIGHTING.day, 10);
    expect(day.dx).toBeCloseTo(0, 6);
    expect(day.dy).toBeGreaterThan(0);
    const len = (o: { dx: number; dy: number }) => Math.hypot(o.dx, o.dy);
    for (const t of ["dawn", "dusk"] as const) {
      expect(len(day)).toBeLessThan(len(shadowOffset(LIGHTING[t], 10)));
    }
  });

  it("黄昏光从右侧照来，阴影投向左侧，色调偏暖", () => {
    expect(shadowOffset(LIGHTING.dusk, 10).dx).toBeLessThan(0);
    expect(LIGHTING.dusk.warm).toBe(true);
  });

  it("夜晚是逆光，有萤火虫", () => {
    expect(LIGHTING.night.backlit).toBe(true);
    expect(LIGHTING.night.fireflies).toBe(true);
    expect(LIGHTING.day.fireflies).toBe(false);
  });

  it("阴影偏移随距离线性放大", () => {
    const a = shadowOffset(LIGHTING.dawn, 10);
    const b = shadowOffset(LIGHTING.dawn, 20);
    expect(b.dx).toBeCloseTo(a.dx * 2, 6);
    expect(b.dy).toBeCloseTo(a.dy * 2, 6);
  });
});

describe("纸色表", () => {
  it("四个时段都给出完整的纸色", () => {
    const keys = Object.keys(LIGHTING.day.palette).sort();
    for (const t of ["dawn", "dusk", "night"] as const) {
      expect(Object.keys(LIGHTING[t].palette).sort()).toEqual(keys);
    }
  });

  it.each(["dawn", "day", "dusk", "night"] as const)("%s：远山远树更亮、更灰（空气透视）", (t) => {
    const p = LIGHTING[t].palette;
    for (const far of [p.hillFar, p.treeFar]) {
      for (const near of [p.meadow, p.fore]) {
        const f = hexToHsl(far);
        const n = hexToHsl(near);
        expect(f.l).toBeGreaterThan(n.l);
        expect(f.s).toBeLessThan(n.s);
      }
    }
  });
});

function hexToHsl(hex: string): { s: number; l: number } {
  const v = parseInt(hex.slice(1), 16);
  const r = ((v >> 16) & 255) / 255;
  const g = ((v >> 8) & 255) / 255;
  const b = (v & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const s = max === min ? 0 : l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
  return { s, l };
}
