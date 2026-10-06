import { describe, expect, it } from "vitest";
import { groundY, inStream, onGround } from "./ground";
import { planMove, sampleTrack, trackDuration } from "./motion";
import { homeOf, TREE_DEPTH, TERRITORIES } from "./territory";

describe("planMove：地面行走", () => {
  const from = onGround(-100, 40);
  const to = onGround(60, 60);
  const track = planMove("fox", from, to);

  it("起点和终点正确，全程贴地", () => {
    expect(sampleTrack(track, 0).pos).toEqual(from);
    const end = sampleTrack(track, trackDuration(track)).pos;
    expect(end.x).toBeCloseTo(to.x);
    expect(end.depth).toBeCloseTo(to.depth);
    for (let t = 0; t <= trackDuration(track); t += 0.05) {
      const p = sampleTrack(track, t).pos;
      expect(p.y).toBeCloseTo(groundY(p.depth), 5);
    }
  });

  it("朝着前进方向", () => {
    expect(sampleTrack(track, 0.1).facing).toBe("right");
    const back = planMove("fox", to, from);
    expect(sampleTrack(back, 0.1).facing).toBe("left");
  });

  it("用时按速度计算：乌龟比狐狸慢", () => {
    expect(trackDuration(planMove("turtle", from, to))).toBeGreaterThan(trackDuration(track) * 3);
  });

  it("行走姿态", () => {
    expect(sampleTrack(track, trackDuration(track) / 2).pose).toBe("walk");
  });
});

describe("planMove：跳跃遵循重力", () => {
  it("松鼠从树洞下来：先头朝下爬树，再跳到草地，最后跑过去", () => {
    const from = homeOf("portrait", "squirrel");
    const to = onGround(80, 40);
    const track = planMove("squirrel", from, to);
    const poses = track.segments.map((s) => s.pose);
    expect(poses[0]).toBe("climb-down");
    expect(poses).toContain("jump");
    expect(poses[poses.length - 1]).toBe("run");
    // 爬树时一直贴着树干，深度不变
    const climb = track.segments[0];
    expect(climb.from.depth).toBeGreaterThanOrEqual(TREE_DEPTH);
    expect(climb.to.depth).toBe(climb.from.depth);
  });

  it("跳跃轨迹是抛物线：中途高于两端的地面，落地时回到地面", () => {
    const from = onGround(0, 40);
    const to = onGround(0, 40);
    const track = planMove("fox", from, { ...to, x: 1 }, { hop: true });
    const jump = track.segments.find((s) => s.pose === "jump");
    if (!jump) throw new Error("没有跳跃段");
    const start = track.segments.indexOf(jump);
    const t0 = track.segments.slice(0, start).reduce((a, s) => a + s.duration, 0);
    const mid = sampleTrack(track, t0 + jump.duration / 2);
    expect(mid.pos.y).toBeLessThan(groundY(mid.pos.depth) - 5);
    expect(mid.lift).toBeGreaterThan(0);
    const land = sampleTrack(track, t0 + jump.duration);
    expect(land.pos.y).toBeCloseTo(groundY(land.pos.depth), 5);
    expect(land.lift).toBeCloseTo(0, 5);
  });

  it("鸟从树枝飞到草地：全程飞行，沿弧线", () => {
    const from = homeOf("portrait", "owl");
    const to = onGround(-40, 50);
    const track = planMove("owl", from, to);
    expect(track.segments.every((s) => s.pose === "fly")).toBe(true);
    const mid = sampleTrack(track, trackDuration(track) / 2).pos;
    // 弧线：中点比两端连线更高
    const linY = (from.y + to.y) / 2;
    expect(mid.y).toBeLessThan(linY);
  });
});

describe("planMove：水獭在水里漂", () => {
  it("沿溪流中线漂，全程都在水里", () => {
    const [a, b] = TERRITORIES.landscape.otter.anchors;
    const track = planMove("otter", a, b);
    expect(track.segments.every((s) => s.pose === "swim")).toBe(true);
    for (let t = 0; t <= trackDuration(track); t += 0.1) {
      const p = sampleTrack(track, t).pos;
      expect(inStream(p.x, p.depth)).toBe(true);
    }
  });
});

describe("planMove：不会游泳的动物绕开溪流", () => {
  it("熊去溪流对岸时，从溪流源头左边绕过去，全程不进水", () => {
    const from = onGround(200, 30);
    const to = onGround(200, 230);
    const track = planMove("bear", from, to);
    for (let t = 0; t <= trackDuration(track); t += 0.05) {
      const p = sampleTrack(track, t).pos;
      expect(inStream(p.x, p.depth)).toBe(false);
    }
  });
});

describe("planMove：maxDuration 赶路", () => {
  it("限制总时长；乌龟仍然不比狐狸快", () => {
    const from = onGround(-150, 60);
    const to = onGround(150, 40);
    const turtle = planMove("turtle", from, to, { maxDuration: 3 });
    const fox = planMove("fox", from, to, { maxDuration: 3 });
    expect(trackDuration(turtle)).toBeCloseTo(3);
    expect(trackDuration(turtle)).toBeGreaterThanOrEqual(trackDuration(fox));
  });

  it("本来就够快时不变", () => {
    const from = onGround(0, 30);
    const to = onGround(40, 30);
    expect(trackDuration(planMove("fox", from, to, { maxDuration: 3 }))).toBeCloseTo(
      trackDuration(planMove("fox", from, to)),
    );
  });
});

describe("sampleTrack", () => {
  it("超出时长时停在终点，姿态为 idle", () => {
    const track = planMove("fox", onGround(0, 30), onGround(50, 30));
    const s = sampleTrack(track, 999);
    expect(s.pos.x).toBeCloseTo(50);
    expect(s.pose).toBe("idle");
  });

  it("原地不动时没有分段", () => {
    const p = onGround(0, 30);
    expect(planMove("fox", p, p).segments).toEqual([]);
  });
});
