import type { AnimalId } from "@/lib/animals";

/** 纸偶会做的小动作：点头、竖耳朵、托腮、思考、笑 */
export type Gesture = "nod" | "ears" | "chin" | "think" | "smile";

/** 聆听时每只的动作（文档 6.3.4：点头、竖耳朵、团团托腮） */
export const LISTEN_GESTURE: Record<AnimalId, Gesture> = {
  woodpecker: "nod",
  owl: "nod",
  squirrel: "ears",
  otter: "nod",
  turtle: "nod",
  bear: "chin",
  fox: "nod",
};

/** 别人说话时轮着做的反应（文档 6.3.6：点头、思考、笑） */
export const REACTIONS: readonly Gesture[] = ["nod", "think", "smile"];

/**
 * 谁在发言时，其他每一只做什么反应。发言的那只不排（它已经走到前面、放大了）。
 * round 是说到第几条：每换一位，动作往后错一格，看起来不像同一套复读。
 */
export function reactionPlan(
  cast: readonly AnimalId[],
  speaker: AnimalId | null,
  round: number,
): Partial<Record<AnimalId, Gesture>> {
  const plan: Partial<Record<AnimalId, Gesture>> = {};
  let index = 0;
  for (const id of cast) {
    if (id === speaker) continue;
    plan[id] = REACTIONS[(index + round) % REACTIONS.length];
    index += 1;
  }
  return plan;
}
/** 此刻这只动物该做什么动作：聆听时做自己的，圆桌上做别人发言时的反应，其它时候不做 */
export function gestureFor(
  phase: string,
  id: AnimalId,
  reactions: Partial<Record<AnimalId, Gesture>>,
): Gesture | null {
  if (phase === "listening") return LISTEN_GESTURE[id];
  if (phase === "roundtable") return reactions[id] ?? null;
  return null;
}
