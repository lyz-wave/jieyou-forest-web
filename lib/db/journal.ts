/**
 * 倾诉会话与成长记忆的读写。数据只存在本机；IndexedDB 打不开时退回内存，本次访问仍能用。
 */
import type { Memory, Session } from "../journal/types";
import { DB_NAME, openJieyouDb } from "./db";

export interface JournalStore {
  /** false 表示数据只在内存里，关掉页面就没了 */
  readonly persistent: boolean;
  saveSession(session: Session): Promise<void>;
  getSession(id: string): Promise<Session | null>;
  /** 按开始时间倒序（最近的在前） */
  listSessions(): Promise<Session[]>;
  /** 最近一次暂存的倾诉：古树据此问「上次那件事，还想接着聊吗？」 */
  latestPaused(): Promise<Session | null>;
  saveMemory(memory: Memory): Promise<void>;
  /** 按日期倒序（最近的在前） */
  listMemories(): Promise<Memory[]>;
  deleteMemory(id: string): Promise<void>;
  /** 清空倾诉与记忆（资料表不动） */
  clear(): Promise<void>;
}

const byDateDesc = (a: Memory, b: Memory): number => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
const byStartDesc = (a: Session, b: Session): number => b.startedAt - a.startedAt;

function memoryStore(): JournalStore {
  let sessions: Session[] = [];
  let memories: Memory[] = [];
  return {
    persistent: false,
    saveSession: async (session) => {
      sessions = [...sessions.filter((s) => s.id !== session.id), session];
    },
    getSession: async (id) => sessions.find((s) => s.id === id) ?? null,
    listSessions: async () => [...sessions].sort(byStartDesc),
    latestPaused: async () => [...sessions].sort(byStartDesc).find((s) => s.status === "paused") ?? null,
    saveMemory: async (memory) => {
      memories = [...memories.filter((m) => m.id !== memory.id), memory];
    },
    listMemories: async () => [...memories].sort(byDateDesc),
    deleteMemory: async (id) => {
      memories = memories.filter((m) => m.id !== id);
    },
    clear: async () => {
      sessions = [];
      memories = [];
    },
  };
}

export async function createJournalStore(dbName: string = DB_NAME): Promise<JournalStore> {
  const db = await openJieyouDb(dbName);
  if (!db) return memoryStore();
  return {
    persistent: true,
    saveSession: async (session) => {
      await db.sessions.put(session);
    },
    getSession: async (id) => (await db.sessions.get(id)) ?? null,
    listSessions: async () => (await db.sessions.toArray()).sort(byStartDesc),
    latestPaused: async () => (await db.sessions.where("status").equals("paused").toArray()).sort(byStartDesc)[0] ?? null,
    saveMemory: async (memory) => {
      await db.memories.put(memory);
    },
    listMemories: async () => (await db.memories.toArray()).sort(byDateDesc),
    deleteMemory: async (id) => {
      await db.memories.delete(id);
    },
    clear: async () => {
      await db.sessions.clear();
      await db.memories.clear();
    },
  };
}
