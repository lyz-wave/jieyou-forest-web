/**
 * 动物移动规划（纯函数）：给出起点和终点，按习性生成一串分段轨迹。
 * 每段有姿态（走 / 跑 / 跳 / 飞 / 爬 / 漂）、起止位置、时长和抛物线高度。
 * 渲染时按时间采样，用 MotionValue 驱动，不触发 React 重渲染。
 */
import type { AnimalId } from "../animals";
import { GROUND, groundY, inStream, onGround, streamCenterY, streamDepthAt, type WorldPos } from "./ground";
import { HABITS, TREE_CLIMB_BOTTOM_Y, TREE_DEPTH } from "./territory";

export type Pose = "idle" | "walk" | "run" | "jump" | "fly" | "climb-up" | "climb-down" | "swim" | "hop";
export type Facing = "left" | "right";

export interface Segment {
  pose: Pose;
  from: WorldPos;
  to: WorldPos;
  /** 秒 */
  duration: number;
  /** 抛物线最高点比两端连线高出多少（舞台单位）；0 表示直线 */
  arc: number;
}

export interface Track {
  animal: AnimalId;
  segments: Segment[];
}

export interface TrackSample {
  pos: WorldPos;
  facing: Facing;
  pose: Pose;
  /** 离地高度（舞台单位），用于接触阴影的大小和浓淡 */
  lift: number;
}

const dist = (a: WorldPos, b: WorldPos) => Math.hypot(a.x - b.x, (a.depth - b.depth) * 1.2, a.y - b.y);
const same = (a: WorldPos, b: WorldPos) => dist(a, b) < 0.5;

/** 树根前方的落脚点：从树上下来后先落在这里（草地最远处，紧挨古树） */
const treeFoot = (x: number): WorldPos => onGround(x, GROUND.farDepth - 4);

function seg(pose: Pose, from: WorldPos, to: WorldPos, speed: number, arc = 0, minDuration = 0.25): Segment {
  return { pose, from, to, arc, duration: Math.max(minDuration, dist(from, to) / speed) };
}

function isOnTree(p: WorldPos): boolean {
  return p.depth >= TREE_DEPTH - 1;
}

function isInWater(p: WorldPos): boolean {
  return inStream(p.x, p.depth) && Math.abs(p.y - streamCenterY(p.x)) < 2;
}

/** 地面上两点之间的路线：如果直线穿过溪流，就绕到溪流源头左边再过去 */
function groundRoute(from: WorldPos, to: WorldPos): WorldPos[] {
  const crosses = (a: WorldPos, b: WorldPos) => {
    for (let i = 1; i < 20; i++) {
      const t = i / 20;
      const x = a.x + (b.x - a.x) * t;
      const d = a.depth + (b.depth - a.depth) * t;
      if (inStream(x, d)) return true;
    }
    return false;
  };
  if (!crosses(from, to)) return [from, to];
  const detourX = GROUND.streamStartX - 60;
  const near = onGround(detourX, Math.min(from.depth, to.depth) + 10);
  const far = onGround(detourX, Math.max(from.depth, to.depth) - 10);
  const towardFar = to.depth > from.depth;
  return [from, towardFar ? near : far, towardFar ? far : near, to];
}

function walkSegments(animal: AnimalId, points: WorldPos[]): Segment[] {
  const { speed } = HABITS[animal];
  const pose: Pose = speed >= 100 ? "run" : "walk";
  const out: Segment[] = [];
  for (let i = 1; i < points.length; i++) {
    if (!same(points[i - 1], points[i])) out.push(seg(pose, points[i - 1], points[i], speed));
  }
  return out;
}

/** 沿溪流中线漂：按 x 细分，保证每一点都在水里 */
function swimSegments(from: WorldPos, to: WorldPos, speed: number): Segment[] {
  const steps = Math.max(1, Math.ceil(Math.abs(to.x - from.x) / 30));
  const out: Segment[] = [];
  let prev = from;
  for (let i = 1; i <= steps; i++) {
    const x = from.x + ((to.x - from.x) * i) / steps;
    const next: WorldPos = i === steps ? to : { x, y: streamCenterY(x), depth: streamDepthAt(x) };
    out.push(seg("swim", prev, next, speed, 0, 0.1));
    prev = next;
  }
  return out;
}

export interface PlanOptions {
  /** 在原地附近轻跳一下（比如点击反馈之外的小动作） */
  hop?: boolean;
  /** 赶路：总时长超过这个秒数时整体加速到这个时长（聚拢时不让大家等乌龟太久） */
  maxDuration?: number;
}

export function planMove(animal: AnimalId, from: WorldPos, to: WorldPos, opts: PlanOptions = {}): Track {
  const track = planRoute(animal, from, to, opts);
  const total = trackDuration(track);
  if (opts.maxDuration === undefined || total <= opts.maxDuration) return track;
  const k = opts.maxDuration / total;
  return { animal, segments: track.segments.map((s) => ({ ...s, duration: s.duration * k })) };
}

