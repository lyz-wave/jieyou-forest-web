/**
 * 聚拢倾听：篝火（夜晚）或阳光（白天）在空地中央，动物们分坐在两侧，
 * 从镜头看是一个向后弯的弧形，所有动物面朝中心，中心正前方留空，不挡住火光。
 * 伙伴坐在离中心最近的位置。
 */
import type { AnimalId } from "../animals";
import { onGround, sizeAt, streamDepthAt, streamHalfWidthAt, type WorldPos } from "./ground";
import type { Facing } from "./motion";
import { CLEARING, HABITS, type Layout } from "./territory";

export interface Seat {
  pos: WorldPos;
  facing: Facing;
}

/** 参加聚拢的动物 */
export const GATHER_ORDER: readonly AnimalId[] = ["fox", "owl", "squirrel", "turtle", "woodpecker", "otter", "bear"];

/** 动物在屏幕上实际占的宽度（纸偶 viewBox 两侧有留白，约为尺寸的 0.7） */
const bodyWidth = (id: AnimalId, layout: Layout, depth: number) => HABITS[id].size[layout] * sizeAt(depth) * 0.7;

/**
 * gap：相邻两只之间的空隙（占两者平均宽度的比例，负数表示前后错开时允许部分重叠）；
 * depthRise：两端比中间多退后的深度（越远越小，从镜头看是弧形）；inner：中心留给火堆的半宽
 */
const LAYOUT: Record<Layout, { gap: number; depthRise: number; inner: number }> = {
  portrait: { gap: -0.22, depthRise: 56, inner: 30 },
  landscape: { gap: 0.45, depthRise: 36, inner: 70 },
};

/** 空地中心：篝火或阳光放在这里 */
export function clearingCenter(): WorldPos {
  return onGround(CLEARING.x, CLEARING.depth);
}

export function gatherSeats(companion: AnimalId, layout: Layout): Record<AnimalId, Seat> {
  // 伙伴紧挨中心坐左边；其余从大到小排，大个子靠近火堆，小个子坐到两端更远处（看起来像透视）
  const others = GATHER_ORDER.filter((a) => a !== companion).sort(
    (a, b) => HABITS[b].size[layout] - HABITS[a].size[layout],
  );
  const { gap, depthRise, inner } = LAYOUT[layout];
  // 交替分到两侧，每次放到当前较窄的一侧，让左右两排差不多宽
  const left: AnimalId[] = [companion];
  const right: AnimalId[] = [];
  let lw = HABITS[companion].size[layout];
  let rw = 0;
  for (const id of others) {
    const w = HABITS[id].size[layout];
    if (rw <= lw) {
      right.push(id);
      rw += w;
    } else {
      left.push(id);
      lw += w;
    }
  }
  const seats = {} as Record<AnimalId, Seat>;

  const place = (row: AnimalId[], side: -1 | 1) => {
    const n = Math.max(row.length - 1, 1);
    let x = CLEARING.x;
    row.forEach((id, i) => {
      const u = i / n;
      // 越靠外越往后退，形成弧形；但不能碰到溪流
      const depthWanted = CLEARING.depth - 8 + u * u * depthRise;
      // 横向间距按这只动物所在深度的实际大小算
      const w = (a: AnimalId) => bodyWidth(a, layout, depthWanted);
      // 第一只紧挨着中心（留出火堆的位置）
      x = i === 0 ? CLEARING.x + side * (inner + w(id) / 2) : x + side * ((w(row[i - 1]) + w(id)) / 2) * (1 + gap);
      const limit = streamDepthAt(x) - streamHalfWidthAt(x) - 8;
      seats[id] = { pos: onGround(x, Math.min(depthWanted, limit)), facing: side < 0 ? "right" : "left" };
    });
  };
  place(left, -1);
  place(right, 1);
  return seats;
}

/**
 * 座位两侧最远能到哪里（舞台单位，含最外侧动物的半个身宽）。
 * 镜头推近时用它保证所有动物都在画面里。
 */
export function gatherHalfWidth(companion: AnimalId, layout: Layout): number {
  let half = 0;
  for (const [id, seat] of Object.entries(gatherSeats(companion, layout)) as [AnimalId, Seat][]) {
    half = Math.max(half, Math.abs(seat.pos.x - CLEARING.x) + bodyWidth(id, layout, seat.pos.depth) / 2);
  }
  return half;
}
