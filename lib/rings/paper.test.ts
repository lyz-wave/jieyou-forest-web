import { describe, expect, it } from "vitest";
import {
  BARK,
  MIN_BAND,
  WOOD,
  bandEdges,
  cutHoles,
  eccentricAt,
  grainPath,
  packedRings,
  ringPaperPath,
  smoothClosedPath,
  wobbledCircle,
  woodTint,
} from "./paper";

function countCommands(path: string, command: string): number {
  return path.split(command).length - 1;
}

function distance(input: { x: number; y: number }, cx: number, cy: number): number {
  return Math.hypot(input.x - cx, input.y - cy);
}

describe("手剪的圆", () => {
  it("同一个种子画得一模一样，换一个种子就不一样", () => {
    const a = wobbledCircle({ cx: 0, cy: 0, radius: 100, seed: 7 });
    const b = wobbledCircle({ cx: 0, cy: 0, radius: 100, seed: 7 });
    const c = wobbledCircle({ cx: 0, cy: 0, radius: 100, seed: 8 });
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  it("半径只在自己的那一圈上下起伏，不会变成别的形状", () => {
    const points = wobbledCircle({ cx: 20, cy: 30, radius: 100, seed: 3, wobble: 0.06, petals: 11, petal: 0.02 });
    for (const point of points) {
      const r = distance(point, 20, 30);
      expect(r).toBeGreaterThan(100 * 0.9);
      expect(r).toBeLessThan(100 * 1.1);
    }
  });

  it("默认 48 个采样点，也可以自己定", () => {
    expect(wobbledCircle({ cx: 0, cy: 0, radius: 10, seed: 1 })).toHaveLength(48);
    expect(wobbledCircle({ cx: 0, cy: 0, radius: 10, seed: 1, samples: 24 })).toHaveLength(24);
  });
});

describe("平滑的闭合路径", () => {
  it("是一串三次曲线，首尾闭上，没有 NaN", () => {
    const d = smoothClosedPath(wobbledCircle({ cx: 0, cy: 0, radius: 50, seed: 5 }));
    expect(d.startsWith("M ")).toBe(true);
    expect(d.endsWith(" Z")).toBe(true);
    expect(countCommands(d, "C")).toBeGreaterThan(8);
    expect(d).not.toContain("NaN");
  });

  it("点再少也画得出来", () => {
    const d = smoothClosedPath([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ]);
    expect(d).not.toContain("NaN");
    expect(d.endsWith(" Z")).toBe(true);
  });
});

describe("环形纸片", () => {
  it("环宽撑得开时是内外两条轮廓，撑不开时只剩一张圆纸片", () => {
    const ring = ringPaperPath({ cx: 150, cy: 150, radius: 60, width: 14, seed: 2 });
    expect(countCommands(ring, "M")).toBe(2);
    const disc = ringPaperPath({ cx: 150, cy: 150, radius: 6, width: 14, seed: 2 });
    expect(countCommands(disc, "M")).toBe(1);
  });

  it("剪纸的镂空挖在环带中间，有几个镂空就多几段子路径", () => {
    const holes = cutHoles({ cx: 150, cy: 150, radius: 60, width: 20, seed: 4, count: 3 });
    expect(holes).toHaveLength(3);
    for (const hole of holes) {
      const hit = /^M ([0-9.-]+) ([0-9.-]+)/.exec(hole);
      expect(hit).not.toBeNull();
      const r = distance({ x: Number(hit?.[1]), y: Number(hit?.[2]) }, 150, 150);
      expect(r).toBeGreaterThan(60 - 10);
      expect(r).toBeLessThan(60 + 10);
    }
    const withCuts = ringPaperPath({ cx: 150, cy: 150, radius: 60, width: 20, seed: 4, cuts: 3 });
    expect(countCommands(withCuts, "M")).toBe(5);
  });

  it("环带太窄就不镂空", () => {
    expect(cutHoles({ cx: 150, cy: 150, radius: 40, width: 2, seed: 1, count: 2 })).toEqual([]);
    expect(countCommands(ringPaperPath({ cx: 150, cy: 150, radius: 40, width: 2, seed: 1, cuts: 2 }), "M")).toBe(2);
  });
});

describe("不同心的年轮", () => {
  it("同种子同序号一个样，偏移都不超过给定的上限", () => {
    const a = eccentricAt(9, 3, 4);
    expect(eccentricAt(9, 3, 4)).toEqual(a);
    for (let index = 0; index < 8; index++) {
      const at = eccentricAt(9, index, 4);
      expect(Math.abs(at.x)).toBeLessThanOrEqual(4);
      expect(Math.abs(at.y)).toBeLessThanOrEqual(4);
    }
  });

  it("最里面那圈几乎不偏，往外越偏越多", () => {
    const inner = eccentricAt(9, 0, 4);
    expect(Math.abs(inner.x)).toBeLessThanOrEqual(2);
    const outer = eccentricAt(9, 6, 4);
    expect(Math.abs(outer.x) + Math.abs(outer.y)).toBeGreaterThan(0);
  });
});

describe("木纹与调色", () => {
  it("木纹是一段闭合的细线", () => {
    const d = grainPath({ cx: 150, cy: 150, radius: 64, seed: 3 });
    expect(d.startsWith("M ")).toBe(true);
    expect(d.endsWith(" Z")).toBe(true);
  });

  it("情绪色往木头色里调，调满就是木色，调不动就原样", () => {
    expect(woodTint("#c4553f", 1)).toBe(WOOD);
    expect(woodTint("#c4553f", 0)).toBe("#c4553f");
    const half = woodTint("#c4553f", 0.5);
    expect(half).not.toBe("#c4553f");
    expect(Number.parseInt(half.slice(3, 5), 16)).toBeGreaterThan(0x55);
    expect(woodTint("不是颜色", 0.5)).toBe("不是颜色");
    expect(BARK.startsWith("#")).toBe(true);
  });
});

describe("一圈挨着一圈", () => {
  it("单圈就长在核心外面", () => {
    const rings = packedRings([20], 26, 100);
    expect(rings).toHaveLength(1);
    expect(rings[0]?.radius).toBe(36);
    expect(rings[0]?.width).toBe(20);
  });

  it("相邻两圈只隔一条缝", () => {
    const rings = packedRings([20, 12], 26, 200, 4);
    const first = rings[0];
    const second = rings[1];
    expect(first && second).toBeTruthy();
    const outerEdge = (first?.radius ?? 0) + (first?.width ?? 0) / 2;
    const innerEdge = (second?.radius ?? 0) - (second?.width ?? 0) / 2;
    expect(innerEdge - outerEdge).toBeCloseTo(4);
  });

  it("圈太多就整体收窄，最外一圈不越界，窄圈也不小于最小值", () => {
    const rings = packedRings([26, 26, 26, 26, 26], 26, 100);
    const last = rings[rings.length - 1];
    expect((last?.radius ?? 0) + (last?.width ?? 0) / 2).toBeLessThanOrEqual(100.5);
    for (const ring of rings) expect(ring.width).toBeGreaterThanOrEqual(MIN_BAND);
  });

  it("没有记录就没有圈", () => {
    expect(packedRings([], 26, 100)).toEqual([]);
  });
});

describe("环带的宽度", () => {
  it("沿圆周有粗有细：不是一条等宽的圈", () => {
    const { outer, inner } = bandEdges({ cx: 0, cy: 0, radius: 40, width: 16, seed: 7 });
    expect(inner).not.toBeNull();
    const widths = outer.map((point, index) => {
      const other = inner?.[index] ?? point;
      return Math.hypot(point.x - other.x, point.y - other.y);
    });
    const min = Math.min(...widths);
    const max = Math.max(...widths);
    expect(max - min).toBeGreaterThan(2);
    expect(min).toBeGreaterThan(1.2);
  });

  it("薄得只剩一条缝时内圈会被推回去，不会戳出外圈", () => {
    const { outer, inner } = bandEdges({ cx: 0, cy: 0, radius: 12, width: 4, seed: 3 });
    expect(inner).not.toBeNull();
    for (let index = 0; index < outer.length; index++) {
      const away = outer[index];
      const near = inner?.[index];
      const far = Math.hypot((away?.x ?? 0), (away?.y ?? 0));
      const close = Math.hypot((near?.x ?? 0), (near?.y ?? 0));
      expect(far - close).toBeGreaterThan(1.2);
    }
  });

  it("半径比环宽还小时只剩一张圆纸片", () => {
    const { inner } = bandEdges({ cx: 0, cy: 0, radius: 1, width: 8, seed: 5 });
    expect(inner).toBeNull();
  });
});
