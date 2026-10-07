import { describe, expect, it } from "vitest";
import { zoneAtPoint, type ZoneRect } from "./dnd";

const box = (id: string, left: number, top: number, width: number, height: number): ZoneRect => ({
  id,
  left,
  top,
  width,
  height,
});

describe("落点判定", () => {
  it("点在区域里就返回那个区域", () => {
    const zones = [box("hole", 100, 100, 50, 50)];
    expect(zoneAtPoint(120, 130, zones)).toBe("hole");
  });

  it("边界算在里面，外面不算", () => {
    const zones = [box("hole", 100, 100, 50, 50)];
    expect(zoneAtPoint(100, 100, zones)).toBe("hole");
    expect(zoneAtPoint(150, 150, zones)).toBe("hole");
    expect(zoneAtPoint(99, 120, zones)).toBeNull();
    expect(zoneAtPoint(151, 120, zones)).toBeNull();
  });

  it("没落在任何区域上返回 null（物件会弹回）", () => {
    const zones = [box("hole", 0, 0, 10, 10)];
    expect(zoneAtPoint(500, 500, zones)).toBeNull();
    expect(zoneAtPoint(5, 5, [])).toBeNull();
  });

  it("区域重叠时取更小的那个（更具体的赢）", () => {
    const zones = [box("big", 0, 0, 200, 200), box("small", 50, 50, 20, 20)];
    expect(zoneAtPoint(60, 60, zones)).toBe("small");
    expect(zoneAtPoint(10, 10, zones)).toBe("big");
  });

  it("尺寸为零或负的区域不当目标（还没量出来或收起来了）", () => {
    const zones = [box("hidden", 0, 0, 0, 40), box("flat", 0, 0, 40, -1)];
    expect(zoneAtPoint(10, 10, zones)).toBeNull();
  });
});
