import { describe, expect, it } from "vitest";
import { clampCamera, coversViewport, focusCamera, layerScale, maxZoomToFit, projectPoint, projectStage, stageRect } from "./depth";

const P = 1000;
const DEPTHS = [1600, 900, 550, 280, 110, 0];
const VIEWPORTS = [
  { width: 375, height: 667 },
  { width: 1440, height: 900 },
];
const M = 36;

describe("layerScale", () => {
  it("缩放补偿让纸层投影后保持原大小", () => {
    expect(layerScale(0, P)).toBe(1);
    expect(layerScale(1000, P)).toBe(2);
  });
});

describe("stageRect", () => {
  it("舞台在视口四周各留出 margin，单位换算按 1000 单位高", () => {
    const r = stageRect({ width: 375, height: 667 }, M);
    expect(r).toEqual({ left: -36, top: -36, width: 447, height: 739, unit: 0.739 });
  });

  it("超宽视口按宽度换算单位，保证 3000 单位宽的舞台也能铺满", () => {
    const r = stageRect({ width: 3000, height: 600 }, 0);
    expect(r.unit).toBe(1);
  });
});

describe("projectStage", () => {
  it("相机静止时所有纸层投影后完全重合", () => {
    const vp = VIEWPORTS[0];
    const rects = DEPTHS.map((d) => projectStage(vp, M, P, d, { x: 0, y: 0, z: 0 }));
    for (const r of rects) {
      expect(r.left).toBeCloseTo(-36, 6);
      expect(r.right).toBeCloseTo(375 + 36, 6);
    }
  });

  it("近处纸层的视差位移大于远处", () => {
    const vp = VIEWPORTS[1];
    const cam = { x: 30, y: 0, z: 0 };
    const near = projectStage(vp, M, P, 0, cam).left - projectStage(vp, M, P, 0, { x: 0, y: 0, z: 0 }).left;
    const far = projectStage(vp, M, P, 1600, cam).left - projectStage(vp, M, P, 1600, { x: 0, y: 0, z: 0 }).left;
    expect(near).toBeGreaterThan(far);
    expect(far).toBeGreaterThan(0);
  });
});

describe("视差最大时不露边", () => {
  for (const vp of VIEWPORTS) {
    it(`${vp.width}×${vp.height}`, () => {
      for (const x of [-M, 0, M]) {
        for (const y of [-M, 0, M]) {
          for (const d of DEPTHS) {
            expect(coversViewport(projectStage(vp, M, P, d, { x, y, z: 0 }), vp)).toBe(true);
          }
        }
      }
    });
  }
});

describe("clampCamera", () => {
  it("超出范围的平移会被收回，收回后所有纸层仍覆盖视口", () => {
    for (const vp of VIEWPORTS) {
      const cam = clampCamera(vp, M, P, { x: 500, y: -500, z: 150 });
      expect(Math.abs(cam.x)).toBeLessThan(500);
      expect(Math.abs(cam.y)).toBeLessThan(500);
      for (const d of DEPTHS) {
        expect(coversViewport(projectStage(vp, M, P, d, cam), vp)).toBe(true);
      }
    }
  });

  it("推近时允许更大的平移", () => {
    const vp = VIEWPORTS[0];
    const flat = clampCamera(vp, M, P, { x: 500, y: 0, z: 0 });
    const pushed = clampCamera(vp, M, P, { x: 500, y: 0, z: 200 });
    expect(pushed.x).toBeGreaterThan(flat.x);
  });

  it("z 被限制在 [0, P/2]", () => {
    const vp = VIEWPORTS[0];
    expect(clampCamera(vp, M, P, { x: 0, y: 0, z: -100 }).z).toBe(0);
    expect(clampCamera(vp, M, P, { x: 0, y: 0, z: 900 }).z).toBe(500);
  });

  it("范围内的相机保持不变", () => {
    const cam = { x: 10, y: -12, z: 40 };
    expect(clampCamera(VIEWPORTS[1], M, P, cam)).toEqual(cam);
  });
});

describe("focusCamera", () => {
  it("推近后，目标点比推近前更靠近视口中心，且仍不露边", () => {
    for (const vp of VIEWPORTS) {
      const point = { x: 200, y: 700 };
      const d = 110;
      const before = projectPoint(vp, M, P, d, { x: 0, y: 0, z: 0 }, point);
      const cam = focusCamera(vp, M, P, d, point, 200);
      const after = projectPoint(vp, M, P, d, cam, point);
      const dist = (p: { x: number; y: number }) => Math.hypot(p.x - vp.width / 2, p.y - vp.height / 2);
      expect(dist(after)).toBeLessThan(dist(before));
      for (const layer of DEPTHS) {
        expect(coversViewport(projectStage(vp, M, P, layer, cam), vp)).toBe(true);
      }
    }
  });

  it("anchorY 把目标放到视口指定高度（在不露边的范围内）", () => {
    const vp = VIEWPORTS[1];
    const point = { x: 0, y: 900 };
    const cam = focusCamera(vp, M, P, 40, point, 120, 0.6);
    const p = projectPoint(vp, M, P, 40, cam, point);
    // 能推到就正好在 60% 高度；被不露边限制时，至少比不推近更靠近目标
    const before = projectPoint(vp, M, P, 40, { x: 0, y: 0, z: 0 }, point);
    expect(Math.abs(p.y - vp.height * 0.6)).toBeLessThan(Math.abs(before.y - vp.height * 0.6));
  });

  it("目标在中心时只推近不平移", () => {
    const vp = VIEWPORTS[0];
    const cam = focusCamera(vp, M, P, 0, { x: 0, y: 500 }, 150);
    expect(cam.x).toBeCloseTo(0, 6);
    expect(cam.y).toBeCloseTo(0, 6);
    expect(cam.z).toBe(150);
  });
});

describe("maxZoomToFit", () => {
  it("推近到这个距离时，深度 d 上 ±halfWidth 的范围正好还在视口里", () => {
    for (const vp of VIEWPORTS) {
      const d = 50;
      const half = 200;
      const z = maxZoomToFit(vp, M, P, d, half);
      expect(z).toBeGreaterThanOrEqual(0);
      const edge = projectPoint(vp, M, P, d, { x: 0, y: 0, z }, { x: half, y: 500 });
      expect(edge.x).toBeLessThanOrEqual(vp.width + 1e-6);
    }
  });

  it("竖屏手机上要放下 ±240 宽的一排动物时几乎不能推近", () => {
    expect(maxZoomToFit(VIEWPORTS[0], M, P, 60, 240)).toBeLessThan(60);
  });

  it("宽屏上可以推得更近", () => {
    expect(maxZoomToFit(VIEWPORTS[1], M, P, 60, 500)).toBeGreaterThan(200);
  });

  it("本来就放不下时返回 0", () => {
    expect(maxZoomToFit(VIEWPORTS[0], M, P, 60, 400)).toBe(0);
  });
});
