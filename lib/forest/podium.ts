/**
 * 发言的位置：古树前的空地正中，比任何一个座位都更靠近镜头 ——
 * 谁说话谁走到这里，像从大家中间站出来，说完再回自己的座位。
 */
import type { AnimalId } from "../animals";
import { onGround, type WorldPos } from "./ground";
import type { Seat } from "./gather";
import type { Facing } from "./motion";
import { CLEARING } from "./territory";

/** 站到大家前面时的深度：比空地中心还近一点，已经坐下的座位没有一个会这么近 */
export const PODIUM_DEPTH = 16;

export function podiumSpot(): WorldPos {
  return onGround(CLEARING.x, PODIUM_DEPTH);
}

export interface PodiumPlan {
  speaker: AnimalId;
  to: WorldPos;
  facing: Facing;
}

/** 该谁走到前面：没人在说，或者这只没有座位，就谁也不动 */
export function podiumPlan(seats: Record<AnimalId, Seat>, speaker: AnimalId | null): PodiumPlan | null {
  if (!speaker) return null;
  const seat = seats[speaker];
  if (!seat) return null;
  return { speaker, to: podiumSpot(), facing: seat.facing };
}