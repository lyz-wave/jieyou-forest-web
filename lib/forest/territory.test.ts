import { describe, expect, it } from "vitest";
import { TREE_SPOTS } from "../scene";
import { GROUND, groundY, inStream, streamDepthAt } from "./ground";
import { ANIMAL_IDS, HABITS, TERRITORIES, TREE_DEPTH, type Layout } from "./territory";

const LAYOUTS: Layout[] = ["portrait", "landscape"];

describe("TERRITORIES", () => {
  for (const layout of LAYOUTS) {
    describe(layout, () => {
      it("7 只动物都有领地，每块领地至少 2 个锚点", () => {
        expect(Object.keys(TERRITORIES[layout]).sort()).toEqual([...ANIMAL_IDS].sort());
        for (const t of Object.values(TERRITORIES[layout])) expect(t.anchors.length).toBeGreaterThanOrEqual(2);
      });

      it("走路的动物：锚点都在草地上、不在水里", () => {
        for (const id of ["fox", "bear", "turtle"] as const) {
          for (const a of TERRITORIES[layout][id].anchors) {
            expect(a.y).toBeCloseTo(groundY(a.depth), 5);
            expect(a.depth).toBeGreaterThanOrEqual(GROUND.nearDepth);
            expect(a.depth).toBeLessThanOrEqual(GROUND.farDepth);
            expect(inStream(a.x, a.depth)).toBe(false);
          }
        }
      });

      it("熊和狐狸在溪流前方的草地上", () => {
        for (const id of ["fox", "bear"] as const) {
          for (const a of TERRITORIES[layout][id].anchors) {
            if (a.x >= GROUND.streamStartX) expect(a.depth).toBeLessThan(streamDepthAt(a.x));
          }
        }
      });

      it("水獭的锚点都在溪流里", () => {
        for (const a of TERRITORIES[layout].otter.anchors) expect(inStream(a.x, a.depth)).toBe(true);
      });

      it("树上的动物：贴在古树上，高度在树干 / 树枝范围", () => {
        for (const id of ["woodpecker", "owl", "squirrel"] as const) {
          for (const a of TERRITORIES[layout][id].anchors) {
            expect(a.depth).toBe(TREE_DEPTH);
            expect(a.y).toBeLessThan(GROUND.farY);
          }
        }
        for (const a of TERRITORIES[layout].owl.anchors) {
          expect(Math.abs(a.y - TREE_SPOTS.branchTip.y)).toBeLessThan(30);
        }
        for (const a of TERRITORIES[layout].squirrel.anchors) {
          expect(Math.abs(a.x - TREE_SPOTS.hollow.x)).toBeLessThan(10);
        }
      });

      it("竖屏时所有锚点都落在手机能看到的中间区域", () => {
        if (layout !== "portrait") return;
        for (const t of Object.values(TERRITORIES.portrait)) {
          for (const a of t.anchors) expect(Math.abs(a.x)).toBeLessThan(230);
        }
      });
    });
  }
});

describe("HABITS", () => {
  it("乌龟最慢，松鼠最快", () => {
    const speeds = Object.values(HABITS).map((h) => h.speed);
    expect(HABITS.turtle.speed).toBe(Math.min(...speeds));
    expect(HABITS.squirrel.speed).toBe(Math.max(...speeds));
  });

  it("只有鸟会飞，只有水獭会游", () => {
    expect(Object.entries(HABITS).filter(([, h]) => h.canFly).map(([id]) => id).sort()).toEqual(["owl", "woodpecker"]);
    expect(Object.entries(HABITS).filter(([, h]) => h.canSwim).map(([id]) => id)).toEqual(["otter"]);
  });
});