function planRoute(animal: AnimalId, from: WorldPos, to: WorldPos, opts: PlanOptions): Track {
  const habit = HABITS[animal];
  if (same(from, to)) return { animal, segments: [] };

  // 会飞的：直接沿弧线飞过去（树干上的小挪动除外）
  if (habit.canFly) {
    if (isOnTree(from) && isOnTree(to) && Math.abs(from.x - to.x) < 20) {
      // 啄木鸟沿树干一跳一跳
      const hops = Math.max(1, Math.round(Math.abs(to.y - from.y) / 20));
      const out: Segment[] = [];
      for (let i = 1; i <= hops; i++) {
        const a = { ...from, y: from.y + ((to.y - from.y) * (i - 1)) / hops };
        const b = { ...from, x: to.x, y: from.y + ((to.y - from.y) * i) / hops };
        out.push({ pose: "hop", from: a, to: b, duration: 0.28, arc: 4 });
      }
      return { animal, segments: out };
    }
    if (isOnTree(from) && isOnTree(to)) {
      return { animal, segments: [seg("walk", from, to, habit.speed * 0.6)] };
    }
    const arc = 30 + dist(from, to) * 0.25;
    return { animal, segments: [seg("fly", from, to, habit.speed * 3, arc, 0.8)] };
  }

  // 水獭：水里漂，要上岸时跳上去
  if (habit.canSwim && isInWater(from) && isInWater(to)) {
    return { animal, segments: swimSegments(from, to, habit.speed) };
  }

  const segments: Segment[] = [];
  let cur = from;

  // 从树上下来：先爬到树根，再跳到树根前方的地面
  if (isOnTree(cur) && !isOnTree(to)) {
    // 爬树全程贴着树干，深度不变；爬到被草地挡住之前，向前跳到草地上
    const root: WorldPos = { x: cur.x, y: TREE_CLIMB_BOTTOM_Y, depth: cur.depth };
    segments.push(seg("climb-down", cur, root, habit.speed * 0.6));
    const foot = treeFoot(cur.x + (to.x >= cur.x ? 18 : -18));
    segments.push({ pose: "jump", from: root, to: foot, duration: 0.55, arc: 30 });
    cur = foot;
  }
  // 从水里上岸：跳到岸上
  if (isInWater(cur) && !isInWater(to)) {
    const shore = onGround(cur.x, streamDepthAt(cur.x) - GROUND.streamHalfWidth - 8);
    segments.push({ pose: "jump", from: cur, to: shore, duration: 0.4, arc: 14 });
    cur = shore;
  }

  // 要上树：先走到树根前，跳到树根，再爬上去
  if (isOnTree(to) && !isOnTree(cur)) {
    const foot = treeFoot(to.x + (cur.x >= to.x ? 18 : -18));
    segments.push(...walkSegments(animal, groundRoute(cur, foot)));
    const root: WorldPos = { x: to.x, y: TREE_CLIMB_BOTTOM_Y, depth: to.depth };
    segments.push({ pose: "jump", from: foot, to: root, duration: 0.55, arc: 30 });
    segments.push(seg("climb-up", root, to, habit.speed * 0.6));
    return { animal, segments };
  }
  // 要下水
  if (isInWater(to) && !isInWater(cur)) {
    const shore = onGround(to.x, streamDepthAt(to.x) - GROUND.streamHalfWidth - 8);
    segments.push(...walkSegments(animal, groundRoute(cur, shore)));
    segments.push({ pose: "jump", from: shore, to, duration: 0.4, arc: 14 });
    return { animal, segments };
  }

  if (opts.hop) {
    segments.push({ pose: "jump", from: cur, to, duration: 0.45, arc: 26 });
    return { animal, segments };
  }

  segments.push(...walkSegments(animal, groundRoute(cur, to)));
  return { animal, segments };
}

export function trackDuration(track: Track): number {
  return track.segments.reduce((sum, s) => sum + s.duration, 0);
}

function facingOf(s: Segment, prev: Facing): Facing {
  const dx = s.to.x - s.from.x;
  if (Math.abs(dx) < 0.5) return prev;
  return dx > 0 ? "right" : "left";
}

/** 按时间采样轨迹。超过总时长时停在终点，姿态为 idle。 */
export function sampleTrack(track: Track, t: number, initialFacing: Facing = "right"): TrackSample {
  let facing = initialFacing;
  let elapsed = 0;
  for (const s of track.segments) {
    facing = facingOf(s, facing);
    if (t <= elapsed + s.duration) {
      const u = s.duration === 0 ? 1 : Math.max(0, (t - elapsed) / s.duration);
      const depth = s.from.depth + (s.to.depth - s.from.depth) * u;
      const x = s.from.x + (s.to.x - s.from.x) * u;
      const linY = s.from.y + (s.to.y - s.from.y) * u;
      const rise = 4 * s.arc * u * (1 - u);
      const y = linY - rise;
      // 离地高度：地面上的动物相对地面算；树上和水里的动物不画接触阴影
      const ground = groundY(depth);
      const lift = s.pose === "jump" || s.pose === "fly" ? Math.max(0, ground - y) : 0;
      return { pos: { x, y, depth }, facing, pose: s.pose, lift };
    }
    elapsed += s.duration;
  }
  const last = track.segments[track.segments.length - 1];
  const pos = last ? last.to : { x: 0, y: groundY(0), depth: 0 };
  return { pos, facing, pose: "idle", lift: 0 };
}
