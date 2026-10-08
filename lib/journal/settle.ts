/**
 * 把一次倾诉收拾成会话与成长卡片（纯函数，先写测试再写它）。
 * 消息怎么定型、帮助最大的动物是谁、成长卡片要补哪些字段都在这里；写库与渲染只读结果。
 */
import { ANIMAL_CAST, type AnimalId } from "../animals";
import {
  sanitizeThemes,
  type Memory,
  type MemoryDraft,
  type Message,
  type Session,
  type SessionStatus,
  type Speaker,
} from "./types";

/** 对话里的一句话（七只的发言、追问的回答都长这样） */
export interface TalkLine {
  speaker: Speaker;
  text: string;
}

export interface TalkLog {
  startedAt: number;
  /** 用户这次写下的原话 */
  text: string;
  speeches: TalkLine[];
  /** 古树的总结（还没总结时是 null） */
  summary: string | null;
  replies: TalkLine[];
  /** 用户点过「说到心里了」的动物 */
  marked: readonly AnimalId[];
}

/** 本地日期 YYYY-MM-DD：年轮按本机时区分层，不按 UTC */
export function localDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return String(date.getFullYear()) + "-" + month + "-" + day;
}

function isCast(speaker: Speaker): speaker is AnimalId {
  return speaker !== "tree" && speaker !== "user" && ANIMAL_CAST.some((animal) => animal.id === speaker);
}

/** 一句话一步的间隔：写进库里时间要能排序，也不必按真实毫秒 */
const STEP_MS = 1000;

/** 一次倾诉的全部内容，按发生的顺序排成消息 */
export function messagesFromTalk(log: TalkLog): Message[] {
  const messages: Message[] = [];
  const push = (speaker: Speaker, content: string, resonated = false): void => {
    messages.push({
      id: "m-" + String(messages.length),
      speaker,
      content,
      resonated,
      createdAt: log.startedAt + messages.length * STEP_MS,
    });
  };
  push("user", log.text);
  for (const line of log.speeches) {
    push(line.speaker, line.text, isCast(line.speaker) && log.marked.includes(line.speaker));
  }
  if (log.summary) push("tree", log.summary);
  for (const line of log.replies) {
    push(line.speaker, line.text, isCast(line.speaker) && log.marked.includes(line.speaker));
  }
  return messages;
}

/** 帮助最大的动物：用户点过「说到心里了」的七只，按出现顺序去重 */
export function helpfulAnimalsOf(messages: Message[]): AnimalId[] {
  const out: AnimalId[] = [];
  for (const message of messages) {
    if (message.resonated !== true) continue;
    if (!isCast(message.speaker)) continue;
    if (out.includes(message.speaker)) continue;
    out.push(message.speaker);
  }
  return out;
}

export interface MemoryInput {
  draft: MemoryDraft;
  sessionId: string;
  /** YYYY-MM-DD */
  date: string;
  helpfulAnimals: AnimalId[];
  moodBefore?: number;
  moodAfter?: number;
}

/** 把模型给的半张卡片补成一张完整的成长记忆 */
export function memoryFromDraft(input: MemoryInput): Memory {
  const memory: Memory = {
    ...input.draft,
    themes: sanitizeThemes(input.draft.themes),
    id: "mem-" + input.sessionId,
    sessionId: input.sessionId,
    date: input.date,
    helpfulAnimals: input.helpfulAnimals,
  };
  if (typeof input.moodBefore === "number") memory.moodBefore = input.moodBefore;
  if (typeof input.moodAfter === "number") memory.moodAfter = input.moodAfter;
  return memory;
}

export interface SessionInput {
  id: string;
  startedAt: number;
  endedAt: number;
  status: SessionStatus;
  companion: AnimalId;
  moodBefore?: number;
  moodAfter?: number;
  gameContext: string[];
  messages: Message[];
  /** 这次提起过的旧记忆（第三阶段先留空，第四阶段记忆唤醒用） */
  matchedMemoryIds?: string[];
}

/** 一次倾诉的会话记录 */
export function sessionFromTalk(input: SessionInput): Session {
  const session: Session = {
    id: input.id,
    startedAt: input.startedAt,
    endedAt: input.endedAt,
    status: input.status,
    companion: input.companion,
    gameContext: input.gameContext,
    matchedMemoryIds: input.matchedMemoryIds ?? [],
    messages: input.messages,
  };
  if (typeof input.moodBefore === "number") session.moodBefore = input.moodBefore;
  if (typeof input.moodAfter === "number") session.moodAfter = input.moodAfter;
  return session;
}
