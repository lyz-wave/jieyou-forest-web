import { describe, expect, it } from "vitest";
import { FAR_SCALE, GROUND, groundY, inStream, isOnGround, sizeAt, streamCenterY, streamDepthAt } from "./ground";

describe("groundY", () => {
  it("越远的地面在舞台上越高（y 越小）", () => {
    let prev = Infinity;
    for (let d = GROUND.nearDepth; d <= GROUND.farDepth; d += 4) {
      const y = groundY(d);
      expect(y).toBeLessThan(prev);
      prev = y;
    }
  });

  it("草地夹在草地纸层（深度 110）和前景纸层（深度 0）之间，不会被纸层挡住", () => {
    expect(GROUND.farDepth).toBeLessThan(110);
    expect(GROUND.nearDepth).toBeGreaterThan(0);
  });

  it("最远处落在草地纸层的地平线下方，最近处在底部按钮上方", () => {
    // 草地纸层顶边在 y = 760 ± 22
    expect(groundY(GROUND.farDepth)).toBeGreaterThan(782);
    // 竖屏手机最下面能看到 y ≈ 951，底部按钮和纸条约占 70px（约 95 舞台单位）
    expect(groundY(GROUND.nearDepth)).toBeLessThanOrEqual(900);
  });

  it("超出范围时截断，不会飞到天上或钻进地下", () => {
    expect(groundY(GROUND.farDepth + 500)).toBeCloseTo(GROUND.farY);
    expect(groundY(-100)).toBeCloseTo(GROUND.nearY);
  });
});

describe("溪流", () => {
  it("溪流中线在草地上", () => {
    for (const x of [GROUND.streamStartX, 0, 300, 900]) {
      const d = streamDepthAt(x);
      expect(d).toBeGreaterThan(GROUND.nearDepth);
      expect(d).toBeLessThan(GROUND.farDepth);
      expect(streamCenterY(x)).toBeCloseTo(groundY(d), 5);
    }
  });

  it("溪流中线上的点在水里，离开中线足够远就不在水里", () => {
    const x = 200;
    const d = streamDepthAt(x);
    expect(inStream(x, d)).toBe(true);
    expect(inStream(x, d + 20)).toBe(false);
    expect(inStream(x, d - 20)).toBe(false);
  });

  it("溪流源头左边没有水", () => {
    expect(inStream(GROUND.streamStartX - 30, streamDepthAt(GROUND.streamStartX))).toBe(false);
  });

  it("溪流前方留有足够的草地给动物活动和聚拢", () => {
    for (const x of [-40, 0, 200, 600]) {
      expect(streamDepthAt(x) - 13 - GROUND.nearDepth).toBeGreaterThan(50);
    }
  });
});

describe("isOnGround", () => {
  it("y 和 groundY 一致时在地上", () => {
    expect(isOnGround({ x: 0, y: groundY(60), depth: 60 })).toBe(true);
    expect(isOnGround({ x: 0, y: groundY(60) - 30, depth: 60 })).toBe(false);
  });
});

describe("sizeAt", () => {
  it("越远越小：最近处 1，最远处和树上一样小", () => {
    expect(sizeAt(GROUND.nearDepth)).toBeCloseTo(1);
    expect(sizeAt(GROUND.farDepth)).toBeCloseTo(FAR_SCALE);
    expect(sizeAt(274)).toBeCloseTo(FAR_SCALE);
    let prev = Infinity;
    for (let d = GROUND.nearDepth; d <= GROUND.farDepth; d += 4) {
      expect(sizeAt(d)).toBeLessThan(prev);
      prev = sizeAt(d);
    }
  });
});
