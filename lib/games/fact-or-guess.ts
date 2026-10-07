/* **/
/* * 事实还是猜测（墨墨）的点评逻辑：哪些放对了、哪些可以再看看、出现过哪些思维陷阱。*/
/* * 规格要求：点评里不能出现「错了」二字，不一致的那条要用提问的语气说。*/
/* */

import { TRAPS, type ThoughtAnswer, type ThoughtBubble, type TrapKind } from "@/lib/ai/types";
import { seeded } from "@/lib/paper/random";

export interface ThoughtReview {
/* 与标准答案一致的气泡 id*/
  agreed: string[];
/* 放得不一样的气泡 id*/
  disagreed: string[];
/* 还没放进树洞的气泡 id*/
  pending: string[];
/* 这句话里出现过的思维陷阱（按气泡顺序，与放得对不对无关）*/
  traps: TrapKind[];
}

export function reviewPlacements(
  bubbles: readonly ThoughtBubble[],
  placements: Readonly<Record<string, ThoughtAnswer>>,
): ThoughtReview {
  const agreed: string[] = [];
  const disagreed: string[] = [];
  const pending: string[] = [];
  for (const bubble of bubbles) {
    const placed = placements[bubble.id];
    if (placed === undefined) {
      pending.push(bubble.id);
    } else if (placed === bubble.answer) {
      agreed.push(bubble.id);
    } else {
      disagreed.push(bubble.id);
    }
  }
  const traps = bubbles.flatMap((bubble) => (bubble.trap === undefined ? [] : [bubble.trap]));
  return { agreed, disagreed, pending, traps };
}

const AGREE_LINES = [
  "这一条你分得很清楚。",
  "嗯，这个我同意。",
  "对，这句你抓得很稳。",
  "这个看得挺准。",
] as const;

export function agreeLine(id: string): string {
  const rng = seeded("agree:" + id);
  return AGREE_LINES[Math.floor(rng() * AGREE_LINES.length)];
}

/* 不一致时的说法：像提问，不像判卷*/
export function differLine(answer: ThoughtAnswer): string {
  const label = answer === "fact" ? "事实" : "猜测";
  return "这一个我倒觉得更像" + label + "——你能确定吗？";
}

export function trapSummary(traps: readonly TrapKind[]): string {
  const seen = [...new Set(traps)];
  return seen.map((trap) => TRAPS[trap].name + "：" + TRAPS[trap].note).join("；");
}

export function factOrGuessContext(
  thought: string,
  guesses: readonly string[],
  traps: readonly TrapKind[],
): string {
  const guessText = guesses.length > 0 ? guesses.join("、") : "没有明显的猜测";
  const trapText =
    traps.length > 0 ? [...new Set(traps)].map((trap) => TRAPS[trap].name).join("、") : "没有发现明显的思维陷阱";
  return "困扰的话：" + thought + "；其中的猜测：" + guessText + "；可能的思维陷阱：" + trapText;
}