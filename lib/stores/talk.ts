import { create } from "zustand";
import type { AnimalId, CharacterId } from "../animals";
import type { RiskLevel, Speech, TreeSummary } from "../ai/schema";
import type { Memory } from "../journal/types";
import { roundtableOrder } from "../talk/flow";
import { useForestStore } from "./forest";

/**
 * 一次倾诉的过程。
 * away 不在倾诉 → mood 打分与写字 → listening 大家都在听 →
 * risk 先停一停（高风险）→ roundtable 圆桌发言 → summary 古树总结 → followup 继续聊 →
 * rate 再说说这次的心情 → grow 岁岁把它收进年轮 → card 成长卡片。
 * 前六个阶段在上一步结束时清掉、不写库；rate 之后的东西才写进年轮。
 */
export type TalkPhase =
  | "away"
  | "mood"
  | "listening"
  | "risk"
  | "roundtable"
  | "summary"
  | "followup"
  | "rate"
  | "grow"
  | "card";

/** 沉淀这件事进行到哪儿了 */
export type MemoryStatus = "idle" | "thinking" | "failed";

export interface TalkReply {
  speaker: CharacterId;
  text: string;
}

/** 追问的回复最多留这么多条，再多的从最前面丢 */
export const REPLY_KEEP = 20;

export interface TalkState {
  phase: TalkPhase;
  /** 这一次是什么时候开始的（写进会话与记忆的 id 都用它） */
  startedAt: number;
  mood: number | null;
  text: string;
  risk: RiskLevel;
  /** 风险检测记下的 concern：照常聊，只在总结里温和提一句 */
  concern: boolean;
  speeches: Speech[];
  /** 已经说到第几只 */
  shown: number;
  /** 是不是一次全放出来了 */
  all: boolean;
  /** 被点过「说到心里了」的动物 */
  marked: AnimalId[];
  /** 正在说话的那只（镜头与高亮跟着它） */
  speaker: AnimalId | null;
  /** 头顶气泡里已经打出来的那部分字 */
  bubble: string | null;
  summary: TreeSummary | null;
  replies: TalkReply[];
  /** 说完了之后他自己又打的那次分 */
  moodAfter: number | null;
  /** 沉淀下来的成长卡片 */
  memory: Memory | null;
  memoryStatus: MemoryStatus;
  open(): void;
  setMood(mood: number | null): void;
  setText(text: string): void;
  submit(): void;
  /** 圆桌那边没接上：从聆听里出来，把「没接上」摆到眼前，别让人一直等着 */
  toRoundtable(): void;
  gotSpeeches(speeches: Speech[]): void;
  next(): void;
  showAll(): void;
  toggleMark(id: AnimalId): void;
  setBubble(text: string | null): void;
  guard(level: RiskLevel): void;
  markConcern(concern: boolean): void;
  resume(): void;
  toSummary(summary: TreeSummary): void;
  /** 「心结解开了」：先再打一次分 */
  toRate(): void;
  setMoodAfter(mood: number | null): void;
  /** 进生长页，岁岁开始把这次收进年轮 */
  toGrow(): void;
  memoryFailed(): void;
  gotMemory(memory: Memory): void;
  toFollowUp(): void;
  addReply(reply: TalkReply): void;
  again(): void;
  finish(): void;
}

const EMPTY = {
  phase: "away" as TalkPhase,
  startedAt: 0,
  mood: null,
  text: "",
  risk: "none" as RiskLevel,
  concern: false,
  speeches: [] as Speech[],
  shown: 0,
  all: false,
  marked: [] as AnimalId[],
  speaker: null,
  bubble: null as string | null,
  summary: null,
  replies: [] as TalkReply[],
  moodAfter: null as number | null,
  memory: null as Memory | null,
  memoryStatus: "idle" as MemoryStatus,
};

/** 同一只动物只说一次；第一次出现的那段留下 */
function dedupe(speeches: Speech[]): Speech[] {
  const seen = new Set<string>();
  const out: Speech[] = [];
  for (const speech of speeches) {
    if (seen.has(speech.animal)) continue;
    seen.add(speech.animal);
    out.push(speech);
  }
  return out;
}

export const useTalkStore = create<TalkState>()((set) => ({
  ...EMPTY,
  open: () => set({ ...EMPTY, phase: "mood", startedAt: Date.now() }),
  setMood: (mood) => set({ mood }),
  setText: (text) => set({ text }),
  submit: () => set({ phase: "listening" }),
  toRoundtable: () => set((s) => ({ phase: s.phase === "listening" ? "roundtable" : s.phase })),
  gotSpeeches: (incoming) =>
    set((s) => {
      const order = roundtableOrder(useForestStore.getState().companion);
      const rank = (id: string): number => {
        const at = order.indexOf(id as AnimalId);
        return at < 0 ? order.length : at;
      };
      const speeches = dedupe(incoming).sort((a, b) => rank(a.animal) - rank(b.animal));
      // 守护页上等着的发言先不出，等用户按了「继续」再回圆桌
      const phase: TalkPhase = s.phase === "risk" || s.phase === "away" ? s.phase : "roundtable";
      return { speeches, shown: speeches.length > 0 ? 1 : 0, all: false, speaker: speeches[0]?.animal ?? null, phase };
    }),
  next: () =>
    set((s) => {
      if (s.speeches.length === 0) return {};
      const shown = Math.min(s.speeches.length, s.shown + 1);
      return { shown, all: shown >= s.speeches.length, speaker: s.speeches[shown - 1].animal };
    }),
  showAll: () =>
    set((s) => {
      if (s.speeches.length === 0) return {};
      return { shown: s.speeches.length, all: true, speaker: s.speeches[s.speeches.length - 1].animal };
    }),
  toggleMark: (id) =>
    set((s) => ({
      marked: s.marked.includes(id) ? s.marked.filter((x) => x !== id) : [...s.marked, id],
    })),
  setBubble: (text) => set({ bubble: text }),
  guard: (risk) => set({ risk, phase: "risk" }),
  markConcern: (concern) => set({ concern }),
  resume: () => set((s) => ({ phase: s.speeches.length > 0 ? "roundtable" : "listening" })),
  toSummary: (summary) => set({ summary, phase: "summary" }),
  toRate: () => set({ phase: "rate" }),
  setMoodAfter: (moodAfter) => set({ moodAfter }),
  toGrow: () => set({ phase: "grow", memoryStatus: "thinking" }),
  memoryFailed: () => set({ memoryStatus: "failed" }),
  gotMemory: (memory) => set({ memory, phase: "card", memoryStatus: "idle" }),
  toFollowUp: () => set({ phase: "followup" }),
  addReply: (reply) =>
    set((s) => ({ replies: [...s.replies, reply].slice(-REPLY_KEEP), phase: "followup" })),
  again: () => set({ phase: "listening", shown: 0, all: false, speaker: null, bubble: null }),
  finish: () => set({ ...EMPTY }),
}));