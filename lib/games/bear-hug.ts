/* **/
/* * 熊抱（团团）的纯逻辑：按多久算抱过、暖光曲线、心跳节奏、文案库（同一次访问内不连续重复）。*/
/* * 这个游戏不调用 AI，文案全部在本地。*/
/* */

import type { Rng } from "@/lib/paper/random";

/* 少于 1 秒就松开不算抱过*/
export const HUG_MIN_MS = 1000;
/* 按满 10 秒最亮*/
export const HUG_BRIGHT_MS = 10000;
/* 心跳：每分钟 60 次*/
export const HEARTBEAT_MS = 1000;
export const TOO_SHORT_LINE = "抱久一点点也没关系";

/* 暖光强度 0–1：先快后慢，10 秒正好到最亮*/
export function hugGlow(heldMs: number): number {
  if (!(heldMs > 0)) return 0;
  const t = Math.min(1, heldMs / HUG_BRIGHT_MS);
  return 1 - (1 - t) * (1 - t);
}

/* 心跳的瞬时强度 0–1：每 1000ms 一下，250ms 内回落*/
export function heartbeatPulse(heldMs: number): number {
  const phase = (((heldMs % HEARTBEAT_MS) + HEARTBEAT_MS) % HEARTBEAT_MS) / HEARTBEAT_MS;
  return Math.max(0, 1 - phase * 4);
}

export const BEAR_HUG_PHRASES: readonly string[] = [
  "你已经很努力了，先歇一会儿也没关系。",
  "这件事很难，不是你不够好。",
  "现在这样也可以，不用马上变好。",
  "你不需要先做到什么，才配被抱一下。",
  "累了就是累了，不用找理由。",
  "刚才那一下，你其实撑住了一些事。",
  "会难过，说明你在乎；这不是缺点。",
  "今天只要过完今天就够了。",
  "你对别人那么宽容，也分一点给自己吧。",
  "心里乱的时候，可以先什么都不决定。",
  "不是所有事都得今天想明白。",
  "你可以慢一点，没人催你。",
  "抱一下，什么都不用说。",
  "难受的时候还愿意来这里，已经很勇敢了。",
  "你值得被好好对待，包括被自己。",
  "没做好的那部分，也有它的来由。",
  "哭出来也没关系，眼泪不是认输。",
  "就算现在什么都没做成，你也是有价值的人。",
  "把肩膀放下来一点，那里常常是紧的。",
  "明天的事，留给明天的手。",
  "你不是一个人在扛，至少现在不是。",
  "慢慢来，我在这儿。",
] as const;

/* 随机挑一句，但不和上一句重复*/
export function pickNoRepeat(last: string | null, rng: Rng): string {
  const total = BEAR_HUG_PHRASES.length;
  const start = Math.min(total - 1, Math.floor(rng() * total));
  const first = BEAR_HUG_PHRASES[start];
  if (first !== last) return first;
  return BEAR_HUG_PHRASES[(start + 1) % total];
}

export function bearHugContext(heldMs: number): string | null {
  if (heldMs < HUG_MIN_MS) return null;
  return "和团团抱了 " + Math.round(heldMs / 1000) + " 秒";
}