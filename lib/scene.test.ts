import { describe, expect, it, vi } from "vitest";
import { ONBOARDING_MIST, SCENE_LAYERS } from "./scene";

describe("入林纸雾", () => {
  it("有三层固定纸边的晨雾，覆盖整张舞台", () => {
    expect(ONBOARDING_MIST).toHaveLength(3);
    for (const mist of ONBOARDING_MIST) {
      expect(mist.left).toMatch(/^M.*Z$/);
      expect(mist.right).toMatch(/^M.*Z$/);
    }
  });
});

describe("SCENE_LAYERS", () => {
  it("6 个纸层由远到近排列", () => {
    expect(SCENE_LAYERS.map((l) => l.id)).toEqual(["sky", "hills", "farTrees", "forest", "meadow", "fore"]);
    const depths = SCENE_LAYERS.map((l) => l.depth);
    expect([...depths].sort((a, b) => b - a)).toEqual(depths);
    expect(depths[depths.length - 1]).toBe(0);
  });

  it("只有远树层可以在低画质下隐藏", () => {
    expect(SCENE_LAYERS.filter((l) => l.optional).map((l) => l.id)).toEqual(["farTrees"]);
  });

  it("所有纸片路径非空、只包含 M/L/Z 指令", () => {
    for (const layer of SCENE_LAYERS) {
      for (const piece of layer.pieces) {
        expect(piece.d.length).toBeGreaterThan(0);
        expect(piece.d).toMatch(/^[MLZ0-9.\s-]+$/);
      }
    }
  });

  it("两次生成完全相同（不会导致水合不一致）", async () => {
    vi.resetModules();
    const again: typeof import("./scene") = await import("./scene");
    expect(again.SCENE_LAYERS).not.toBe(SCENE_LAYERS);
    expect(again.SCENE_LAYERS.map((l) => l.pieces.map((p) => p.d))).toEqual(
      SCENE_LAYERS.map((l) => l.pieces.map((p) => p.d)),
    );
  });

  it("古树树冠带镂空纹样", () => {
    const forest = SCENE_LAYERS.find((l) => l.id === "forest");
    const crown = forest?.pieces.find((p) => p.cutouts);
    expect(crown?.cutouts).toMatch(/^[MLZ0-9.\s-]+$/);
  });
});
