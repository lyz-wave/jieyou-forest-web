import { ANIMAL_CAST, ANIMALS, type AnimalId, type CharacterId } from "@/lib/animals";
import type { Speaker } from "@/lib/ai/types";
import type { RiskLevel, Speech, TreeSummary } from "@/lib/ai/schema";
import type { TalkLog } from "@/lib/journal/settle";

/** 圆桌的顺序：今天的伙伴先说，其余按古树周围的固定位置排 */
export function roundtableOrder(companion: AnimalId): AnimalId[] {
  const rest = ANIMAL_CAST.map((a) => a.id).filter((id) => id !== companion);
  return [companion, ...rest];
}

export interface Mention {
  target: CharacterId;
  rest: string;
}

const MENTION = /@\s*([^\s@]+)/;

/** 名字 → 谁，只认森林里这几位（古树叫岁岁） */
function whoOf(name: string): CharacterId | null {
  if (name === ANIMALS.tree.name) return "tree";
  for (const a of ANIMAL_CAST) {
    if (a.name === name) return a.id;
  }
  return null;
}

/**
 * 从一句话里认出「@ 谁」：认得出就把那一段摘掉，认不出就原样交给古树。
 * 没写 @ 的时候，默认是古树。
 */
export function parseMention(text: string): Mention {
  const hit = MENTION.exec(text);
  if (!hit) return { target: "tree", rest: text.trim() };
  const target = whoOf(hit[1]);
  if (!target) return { target: "tree", rest: text.trim() };
  const rest = (text.slice(0, hit.index) + text.slice(hit.index + hit[0].length)).trim();
  return { target, rest };
}


/** 这句话里有没有指名到某一位（认得出才算；@ 了不认识的名字不算） */
export function mentionsTarget(text: string): boolean {
  const hit = MENTION.exec(text);
  return hit !== null && whoOf(hit[1]) !== null;
}

/** 说到这些，本地就当成危险信号：先停下，也不请七只说话 */
const CRISIS_MARKERS: readonly string[] = [
  "自杀",
  "轻生",
  "不想活",
  "不想活了",
  "想死",
  "去死",
  "死了算了",
  "结束生命",
  "活不下去",
  "活着没意思",
  "活着没有意思",
  "没有意义活",
  "消失掉",
  "伤害自己",
  "自残",
  "割腕",
  "跳楼",
  "上吊",
  "安眠药",
];

/** 很沉，但不一定危险；交给服务端再判一次 */
const CONCERN_MARKERS: readonly string[] = [
  "撑不住",
  "撑不下去",
  "崩溃",
  "绝望",
  "没希望",
  "没有希望",
  "熬不住",
  "熬不下去",
  "很难受",
  "好难受",
  "受不了",
  "喘不过气",
  "没力气",
  "害怕自己",
  "控制不住",
];

/** 本地的粗筛：宁可多报也不漏报 */
export function localGuard(text: string): RiskLevel {
  if (CRISIS_MARKERS.some((marker) => text.includes(marker))) return "crisis";
  if (CONCERN_MARKERS.some((marker) => text.includes(marker))) return "concern";
  return "none";
}

/** 每句都要问服务端一次；只有本地已经认定危险时才先停下、不去打扰它 */
export function needsServerCheck(local: RiskLevel): boolean {
  return local !== "crisis";
}

/** 打字机：已经出了多少个字 */
export function reveal(full: string, shown: number): string {
  if (shown <= 0) return "";
  return full.slice(0, shown);
}
export interface HistoryLine {
  speaker: Speaker;
  content: string;
}

/** 圆桌的发言当作「刚才大家说过的话」交给总结与追问 */
export function speechesAsHistory(speeches: readonly Speech[]): HistoryLine[] {
  return speeches.map((speech) => ({ speaker: speech.animal as Speaker, content: speech.text }));
}

/** 追问要带上：用户这次说的、刚才七只说的、以及已经来回过的那些话 */
export function replyHistory(
  text: string,
  speeches: readonly Speech[],
  replies: readonly { speaker: Speaker; text: string }[],
): HistoryLine[] {
  return [
    { speaker: "user", content: text },
    ...speechesAsHistory(speeches),
    ...replies.map((reply) => ({ speaker: reply.speaker, content: reply.text })),
  ];
}

/** 古树的总结拼成一段留档的话：我听到的、森林的声音、一个念头、一小步、一个问题 */
export function summaryText(summary: TreeSummary): string {
  const voices = summary.voices.map((voice) => ANIMALS[voice.animal].name + "：" + voice.point).join("；");
  return [summary.heard, "森林里的声音——" + voices, summary.thought, summary.nextStep, summary.question].join(
    "\n",
  );
}

/** 一次倾诉进行到哪儿了（够了，能整理成留档的形状就行） */
export interface TalkSnapshot {
  startedAt: number;
  text: string;
  speeches: readonly { animal: AnimalId; text: string }[];
  summary: TreeSummary | null;
  replies: readonly { speaker: CharacterId; text: string }[];
  marked: readonly AnimalId[];
}

/** 把一次倾诉整理成要写进年轮的形状：原话、七只的发言、古树的总结、追问的回答 */
export function toTalkLog(snapshot: TalkSnapshot): TalkLog {
  return {
    startedAt: snapshot.startedAt,
    text: snapshot.text,
    speeches: snapshot.speeches.map((speech) => ({ speaker: speech.animal, text: speech.text })),
    summary: snapshot.summary === null ? null : summaryText(snapshot.summary),
    replies: snapshot.replies.map((reply) => ({ speaker: reply.speaker, text: reply.text })),
    marked: [...snapshot.marked],
  };
}
