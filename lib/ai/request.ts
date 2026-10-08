/**
 * 前端送上来的东西先在这里过一遍：形状不对就直接 400，一次也不问模型。
 * 这里只做形状和长度，不做内容判断——内容判断是模型和本地粗筛的事。
 */
import type { CharacterId } from "@/lib/animals";
import type { PromptContext } from "@/lib/prompts";
import { isAnimalId, isTalker } from "./schema";
import type { Speaker } from "./types";

/** 一次倾诉最多写这么多字；前端输入框也按这个显示字数 */
export const TALK_MAX = 1000;
export const NICKNAME_MAX = 12;
export const GAME_CONTEXT_MAX = 20;
export const MEMORY_MAX = 12;
export const HISTORY_MAX_INPUT = 40;
export const NOTE_MAX = 200;
export const MOOD_MIN = 1;
export const MOOD_MAX = 10;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readNotes(value: unknown, max: number): string[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > max) return null;
  const notes: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") return null;
    const text = item.trim();
    if (!text || text.length > NOTE_MAX) return null;
    notes.push(text);
  }
  return notes;
}

function readHistory(value: unknown): { speaker: Speaker; content: string }[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > HISTORY_MAX_INPUT) return null;
  const history: { speaker: Speaker; content: string }[] = [];
  for (const item of value) {
    if (!isRecord(item) || !isTalker(item.speaker)) return null;
    const content = typeof item.content === "string" ? item.content.trim() : "";
    if (!content || content.length > TALK_MAX) return null;
    history.push({ speaker: item.speaker, content });
  }
  return history;
}

export function readContext(value: unknown): PromptContext | null {
  if (!isRecord(value)) return null;
  const nickname = typeof value.nickname === "string" ? value.nickname.trim() : "";
  if (!nickname || nickname.length > NICKNAME_MAX) return null;
  if (!isAnimalId(value.companion)) return null;
  const text = typeof value.text === "string" ? value.text.trim() : "";
  if (!text || text.length > TALK_MAX) return null;
  const gameContext = readNotes(value.gameContext, GAME_CONTEXT_MAX);
  const memories = readNotes(value.memories, MEMORY_MAX);
  const history = readHistory(value.history);
  if (!gameContext || !memories || !history) return null;
  const context: PromptContext = { nickname, companion: value.companion, text, gameContext, memories, history };
  if (value.moodBefore !== undefined) {
    const mood = value.moodBefore;
    if (typeof mood !== "number" || !Number.isInteger(mood) || mood < MOOD_MIN || mood > MOOD_MAX) return null;
    context.moodBefore = mood;
  }
  return context;
}

export function readTarget(value: unknown): CharacterId | null {
  if (!isRecord(value)) return null;
  const target = value.target;
  if (target === "tree" || isAnimalId(target)) return target;
  return null;
}

/** 只要一段话的接口（小游戏与风险检测）都走这里：形状不对或者太长就是 null */
export function readText(value: unknown, max: number): string | null {
  if (!isRecord(value)) return null;
  const text = typeof value.text === "string" ? value.text.trim() : "";
  if (!text || text.length > max) return null;
  return text;
}

export function readRiskText(value: unknown): string | null {
  return readText(value, TALK_MAX);
}