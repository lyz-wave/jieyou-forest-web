/**
 * 倾诉会话与成长记忆的形状（产品文档第九节那份类型），以及年轮用的固定标签库。
 * 存在本机 IndexedDB 里，不上传（见 lib/db/journal.ts）。
 */
import type { AnimalId } from "../animals";

export type Speaker = AnimalId | "tree" | "user";

export interface Message {
  id: string;
  speaker: Speaker;
  content: string;
  /** 用户点过「说到心里了」 */
  resonated?: boolean;
  createdAt: number;
}

export type SessionStatus = "open" | "resolved" | "paused";

export interface Session {
  id: string;
  startedAt: number;
  endedAt?: number;
  status: SessionStatus;
  companion: AnimalId;
  /** 1-10 */
  moodBefore?: number;
  moodAfter?: number;
  /** 小游戏产生的上下文 */
  gameContext: string[];
  matchedMemoryIds: string[];
  messages: Message[];
}

export interface MemoryShift {
  from: string;
  to: string;
}

/** 沉淀进年轮的成长记忆 */
export interface Memory {
  id: string;
  sessionId: string;
  /** YYYY-MM-DD，年轮按它分层 */
  date: string;
  /** 不超过 12 字 */
  title: string;
  /** 不超过 60 字 */
  summary: string;
  emotions: string[];
  /** 只能取自 THEMES，1-3 个 */
  themes: string[];
  /** 当时困住自己的念头 */
  coreBelief: string;
  shift: MemoryShift;
  /** 一句话领悟，用户第一人称 */
  insight: string;
  /** 一个小行动 */
  action?: string;
  helpfulAnimals: AnimalId[];
  moodBefore?: number;
  moodAfter?: number;
}

/**
 * 模型返回的那部分（文档 10.4：不含 id、sessionId、date）。
 * 帮助最大的动物来自用户点过的「说到心里了」，心情分是用户自己打的，都不问模型。
 */
export type MemoryDraft = Pick<Memory, "title" | "summary" | "emotions" | "themes" | "coreBelief" | "shift" | "insight" | "action">;

/** 成长卡片各字段的字数上限（文档 10.4） */
export const MEMORY_TITLE_MAX = 12;
export const MEMORY_SUMMARY_MAX = 60;
export const MEMORY_EMOTIONS_MAX = 5;
export const MEMORY_EMOTION_MAX = 8;
export const MEMORY_BELIEF_MAX = 40;
export const MEMORY_SHIFT_MAX = 20;
export const MEMORY_INSIGHT_MAX = 40;
export const MEMORY_ACTION_MAX = 30;
/** 主题最多挑几个 */
export const MEMORY_THEMES_MAX = 3;

/** 固定标签库（文档第七节第 2 条），不能自己造词 */
export const THEMES = [
  "工作压力",
  "职场人际",
  "亲密关系",
  "家庭",
  "友情",
  "自我价值",
  "学业考试",
  "健康",
  "金钱",
  "未来迷茫",
  "失去与离别",
  "孤独",
  "其他",
] as const;

export type Theme = (typeof THEMES)[number];

export function isTheme(value: string): value is Theme {
  return (THEMES as readonly string[]).includes(value);
}

/** 只留下库里的词、去重、最多 max 个；一个都不剩时给「其他」 */
export function sanitizeThemes(values: string[], max = 3): Theme[] {
  const out: Theme[] = [];
  for (const value of values) {
    if (!isTheme(value)) continue;
    if (out.includes(value)) continue;
    out.push(value);
    if (out.length >= max) break;
  }
  return out.length > 0 ? out : ["其他"];
}
